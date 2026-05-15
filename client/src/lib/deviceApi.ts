const API_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:3000";

const normalizedApiBaseUrl = API_BASE_URL.replace(/\/$/, "");

export type VendorDevice = {
  id: string;
  vendorId: string;
  deviceHash: string;
  ipAddress: string;
  browser: string;
  timezone: string;
  riskScore: number;
  createdAt: string;
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

export function getVendorDevices(vendorId: string) {
  return requestJson<{
    success: boolean;
    count: number;
    data: VendorDevice[];
  }>(`/devices/vendor/${encodeURIComponent(vendorId)}`);
}

export const deviceApi = {
  getVendorDevices,
};
