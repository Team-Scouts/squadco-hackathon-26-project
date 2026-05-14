const API_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:3000";

const normalizedApiBaseUrl = API_BASE_URL.replace(/\/$/, "");

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

export type GraphSyncResponse = {
  synced: number;
  failed: number;
};

export type Neo4jHealthResponse = {
  ok: boolean;
  status: string;
  details?: Record<string, unknown>;
};

async function readErrorMessage(response: Response) {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await response.json()) as {
        code?: unknown;
        message?: unknown;
        error?: unknown;
      };
      const code = typeof body.code === "string" ? body.code : undefined;
      const message =
        typeof body.message === "string"
          ? body.message
          : typeof body.error === "string"
            ? body.error
            : undefined;

      return [code, message].filter(Boolean).join(": ");
    }

    return await response.text();
  } catch {
    return "";
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(`${normalizedApiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const method = init?.method ?? "GET";
    const detail = message ? `: ${message}` : "";

    throw new Error(`${method} ${path} failed (${response.status})${detail}`);
  }

  return response.json() as Promise<T>;
}

function requestGraph(path: string) {
  return requestJson<GraphResponse>(path);
}

export function getVendorGraph(vendorId: string) {
  return requestGraph(`/graph/vendors/${encodeURIComponent(vendorId)}`);
}

export function getSharedDevices() {
  return requestGraph("/graph/shared-devices");
}

export function getSharedAccounts() {
  return requestGraph("/graph/shared-accounts");
}

export function getDuplicateDocuments() {
  return requestGraph("/graph/duplicate-documents");
}

export function getFraudClusters() {
  return requestGraph("/graph/fraud-clusters");
}

export function syncGraphData() {
  return requestJson<GraphSyncResponse>("/graph/sync", { method: "POST" });
}

export function getNeo4jHealth() {
  return requestJson<Neo4jHealthResponse>("/neo4j/health");
}

export const graphApi = {
  getVendorGraph,
  getSharedDevices,
  getSharedAccounts,
  getDuplicateDocuments,
  getFraudClusters,
  syncGraphData,
  getNeo4jHealth,
};
