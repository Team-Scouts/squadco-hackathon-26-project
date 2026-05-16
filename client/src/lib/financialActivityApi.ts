const API_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:3000";

const normalizedApiBaseUrl = API_BASE_URL.replace(/\/$/, "");

export type FinancialActivityKind = "TRANSACTION" | "TRANSFER";

export type FinancialActivityItem = {
  id: string;
  kind: FinancialActivityKind;
  vendorId: string;
  vendorName: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  channel?: string;
  bankAccount?: {
    id: string;
    bankName: string;
    accountName: string;
    accountNumberLast4: string;
  };
  webhookEventCount: number;
  latestWebhookEventType?: string;
  createdAt: string;
  updatedAt?: string;
};

export type FinancialActivitySummary = {
  totalVolume: number;
  transactionCount: number;
  transferCount: number;
  failedCount: number;
  pendingCount: number;
};

export type FinancialActivityResponse = {
  success: boolean;
  count: number;
  summary: FinancialActivitySummary;
  data: FinancialActivityItem[];
};

export type VirtualAccountRequest = {
  vendorId: string;
  customer_identifier: string;
  first_name: string;
  last_name: string;
  mobile_num: string;
  email: string;
  bvn: string;
  dob: string;
  address: string;
  gender: string;
  beneficiary_account: string;
};

export type PersistedVirtualAccount = {
  id: string;
  vendorId: string;
  provider: string;
  customerIdentifier: string;
  virtualAccountNumber: string;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateVirtualAccountResponse = {
  success: boolean;
  status?: number;
  message?: string;
  data: {
    virtual_account_number?: string;
    virtualAccountNumber?: string;
    [key: string]: unknown;
  };
  virtualAccount: PersistedVirtualAccount;
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

export function getFinancialActivity() {
  return requestJson<FinancialActivityResponse>("/transactions/activity");
}

export function getVendorFinancialActivity(vendorId: string) {
  return requestJson<FinancialActivityResponse>(
    `/transactions/vendors/${encodeURIComponent(vendorId)}/activity`,
  );
}

export function createVirtualAccount(input: VirtualAccountRequest) {
  return requestJson<CreateVirtualAccountResponse>("/squad/virtual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getVendorVirtualAccounts(vendorId: string) {
  return requestJson<{
    success: boolean;
    count: number;
    data: PersistedVirtualAccount[];
  }>(`/squad/vendors/${encodeURIComponent(vendorId)}/virtual-accounts`);
}

export const financialActivityApi = {
  getFinancialActivity,
  getVendorFinancialActivity,
  createVirtualAccount,
  getVendorVirtualAccounts,
};
