# Frontend Graph API Integration Guide

This document explains how the frontend should consume FraudLens graph data.

The frontend must never connect directly to Neo4j Aura and must never include Neo4j credentials. All graph data must be requested through the NestJS backend.

```txt
Frontend -> NestJS GraphController -> GraphService -> Neo4jService -> Neo4j Aura
```

PostgreSQL remains the source of truth. Neo4j is a derived relationship store used by the backend for fraud graph queries.

## Environment

Use the same backend base URL variable already used by the Better Auth client:

```txt
VITE_SERVER_BASE_URL=http://localhost:3000
```

The current backend has no global `/api` prefix, so graph routes start directly with `/graph`.

## Authentication

Graph endpoints are protected backend endpoints. The user must be signed in and must have one of these lowercase roles:

```txt
admin
reviewer
```

Every frontend graph request must send Better Auth cookies:

```ts
credentials: "include"
```

If a request returns `FORBIDDEN`, sign out and sign in again, then confirm the session user includes:

```json
{
  "role": "admin"
}
```

## Frontend Helper

Use the shared helper at:

```txt
client/src/lib/graphApi.ts
```

Available helper methods:

```ts
graphApi.getVendorGraph(vendorId)
graphApi.getSharedDevices()
graphApi.getSharedAccounts()
graphApi.getDuplicateDocuments()
graphApi.getFraudClusters()
graphApi.syncGraphData()
graphApi.getNeo4jHealth()
```

Import it like this:

```ts
import { graphApi, type GraphResponse } from "../lib/graphApi";
```

You can also import individual helpers:

```ts
import { getFraudClusters, type GraphResponse } from "../lib/graphApi";
```

## Graph Response Contract

All frontend-facing graph endpoints return this shape:

```ts
export type GraphNode = {
  id: string;
  type: string;
  label: string;
  data?: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
};

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

Example:

```json
{
  "nodes": [
    {
      "id": "vendor_123",
      "type": "Vendor",
      "label": "ABC Stores",
      "data": {
        "businessName": "ABC Stores",
        "riskLevel": "HIGH",
        "overallRiskScore": 84
      }
    }
  ],
  "edges": [
    {
      "id": "vendor_123-USES_DEVICE-device_456",
      "source": "vendor_123",
      "target": "device_456",
      "label": "USES_DEVICE",
      "type": "USES_DEVICE"
    }
  ]
}
```

## Endpoints

### Vendor Graph

```txt
GET /graph/vendors/:id
```

Returns one vendor and its connected graph nodes, such as email, phone, devices, documents, transactions, bank accounts, transfers, and risk scores.

Use this on the vendor detail or investigation page.

### Shared Devices

```txt
GET /graph/shared-devices
```

Returns clusters where the same device is linked to multiple vendors.

Use this for device fingerprint fraud review.

### Shared Bank Accounts

```txt
GET /graph/shared-accounts
```

Returns clusters where multiple vendors are connected to the same account number hash.

The frontend must never display or store raw account numbers.

### Duplicate Documents

```txt
GET /graph/duplicate-documents
```

Returns clusters where multiple vendors submitted documents with the same document hash.

Use this for duplicate CAC, tax, or identity document review.

### Fraud Clusters

```txt
GET /graph/fraud-clusters
```

Returns a combined graph containing shared-device clusters, shared-bank-account clusters, and duplicate-document clusters.

Use this for the main fraud graph dashboard.

### Sync Existing Data

```txt
POST /graph/sync
```

Protected demo/bootstrap endpoint. Use this after seeding or creating demo records to sync existing PostgreSQL data into Neo4j.

Do not call this on every page load.

### Neo4j Health

```txt
GET /neo4j/health
```

Protected internal/debug endpoint. Use this only for admin diagnostics.

## React Usage

Example fraud clusters panel:

```tsx
import { useEffect, useState } from "react";
import { graphApi, type GraphResponse } from "../lib/graphApi";

export function FraudClustersPanel() {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphApi
      .getFraudClusters()
      .then(setGraph)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading graph...</div>;
  if (error) return <div>{error}</div>;
  if (!graph || graph.nodes.length === 0) {
    return <div>No fraud clusters found.</div>;
  }

  return (
    <div>
      <p>{graph.nodes.length} nodes</p>
      <p>{graph.edges.length} relationships</p>
    </div>
  );
}
```

Example vendor detail usage:

```tsx
useEffect(() => {
  if (!vendorId) return;

  graphApi
    .getVendorGraph(vendorId)
    .then(setGraph)
    .catch((err) => setError(err.message));
}, [vendorId]);
```

## Graph Library Conversion

Some visualization libraries expect `links` instead of `edges`. Convert the backend shape like this:

```ts
const visualGraph = {
  nodes: graph.nodes.map((node) => ({
    id: node.id,
    name: node.label,
    type: node.type,
    ...node.data,
  })),
  links: graph.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: edge.type,
  })),
};
```

## Rendering Guidance

Useful node types:

```txt
Vendor
Device
Document
BankAccount
Transaction
Transfer
WebhookEvent
RiskScore
Email
Phone
Cluster
```

Useful edge types:

```txt
HAS_EMAIL
HAS_PHONE
USES_DEVICE
SUBMITTED_DOC
MADE_PAYMENT
OWNS_ACCOUNT
RECEIVED_TRANSFER
PAID_TO
RECORDED_TRANSACTION
RECORDED_TRANSFER
HAS_RISK_SCORE
HAS_SHARED_SIGNAL
INCLUDES_VENDOR
```

Suggested visual mapping:

- `Vendor`: business/user icon
- `Device`: fingerprint/device icon
- `Document`: file icon
- `BankAccount`: bank/card icon
- `Transaction`: payment icon
- `Transfer`: payout icon
- `RiskScore`: shield/warning icon
- `Cluster`: alert icon

Suggested risk colors:

```txt
LOW      -> green
MEDIUM   -> amber
HIGH     -> red
CRITICAL -> deep red
```

## Security Rules

- Do not put Neo4j credentials in the frontend.
- Do not connect the browser directly to Neo4j Aura.
- Do not display raw account numbers.
- Use only backend graph endpoints.
- Include cookies with `credentials: "include"`.
- Treat graph endpoints as admin/reviewer-only views.
