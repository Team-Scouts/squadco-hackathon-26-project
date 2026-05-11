# VeriSphere

## AI Trust Graph & Fraud Intelligence Platform

VeriSphere is an AI-powered fraud intelligence platform for verifying vendors, detecting fake businesses, identifying fraud rings, and enabling safer grant, loan, procurement, and payout decisions.

The platform combines:

- Vendor onboarding
- Squad payment and transfer APIs
- Webhook-driven transaction intelligence
- AI document analysis
- Device fingerprinting
- Neo4j trust graph relationships
- Explainable risk scoring
- Admin review workflows

The MVP is designed for the Squad Hackathon and is built to prove one clear idea:

> Institutions should not verify vendors by checking documents in isolation. They should verify vendors by analyzing identity, documents, devices, payments, and relationships together.

---

# 1. Problem Statement

Governments, NGOs, banks, and large companies often distribute money through:

- SME grants
- Procurement contracts
- Vendor payments
- Youth empowerment loans
- Business support funds
- Contractor payouts

However, these programs are vulnerable to fraud.

Common fraud patterns include:

- Fake businesses
- Forged CAC documents
- Duplicate invoices
- Recycled bank accounts
- Shared devices
- Synthetic identities
- Ghost vendors
- Coordinated fraud rings

Traditional verification is weak because it checks vendors one by one. It may confirm that a document looks acceptable, but it does not reveal that five vendors may be connected by the same device, same bank account, duplicate document, or suspicious payment behavior.

VeriSphere solves this by building a trust graph.

---

# 2. Core Idea

VeriSphere creates a fraud intelligence graph where every important entity becomes a node.

## Example Nodes

- Vendor
- Business
- User
- Device
- Bank account
- Document
- Phone number
- Email address
- Transaction
- Squad payment reference
- Squad transfer reference

## Example Relationships

- Vendor uses Device
- Vendor owns Bank Account
- Vendor uploaded Document
- Vendor made Payment
- Vendor received Transfer
- Vendor shares Device with another Vendor
- Vendor shares Bank Account with another Vendor
- Vendor submitted duplicate Document

This allows the system to detect hidden fraud patterns that a manual reviewer would miss.

Example:

```txt
Vendor A -- uses -- Device X
Vendor B -- uses -- Device X
Vendor C -- uses -- Device X
Vendor B -- owns -- Bank Account Y
Vendor C -- owns -- Bank Account Y
```

The system can flag this as a possible fraud ring.

---

# 3. MVP Goal

The MVP proves that VeriSphere can complete an end-to-end vendor verification and payout workflow.

## MVP Flow

```txt
Vendor signs up
        ↓
Vendor uploads business documents
        ↓
System captures device fingerprint
        ↓
Vendor pays verification fee through Squad
        ↓
Squad webhook confirms payment
        ↓
Document AI analyzes uploaded files
        ↓
Neo4j trust graph is updated
        ↓
Risk engine calculates explainable trust score
        ↓
Admin approves, rejects, or escalates vendor
        ↓
Approved vendor receives payout using Squad Transfer API
```

---

# 4. MVP Key Strengths

## 4.1 Meaningful Squad Integration

Squad is not used as a token payment button.

Squad powers:

- Payment initiation
- Payment confirmation
- Webhook-driven transaction updates
- Account lookup
- Transfer payouts
- Payment metadata tracking
- Financial behavior signals

Squad becomes the financial telemetry layer of the platform.

---

## 4.2 Real Trust Graph

Neo4j is used in the MVP to store and analyze relationships between vendors, devices, documents, accounts, and transactions.

This enables:

- Shared-device detection
- Shared-bank-account detection
- Duplicate-document detection
- Fraud-ring discovery
- Connected-entity investigation

---

## 4.3 AI Document Intelligence

The MVP includes practical AI-assisted document verification using:

- OCR
- Image hashing
- Perceptual hashing
- Metadata extraction
- Duplicate detection
- Basic tamper heuristics
- Vendor/document mismatch checks

This does not claim to be a perfect fake-document classifier. Instead, it provides a realistic document risk score based on multiple signals.

---

## 4.4 Explainable Risk Scoring

The system does not only say:

```txt
HIGH RISK
```

It explains why.

Example:

```json
{
  "riskLevel": "HIGH",
  "overallRisk": 84,
  "reasons": [
    "Device used by 5 vendors within 2 hours",
    "Bank account linked to 3 vendors",
    "Duplicate CAC document detected",
    "Verification payment metadata linked to suspicious onboarding session"
  ]
}
```

This makes the platform useful to real reviewers.

---

## 4.5 Realistic Nigerian Data Strategy

The MVP does not depend on restricted datasets such as national telecom records, full BVN data, government payroll systems, or cross-bank transaction histories.

Instead, the MVP uses data that can realistically be collected:

- User-submitted vendor details
- Uploaded documents
- Device fingerprint hash
- IP/session metadata
- Squad payment events
- Squad transfer events
- Account lookup results
- Virtual account activity where enabled
- Admin review outcomes

Future institutional versions can integrate CAC, BVN/NUBAN, tax systems, government procurement databases, and bank fraud lists.

---

# 5. Tech Stack

## Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Neo4j

## AI Service

- Python FastAPI
- OpenCV
- OCR tooling
- scikit-learn
- Image hashing
- Metadata analysis

## Payments

- Squad APIs
- Squad Webhooks
- Squad Account Lookup
- Squad Transfers
- Squad Virtual Accounts

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Admin dashboard
- Vendor onboarding UI
- Risk explanation UI
- Graph visualization

---

# 6. High-Level Architecture

```txt
Frontend: Next.js
        ↓
NestJS Backend API
        ↓
Core Backend Modules
 ├── Auth
 ├── Vendors
 ├── Documents
 ├── Devices
 ├── Squad
 ├── Transactions
 ├── Risk Engine
 ├── Graph Intelligence
 ├── Alerts
 └── Admin
        ↓
Data Layer
 ├── PostgreSQL
 ├── Neo4j
 └── Redis
        ↓
Python AI Service
 ├── OCR
 ├── Document analysis
 ├── Metadata extraction
 ├── Image similarity
 └── Anomaly helpers
```

---

# 7. Folder Structure

```txt
src/
│
├── config/
├── common/
├── prisma/
├── neo4j/
├── redis/
├── integrations/
│   └── squad/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── vendors/
│   ├── documents/
│   ├── devices/
│   ├── transactions/
│   ├── risk/
│   ├── graph/
│   ├── alerts/
│   └── admin/
├── queue/
├── storage/
├── database/
└── types/
```

---

# 8. Main Backend Modules

## 8.1 Auth Module

Handles:

- User registration
- Login
- JWT authentication
- Role-based access control
- Admin/reviewer/vendor roles

---

## 8.2 Vendors Module

Handles:

- Vendor onboarding
- Business profile creation
- Verification state
- Approval/rejection workflow
- Vendor status updates

Vendor statuses:

```txt
PENDING
PAYMENT_CONFIRMED
UNDER_REVIEW
APPROVED
FLAGGED
REJECTED
PAID_OUT
```

---

## 8.3 Documents Module

Handles:

- CAC document upload
- Invoice upload
- ID upload
- OCR extraction
- File hashing
- Metadata extraction
- Duplicate detection
- Document risk scoring

---

## 8.4 Device Intelligence Module

Handles:

- Browser fingerprint hash
- User agent
- IP metadata
- Session velocity
- Device reuse detection
- Suspicious login patterns

Example device rule:

```txt
If one device is linked to 3 or more vendors within 24 hours, increase device risk.
```

---

## 8.5 Squad Module

Handles:

- Payment initiation
- Payment verification
- Webhook validation
- Account lookup
- Transfer payouts
- Virtual account creation where enabled
- Squad metadata strategy

---

## 8.6 Transactions Module

Handles:

- Transaction persistence
- Squad payment events
- Squad transfer events
- Raw webhook payload storage
- Transaction risk signals

---

## 8.7 Graph Module

Handles:

- Neo4j node creation
- Neo4j relationship creation
- Shared-device queries
- Shared-account queries
- Duplicate-document graph checks
- Fraud cluster detection

---

## 8.8 Risk Module

Handles:

- Weighted risk scoring
- Document risk
- Device risk
- Network fraud risk
- Financial anomaly risk
- Identity mismatch risk
- Explainable risk output

---

## 8.9 Alerts Module

Handles:

- High-risk alerts
- Manual review queues
- Fraud ring alerts
- Payout warning alerts

---

## 8.10 Admin Module

Handles:

- Admin dashboard APIs
- Vendor review
- Risk summary
- Fraud clusters
- Manual approval/rejection
- Payout trigger after approval

---

# 9. Squad Integration

Squad is central to the MVP.

## 9.1 Verification Payment Flow

```txt
Vendor registers
        ↓
Backend creates Squad payment
        ↓
Payment metadata includes vendor_id and purpose
        ↓
Vendor completes payment
        ↓
Squad sends webhook
        ↓
Backend validates webhook
        ↓
Transaction is stored
        ↓
Graph is updated
        ↓
Risk score is recalculated
```

### Payment Metadata

Every Squad transaction should include metadata:

```json
{
  "vendor_id": "vendor_123",
  "user_id": "user_456",
  "purpose": "verification_fee",
  "risk_session_id": "risk_session_789"
}
```

This ensures every payment event can be connected back to the correct vendor and graph node.

---

## 9.2 Squad Webhook Processing

Webhook endpoint:

```txt
POST /api/webhooks/squad
```

Webhook responsibilities:

1. Validate Squad webhook signature
2. Store raw webhook event
3. Check idempotency
4. Prevent duplicate transaction processing
5. Save payment or transfer event
6. Update Neo4j graph
7. Trigger risk recalculation
8. Return success response quickly

### Webhook Idempotency Rules

```txt
If transaction reference already exists:
    do not process again
    return success

If transaction reference is new:
    save webhook event
    save transaction
    update graph
    recalculate risk
```

---

## 9.3 Account Lookup

Before approving a vendor for payout, the system can verify the submitted account details.

Flow:

```txt
Vendor submits bank account
        ↓
Backend calls Squad Account Lookup
        ↓
Returned account name is compared with vendor/business name
        ↓
Mismatch increases identity risk
        ↓
Match improves payout confidence
```

Account lookup does not prove full business legitimacy, but it helps reduce payout fraud risk.

---

## 9.4 Squad Transfers

Transfers are included in the MVP as the final step after admin approval.

Flow:

```txt
Vendor risk score is calculated
        ↓
Admin reviews vendor
        ↓
Admin approves vendor
        ↓
Backend initiates Squad transfer
        ↓
Transfer event is stored
        ↓
Neo4j graph records payout relationship
        ↓
Vendor status becomes PAID_OUT
```

The MVP should use Squad sandbox/test mode for transfers.

Transfers prove that VeriSphere can support a complete institutional workflow:

```txt
verify → approve → pay out → monitor
```

---

## 9.5 Squad Virtual Accounts

Virtual accounts are optional in the first MVP but recommended if time allows.

Use case:

```txt
Each vendor receives a dedicated virtual account.
Incoming payments into that account become behavioral signals.
```

Virtual account data can improve:

- Vendor financial activity profile
- Transaction consistency scoring
- Suspicious inflow detection
- Merchant behavior analysis

If time is limited, virtual accounts can be moved to Phase 2.

---

# 10. API Endpoints

## 10.1 Auth

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

## 10.2 Vendors

```txt
POST  /api/vendors
GET   /api/vendors
GET   /api/vendors/:id
PATCH /api/vendors/:id
PATCH /api/vendors/:id/status
```

---

## 10.3 Documents

```txt
POST /api/vendors/:id/documents
GET  /api/vendors/:id/documents
POST /api/documents/:id/analyze
GET  /api/documents/:id/result
```

---

## 10.4 Device Intelligence

```txt
POST /api/vendors/:id/device-signals
GET  /api/vendors/:id/device-signals
```

---

## 10.5 Squad

```txt
POST /api/squad/payments/initiate
GET  /api/squad/transactions/:reference/verify
POST /api/squad/account-lookup
POST /api/squad/transfers
POST /api/squad/virtual-accounts
POST /api/webhooks/squad
```

---

## 10.6 Risk

```txt
POST /api/vendors/:id/recalculate-risk
GET  /api/vendors/:id/risk-score
GET  /api/vendors/:id/risk-history
```

---

## 10.7 Graph

```txt
GET /api/graph/vendors/:id
GET /api/graph/fraud-clusters
GET /api/graph/shared-devices
GET /api/graph/shared-accounts
GET /api/graph/duplicate-documents
```

---

## 10.8 Admin

```txt
GET   /api/admin/overview
GET   /api/admin/vendors
GET   /api/admin/flagged-vendors
GET   /api/admin/alerts
GET   /api/admin/fraud-clusters
PATCH /api/admin/vendors/:id/approve
PATCH /api/admin/vendors/:id/reject
POST  /api/admin/vendors/:id/payout
```

---

# 11. Database Models

## 11.1 PostgreSQL / Prisma Models

Core models:

```txt
User
Vendor
Document
DeviceSignal
BankAccount
SquadTransaction
SquadTransfer
RiskScore
RiskReason
Alert
WebhookEvent
AdminReview
```

---

## 11.2 WebhookEvent Model

The webhook event table is important for reliability and auditability.

```txt
webhook_events
- id
- provider
- event_type
- transaction_reference
- raw_payload
- signature
- processed
- processed_at
- created_at
```

---

## 11.3 SquadTransaction Model

```txt
squad_transactions
- id
- vendor_id
- transaction_reference
- squad_reference
- amount
- currency
- status
- channel
- purpose
- metadata
- raw_payload
- created_at
```

---

## 11.4 SquadTransfer Model

```txt
squad_transfers
- id
- vendor_id
- transfer_reference
- amount
- bank_code
- account_number_hash
- account_name
- status
- raw_payload
- created_at
```

---

## 11.5 RiskScore Model

```txt
risk_scores
- id
- vendor_id
- document_risk
- network_fraud_risk
- financial_anomaly_risk
- device_risk
- identity_mismatch_risk
- manual_review_penalty
- overall_risk
- risk_level
- recommended_action
- created_at
```

---

# 12. Neo4j Graph Design

## 12.1 Nodes

```txt
(:Vendor)
(:User)
(:Device)
(:BankAccount)
(:Document)
(:Phone)
(:Email)
(:Transaction)
(:Transfer)
(:RiskScore)
```

---

## 12.2 Relationships

```txt
(:Vendor)-[:REGISTERED_BY]->(:User)
(:Vendor)-[:USES_DEVICE]->(:Device)
(:Vendor)-[:OWNS_ACCOUNT]->(:BankAccount)
(:Vendor)-[:SUBMITTED_DOC]->(:Document)
(:Vendor)-[:HAS_PHONE]->(:Phone)
(:Vendor)-[:HAS_EMAIL]->(:Email)
(:Vendor)-[:MADE_PAYMENT]->(:Transaction)
(:Vendor)-[:RECEIVED_TRANSFER]->(:Transfer)
(:Vendor)-[:HAS_RISK_SCORE]->(:RiskScore)
```

---

## 12.3 Example Fraud Queries

Find vendors sharing one device:

```cypher
MATCH (d:Device)<-[:USES_DEVICE]-(v:Vendor)
WITH d, collect(v) AS vendors, count(v) AS vendorCount
WHERE vendorCount >= 3
RETURN d, vendors, vendorCount
```

Find vendors sharing one bank account:

```cypher
MATCH (b:BankAccount)<-[:OWNS_ACCOUNT]-(v:Vendor)
WITH b, collect(v) AS vendors, count(v) AS vendorCount
WHERE vendorCount >= 2
RETURN b, vendors, vendorCount
```

Find duplicate document usage:

```cypher
MATCH (doc:Document)<-[:SUBMITTED_DOC]-(v:Vendor)
WITH doc, collect(v) AS vendors, count(v) AS vendorCount
WHERE vendorCount >= 2
RETURN doc, vendors, vendorCount
```

---

# 13. AI Document Intelligence

## 13.1 MVP Document Pipeline

```txt
Document uploaded
        ↓
File stored securely
        ↓
OCR extracts text
        ↓
System extracts key fields
        ↓
Document hash is generated
        ↓
Perceptual hash is generated
        ↓
Metadata is analyzed
        ↓
Duplicate checks are performed
        ↓
Tamper heuristics run
        ↓
Document risk score is returned
```

---

## 13.2 MVP Document Checks

The MVP document engine should check:

- Duplicate document hash
- Similar image hash
- Missing expected text fields
- Name mismatch between vendor profile and document
- CAC number mismatch
- Suspicious file metadata
- Unusual compression patterns
- Reused invoice templates
- Low-confidence OCR output

---

## 13.3 Example Document Risk Output

```json
{
  "documentId": "doc_123",
  "documentRisk": 72,
  "status": "SUSPICIOUS",
  "signals": [
    "Duplicate perceptual hash matched another vendor document",
    "OCR extracted business name does not match vendor business name",
    "Image metadata suggests post-processing",
    "CAC number was not clearly detected"
  ]
}
```

---

# 14. Device Intelligence

## 14.1 Captured Device Signals

The frontend should collect non-invasive fingerprinting signals and send them to the backend.

```json
{
  "browserFingerprintHash": "hashed_fingerprint",
  "userAgent": "Chrome on Windows",
  "timezone": "Africa/Lagos",
  "screenResolution": "1920x1080",
  "language": "en-US",
  "sessionId": "session_uuid"
}
```

The backend should detect IP address server-side.

---

## 14.2 Device Risk Rules

Examples:

```txt
Same device linked to 3+ vendors = high risk
Same IP linked to multiple vendors in short time = medium risk
Device previously linked to rejected vendor = high risk
Rapid repeated registrations = high risk
Timezone/location mismatch = medium risk
```

Sensitive identifiers should be hashed. The system should avoid storing invasive raw device identifiers.

---

# 15. Risk Scoring Logic

## 15.1 MVP Risk Formula

```txt
overall_risk =
0.25 * document_risk +
0.25 * network_fraud_risk +
0.20 * financial_anomaly_risk +
0.15 * device_risk +
0.10 * identity_mismatch_risk +
0.05 * manual_review_penalty
```

---

## 15.2 Risk Levels

```txt
0 - 30    LOW
31 - 60   MEDIUM
61 - 80   HIGH
81 - 100  CRITICAL
```

---

## 15.3 Example Risk Response

```json
{
  "vendorId": "vendor_123",
  "overallRisk": 84,
  "riskLevel": "HIGH",
  "scores": {
    "documentRisk": 70,
    "networkFraudRisk": 95,
    "financialAnomalyRisk": 60,
    "deviceRisk": 90,
    "identityMismatchRisk": 50,
    "manualReviewPenalty": 20
  },
  "reasons": [
    "Device used by 5 vendors in 2 hours",
    "Bank account linked to 3 vendors",
    "Duplicate CAC document detected",
    "Account lookup name does not strongly match vendor name"
  ],
  "recommendedAction": "manual_review"
}
```

---

# 16. Queue and Background Jobs

Use BullMQ and Redis for background processing.

## Jobs

```txt
document-analysis-job
squad-webhook-processing-job
graph-update-job
risk-recalculation-job
transfer-status-job
alert-generation-job
```

Webhook endpoints should respond quickly. Heavy processing should be done in background jobs.

---

# 17. Local Development Setup

## 17.1 Clone Repository

```bash
git clone <repository-url>
cd verisphere
```

---

## 17.2 Install Dependencies

```bash
npm install
```

---

## 17.3 Setup Environment Variables

Create a `.env` file.

```env
PORT=5000

DATABASE_URL=
JWT_SECRET=

REDIS_URL=

NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=

SQUAD_SECRET_KEY=
SQUAD_PUBLIC_KEY=
SQUAD_WEBHOOK_SECRET=

AI_SERVICE_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 17.4 Run Database Migrations

```bash
npx prisma migrate dev
```

---

## 17.5 Seed Database

```bash
npm run seed
```

---

## 17.6 Start Development Server

```bash
npm run start:dev
```

---

# 18. Running Neo4j Locally

You can use Neo4j Desktop or Docker.

## Docker Example

```bash
docker run \
  --name verisphere-neo4j \
  -p7474:7474 -p7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

---

# 19. MVP Build Order

Build in this order:

```txt
1. Auth + vendor onboarding
2. Document upload
3. Device fingerprint capture
4. Squad payment initiation
5. Squad webhook processing
6. Transaction storage
7. Neo4j graph relationship creation
8. Document risk analysis
9. Risk score calculation
10. Admin dashboard APIs
11. Admin approval/rejection
12. Squad transfer payout
13. Demo seed data
14. Graph/risk visualization
```

---

# 20. MVP Must-Have Features

## Must Have

- Vendor registration
- Document upload
- Device signal capture
- Squad payment initiation
- Squad webhook validation
- Transaction persistence
- Neo4j graph updates
- Basic AI document analysis
- Risk score generation
- Explainable risk reasons
- Admin review dashboard APIs
- Admin approve/reject
- Squad transfer payout in sandbox

---

## Nice To Have

- Squad virtual accounts
- Real-time dashboard updates
- Graph visualization
- Anomaly charts
- Advanced document tamper classifier
- Email/SMS alerts
- Institution-facing API

---

# 21. Phase 2 Integration Plan

Phase 2 makes the system more intelligent and more automated.

## 21.1 Squad Virtual Accounts

Create a dedicated virtual account for each vendor.

Purpose:

- Track vendor inflows
- Build richer financial behavior profile
- Improve payment telemetry
- Detect suspicious payment flows

Flow:

```txt
Vendor approved for monitoring
        ↓
Backend creates Squad virtual account
        ↓
Vendor receives dedicated account number
        ↓
Payments into account trigger webhooks
        ↓
Transactions update graph
        ↓
Risk score improves over time
```

---

## 21.2 Stronger AI Service

Expand the Python FastAPI service to include:

- ML-based document tamper classification
- Better image manipulation detection
- Transaction anomaly detection
- Device-risk model
- Risk prediction model

---

## 21.3 Advanced Graph Intelligence

Upgrade Neo4j usage with:

- Community detection
- Graph centrality scoring
- Fraud cluster severity ranking
- Entity risk propagation
- Graph-based vendor similarity

---

## 21.4 Transfer Monitoring

Track post-payout behavior:

```txt
Transfer completed
        ↓
Vendor transaction behavior monitored
        ↓
Suspicious post-payout activity flagged
        ↓
Institution receives alert
```

---

# 22. Phase 3 Integration Plan

Phase 3 turns VeriSphere into institutional fraud intelligence infrastructure.

## 22.1 External Verification Integrations

Integrate with:

- CAC registry
- BVN/NUBAN verification partners
- Tax databases
- Government procurement systems
- Bank fraud lists
- Education verification systems
- Healthcare credential verification systems

---

## 22.2 Institution API

Allow institutions to verify vendors programmatically.

Example endpoints:

```txt
POST /api/institution/verify-vendor
POST /api/institution/submit-fraud-case
GET  /api/institution/vendor-risk/:vendorId
GET  /api/institution/fraud-network/:vendorId
```

---

## 22.3 Shared Fraud Intelligence Network

When an institution confirms a fraud case:

```txt
Fraud case confirmed
        ↓
Vendor marked fraudulent
        ↓
Connected graph entities are rescored
        ↓
Related vendors are flagged
        ↓
Partner institutions receive alerts
```

This transforms VeriSphere from a single verification product into a shared fraud intelligence network.

---

# 23. Data Feasibility in Nigeria

## 23.1 Feasible for MVP

The following data can be realistically collected:

- Vendor profile data
- Uploaded CAC/invoice/ID documents
- Browser/device fingerprint hash
- IP/session metadata
- Squad payment events
- Squad transfer events
- Account lookup responses
- Admin review outcomes
- Demo-seeded transaction history

---

## 23.2 Feasible With Partnerships

The following are realistic in later phases through partnerships:

- CAC verification
- BVN/NUBAN checks
- Tax ID checks
- Government procurement records
- Banking fraud lists
- Business registry integrations
- School certificate verification

---

## 23.3 Not Required for MVP

The MVP does not require:

- National telecom device records
- Full BVN database access
- Government payroll data
- Cross-bank transaction history
- National ID database access
- Private bank fraud data

This makes the MVP realistic and buildable.

---

# 24. Demo Data Plan

The demo should include at least three vendor types.

## 24.1 Clean Vendor

Signals:

- Unique device
- Unique account
- Clean document
- Successful Squad payment
- No suspicious graph links

Expected result:

```txt
LOW RISK
```

---

## 24.2 Suspicious Vendor

Signals:

- Weak document quality
- Account name partial mismatch
- Limited payment history
- Medium device risk

Expected result:

```txt
MEDIUM RISK
```

---

## 24.3 Fraud Ring

Signals:

- 4 vendors sharing one device
- 2 vendors sharing one bank account
- Duplicate CAC or invoice image
- Rapid registration pattern
- Suspicious payment behavior

Expected result:

```txt
HIGH RISK / CRITICAL
```

---

# 25. Demo Goals

The demo should prove:

- Vendors can be onboarded
- Squad payment events affect risk decisions
- Squad transfers work after approval
- Neo4j detects shared relationships
- Document intelligence detects duplicate or suspicious documents
- Risk scores are explainable
- Admins can approve, reject, or escalate vendors
- The architecture can scale beyond a hackathon demo

---

# 26. Security Notes

The MVP should:

- Hash sensitive identifiers
- Validate Squad webhook signatures
- Avoid logging raw secrets or sensitive payloads
- Use JWT guards
- Use role-based access control
- Encrypt uploaded documents where possible
- Store account numbers in hashed or masked form
- Keep Squad secret keys only on the backend
- Use rate limiting for sensitive endpoints
- Store webhook events for auditability

---

# 27. Team Responsibilities

## Backend Team

Responsible for:

- APIs
- Authentication
- Vendor onboarding
- Squad integration
- Webhooks
- Transfers
- Graph writes
- Risk orchestration

---

## AI Team

Responsible for:

- OCR
- Document risk analysis
- Metadata extraction
- Image hashing
- Duplicate detection
- Anomaly helper functions

---

## Frontend Team

Responsible for:

- Vendor onboarding UI
- Admin dashboard
- Risk explanation display
- Fraud cluster visualization
- Payment and payout status views

---

# 28. Final MVP Success Criteria

The MVP is successful if it can show:

```txt
A vendor signs up
A document is uploaded
A device fingerprint is captured
A Squad payment is completed
A Squad webhook updates the backend
A Neo4j graph relationship is created
A document risk score is generated
A trust score is calculated
A suspicious fraud ring is detected
An admin approves or rejects the vendor
An approved vendor receives a Squad transfer payout
```

---

# 29. Final Product Vision

VeriSphere is not just a verification tool.

It is a fraud intelligence infrastructure layer for institutions that need to safely distribute money, onboard vendors, and detect coordinated fraud.

The long-term vision is to become a shared trust network where governments, banks, marketplaces, and enterprises can verify economic actors using AI, payments, and relationship intelligence.
