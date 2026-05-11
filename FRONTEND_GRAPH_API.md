# Frontend Guide: VeriSphere Graph API

This guide explains how the frontend should use the Neo4j-powered graph features.

The frontend must never connect directly to Neo4j Aura and must never use Neo4j credentials. All graph data must come from the NestJS backend.

```txt
Frontend -> NestJS GraphController -> GraphService -> Neo4jService -> Neo4j Aura
```

PostgreSQL remains the source of truth. Neo4j is a derived relationship store used by the backend for fraud graph queries.

## Base URL

For local development, the backend currently runs on:

```txt
http://localhost:3000
```

There is currently no global `/api` prefix configured in NestJS, so graph routes start directly with `/graph`.

If the backend later adds an API prefix, update the frontend base URL accordingly.

```ts
export const API_BASE_URL = 'http://localhost:3000'
```

## Authentication

Graph endpoints are protected.

Allowed backend roles:

```txt
ADMIN
REVIEWER
admin
reviewer
```

Frontend requests should include auth cookies:

```ts
credentials: 'include'
```

Example:

```ts
const response = await fetch(`${API_BASE_URL}/graph/fraud-clusters`, {
  credentials: 'include',
})
```

If requests fail in the browser because of CORS, the backend needs credentials-enabled CORS for the Vite origin:

```ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
})
```

## Graph Response Shape

All frontend-facing graph endpoints return this structure:

```ts
export type GraphResponse = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type GraphNode = {
  id: string
  type: string
  label: string
  data: Record<string, unknown>
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  label: string
  type: string
}
```

Example response:

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

## Available Endpoints

### Neo4j Health

Internal/debug endpoint.

```txt
GET /neo4j/health
```

Use this to check whether the backend can reach Neo4j.

Example:

```ts
export async function getNeo4jHealth() {
  const response = await fetch(`${API_BASE_URL}/neo4j/health`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Neo4j health check failed: ${response.status}`)
  }

  return response.json()
}
```

### Sync PostgreSQL Data To Neo4j

Protected demo/bootstrap endpoint.

```txt
POST /graph/sync
```

Use this after seeding or creating demo data so existing PostgreSQL records are copied into Neo4j.

This is not needed for every page load.

Example:

```ts
export async function syncGraphData() {
  const response = await fetch(`${API_BASE_URL}/graph/sync`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Graph sync failed: ${response.status}`)
  }

  return response.json()
}
```

Expected response:

```json
{
  "synced": 10,
  "failed": 0
}
```

### Vendor Graph

```txt
GET /graph/vendors/:id
```

Returns one vendor and connected graph nodes:

- email
- phone
- devices
- documents
- transactions
- bank accounts
- transfers
- risk scores

Example:

```ts
export async function getVendorGraph(vendorId: string): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE_URL}/graph/vendors/${vendorId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Vendor graph request failed: ${response.status}`)
  }

  return response.json()
}
```

Use this for:

- vendor detail page
- investigation view
- graph visualization around a single vendor

### Shared Devices

```txt
GET /graph/shared-devices
```

Returns clusters where the same device is linked to multiple vendors.

Example:

```ts
export async function getSharedDevices(): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE_URL}/graph/shared-devices`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Shared devices request failed: ${response.status}`)
  }

  return response.json()
}
```

Use this for:

- shared-device fraud alerts
- risk dashboard widgets
- fraud-ring investigation pages

### Shared Bank Accounts

```txt
GET /graph/shared-accounts
```

Returns clusters where multiple vendors are connected to the same account number hash.

The backend stores only account hashes and last four digits. Raw account numbers must never be shown or stored in the frontend.

Example:

```ts
export async function getSharedAccounts(): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE_URL}/graph/shared-accounts`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Shared accounts request failed: ${response.status}`)
  }

  return response.json()
}
```

Use this for:

- reused account detection
- payout-risk review
- vendor fraud cluster pages

### Duplicate Documents

```txt
GET /graph/duplicate-documents
```

Returns clusters where multiple vendors submitted documents with the same `documentHash`.

Example:

```ts
export async function getDuplicateDocuments(): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE_URL}/graph/duplicate-documents`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Duplicate documents request failed: ${response.status}`)
  }

  return response.json()
}
```

Use this for:

- duplicate CAC document detection
- suspicious document review
- fraud explanation panels

### Fraud Clusters

```txt
GET /graph/fraud-clusters
```

Returns a combined graph containing:

- shared-device clusters
- shared-bank-account clusters
- duplicate-document clusters

Example:

```ts
export async function getFraudClusters(): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE_URL}/graph/fraud-clusters`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Fraud clusters request failed: ${response.status}`)
  }

  return response.json()
}
```

Use this for:

- main fraud graph page
- dashboard overview
- highest-risk cluster visualization

## Suggested Frontend API Client

Create a small graph API file in the client, for example:

```txt
client/src/api/graph.ts
```

Suggested content:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export type GraphResponse = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type GraphNode = {
  id: string
  type: string
  label: string
  data: Record<string, unknown>
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  label: string
  type: string
}

async function requestGraph(path: string, init?: RequestInit): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Graph API request failed: ${response.status}`)
  }

  return response.json()
}

export function getVendorGraph(vendorId: string) {
  return requestGraph(`/graph/vendors/${vendorId}`)
}

export function getSharedDevices() {
  return requestGraph('/graph/shared-devices')
}

export function getSharedAccounts() {
  return requestGraph('/graph/shared-accounts')
}

export function getDuplicateDocuments() {
  return requestGraph('/graph/duplicate-documents')
}

export function getFraudClusters() {
  return requestGraph('/graph/fraud-clusters')
}

export async function syncGraphData() {
  const response = await fetch(`${API_BASE_URL}/graph/sync`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Graph sync failed: ${response.status}`)
  }

  return response.json()
}
```

## Suggested React Usage

Example dashboard usage:

```tsx
import { useEffect, useState } from 'react'
import { getFraudClusters, type GraphResponse } from '../api/graph'

export function FraudClustersPanel() {
  const [graph, setGraph] = useState<GraphResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFraudClusters()
      .then(setGraph)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading graph...</div>
  if (error) return <div>{error}</div>
  if (!graph || graph.nodes.length === 0) return <div>No fraud clusters found.</div>

  return (
    <div>
      <p>{graph.nodes.length} nodes</p>
      <p>{graph.edges.length} relationships</p>
    </div>
  )
}
```

## Rendering Guidance

Useful node types currently returned:

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

Useful edge types currently returned:

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
- `Device`: laptop/phone icon
- `Document`: file icon
- `BankAccount`: card/bank icon
- `Transaction`: payment icon
- `Transfer`: payout icon
- `RiskScore`: warning/shield icon
- `Cluster`: alert icon

Suggested risk colors:

```txt
LOW      -> green
MEDIUM   -> amber
HIGH     -> red
CRITICAL -> deep red
```

## Recommended First Integration Steps

1. Add `VITE_API_BASE_URL=http://localhost:3000` to the client environment.
2. Log in as an admin/reviewer user.
3. Call `POST /graph/sync` once after seeding/demo setup.
4. Call `GET /graph/fraud-clusters` from the dashboard.
5. Render `nodes` and `edges`.
6. Add vendor detail graph by calling `GET /graph/vendors/:id`.

## Important Security Rules

- Do not put Neo4j credentials in the frontend.
- Do not connect the browser directly to Neo4j Aura.
- Do not display raw account numbers.
- Use only backend graph endpoints.
- Include cookies with `credentials: 'include'`.
- Treat graph endpoints as admin/reviewer-only views.
