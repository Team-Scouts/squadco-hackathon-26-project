import { Injectable, Logger } from '@nestjs/common';
import { createSign, randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import {
  RealityDefender,
  type DetectionResult,
} from '@realitydefender/realitydefender';

type VendorLike = {
  businessName?: string;
  registrationNumber?: string | null;
  contactName?: string | null;
  email?: string;
  phone?: string;
  country?: string | null;
  state?: string | null;
  address?: string | null;
};

type DocumentLike = {
  documentType: string;
  fileUrl: string;
  documentHash?: string | null;
  duplicateDetected: boolean;
  duplicateVendorCount: number;
  createdAt?: Date;
};

export type ExtractedDocumentField = {
  label: string;
  extracted: string;
  verified: string;
  confidence: number;
  status: 'match' | 'edited' | 'flagged' | 'missing';
};

type ExtractionCandidate = {
  value: string;
  score: number;
};

export type VerificationReason = {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoreImpact: number;
  metadata?: Record<string, unknown>;
};

type OcrResult = {
  provider: string;
  text: string;
  confidence: number;
  fields: ExtractedDocumentField[];
};

type AiDetectionResult = {
  score: number;
  detected: boolean;
  signals: ForensicSignal[];
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type ForensicSignal = {
  code: string;
  message: string;
  weight: number;
  metadata?: Record<string, JsonValue>;
};

export type DocumentIntelligenceResult = {
  ocrProvider: string;
  ocrText: string;
  ocrConfidence: number;
  extractedFields: ExtractedDocumentField[];
  aiGeneratedScore: number;
  aiGeneratedDetected: boolean;
  forensicSignals: AiDetectionResult['signals'];
  tamperScore: number;
  reasons: VerificationReason[];
};

@Injectable()
export class DocumentIntelligenceService {
  private readonly logger = new Logger(DocumentIntelligenceService.name);

  async analyzeDocument(input: {
    document: DocumentLike;
    vendor: VendorLike;
  }): Promise<DocumentIntelligenceResult> {
    const file = await this.fetchDocumentFile(input.document.fileUrl);
    const ocr = await this.runOcr(input.document, input.vendor, file);
    const metadata = this.extractFileMetadata(input.document, file);
    const synthId = await this.checkSynthId(file);
    const externalAiDetector = await this.checkExternalAiDocumentDetector(
      input.document,
      file,
    );
    const aiDetection = this.runAiGeneratedDetection(
      input.document,
      ocr,
      file,
      metadata,
      synthId,
      externalAiDetector,
    );
    const evaluation = this.evaluateDocumentRisk({
      document: input.document,
      vendor: input.vendor,
      ocr,
      aiDetection,
    });

    return {
      ocrProvider: ocr.provider,
      ocrText: ocr.text,
      ocrConfidence: ocr.confidence,
      extractedFields: ocr.fields,
      aiGeneratedScore: aiDetection.score,
      aiGeneratedDetected: aiDetection.detected,
      forensicSignals: aiDetection.signals,
      tamperScore: evaluation.tamperScore,
      reasons: evaluation.reasons,
    };
  }

  private async runOcr(
    document: DocumentLike,
    vendor: VendorLike,
    file: { bytes: Buffer; mimeType: string },
  ): Promise<OcrResult> {
    const provider = process.env.OCR_PROVIDER ?? 'heuristic';
    if (provider === 'google-document-ai') {
      try {
        return await this.runGoogleDocumentAi(document, vendor, file);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Google Document AI failed; using heuristic fallback: ${message}`,
        );
      }
    }

    return this.runHeuristicOcr(document, vendor);
  }

  private async runGoogleDocumentAi(
    document: DocumentLike,
    vendor: VendorLike,
    file: { bytes: Buffer; mimeType: string },
  ): Promise<OcrResult> {
    const projectId = process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID;
    const location = process.env.GOOGLE_DOCUMENT_AI_LOCATION;
    const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;

    if (!projectId || !location || !processorId) {
      throw new Error(
        'Google Document AI project/location/processor config missing',
      );
    }

    const accessToken = await this.getGoogleAccessToken();
    const url =
      `https://${location}-documentai.googleapis.com/v1/projects/` +
      `${projectId}/locations/${location}/processors/${processorId}:process`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawDocument: {
          content: file.bytes.toString('base64'),
          mimeType: file.mimeType,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Document AI request failed with status ${response.status}`,
      );
    }

    const body = (await response.json()) as any;
    const text = String(body.document?.text ?? '');
    const confidence = this.averageConfidence(body.document?.pages ?? []);
    const fields = this.extractFieldsFromText(
      document,
      vendor,
      text,
      confidence,
    );

    return {
      provider: 'google-document-ai',
      text,
      confidence,
      fields,
    };
  }

  private async getGoogleAccessToken() {
    if (process.env.GOOGLE_DOCUMENT_AI_ACCESS_TOKEN) {
      return process.env.GOOGLE_DOCUMENT_AI_ACCESS_TOKEN;
    }

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set');
    }

    const fs = await import('node:fs/promises');
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8')) as {
      client_email?: string;
      private_key?: string;
    };

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Google service account credentials are invalid');
    }

    const now = Math.floor(Date.now() / 1000);
    const header = this.base64Url({ alg: 'RS256', typ: 'JWT' });
    const payload = this.base64Url({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    });
    const unsignedJwt = `${header}.${payload}`;
    const signature = createSign('RSA-SHA256')
      .update(unsignedJwt)
      .sign(credentials.private_key, 'base64url');
    const assertion = `${unsignedJwt}.${signature}`;
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Google token exchange failed with status ${response.status}`,
      );
    }

    const body = (await response.json()) as { access_token?: string };

    if (!body.access_token) {
      throw new Error('Google token response did not include access_token');
    }

    return body.access_token;
  }

  private base64Url(value: Record<string, unknown>) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private runHeuristicOcr(
    document: DocumentLike,
    vendor: VendorLike,
  ): OcrResult {
    const fields = this.defaultFieldsForDocumentType(document, vendor);
    const text = fields
      .filter((field) => field.extracted)
      .map((field) => `${field.label}: ${field.extracted}`)
      .join('\n');

    return {
      provider: 'heuristic',
      text,
      confidence: fields.length ? 82 : 55,
      fields,
    };
  }

  private extractFieldsFromText(
    document: DocumentLike,
    vendor: VendorLike,
    text: string,
    confidence: number,
  ) {
    if (document.documentType === 'CAC_REGISTRATION') {
      return this.extractCacFieldsFromText(vendor, text, confidence);
    }

    if (document.documentType === 'TAX_ID') {
      return this.extractTaxFieldsFromText(vendor, text, confidence);
    }

    if (document.documentType === 'OWNER_ID') {
      return this.extractOwnerIdFieldsFromText(vendor, text, confidence);
    }

    if (document.documentType === 'ADDRESS_PROOF') {
      return this.extractAddressProofFieldsFromText(vendor, text, confidence);
    }

    const fallback = this.defaultFieldsForDocumentType(document, vendor);
    const normalizedText = text.toLowerCase();

    return fallback.map((field) => {
      if (!field.extracted) {
        return {
          ...field,
          confidence: 0,
          status: 'missing' as const,
        };
      }

      const found = normalizedText.includes(field.extracted.toLowerCase());

      return {
        ...field,
        confidence: found
          ? Math.round(confidence)
          : Math.max(45, Math.round(confidence - 20)),
        status: found ? ('match' as const) : field.status,
      };
    });
  }

  private extractCacFieldsFromText(
    vendor: VendorLike,
    text: string,
    confidence: number,
  ): ExtractedDocumentField[] {
    const vendorBusinessName = vendor.businessName ?? '';
    const vendorRegistrationNumber = vendor.registrationNumber ?? '';
    const businessNameCandidate = this.extractCacBusinessNameCandidate(
      text,
      vendorBusinessName,
    );
    const registrationNumberCandidate =
      this.extractCacRegistrationNumberCandidate(text, vendorRegistrationNumber);
    const businessName = businessNameCandidate?.value ?? '';
    const registrationNumber = registrationNumberCandidate?.value ?? '';

    const businessNameStatus: ExtractedDocumentField['status'] = businessName
      ? this.businessNamesMatch(businessName, vendorBusinessName)
        ? 'match'
        : 'flagged'
      : 'missing';
    const registrationNumberStatus: ExtractedDocumentField['status'] =
      registrationNumber
        ? this.registrationNumbersMatch(
            registrationNumber,
            vendorRegistrationNumber,
          )
          ? 'match'
          : 'flagged'
        : 'missing';

    return [
      this.field(
        'Legal business name',
        businessName,
        vendorBusinessName,
        this.candidateConfidence(confidence, businessNameCandidate),
        businessNameStatus,
      ),
      this.field(
        'Registration number',
        registrationNumber,
        vendorRegistrationNumber,
        this.candidateConfidence(confidence, registrationNumberCandidate),
        registrationNumberStatus,
      ),
    ];
  }

  private extractCacBusinessNameCandidate(
    text: string,
    vendorBusinessName = '',
  ): ExtractionCandidate | null {
    const certificateMatch = text.match(
      /I\s+hereby\s+certify\s+that\s+([\s\S]+?)\s+is\s+this\s+day\s+incorporated/i,
    );
    const candidates: ExtractionCandidate[] = [];

    if (certificateMatch?.[1]) {
      const candidate = this.pickBestBusinessNameCandidate(
        certificateMatch[1],
        vendorBusinessName,
        35,
      );

      if (candidate) {
        candidates.push(candidate);
      }
    }

    const fullTextCandidate = this.pickBestBusinessNameCandidate(
      text,
      vendorBusinessName,
    );

    if (fullTextCandidate) {
      candidates.push(fullTextCandidate);
    }

    return this.bestCandidate(candidates, 45);
  }

  private extractTaxFieldsFromText(
    vendor: VendorLike,
    text: string,
    confidence: number,
  ): ExtractedDocumentField[] {
    const vendorBusinessName = vendor.businessName ?? '';
    const businessNameCandidate =
      this.extractNamedValueCandidate(
        text,
        [
          'business name',
          'company name',
          'taxpayer name',
          'tax payer name',
          'registered name',
          'name',
        ],
        vendorBusinessName,
        this.businessNamesMatch.bind(this),
      ) || this.pickBestBusinessNameCandidate(text, vendorBusinessName);
    const tinCandidate = this.extractTinCandidate(text);
    const businessName = businessNameCandidate?.value ?? '';
    const tin = tinCandidate?.value ?? '';

    return [
      this.field(
        'Legal business name',
        businessName,
        vendorBusinessName,
        this.candidateConfidence(confidence, businessNameCandidate),
        this.textFieldStatus(
          businessName,
          vendorBusinessName,
          this.businessNamesMatch.bind(this),
        ),
      ),
      this.field(
        'Tax identification number',
        tin,
        '',
        this.candidateConfidence(confidence, tinCandidate),
        tin ? 'match' : 'missing',
      ),
    ];
  }

  private extractOwnerIdFieldsFromText(
    vendor: VendorLike,
    text: string,
    confidence: number,
  ): ExtractedDocumentField[] {
    const contactName = vendor.contactName ?? '';
    const ownerNameCandidate =
      this.extractNamedValueCandidate(
        text,
        [
          'full name',
          'name',
          'surname',
          'given names',
          'given name',
          'holder',
        ],
        contactName,
        this.personNamesMatch.bind(this),
      ) || this.pickLikelyPersonNameCandidate(text, contactName);
    const documentNumberCandidate = this.extractIdentityDocumentNumberCandidate(text);
    const ownerName = ownerNameCandidate?.value ?? '';
    const documentNumber = documentNumberCandidate?.value ?? '';

    return [
      this.field(
        'Owner name',
        ownerName,
        contactName,
        this.candidateConfidence(confidence, ownerNameCandidate),
        this.textFieldStatus(
          ownerName,
          contactName,
          this.personNamesMatch.bind(this),
        ),
      ),
      this.field(
        'Document number',
        documentNumber,
        '',
        this.candidateConfidence(confidence, documentNumberCandidate),
        documentNumber ? 'match' : 'missing',
      ),
    ];
  }

  private extractAddressProofFieldsFromText(
    vendor: VendorLike,
    text: string,
    confidence: number,
  ): ExtractedDocumentField[] {
    const vendorAddress = this.vendorAddress(vendor);
    const vendorBusinessName = vendor.businessName ?? '';
    const addressCandidate =
      this.extractNamedValueCandidate(
        text,
        [
          'service address',
          'billing address',
          'business address',
          'customer address',
          'premises',
          'address',
        ],
        vendorAddress,
        this.addressesMatch.bind(this),
      ) || this.pickLikelyAddressCandidate(text, vendorAddress);
    const businessNameCandidate =
      this.extractNamedValueCandidate(
        text,
        [
          'customer name',
          'account name',
          'business name',
          'company name',
          'name',
        ],
        vendorBusinessName,
        this.businessNamesMatch.bind(this),
      ) || this.pickBestBusinessNameCandidate(text, vendorBusinessName);
    const issueDateCandidate = this.extractDocumentDateCandidate(text);
    const address = addressCandidate?.value ?? '';
    const businessName = businessNameCandidate?.value ?? '';
    const issueDate = issueDateCandidate?.value ?? '';

    return [
      this.field(
        'Business address',
        address,
        vendorAddress,
        this.candidateConfidence(confidence, addressCandidate),
        this.textFieldStatus(
          address,
          vendorAddress,
          this.addressesMatch.bind(this),
        ),
      ),
      this.field(
        'Legal business name',
        businessName,
        vendorBusinessName,
        this.candidateConfidence(confidence, businessNameCandidate),
        this.textFieldStatus(
          businessName,
          vendorBusinessName,
          this.businessNamesMatch.bind(this),
        ),
      ),
      this.field(
        'Issue date',
        issueDate,
        '',
        this.candidateConfidence(confidence, issueDateCandidate),
        issueDate ? 'match' : 'missing',
      ),
    ];
  }

  private pickBestBusinessNameLine(text: string) {
    return this.pickBestBusinessNameCandidate(text)?.value ?? '';
  }

  private pickBestBusinessNameCandidate(
    text: string,
    vendorBusinessName = '',
    baseScore = 0,
  ): ExtractionCandidate | null {
    const candidates = this.ocrLines(text)
      .map((line) => ({
        value: line,
        score:
          baseScore + this.scoreBusinessNameCandidate(line, vendorBusinessName),
      }))
      .filter((candidate) => candidate.score > 0);

    return this.bestCandidate(candidates, 45);
  }

  private scoreBusinessNameCandidate(line: string, vendorBusinessName = '') {
    if (!line || this.isBoilerplateDocumentLine(line)) {
      return 0;
    }

    let score = 20;

    if (
      /\b(LTD|LIMITED|PLC|LLC|INC|COMPANY|ENTERPRISES?|VENTURES?|SERVICES?)\b\.?$/i.test(
        line,
      )
    ) {
      score += 35;
    } else if (
      /\b(LTD|LIMITED|PLC|LLC|INC|COMPANY|ENTERPRISES?|VENTURES?|SERVICES?)\b/i.test(
        line,
      )
    ) {
      score += 25;
    }

    if (/^[A-Z0-9 .,'&-]+$/.test(line) && line.length <= 80) {
      score += 8;
    }

    if (/^(email|phone|status|date|tin|tax|address)\s*:/i.test(line)) {
      score -= 35;
    }

    if (/^\d{1,2}\s+[A-Z]+\s+\d{4}$/i.test(line) || /@/.test(line)) {
      score -= 45;
    }

    if (vendorBusinessName) {
      const ratio = this.sharedTokenRatio(
        this.normalizeBusinessName(line),
        this.normalizeBusinessName(vendorBusinessName),
      );

      if (ratio >= 0.8) {
        score += 35;
      } else if (ratio >= 0.5) {
        score += 25;
      } else if (ratio > 0) {
        score += 10;
      }
    }

    return score;
  }

  private extractCacRegistrationNumberCandidate(
    text: string,
    vendorRegistrationNumber = '',
  ): ExtractionCandidate | null {
    const candidates: ExtractionCandidate[] = [];
    const registrationPatterns: Array<{
      regex: RegExp;
      score: number;
      prefixGroup?: number;
      numberGroup: number;
    }> = [
      {
        regex:
          /\bCAC\s*[/-]\s*(RC|BN|IT)\s*[/-]\s*([0-9][0-9,\s.-]{2,})\b/gi,
        score: 95,
        prefixGroup: 1,
        numberGroup: 2,
      },
      {
        regex: /\b(RC|BN|IT)\s*[-/:]?\s*([0-9][0-9,\s.-]{2,})\b/gi,
        score: 85,
        prefixGroup: 1,
        numberGroup: 2,
      },
      {
        regex:
          /\b(?:registration|reg\.?|company|certificate)\s*(?:number|no\.?|num)?\s*[:#-]?\s*(?:CAC\s*[/-]\s*)?(RC|BN|IT)?\s*[/-]?\s*([0-9][0-9,\s.-]{2,})\b/gi,
        score: 80,
        prefixGroup: 1,
        numberGroup: 2,
      },
      {
        regex: /\bR\s*[-:]?\s*([0-9][0-9,\s.-]{2,})\b/gi,
        score: 52,
        numberGroup: 1,
      },
    ];

    for (const pattern of registrationPatterns) {
      for (const match of text.matchAll(pattern.regex)) {
        const prefix = pattern.prefixGroup
          ? match[pattern.prefixGroup]?.toUpperCase().replace(/^R$/, 'RC')
          : pattern.regex.source.startsWith('\\bR')
            ? 'RC'
            : '';
        const digits =
          match[pattern.numberGroup]?.replace(/[\s,.-]+/g, '') ?? '';

        if (digits.length < 3) {
          continue;
        }

        const value = `${prefix}${digits}`;
        let score =
          pattern.score + this.scoreRegistrationContext(text, match.index ?? 0);

        if (
          vendorRegistrationNumber &&
          this.registrationNumbersMatch(value, vendorRegistrationNumber)
        ) {
          score += 35;
        }

        candidates.push({ value, score });
      }
    }

    return this.bestCandidate(candidates, 55);
  }

  private scoreRegistrationContext(text: string, index: number) {
    const context = text
      .slice(Math.max(0, index - 60), index + 100)
      .toLowerCase();
    let score = 0;

    if (/cac|registration|reg\.?|company|certificate|incorporated/.test(context)) {
      score += 15;
    }

    if (/phone|mobile|email|date|status|amount|total/.test(context)) {
      score -= 35;
    }

    return score;
  }

  private extractTinCandidate(text: string) {
    const candidates: ExtractionCandidate[] = [];

    for (const match of text.matchAll(
      /\b(?:TIN|TAX\s*(?:IDENTIFICATION)?\s*(?:NUMBER|NO\.?)?)\s*[:#-]?\s*([0-9][0-9\s.-]{5,})\b/gi,
    )) {
      const value = match[1]?.replace(/[\s.-]+/g, '') ?? '';

      if (value.length >= 6) {
        candidates.push({ value, score: 90 });
      }
    }

    for (const match of text.matchAll(/\b([0-9]{8,14})\b/g)) {
      const contextScore = this.scoreRegistrationContext(text, match.index ?? 0);
      candidates.push({
        value: match[1],
        score: 45 + Math.max(-20, contextScore),
      });
    }

    return this.bestCandidate(candidates, 45);
  }

  private extractIdentityDocumentNumberCandidate(text: string) {
    const candidates: ExtractionCandidate[] = [];

    for (const match of text.matchAll(
      /\b(?:NIN|PASSPORT|LICENSE|LICENCE|ID\s*(?:NO\.?|NUMBER)?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9\s-]{5,})\b/gi,
    )) {
      const value = match[1]?.replace(/\s+/g, '').toUpperCase() ?? '';

      if (value.length >= 6) {
        candidates.push({ value, score: 90 });
      }
    }

    for (const match of text.matchAll(
      /\b([A-Z]{1,3}[0-9]{6,12}|[0-9]{10,14})\b/gi,
    )) {
      const context = text.slice(
        Math.max(0, (match.index ?? 0) - 50),
        (match.index ?? 0) + 70,
      );
      const penalty = /phone|mobile|date|amount|total/i.test(context) ? 35 : 0;

      candidates.push({
        value: match[1].toUpperCase(),
        score: 55 - penalty,
      });
    }

    return this.bestCandidate(candidates, 45);
  }

  private extractDocumentDateCandidate(text: string) {
    const patterns = [
      /\b(?:date|issued|issue date|bill date|statement date)\s*[:#-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{1,2}\s+[A-Z][a-z]+\s+[0-9]{4})/i,
      /\b([0-9]{1,2}\s+[A-Z][a-z]+\s+[0-9]{4})\b/i,
      /\b([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})\b/i,
    ];

    for (const [index, pattern] of patterns.entries()) {
      const match = text.match(pattern);

      if (match?.[1]) {
        return {
          value: match[1],
          score: index === 0 ? 90 : 55,
        };
      }
    }

    return null;
  }

  private extractNamedValueCandidate(
    text: string,
    labels: string[],
    verified = '',
    matcher?: (first: string, second: string) => boolean,
  ) {
    const candidates: ExtractionCandidate[] = [];

    for (const label of labels) {
      const pattern = new RegExp(
        `\\b${label.replace(/\s+/g, '\\s+')}\\s*[:#-]\\s*([^\\n\\r]{3,100})`,
        'gi',
      );

      for (const match of text.matchAll(pattern)) {
        const value = match?.[1] ? this.cleanOcrLine(match[1]) : '';

        if (!value || this.isBoilerplateDocumentLine(value)) {
          continue;
        }

        let score = 75;

        if (verified && matcher?.(value, verified)) {
          score += 25;
        }

        candidates.push({ value, score });
      }
    }

    return this.bestCandidate(candidates, 50);
  }

  private pickLikelyPersonNameCandidate(
    text: string,
    verifiedName = '',
  ): ExtractionCandidate | null {
    const candidates = this.ocrLines(text)
      .map((line) => {
        let score = /^[A-Z][A-Z.'-]+(?:\s+[A-Z][A-Z.'-]+){1,3}$/i.test(line)
          ? 50
          : 0;

        if (verifiedName) {
          const ratio = this.sharedTokenRatio(
            this.normalizeLooseText(line),
            this.normalizeLooseText(verifiedName),
          );

          if (ratio >= 0.8) {
            score += 35;
          } else if (ratio >= 0.5) {
            score += 20;
          }
        }

        if (this.isBoilerplateDocumentLine(line)) {
          score = 0;
        }

        return { value: line, score };
      })
      .filter((candidate) => candidate.score > 0);

    return this.bestCandidate(candidates, 45);
  }

  private pickLikelyAddressCandidate(
    text: string,
    verifiedAddress = '',
  ): ExtractionCandidate | null {
    const candidates = this.ocrLines(text)
      .map((line) => {
        let score = /\b(street|road|avenue|close|crescent|estate|lagos|abuja|state|city|suite|flat|plot|drive|lane|way)\b/i.test(line)
          ? 55
          : 0;

        if (verifiedAddress) {
          const ratio = this.sharedTokenRatio(
            this.normalizeLooseText(line),
            this.normalizeLooseText(verifiedAddress),
          );

          if (ratio >= 0.6) {
            score += 30;
          } else if (ratio >= 0.35) {
            score += 15;
          }
        }

        if (this.isBoilerplateDocumentLine(line)) {
          score = 0;
        }

        return { value: line, score };
      })
      .filter((candidate) => candidate.score > 0);

    return this.bestCandidate(candidates, 45);
  }

  private pickLikelyPersonNameLine(text: string) {
    return (
      text
        .split(/\r?\n/)
        .map((line) => this.cleanOcrLine(line))
        .find((line) =>
          /^[A-Z][A-Z.'-]+(?:\s+[A-Z][A-Z.'-]+){1,3}$/i.test(line),
        ) ?? ''
    );
  }

  private pickLikelyAddressLine(text: string) {
    return this.pickLikelyAddressCandidate(text)?.value ?? '';
  }

  private extractCacRegistrationNumber(text: string) {
    return this.extractCacRegistrationNumberCandidate(text)?.value ?? '';
  }

  private extractTin(text: string) {
    return this.extractTinCandidate(text)?.value ?? '';
  }

  private extractIdentityDocumentNumber(text: string) {
    return this.extractIdentityDocumentNumberCandidate(text)?.value ?? '';
  }

  private extractDocumentDate(text: string) {
    return this.extractDocumentDateCandidate(text)?.value ?? '';
  }

  private extractNamedValue(text: string, labels: string[]) {
    return this.extractNamedValueCandidate(text, labels)?.value ?? '';
  }

  private bestCandidate(
    candidates: Array<ExtractionCandidate | null | undefined>,
    minimumScore = 45,
  ) {
    const deduped = new Map<string, ExtractionCandidate>();

    for (const candidate of candidates) {
      if (!candidate?.value) {
        continue;
      }

      const cleanedValue = this.cleanOcrLine(candidate.value);
      const key = this.normalizeLooseText(cleanedValue);
      const existing = deduped.get(key);

      if (!existing || candidate.score > existing.score) {
        deduped.set(key, {
          value: cleanedValue,
          score: candidate.score,
        });
      }
    }

    const best = [...deduped.values()].sort((a, b) => b.score - a.score)[0];

    return best && best.score >= minimumScore ? best : null;
  }

  private candidateConfidence(
    ocrConfidence: number,
    candidate?: ExtractionCandidate | null,
  ) {
    if (!candidate) {
      return 0;
    }

    return Math.max(
      1,
      Math.min(100, Math.round(ocrConfidence * 0.65 + candidate.score * 0.35)),
    );
  }

  private ocrLines(text: string) {
    return text
      .split(/\r?\n/)
      .map((line) => this.cleanOcrLine(line))
      .filter((line) => line.length >= 3);
  }

  private isBoilerplateDocumentLine(line: string) {
    const normalized = line.toLowerCase();
    const boilerplate = new Set([
      'certificate of',
      'incorporation',
      'certificate of incorporation',
      'corporate affairs commission',
      'federal republic of nigeria',
      'federal republic of nire',
      'registrar-general',
      'registered details',
      'mock',
      'tax identification number',
      'national identity management commission',
    ]);

    return (
      boilerplate.has(normalized) ||
      /^(email|phone|status|date|tin|tax|address)\s*:/i.test(line)
    );
  }

  private cleanOcrLine(line: string) {
    return line
      .replace(/\s+/g, ' ')
      .replace(/^[^A-Z0-9]+|[^A-Z0-9.]+$/gi, '')
      .trim();
  }

  private defaultFieldsForDocumentType(
    document: DocumentLike,
    vendor: VendorLike,
  ): ExtractedDocumentField[] {
    const businessName = vendor.businessName ?? '';

    if (document.documentType === 'CAC_REGISTRATION') {
      return [
        this.field('Legal business name', businessName, businessName, 82),
        this.field(
          'Registration number',
          '',
          vendor.registrationNumber ?? '',
          0,
          'missing',
        ),
      ];
    }

    if (document.documentType === 'TAX_ID') {
      return [
        this.field('Legal business name', businessName, businessName, 78),
        this.field('Tax identification number', '', '', 0, 'missing'),
      ];
    }

    if (document.documentType === 'OWNER_ID') {
      return [
        this.field('Owner name', '', vendor.contactName ?? '', 0, 'missing'),
        this.field('Document number', '', '', 0, 'missing'),
      ];
    }

    return [
      this.field(
        'Business address',
        '',
        this.vendorAddress(vendor),
        0,
        'missing',
      ),
      this.field('Legal business name', businessName, businessName, 72),
    ];
  }

  private vendorAddress(vendor: VendorLike) {
    return [vendor.address, vendor.state, vendor.country]
      .filter(Boolean)
      .join(', ');
  }

  private field(
    label: string,
    extracted: string,
    verified: string,
    confidence: number,
    status: ExtractedDocumentField['status'] = 'match',
  ): ExtractedDocumentField {
    return {
      label,
      extracted,
      verified,
      confidence,
      status,
    };
  }

  private runAiGeneratedDetection(
    document: DocumentLike,
    ocr: OcrResult,
    file: { bytes: Buffer; mimeType: string },
    metadata: AiDetectionResult['signals'],
    synthId: AiDetectionResult['signals'][number],
    externalAiDetector: AiDetectionResult['signals'][number],
  ): AiDetectionResult {
    const signals: AiDetectionResult['signals'] = [
      ...metadata,
      synthId,
      externalAiDetector,
    ];
    let score = 0;

    if (document.duplicateDetected) {
      signals.push({
        code: 'DUPLICATE_LAYOUT_OR_FILE',
        message: 'The same document hash appears under another vendor.',
        weight: 30,
      });
      score += 30;
    }

    if (ocr.confidence < 70) {
      signals.push({
        code: 'LOW_OCR_CONFIDENCE',
        message: 'OCR confidence is low for this document.',
        weight: 15,
      });
      score += 15;
    }

    const missingFields = ocr.fields.filter(
      (field) => field.status === 'missing',
    );
    if (missingFields.length) {
      signals.push({
        code: 'MISSING_EXPECTED_FIELDS',
        message: 'Expected document fields were not detected.',
        weight: Math.min(25, missingFields.length * 10),
      });
      score += Math.min(25, missingFields.length * 10);
    }

    const text = ocr.text.toLowerCase();
    if (text.includes('generated by ai') || text.includes('synthetic')) {
      signals.push({
        code: 'SYNTHETIC_TEXT_MARKER',
        message: 'Document text contains a synthetic-generation marker.',
        weight: 45,
      });
      score += 45;
    }

    if (file.bytes.length < 12_000) {
      signals.push({
        code: 'LOW_FILE_COMPLEXITY',
        message: 'The uploaded document file is unusually small.',
        weight: 10,
      });
      score += 10;
    }

    for (const signal of metadata) {
      score += signal.weight;
    }

    if (synthId.code === 'SYNTHID_WATERMARK_DETECTED') {
      score += synthId.weight;
    }

    score = Math.max(score, this.scoreFromDetectorSignal(externalAiDetector));

    return {
      score: Math.min(100, score),
      detected: score >= 70,
      signals,
    };
  }

  private extractFileMetadata(
    document: DocumentLike,
    file: { bytes: Buffer; mimeType: string },
  ): AiDetectionResult['signals'] {
    try {
      if (file.mimeType.includes('pdf') || this.isPdf(file.bytes)) {
        return this.extractPdfMetadata(document, file.bytes);
      }

      if (file.mimeType.includes('png') || this.isPng(file.bytes)) {
        return this.extractPngMetadata(document, file.bytes);
      }

      if (
        file.mimeType.includes('jpeg') ||
        file.mimeType.includes('jpg') ||
        this.isJpeg(file.bytes)
      ) {
        return this.extractJpegMetadata(document, file.bytes);
      }

      return [
        {
          code: 'MISSING_METADATA',
          message:
            'Metadata checks could not identify a supported document file type.',
          weight: 5,
        },
      ];
    } catch (error) {
      return [
        {
          code: 'METADATA_EXTRACTION_FAILED',
          message: `Document metadata extraction failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
          weight: 10,
        },
      ];
    }
  }

  private extractPdfMetadata(
    document: DocumentLike,
    bytes: Buffer,
  ): AiDetectionResult['signals'] {
    const content = bytes.toString('latin1');
    const creator = this.extractPdfInfoValue(content, 'Creator');
    const producer = this.extractPdfInfoValue(content, 'Producer');
    const title = this.extractPdfInfoValue(content, 'Title');
    const author = this.extractPdfInfoValue(content, 'Author');
    const createdAt = this.parsePdfDate(
      this.extractPdfInfoValue(content, 'CreationDate'),
    );
    const modifiedAt = this.parsePdfDate(
      this.extractPdfInfoValue(content, 'ModDate'),
    );
    const pageCount = (content.match(/\/Type\s*\/Page\b/g) ?? []).length;
    const signals: AiDetectionResult['signals'] = [];

    if (
      !creator &&
      !producer &&
      !title &&
      !author &&
      !createdAt &&
      !modifiedAt
    ) {
      signals.push({
        code: 'MISSING_METADATA',
        message: 'PDF metadata is missing or unavailable.',
        weight: 5,
      });
    }

    const tool = [creator, producer].filter(Boolean).join(' ');
    if (tool) {
      signals.push({
        code: 'PDF_GENERATOR_DETECTED',
        message: `PDF generator metadata detected: ${tool}`,
        weight: this.isSuspiciousCreatorTool(tool) ? 15 : 0,
      });
    }

    if (this.isSuspiciousCreatorTool(tool)) {
      signals.push({
        code: 'SUSPICIOUS_CREATOR_TOOL',
        message:
          'Document metadata references a generator or editing tool often used to create synthetic documents.',
        weight: 20,
      });
    }

    this.addDateSignals(signals, document, createdAt, modifiedAt);

    signals.push({
      code: 'PDF_METADATA_EXTRACTED',
      message: `PDF metadata extracted${pageCount ? ` with ${pageCount} page(s)` : ''}.`,
      weight: 0,
    });

    return signals;
  }

  private extractPngMetadata(
    document: DocumentLike,
    bytes: Buffer,
  ): AiDetectionResult['signals'] {
    const signals: AiDetectionResult['signals'] = [];
    const dimensions = this.readPngDimensions(bytes);
    const textChunks = this.readPngTextChunks(bytes);
    const software = textChunks
      .filter((chunk) =>
        /software|creator|producer|prompt|parameters/i.test(chunk.keyword),
      )
      .map((chunk) => `${chunk.keyword}: ${chunk.value}`)
      .join(' ');

    if (!textChunks.length) {
      signals.push({
        code: 'MISSING_METADATA',
        message: 'PNG metadata text chunks are missing.',
        weight: 5,
      });
    }

    if (software) {
      signals.push({
        code: 'IMAGE_EDITING_SOFTWARE_DETECTED',
        message: `Image metadata contains creator/software data: ${software}`,
        weight: this.isSuspiciousCreatorTool(software) ? 15 : 0,
      });
    }

    if (this.isSuspiciousCreatorTool(software)) {
      signals.push({
        code: 'SUSPICIOUS_CREATOR_TOOL',
        message: 'Image metadata references AI generation or editing software.',
        weight: 20,
      });
    }

    signals.push({
      code: 'IMAGE_METADATA_EXTRACTED',
      message: dimensions
        ? `PNG metadata extracted at ${dimensions.width}x${dimensions.height}.`
        : 'PNG metadata extracted.',
      weight: 0,
    });

    this.addDateSignals(signals, document);

    return signals;
  }

  private extractJpegMetadata(
    document: DocumentLike,
    bytes: Buffer,
  ): AiDetectionResult['signals'] {
    const dimensions = this.readJpegDimensions(bytes);
    const ascii = bytes.toString('latin1');
    const hasExif = ascii.includes('Exif');
    const hasXmp = ascii.includes('http://ns.adobe.com/xap/1.0/');
    const softwareMatch = ascii.match(
      /(?:Software|CreatorTool|xmp:CreatorTool)[^A-Za-z0-9]{1,20}([A-Za-z0-9 ._-]{3,80})/i,
    );
    const software = softwareMatch?.[1]?.trim() ?? '';
    const signals: AiDetectionResult['signals'] = [];

    if (!hasExif && !hasXmp) {
      signals.push({
        code: 'MISSING_METADATA',
        message: 'JPEG EXIF/XMP metadata is missing.',
        weight: 5,
      });
    }

    if (software) {
      signals.push({
        code: 'IMAGE_EDITING_SOFTWARE_DETECTED',
        message: `Image metadata contains creator/software data: ${software}`,
        weight: this.isSuspiciousCreatorTool(software) ? 15 : 0,
      });
    }

    if (this.isSuspiciousCreatorTool(software)) {
      signals.push({
        code: 'SUSPICIOUS_CREATOR_TOOL',
        message: 'Image metadata references AI generation or editing software.',
        weight: 20,
      });
    }

    signals.push({
      code: 'IMAGE_METADATA_EXTRACTED',
      message: dimensions
        ? `JPEG metadata extracted at ${dimensions.width}x${dimensions.height}.`
        : 'JPEG metadata extracted.',
      weight: 0,
    });

    this.addDateSignals(signals, document);

    return signals;
  }

  private async checkSynthId(file: {
    bytes: Buffer;
    mimeType: string;
  }): Promise<AiDetectionResult['signals'][number]> {
    const provider = process.env.SYNTHID_PROVIDER ?? 'disabled';

    if (provider === 'disabled') {
      return {
        code: 'SYNTHID_CHECK_UNAVAILABLE',
        message:
          'SynthID backend verification is not configured for this environment.',
        weight: 0,
      };
    }

    if (provider === 'google-vertex') {
      return {
        code: 'SYNTHID_CHECK_UNAVAILABLE',
        message:
          'Google SynthID console verification is available, but no supported backend verification API is configured.',
        weight: 0,
      };
    }

    return {
      code: 'SYNTHID_CHECK_UNAVAILABLE',
      message: `Unknown SynthID provider "${provider}" was configured.`,
      weight: 0,
    };
  }

  private async checkExternalAiDocumentDetector(
    document: DocumentLike,
    file: { bytes: Buffer; mimeType: string },
  ): Promise<AiDetectionResult['signals'][number]> {
    const provider = process.env.AI_DOCUMENT_DETECTOR_PROVIDER ?? 'heuristic';

    if (provider === 'reality-defender') {
      return this.checkRealityDefender(document, file);
    }

    if (provider === 'disabled') {
      return {
        code: 'EXTERNAL_AI_DETECTOR_UNAVAILABLE',
        message:
          'External AI document detection is disabled for this environment.',
        weight: 0,
        metadata: {
          provider,
        },
      };
    }

    return {
      code: 'EXTERNAL_AI_DETECTOR_UNAVAILABLE',
      message:
        provider === 'heuristic'
          ? 'Only local heuristic AI document detection is configured.'
          : `Unknown AI document detector provider "${provider}" was configured.`,
      weight: 0,
      metadata: {
        provider,
      },
    };
  }

  private async checkRealityDefender(
    document: DocumentLike,
    file: { bytes: Buffer; mimeType: string },
  ): Promise<AiDetectionResult['signals'][number]> {
    const apiKey = process.env.REALITY_DEFENDER_API_KEY;

    if (!apiKey) {
      return {
        code: 'EXTERNAL_AI_DETECTOR_UNAVAILABLE',
        message:
          'Reality Defender is configured but REALITY_DEFENDER_API_KEY is missing.',
        weight: 0,
        metadata: {
          provider: 'reality-defender',
        },
      };
    }

    const tempFilePath = join(
      tmpdir(),
      `fraudlens-reality-defender-${randomUUID()}${this.fileExtensionForDetector(
        document,
        file,
      )}`,
    );

    try {
      await writeFile(tempFilePath, file.bytes);

      const client = new RealityDefender({ apiKey });
      const result = await client.detect(
        { filePath: tempFilePath },
        {
          maxAttempts: this.realityDefenderMaxAttempts(),
          pollingInterval: this.realityDefenderPollingInterval(),
        },
      );

      return this.realityDefenderResultToSignal(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`Reality Defender check failed: ${message}`);

      return {
        code: 'EXTERNAL_AI_DETECTOR_FAILED',
        message:
          'Reality Defender check failed; reviewer should rely on other risk signals.',
        weight: 0,
        metadata: {
          provider: 'reality-defender',
          error: message,
        },
      };
    } finally {
      await unlink(tempFilePath).catch(() => undefined);
    }
  }

  private realityDefenderResultToSignal(
    result: DetectionResult,
  ): AiDetectionResult['signals'][number] {
    const score = this.normalizeRealityDefenderScore(result.score);
    const status = result.status?.toUpperCase() ?? 'UNKNOWN';
    const metadata = {
      provider: 'reality-defender',
      requestId: result.requestId,
      status: result.status,
      score,
      models: result.models.map((model) => ({
        name: model.name,
        status: model.status,
        score: this.normalizeRealityDefenderScore(model.score),
      })),
    };

    if (score >= 70 || /MANIPULATED|SYNTHETIC|FAKE|AI/.test(status)) {
      return {
        code: 'REALITY_DEFENDER_AI_DETECTED',
        message: 'Reality Defender reported elevated synthetic-media risk.',
        weight: score >= 90 ? 45 : score >= 70 ? 30 : 15,
        metadata,
      };
    }

    if (score >= 50 || /UNKNOWN|PROCESSING|ANALYZING/.test(status)) {
      return {
        code: 'REALITY_DEFENDER_UNCERTAIN',
        message:
          'Reality Defender returned an uncertain synthetic-media result.',
        weight: score >= 50 ? 15 : 0,
        metadata,
      };
    }

    return {
      code: 'REALITY_DEFENDER_LOW_RISK',
      message: 'Reality Defender did not report elevated synthetic-media risk.',
      weight: 0,
      metadata,
    };
  }

  private normalizeRealityDefenderScore(score: number | null) {
    if (score === null || Number.isNaN(score)) {
      return 0;
    }

    return Math.round(score <= 1 ? score * 100 : score);
  }

  private scoreFromDetectorSignal(signal: ForensicSignal) {
    const score = signal.metadata?.score;

    return typeof score === 'number' && Number.isFinite(score) ? score : 0;
  }

  private realityDefenderPollingInterval() {
    return this.positiveIntegerFromEnv(
      'REALITY_DEFENDER_POLL_INTERVAL_MS',
      3_000,
    );
  }

  private realityDefenderMaxAttempts() {
    const configuredAttempts = this.positiveIntegerFromEnv(
      'REALITY_DEFENDER_MAX_ATTEMPTS',
      0,
    );

    if (configuredAttempts > 0) {
      return configuredAttempts;
    }

    const timeoutMs = this.positiveIntegerFromEnv(
      'REALITY_DEFENDER_TIMEOUT_MS',
      45_000,
    );

    return Math.max(
      1,
      Math.ceil(timeoutMs / this.realityDefenderPollingInterval()),
    );
  }

  private positiveIntegerFromEnv(name: string, fallback: number) {
    const value = Number(process.env[name]);

    return Number.isInteger(value) && value > 0 ? value : fallback;
  }

  private fileExtensionForDetector(
    document: DocumentLike,
    file: { bytes: Buffer; mimeType: string },
  ) {
    const extensionFromUrl = this.extensionFromFileUrl(document.fileUrl);

    if (extensionFromUrl) {
      return extensionFromUrl;
    }

    if (file.mimeType.includes('pdf') || this.isPdf(file.bytes)) {
      return '.pdf';
    }

    if (file.mimeType.includes('png') || this.isPng(file.bytes)) {
      return '.png';
    }

    if (
      file.mimeType.includes('jpeg') ||
      file.mimeType.includes('jpg') ||
      this.isJpeg(file.bytes)
    ) {
      return '.jpg';
    }

    return '.bin';
  }

  private extensionFromFileUrl(fileUrl: string) {
    try {
      const extension = extname(new URL(fileUrl).pathname).toLowerCase();

      return ['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(extension)
        ? extension
        : '';
    } catch {
      return '';
    }
  }

  private isPdf(bytes: Buffer) {
    return bytes.subarray(0, 5).toString() === '%PDF-';
  }

  private isPng(bytes: Buffer) {
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  private isJpeg(bytes: Buffer) {
    return bytes[0] === 0xff && bytes[1] === 0xd8;
  }

  private readPngDimensions(bytes: Buffer) {
    if (!this.isPng(bytes) || bytes.length < 24) {
      return null;
    }

    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }

  private readPngTextChunks(bytes: Buffer) {
    const chunks: Array<{ keyword: string; value: string }> = [];

    if (!this.isPng(bytes)) {
      return chunks;
    }

    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const length = bytes.readUInt32BE(offset);
      const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;

      if (dataEnd > bytes.length) {
        break;
      }

      if (type === 'tEXt') {
        const data = bytes.subarray(dataStart, dataEnd);
        const separator = data.indexOf(0);

        if (separator > 0) {
          chunks.push({
            keyword: data.subarray(0, separator).toString('latin1'),
            value: data.subarray(separator + 1).toString('latin1'),
          });
        }
      }

      offset = dataEnd + 4;
    }

    return chunks;
  }

  private readJpegDimensions(bytes: Buffer) {
    if (!this.isJpeg(bytes)) {
      return null;
    }

    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);

      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7),
        };
      }

      offset += 2 + length;
    }

    return null;
  }

  private extractPdfInfoValue(content: string, key: string) {
    const match = content.match(new RegExp(`/${key}\\s*\\(([^)]*)\\)`, 'i'));
    return match?.[1]?.replace(/\\([()\\])/g, '$1').trim() ?? '';
  }

  private parsePdfDate(value: string) {
    const match = value.match(
      /D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/,
    );

    if (!match) {
      return null;
    }

    const [, year, month, day, hour = '00', minute = '00', second = '00'] =
      match;
    const date = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private addDateSignals(
    signals: AiDetectionResult['signals'],
    document: DocumentLike,
    createdAt?: Date | null,
    modifiedAt?: Date | null,
  ) {
    const now = new Date();

    for (const date of [createdAt, modifiedAt].filter(Boolean) as Date[]) {
      if (date.getTime() > now.getTime() + 60_000) {
        signals.push({
          code: 'FUTURE_CREATED_DATE',
          message: 'Document metadata contains a future timestamp.',
          weight: 15,
        });
      }

      if (
        document.createdAt &&
        date.getTime() > document.createdAt.getTime() + 5 * 60_000
      ) {
        signals.push({
          code: 'METADATA_DATE_AFTER_UPLOAD',
          message:
            'Document metadata timestamp is later than the upload timestamp.',
          weight: 10,
        });
      }
    }
  }

  private isSuspiciousCreatorTool(value: string) {
    return /chatgpt|openai|midjourney|stable diffusion|dall.?e|gemini|imagen|firefly|canva|photoshop|gimp|ai generated|synthetic/i.test(
      value,
    );
  }

  private evaluateDocumentRisk(input: {
    document: DocumentLike;
    vendor: VendorLike;
    ocr: OcrResult;
    aiDetection: AiDetectionResult;
  }) {
    const reasons: VerificationReason[] = [];
    let tamperScore = 0;

    if (input.document.duplicateDetected) {
      tamperScore += 45;
      reasons.push({
        code: 'DUPLICATE_DOCUMENT',
        message: 'This document hash is linked to another vendor.',
        severity: 'HIGH',
        scoreImpact: 45,
        metadata: {
          duplicateVendorCount: input.document.duplicateVendorCount,
        },
      });
    }

    const businessNameField = input.ocr.fields.find(
      (field) => field.label === 'Legal business name',
    );
    if (
      businessNameField?.extracted &&
      input.vendor.businessName &&
      !this.businessNamesMatch(
        businessNameField.extracted,
        input.vendor.businessName,
      )
    ) {
      tamperScore += 25;
      reasons.push({
        code: 'BUSINESS_NAME_MISMATCH',
        message: 'Extracted business name differs from the vendor profile.',
        severity: 'HIGH',
        scoreImpact: 25,
      });
    }

    const registrationNumberField = input.ocr.fields.find(
      (field) => field.label === 'Registration number',
    );
    if (
      registrationNumberField?.extracted &&
      input.vendor.registrationNumber &&
      !this.registrationNumbersMatch(
        registrationNumberField.extracted,
        input.vendor.registrationNumber,
      )
    ) {
      tamperScore += 25;
      reasons.push({
        code: 'REGISTRATION_NUMBER_MISMATCH',
        message:
          'Extracted registration number differs from the vendor profile.',
        severity: 'HIGH',
        scoreImpact: 25,
      });
    }

    const genericFlaggedFields = input.ocr.fields.filter(
      (field) =>
        field.status === 'flagged' &&
        !['Legal business name', 'Registration number'].includes(field.label),
    );
    if (genericFlaggedFields.length) {
      const scoreImpact = Math.min(30, genericFlaggedFields.length * 15);
      tamperScore += scoreImpact;
      reasons.push({
        code: 'PROFILE_FIELD_MISMATCH',
        message: 'One or more extracted fields differ from the vendor profile.',
        severity: scoreImpact >= 30 ? 'HIGH' : 'MEDIUM',
        scoreImpact,
        metadata: {
          fields: genericFlaggedFields.map((field) => field.label),
        },
      });
    }

    const missingFields = input.ocr.fields.filter(
      (field) => field.status === 'missing',
    );
    if (missingFields.length) {
      const scoreImpact = Math.min(20, missingFields.length * 10);
      tamperScore += scoreImpact;
      reasons.push({
        code: 'MISSING_EXPECTED_FIELD',
        message: 'One or more expected document fields were not found.',
        severity: 'MEDIUM',
        scoreImpact,
        metadata: {
          fields: missingFields.map((field) => field.label),
        },
      });
    }

    if (input.ocr.confidence < 70) {
      tamperScore += 10;
      reasons.push({
        code: 'LOW_OCR_CONFIDENCE',
        message: 'OCR confidence is below the safe review threshold.',
        severity: 'MEDIUM',
        scoreImpact: 10,
        metadata: {
          ocrConfidence: input.ocr.confidence,
        },
      });
    }

    const forensicRiskSignals = input.aiDetection.signals.filter(
      (signal) =>
        signal.weight > 0 &&
        ![
          'MISSING_EXPECTED_FIELDS',
          'LOW_OCR_CONFIDENCE',
          'REALITY_DEFENDER_AI_DETECTED',
          'REALITY_DEFENDER_UNCERTAIN',
        ].includes(signal.code),
    );

    for (const signal of forensicRiskSignals) {
      tamperScore += signal.weight;
      reasons.push({
        code: signal.code,
        message: signal.message,
        severity: signal.weight >= 30 ? 'HIGH' : 'MEDIUM',
        scoreImpact: signal.weight,
        metadata: signal.metadata,
      });
    }

    const aiScore = input.aiDetection.score;
    if (aiScore >= 90) {
      tamperScore += 45;
    } else if (aiScore >= 70) {
      tamperScore += 30;
    } else if (aiScore >= 50) {
      tamperScore += 15;
    }

    if (aiScore >= 50) {
      reasons.push({
        code: 'SUSPECTED_AI_GENERATED_DOCUMENT',
        message:
          'Synthetic document risk is elevated and requires reviewer confirmation.',
        severity: aiScore >= 90 ? 'CRITICAL' : 'HIGH',
        scoreImpact: aiScore >= 90 ? 45 : aiScore >= 70 ? 30 : 15,
        metadata: {
          aiGeneratedScore: aiScore,
        },
      });
    }

    return {
      tamperScore: Math.min(100, tamperScore),
      reasons,
    };
  }

  private businessNamesMatch(first: string, second: string) {
    return (
      this.normalizeBusinessName(first) === this.normalizeBusinessName(second)
    );
  }

  private personNamesMatch(first: string, second: string) {
    return this.normalizeLooseText(first) === this.normalizeLooseText(second);
  }

  private addressesMatch(first: string, second: string) {
    const firstAddress = this.normalizeLooseText(first);
    const secondAddress = this.normalizeLooseText(second);

    if (!firstAddress || !secondAddress) {
      return false;
    }

    return (
      firstAddress.includes(secondAddress) ||
      secondAddress.includes(firstAddress) ||
      this.sharedTokenRatio(firstAddress, secondAddress) >= 0.6
    );
  }

  private textFieldStatus(
    extracted: string,
    verified: string,
    matcher: (first: string, second: string) => boolean,
  ): ExtractedDocumentField['status'] {
    if (!extracted) {
      return 'missing';
    }

    if (!verified) {
      return 'flagged';
    }

    return matcher(extracted, verified) ? 'match' : 'flagged';
  }

  private registrationNumbersMatch(first: string, second: string) {
    const firstNumber = this.normalizeRegistrationNumber(first);
    const secondNumber = this.normalizeRegistrationNumber(second);

    if (!firstNumber.raw || !secondNumber.raw) {
      return false;
    }

    if (firstNumber.raw === secondNumber.raw) {
      return true;
    }

    return (
      firstNumber.numericPart === secondNumber.numericPart &&
      Boolean(firstNumber.numericPart) &&
      (!firstNumber.prefix ||
        !secondNumber.prefix ||
        firstNumber.prefix === secondNumber.prefix)
    );
  }

  private normalizeRegistrationNumber(value: string) {
    const rawInput = value.toUpperCase().replace(/[^A-Z0-9]+/g, '');
    const withoutCacPrefix = rawInput.replace(/^CAC(?=RC|BN|IT|\d)/, '');
    const match = withoutCacPrefix.match(/^(RC|BN|IT|R)?([0-9]+)$/);
    const prefix = match?.[1] === 'R' ? 'RC' : match?.[1] ?? '';
    const numericPart = match?.[2] ?? withoutCacPrefix.replace(/^[A-Z]+/, '');

    return {
      raw: `${prefix}${numericPart}`,
      prefix,
      numericPart,
    };
  }

  private normalizeBusinessName(value: string) {
    return value
      .toUpperCase()
      .replace(/\bLIMITED\b/g, 'LTD')
      .replace(/\bLTD\./g, 'LTD')
      .replace(/[^A-Z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeLooseText(value: string) {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sharedTokenRatio(first: string, second: string) {
    const firstTokens = new Set(
      first.split(' ').filter((token) => token.length > 2),
    );
    const secondTokens = new Set(
      second.split(' ').filter((token) => token.length > 2),
    );

    if (!firstTokens.size || !secondTokens.size) {
      return 0;
    }

    const shared = [...firstTokens].filter((token) =>
      secondTokens.has(token),
    ).length;

    return shared / Math.max(firstTokens.size, secondTokens.size);
  }

  private async fetchDocumentFile(fileUrl: string) {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Could not fetch document file: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type') ?? 'application/pdf';

    return {
      bytes: Buffer.from(arrayBuffer),
      mimeType,
    };
  }

  private averageConfidence(pages: any[]) {
    const confidences: number[] = [];

    for (const page of pages) {
      for (const token of page.tokens ?? []) {
        if (typeof token.detectedBreak?.confidence === 'number') {
          confidences.push(token.detectedBreak.confidence * 100);
        }
        if (typeof token.layout?.confidence === 'number') {
          confidences.push(token.layout.confidence * 100);
        }
      }
    }

    if (!confidences.length) {
      return 75;
    }

    return Math.round(
      confidences.reduce((sum, value) => sum + value, 0) / confidences.length,
    );
  }
}
