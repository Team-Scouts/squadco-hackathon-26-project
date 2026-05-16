# FraudLens Pitch Deck Content

## Deck Positioning

**Challenge:** Proof of Life  
**Domain:** Financial services, vendor verification, procurement fraud  
**Product name:** FraudLens  
**One-line pitch:** FraudLens is an AI trust graph that helps institutions verify vendors before money moves by combining documents, devices, Squad payment telemetry, bank account checks, and graph relationships into one explainable risk score.

**Core thesis:** Vendor fraud is not visible when each vendor is reviewed alone. It becomes visible when identities, documents, accounts, devices, payments, and payouts are connected.

---

## Slide 1: Problem

**Title:** Money is moving faster than vendor trust.

**Main message:** Institutions are paying suppliers, contractors, grant applicants, and SMEs without enough proof that the people behind them are real, unique, and safe to pay.

**Slide copy:**
- Vendor review still happens one profile at a time.
- Fraud rings reuse the same documents, devices, bank accounts, and payment patterns across many applications.
- A clean-looking document does not reveal a connected fraud cluster.
- The result: fake businesses, duplicate invoices, ghost vendors, and unsafe payouts.

**Proof point to say aloud:** In procurement, grants, loans, and contractor payouts, the harm is direct: public funds, donor funds, bank capital, or company cash can be paid to actors who should never have passed review.

**Visual direction:** Show one isolated vendor profile on the left, then reveal hidden links to duplicate documents, shared device, shared bank account, and Squad transaction references on the right.

---

## Slide 2: Target User

**Title:** Built for the reviewer who must approve real vendors under pressure.

**Main message:** Our first user is the operations or risk reviewer inside an institution distributing money to many vendors.

**Primary user:**
**Ada, Vendor Risk Officer** at a government grant program, NGO, bank, marketplace, or large enterprise procurement team.

**What Ada needs:**
- Know whether a vendor is safe to approve.
- See why the system flagged a vendor.
- Detect related applications before payout.
- Defend approve, reject, or escalate decisions.
- Move fast without ignoring risk.

**Secondary user:**
SME vendors and contractors who need a simple onboarding flow that does not expose them to internal risk tooling.

**Visual direction:** Split the experience into two surfaces: vendor-facing onboarding and reviewer-facing risk console.

---

## Slide 3: Solution Overview

**Title:** FraudLens turns vendor onboarding into explainable trust intelligence.

**Main message:** We built a verification workflow that collects vendor evidence, analyzes it with AI and rules, connects it in a graph, and produces a reviewer-ready trust decision.

**How it works:**
1. Vendor submits business profile and documents.
2. Device/session signals are captured with consent.
3. Squad verification payment creates financial telemetry.
4. Documents are checked for OCR quality, mismatch, duplicate hashes, and tamper signals.
5. Neo4j links vendors, accounts, devices, documents, transactions, and transfers.
6. Risk engine generates a score, reasons, and recommended action.
7. Admin approves, rejects, escalates, or triggers payout.

**Decision output:**
Trust score, risk level, evidence reasons, graph links, and recommended action.

**Visual direction:** Use a single left-to-right workflow: Intake -> Squad Payment -> AI Checks -> Trust Graph -> Risk Decision -> Payout.

---

## Slide 4: Squad API Integration

**Title:** Squad is the financial telemetry layer, not a payment button.

**Main message:** Squad APIs sit at the center of the workflow and create verifiable payment and payout events that improve the risk decision.

**Squad capabilities used:**
- **Payment initiation:** Vendor pays a verification fee tied to vendor ID and risk session metadata.
- **Transaction verification:** Backend confirms payment status and reference.
- **Webhooks:** Squad events update transactions, graph relationships, and risk scores.
- **Account lookup:** Submitted bank account name is compared with vendor/business identity.
- **Transfers:** Approved vendors can receive sandbox payouts after review.
- **Metadata tracking:** Payment references connect financial events back to the vendor graph.

**Why it matters:**
Squad events create auditable evidence: who paid, when they paid, which vendor they were tied to, and whether payout should proceed.

**Visual direction:** Center Squad as the transaction spine. Surround it with vendor, webhook, graph, risk engine, account lookup, and payout nodes.

---

## Slide 5: AI / Data Intelligence

**Title:** The intelligence layer checks documents, behavior, and relationships together.

**Main message:** FraudLens addresses three hackathon pillars directly: AI Automation, Use of Data, and Squad APIs, with Financial Innovation through graph-based trust scoring.

**Intelligence layers:**
- **Document intelligence:** OCR extraction, field mismatch checks, duplicate hashing, perceptual hashing, metadata/tamper signals, synthetic-media risk indicators.
- **Device intelligence:** Browser fingerprint hash, IP/session metadata, timezone, user agent, rapid registration patterns, shared-device detection.
- **Transaction intelligence:** Squad payment status, transaction references, webhook replay/idempotency signals, account lookup mismatch, payout history.
- **Graph intelligence:** Shared devices, shared bank accounts, duplicate documents, connected vendors, fraud clusters.
- **Explainable risk scoring:** Weighted document, device, network, financial, and identity risk.

**Sample risk reasons:**
- Device used by multiple vendors in a short period.
- Bank account linked to more than one vendor.
- Duplicate CAC document or invoice image detected.
- Account lookup name does not match business name.

**Visual direction:** Use one risk score in the center with five contributing signals around it.

---

## Slide 6: User Flow

**Title:** From vendor signup to safe payout.

**Main message:** The demo shows an end-to-end workflow, not a static risk dashboard.

**Demo journey:**
1. Vendor opens the onboarding portal.
2. Vendor enters contact and business details.
3. Vendor uploads CAC or business document.
4. System records device/session signals.
5. Vendor completes Squad verification payment.
6. Squad webhook confirms the transaction.
7. Document and transaction checks run.
8. Graph relationships are created.
9. Reviewer opens the dashboard and sees risk score, evidence, and graph cluster.
10. Reviewer approves, rejects, or escalates; approved vendor can receive Squad payout.

**Demo cases to show:**
- Clean vendor: unique device, clean document, successful Squad payment.
- Review vendor: partial mismatch or weak document confidence.
- Fraud ring: shared device, shared bank account, duplicate document.

**Visual direction:** Use three swimlanes: Vendor, FraudLens System, Reviewer.

---

## Slide 7: Impact Potential

**Title:** Safer payouts for programs that cannot afford invisible fraud.

**Main message:** FraudLens protects institutional money while helping legitimate SMEs pass review faster.

**Who this can reach:**
- Government grant and empowerment programs.
- NGO and donor-funded SME programs.
- Banks offering SME loans or merchant onboarding.
- Marketplaces onboarding vendors.
- Enterprises managing procurement and contractor payouts.

**Impact metrics to present carefully:**
- Number of vendors screened.
- Number of high-risk vendors flagged before payout.
- Fraud clusters detected by shared signals.
- Average reviewer time saved per case.
- False-positive review rate and appeal outcomes.

**Near-term impact target:**
Deploy first with one institution running a vendor or grant program, then expand from onboarding review to continuous payout monitoring.

**Visual direction:** Show a funnel: applicants screened -> clean vendors approved -> risky vendors escalated -> payouts protected.

---

## Slide 8: Scalability & Business Model

**Title:** Designed to scale from one program to national vendor intelligence.

**Main message:** The product starts as a verification layer for one institution and grows into shared fraud intelligence infrastructure.

**Scalability:**
- PostgreSQL stores operational records.
- Neo4j stores derived relationship intelligence.
- Redis/BullMQ supports background jobs for webhooks, document checks, graph updates, and risk recalculation.
- Squad webhooks keep payment and payout status current.
- The architecture can add external registry partners later: CAC, BVN/NUBAN partners, tax databases, procurement systems, and bank fraud lists.

**Business model:**
- Per-vendor verification fee.
- Institution subscription for reviewer dashboards and fraud graph access.
- Usage-based pricing for API verification calls.
- Enterprise tier for procurement, grant, and payout monitoring.

**Go-to-market:**
Start with institutions already distributing funds to vendors: NGOs, government agencies, lenders, marketplaces, and procurement teams.

**Visual direction:** Show expansion stages: MVP verification -> institutional dashboard -> API layer -> shared trust network.

---

## Slide 9: Research & Validation

**Title:** We validated the workflow against real fraud patterns and buildable data.

**Main message:** The MVP avoids impossible data dependencies and uses signals institutions can realistically collect.

**Evidence we are using:**
- Vendor-submitted profile data.
- Uploaded CAC, invoice, ID, or business documents.
- Device fingerprint hash and session metadata.
- Squad payment and transfer events.
- Squad account lookup responses.
- Admin review outcomes.
- Seeded demo data that simulates clean vendors, suspicious vendors, and fraud rings.

**What makes the approach practical:**
- It does not require national telecom records.
- It does not require full BVN database access.
- It does not require cross-bank transaction history.
- It can improve as institutions add registry and fraud-list partnerships.

**Validation still needed before production:**
- Speak to at least three target users: one risk reviewer, one procurement/admin officer, and one SME vendor.
- Measure reviewer time saved and false-positive handling.
- Test edge cases: incomplete data, forged documents, repeated devices, adversarial submissions.

**Visual direction:** Use a validation matrix: signal, source, MVP availability, risk value.

---

## Slide 10: Team

**Title:** A technical team building where AI, payments, and trust meet.

**Main message:** We are the right team because this product needs full-stack execution across payments, AI, graph data, backend reliability, and reviewer experience.

**Team roles to fill in:**
- **Backend / Squad Integration:** Owns NestJS APIs, webhooks, payments, account lookup, transfers, risk orchestration.
- **AI / Document Intelligence:** Owns OCR, hashing, metadata checks, tamper indicators, document-risk output.
- **Data / Graph Intelligence:** Owns Neo4j modeling, shared-device/shared-account queries, fraud cluster detection.
- **Frontend / Product Experience:** Owns vendor portal, admin dashboard, risk explanation UI, fraud graph visualization.
- **Demo / Product Story:** Owns pitch flow, user validation, impact metrics, judge Q&A.

**Closing line:**
FraudLens does not just verify a vendor. It verifies the network around the vendor before money moves.

**Visual direction:** Team photo or role grid, with the closing line large at the bottom.

---

## 5-Minute Pitch Flow

**0:00-0:30 Problem:** Vendor fraud is hidden because review is isolated.  
**0:30-1:00 User:** Risk reviewers need fast, defensible decisions.  
**1:00-1:45 Solution:** FraudLens connects vendor evidence into a trust graph.  
**1:45-2:30 Squad:** Squad payments, webhooks, account lookup, and transfers are core evidence.  
**2:30-3:15 AI/Data:** Documents, devices, transactions, and graph relationships produce explainable risk.  
**3:15-4:15 Demo:** Clean vendor, suspicious vendor, fraud ring, reviewer decision, payout.  
**4:15-5:00 Impact + scale:** Safer institutional payouts, faster approvals, path to shared trust network.

---

## Judge Q&A Prep

**Why Squad APIs?**  
Because the product is about money movement. Squad provides the payment, webhook, account lookup, transfer, and metadata events that turn verification from a form check into a financial risk workflow.

**Where is the AI?**  
AI/data intelligence appears in document OCR and extraction, duplicate and tamper signals, synthetic-document risk indicators, anomaly rules, graph-based risk signals, and explainable scoring.

**How do you handle false positives?**  
The system recommends actions rather than automatically punishing vendors. High-risk cases go to manual review with reasons, evidence, and appealable signals.

**What data do you need?**  
For the MVP: vendor details, uploaded documents, device/session metadata, Squad transaction events, account lookup results, and admin outcomes. Registry integrations can come later.

**What makes this scalable?**  
Operational records stay in PostgreSQL, relationships are derived into Neo4j, background jobs handle heavy checks, and Squad webhooks keep transaction state current.

**What makes this financially innovative?**  
It treats payments and payouts as trust signals, not just transactions, and uses them to protect financial inclusion programs from coordinated fraud.
