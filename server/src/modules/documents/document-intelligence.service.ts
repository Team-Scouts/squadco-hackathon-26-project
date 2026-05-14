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
  createdAt?: Date;
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
    const metadata = this.extractFileMetadata(input.document, file);
    const synthId = await this.checkSynthId(file);
    const aiDetection = this.runAiGeneratedDetection(
      input.document,
      ocr,
      file,
      metadata,
      synthId,
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
    if (document.documentType === 'CAC_REGISTRATION') {
      return this.extractCacFieldsFromText(vendor, text, confidence);
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
        confidence: found ? Math.round(confidence) : Math.max(45, Math.round(confidence - 20)),
        status: found ? ('match' as const) : field.status,
      };
    });
  }

  private extractCacFieldsFromText(
    vendor: VendorLike,
    text: string,
    confidence: number,
  ): ExtractedDocumentField[] {
    const businessName = this.extractCacBusinessName(text);
    const registrationNumber = this.extractCacRegistrationNumber(text);
    const vendorBusinessName = vendor.businessName ?? '';
    const roundedConfidence = Math.round(confidence);

    const businessNameStatus: ExtractedDocumentField['status'] = businessName
      ? this.businessNamesMatch(businessName, vendorBusinessName)
        ? 'match'
        : 'flagged'
      : 'missing';

    return [
      this.field(
        'Legal business name',
        businessName,
        vendorBusinessName,
        businessName ? roundedConfidence : 0,
        businessNameStatus,
      ),
      this.field(
        'Registration number',
        registrationNumber,
        registrationNumber,
        registrationNumber ? roundedConfidence : 0,
        registrationNumber ? 'match' : 'missing',
      ),
    ];
  }

  private extractCacBusinessName(text: string) {
    const certificateMatch = text.match(
      /I\s+hereby\s+certify\s+that\s+([\s\S]+?)\s+is\s+this\s+day\s+incorporated/i,
    );

    if (certificateMatch?.[1]) {
      const candidate = this.pickBestBusinessNameLine(certificateMatch[1]);

      if (candidate) {
        return candidate;
      }
    }

    return this.pickBestBusinessNameLine(text);
  }

  private pickBestBusinessNameLine(text: string) {
    const ignoredLines = new Set([
      'certificate of',
      'incorporation',
      'corporate affairs commission',
      'federal republic of nigeria',
      'federal republic of nire',
      'registrar-general',
      'registered details',
      'mock',
    ]);

    const lines = text
      .split(/\r?\n/)
      .map((line) => this.cleanOcrLine(line))
      .filter((line) => line.length >= 3)
      .filter((line) => !ignoredLines.has(line.toLowerCase()))
      .filter((line) => !/^(email|phone|status)\s*:/i.test(line))
      .filter((line) => !/^\d{1,2}\s+[A-Z]+\s+\d{4}$/i.test(line));

    return (
      lines.find((line) => /\b(LTD|LIMITED|PLC|LLC|INC|COMPANY)\b\.?$/i.test(line)) ??
      lines.find((line) => /\b(LTD|LIMITED|PLC|LLC|INC|COMPANY)\b/i.test(line)) ??
      ''
    );
  }

  private extractCacRegistrationNumber(text: string) {
    const prefixedMatch = text.match(
      /\b(RC|BN|IT)\s*[-:]?\s*([0-9][0-9,\s.-]{2,})\b/i,
    );

    if (prefixedMatch) {
      const cleanedValue = prefixedMatch[2].replace(/[\s,.-]+/g, '');

      if (cleanedValue.length >= 3) {
        return `${prefixedMatch[1].toUpperCase()}${cleanedValue}`;
      }
    }

    const singleLetterMatch = text.match(/\bR\s*[-:]?\s*([0-9][0-9,\s.-]{2,})\b/i);

    if (singleLetterMatch) {
      const cleanedValue = singleLetterMatch[1].replace(/[\s,.-]+/g, '');

      if (cleanedValue.length >= 3) {
        return `R${cleanedValue}`;
      }
    }

    const labelledMatch = text.match(
      /\b(?:registration|reg\.?|certificate)\s*(?:number|no\.?|num)?\s*[:#-]?\s*([A-Z]{0,3}\s*[0-9][0-9,\s.-]{2,})\b/i,
    );

    if (labelledMatch) {
      const cleanedValue = labelledMatch[1].replace(/[\s,.-]+/g, '').toUpperCase();

      if (cleanedValue.length >= 3) {
        return cleanedValue;
      }
    }

    return '';
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
    metadata: AiDetectionResult['signals'],
    synthId: AiDetectionResult['signals'][number],
  ): AiDetectionResult {
    const signals: AiDetectionResult['signals'] = [...metadata, synthId];
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

    for (const signal of metadata) {
      score += signal.weight;
    }

    if (synthId.code === 'SYNTHID_WATERMARK_DETECTED') {
      score += synthId.weight;
    }

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

      if (file.mimeType.includes('jpeg') || file.mimeType.includes('jpg') || this.isJpeg(file.bytes)) {
        return this.extractJpegMetadata(document, file.bytes);
      }

      return [
        {
          code: 'MISSING_METADATA',
          message: 'Metadata checks could not identify a supported document file type.',
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
    const createdAt = this.parsePdfDate(this.extractPdfInfoValue(content, 'CreationDate'));
    const modifiedAt = this.parsePdfDate(this.extractPdfInfoValue(content, 'ModDate'));
    const pageCount = (content.match(/\/Type\s*\/Page\b/g) ?? []).length;
    const signals: AiDetectionResult['signals'] = [];

    if (!creator && !producer && !title && !author && !createdAt && !modifiedAt) {
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
        message: 'Document metadata references a generator or editing tool often used to create synthetic documents.',
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
      .filter((chunk) => /software|creator|producer|prompt|parameters/i.test(chunk.keyword))
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
    const softwareMatch = ascii.match(/(?:Software|CreatorTool|xmp:CreatorTool)[^A-Za-z0-9]{1,20}([A-Za-z0-9 ._-]{3,80})/i);
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

  private async checkSynthId(
    file: { bytes: Buffer; mimeType: string },
  ): Promise<AiDetectionResult['signals'][number]> {
    const provider = process.env.SYNTHID_PROVIDER ?? 'disabled';

    if (provider === 'disabled') {
      return {
        code: 'SYNTHID_CHECK_UNAVAILABLE',
        message: 'SynthID backend verification is not configured for this environment.',
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

  private isPdf(bytes: Buffer) {
    return bytes.subarray(0, 5).toString() === '%PDF-';
  }

  private isPng(bytes: Buffer) {
    return bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
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
    const match = value.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);

    if (!match) {
      return null;
    }

    const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
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
          message: 'Document metadata timestamp is later than the upload timestamp.',
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
        !['MISSING_EXPECTED_FIELDS', 'LOW_OCR_CONFIDENCE'].includes(signal.code),
    );

    for (const signal of forensicRiskSignals) {
      tamperScore += signal.weight;
      reasons.push({
        code: signal.code,
        message: signal.message,
        severity: signal.weight >= 30 ? 'HIGH' : 'MEDIUM',
        scoreImpact: signal.weight,
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

  private businessNamesMatch(first: string, second: string) {
    return this.normalizeBusinessName(first) === this.normalizeBusinessName(second);
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
