# Frontend Risk And Intelligence API Guide

This document explains the MVP risk fields now available to the frontend.

## Document Intelligence

Run automated document checks after upload:

```txt
POST /documents/:id/run-checks
```

The response still returns the existing document shape, with these important fields:

```ts
document.ocrProvider
document.ocrStatus
document.ocrText
document.ocrConfidence
document.extractedFields
document.verificationReasons
document.forensicSignals
document.aiGeneratedScore
document.aiGeneratedDetected
document.tamperScore
document.verificationStatus
```

`forensicSignals` now includes metadata, SynthID, and external AI detector signals such as:

```txt
MISSING_METADATA
SUSPICIOUS_CREATOR_TOOL
PDF_GENERATOR_DETECTED
IMAGE_EDITING_SOFTWARE_DETECTED
SYNTHID_CHECK_UNAVAILABLE
SYNTHID_WATERMARK_DETECTED
REALITY_DEFENDER_AI_DETECTED
REALITY_DEFENDER_LOW_RISK
REALITY_DEFENDER_UNCERTAIN
EXTERNAL_AI_DETECTOR_UNAVAILABLE
EXTERNAL_AI_DETECTOR_FAILED
```

Display SynthID as a signal, not proof. If the value is `SYNTHID_CHECK_UNAVAILABLE`, show it as unavailable or not configured, not as a failed document.

Display Reality Defender and other AI detector results as synthetic-media risk, not as final proof. The frontend must not call Reality Defender directly or store its API key. Use only the backend response fields:

```ts
document.aiGeneratedScore
document.aiGeneratedDetected
document.forensicSignals
document.verificationReasons
```

Recommended display copy:

```txt
Synthetic document risk: 82%
Requires reviewer confirmation
```

Avoid absolute wording such as "this document is definitely AI-generated."

## Transaction Risk

Financial checks are available through:

```txt
POST /transactions/vendors/:vendorId/run-checks
GET  /transactions
GET  /transactions/:id
POST /transactions
PATCH /transactions/:id
DELETE /transactions/:id
```

The vendor financial check returns:

```ts
{
  success: boolean;
  vendorId: string;
  financialAnomalyRisk: number;
  overallRisk: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: string;
  signals: Array<{
    code: string;
    message: string;
    severity: string;
    scoreImpact: number;
    metadata?: Record<string, unknown>;
  }>;
}
```

Current financial signals include:

```txt
REPEATED_FAILED_PAYMENTS
UNUSUALLY_HIGH_AMOUNT
RAPID_TRANSACTION_VELOCITY
WEBHOOK_REPLAY_OR_IDEMPOTENCY_CONFLICT
MANY_REFUNDS
TRANSFER_TO_SHARED_BANK_ACCOUNT
BANK_ACCOUNT_IDENTITY_MISMATCH
```

## Graph Usage

Graph endpoints remain the frontend entry point for relationship views:

```txt
GET /graph/vendors/:id
GET /graph/shared-accounts
GET /graph/fraud-clusters
```

Use graph data for relationship visualization. Use document and transaction endpoints for source-of-truth risk state.

## Auth

These endpoints require a signed-in `admin` or `reviewer` user and must send Better Auth cookies:

```ts
credentials: "include"
```
