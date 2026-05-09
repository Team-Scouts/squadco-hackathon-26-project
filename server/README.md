# Prisma

prisma outside src is for seeding and db configs
prisma inside src is for communication between modules.

# Run Locally

npm install
npm run start:dev

# Seed the database

npx prisma db seed

# Project Architecture

```txt

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

# Core Backend Modules

auth/

Handles login & JWT auth.

vendors/

Handles vendor onboarding.

documents/

Handles:

OCR
duplicate detection
tampering checks
squad/

Handles:

payments
webhooks
verification
transfers
graph/

Handles Neo4j fraud graph.

This is your:

biggest differentiator
risk/

Handles:

risk scores
anomaly detection
explainable AI

# Databases

## PostgreSQL

- Stores normal app data.

## Neo4j

- Stores relationships for fraud detection.

## Redis

- Handles:

- caching
- webhook deduplication
- queues

# MOST IMPORTANT PAGE

- /dashboard/fraud-rings

- If you execute this page well:

- connected nodes
- suspicious vendors
- shared devices/accounts
- live graph
