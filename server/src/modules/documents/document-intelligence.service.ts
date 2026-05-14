import { Injectable, Logger } from '@nestjs/common';
import { createSign } from 'node:crypto';

type VendorLike = {
  businessName?: string;
  email?: string;
  phone?: string;
};

type DocumentLike = {
  documentType: string;
  fileUrl: string;
  documentHash?: string | null;
  duplicateDetected: boolean;
  duplicateVendorCount: number;
};

export type ExtractedDocumentField = {
  label: string;
  extracted: string;
  verified: string;
  confidence: number;
  status: 'match' | 'edited' | 'flagged' | 'missing';
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
  signals: Array<{
    code: string;
    message: string;
    weight: number;
  }>;
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
    const aiDetection = this.runAiGeneratedDetection(input.document, ocr, file);
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
      throw new Error('Google Document AI project/location/processor config missing');
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
      throw new Error(`Document AI request failed with status ${response.status}`);
    }

    const body = (await response.json()) as any;
    const text = String(body.document?.text ?? '');
    const confidence = this.averageConfidence(body.document?.pages ?? []);
    const fields = this.extractFieldsFromText(document, vendor, text, confidence);

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
      throw new Error(`Google token exchange failed with status ${response.status}`);
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
        confidence: found ? Math.round(confidence) : Math.max(45, Math.round(confidence - 20)),
        status: found ? ('match' as const) : field.status,
      };
    });
  }

  private defaultFieldsForDocumentType(
    document: DocumentLike,
    vendor: VendorLike,
  ): ExtractedDocumentField[] {
    const businessName = vendor.businessName ?? '';

    if (document.documentType === 'CAC_REGISTRATION') {
      return [
        this.field('Legal business name', businessName, businessName, 82),
        this.field('Registration number', '', '', 0, 'missing'),
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
        this.field('Owner name', '', '', 0, 'missing'),
        this.field('Document number', '', '', 0, 'missing'),
      ];
    }

    return [
      this.field('Business address', '', '', 0, 'missing'),
      this.field('Legal business name', businessName, businessName, 72),
    ];
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
  ): AiDetectionResult {
    const signals: AiDetectionResult['signals'] = [];
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

    const missingFields = ocr.fields.filter((field) => field.status === 'missing');
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

    return {
      score: Math.min(100, score),
      detected: score >= 70,
      signals,
    };
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
      businessNameField.extracted.toLowerCase() !==
        input.vendor.businessName.toLowerCase()
    ) {
      tamperScore += 25;
      reasons.push({
        code: 'BUSINESS_NAME_MISMATCH',
        message: 'Extracted business name differs from the vendor profile.',
        severity: 'HIGH',
        scoreImpact: 25,
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
        message: 'Synthetic document risk is elevated and requires reviewer confirmation.',
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
