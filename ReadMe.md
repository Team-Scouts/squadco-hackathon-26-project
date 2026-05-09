# VeriSphere

## What problem does VeriSphere solve?

Imagine a government or a big company wants to give money to small businesses (grants, contracts, loans).
Problem: Many fake businesses apply. They use fake documents, share the same bank account, or even form “fraud rings” (multiple fake vendors working together).
Old way: Manually check documents one by one – slow and easy to fool.
VeriSphere way: Automatically checks not just the document, but also the device, the payment behaviour, and connections between vendors. If 5 vendors all register from the same laptop in 1 hour – suspicious.

The core idea
Build a trust graph – like a social network, but for fraud. Every vendor, device, bank account, document, and transaction becomes a dot (node). If they are connected (shared device, same bank account, paid from same source), we draw a line. Then we can see fraud rings easily.

## What does the MVP do?

    The MVP (Minimum Viable Product) does one complete job:

    Vendor signs up – uploads business documents, enters details.

    System captures device fingerprint – unique ID of the browser/computer.

    Vendor pays a small verification fee using Squad (payment gateway). This proves they have a real bank account.

    VeriSphere checks everything:

    Document tampering (via OCR + image hash)

    Shared devices (graph check)

    Shared bank accounts (graph check)

    Transaction patterns (small test payments, rapid submissions)

    Output: Trust score + risk explanation (e.g., “High risk because this device registered 5 vendors in 2 hours”).

    Admin dashboard – officer sees alerts and can approve/reject.

## Where Squad (payment API) fits

    Squad is not just a payment button. It gives:

    Real payment confirmation (webhook)

    Virtual accounts (optional)

    Account name lookup (before paying out grants)

    Transfer API (to pay approved vendors)

    So Squad becomes the financial telemetry – every payment event updates the trust graph and risk score in real time.

# VeriSphere Backend — README

## Overview

VeriSphere is an AI-powered fraud intelligence and trust graph platform built for vendor verification, payment-linked trust scoring, and fraud-ring detection.

This backend powers:

- Vendor onboarding
- Squad payment integration
- Webhook processing
- Fraud detection
- Risk scoring
- Device intelligence
- Graph intelligence
- Admin review workflows

The architecture is designed for the Squad Hackathon MVP while remaining scalable for future institutional deployment.

---

# Tech Stack

Backend
NestJS
PostgreSQL
Redis
Neo4j

## AI Service

- Python FastAPI
- OCR
- OpenCV
- scikit-learn

## Payments

Squad APIs

## Core Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Neo4j

## AI / Intelligence

- Python FastAPI
- OpenCV
- OCR tooling
- scikit-learn

## Payments

- Squad APIs
- Squad Webhooks
- Squad Virtual Accounts
- Squad Transfers

---

# Project Architecture

```txt
Frontend (Next.js)
        ↓
NestJS Backend
        ↓
Core Modules
 ├── Auth
 ├── Vendors
 ├── Risk Engine
 ├── Squad Integration
 ├── Documents
 ├── Device Intelligence
 ├── Graph Intelligence
 ├── Transactions
 ├── Alerts
 └── Admin
        ↓
PostgreSQL
Neo4j
Redis
        ↓
Python AI Service
```

---

# Folder Structure

```txt
src/
│
├── config/
├── common/
├── prisma/
├── neo4j/
├── redis/
├── integrations/
├── modules/
├── queue/
├── storage/
├── database/
└── types/
```

---

# Main Modules

## Auth Module

Handles:

- JWT authentication
- login/register
- guards
- role-based access

---

## Vendors Module

Handles:

- vendor onboarding
- vendor profiles
- verification state
- onboarding workflow

---

## Documents Module

Handles:

- CAC uploads
- OCR extraction
- tamper checks
- duplicate detection
- metadata extraction

---

## Squad Module

Handles:

- payment initiation
- payment verification
- virtual accounts
- webhooks
- transfers
- account lookup

---

## Transactions Module

Handles:

- transaction persistence
- payment event storage
- telemetry records
- payout history

---

## Graph Module

Handles:

- Neo4j graph writes
- relationship mapping
- fraud-ring detection
- graph traversal
- suspicious clusters

---

## Risk Module

Handles:

- weighted risk scoring
- anomaly detection
- explainable AI output
- risk recomputation

---

## Device Intelligence Module

Handles:

- browser/device fingerprinting
- IP analysis
- session velocity
- device-sharing detection

---

## Alerts Module

Handles:

- suspicious activity alerts
- review queues
- fraud notifications

---

# Local Development Setup

## 1. Clone Repository

---

# 2. Install Dependencies

```bash
npm install
```

---

# 3. Setup Environment Variables

Create:

```txt
.env
```

Example:

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

# 4. Run Database Migrations

```bash
npx prisma migrate dev
```

---

# 5. Seed Database

```bash
npm run seed / npx prisma run seed
```

---

# 6. Start Development Server

```bash
npm run start:dev
```

---

# Running Neo4j Locally

Recommended:

- Neo4j Desktop
  or
- Docker

---

# Squad Integration Flow

## Verification Payment Flow

```txt
Vendor registers
        ↓
Initiate Squad payment
        ↓
Vendor pays verification fee
        ↓
Squad webhook fires
        ↓
Webhook validated
        ↓
Transaction stored
        ↓
Graph updated
        ↓
Risk score recomputed
```

---

# Webhook Processing

Endpoint:

```txt
POST /api/webhooks/squad
```

Responsibilities:

- validate webhook signature
- prevent duplicate processing
- persist transaction
- update trust graph
- trigger risk recalculation

---

# Risk Scoring Logic

Current MVP scoring uses:

- document risk
- device risk
- network fraud risk
- transaction anomalies
- identity mismatch checks

Example formula:

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

# Neo4j Trust Graph

Example relationships:

```txt
(Vendor)-[:USES_DEVICE]->(Device)

(Vendor)-[:OWNS_ACCOUNT]->(BankAccount)

(Vendor)-[:SUBMITTED_DOC]->(Document)

(Transaction)-[:CREDITED_TO]->(Vendor)
```

The graph enables:

- fraud-ring detection
- shared-device detection
- suspicious cluster analysis
- connected-entity investigation

---

# API Conventions

## Success Response

```json
{
  "success": true,
  "data": {}
}
```

---

## Error Response

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

# Recommended Development Workflow

## Branch Naming

```txt
feature/auth-module
feature/squad-integration
feature/risk-engine
fix/webhook-validation
```

---

# Commit Convention

```txt
feat: add squad webhook verification
fix: resolve graph relation bug
refactor: optimize risk scoring service
```

---

# Priority MVP Features

## Must Have

- auth
- vendor onboarding
- Squad payment flow
- webhook processing
- risk scoring
- Neo4j graph updates
- admin dashboard APIs

---

## Nice To Have

- graph visualization
- anomaly charts
- payout workflows
- real-time websocket updates

---

# Recommended Backend Libraries

## NestJS

- @nestjs/jwt
- @nestjs/passport
- @nestjs/config
- @nestjs/swagger

## Database

- prisma
- @prisma/client

## Queue / Cache

- ioredis

## Validation

- class-validator
- class-transformer

## HTTP

- axios

## Graph

- neo4j-driver

---

# Security Notes

The MVP should:

- hash sensitive identifiers
- validate Squad webhook signatures
- encrypt uploaded documents
- avoid logging sensitive raw data
- use JWT auth guards
- implement rate limiting where possible

---

# Demo Goals

The backend demo should prove:

✅ Squad events affect fraud decisions
✅ Fraud rings can be detected through graph relationships
✅ Risk scores are explainable
✅ Vendors can be flagged automatically
✅ The architecture is scalable and realistic

---

# Suggested Demo Scenario

## Clean Vendor

- unique device
- clean payment pattern
- unique account
- valid documents

Result:

```txt
LOW RISK
```

---

## Fraudulent Vendor Ring

- shared device
- reused account
- duplicate documents
- suspicious payment flow

Result:

```txt
HIGH RISK
```

---

# Team Responsibilities

## Backend Team

- APIs
- authentication
- Squad integration
- graph writes
- risk orchestration

---

## AI Team

- OCR
- anomaly detection
- document intelligence
- scoring algorithms

---

## Frontend Team

- dashboards
- graph visualization
- onboarding
- admin UI

---

# Final MVP Goal

Build a working fraud intelligence platform where:

- Squad transactions feed a live trust graph
- AI explains risk decisions
- suspicious vendors are detected automatically
- institutions can make safer financial decisions
