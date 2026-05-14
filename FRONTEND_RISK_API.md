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

`forensicSignals` now includes metadata and SynthID-related signals such as:

```txt
MISSING_METADATA
SUSPICIOUS_CREATOR_TOOL
PDF_GENERATOR_DETECTED
IMAGE_EDITING_SOFTWARE_DETECTED
SYNTHID_CHECK_UNAVAILABLE
SYNTHID_WATERMARK_DETECTED
```

Display SynthID as a signal, not proof. If the value is `SYNTHID_CHECK_UNAVAILABLE`, show it as unavailable or not configured, not as a failed document.

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
