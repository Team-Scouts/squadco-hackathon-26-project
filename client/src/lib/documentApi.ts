const API_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:3000";

const normalizedApiBaseUrl = API_BASE_URL.replace(/\/$/, "");

export type SupportedDocumentType =
  | "CAC_REGISTRATION"
  | "TAX_ID"
  | "OWNER_ID"
  | "ADDRESS_PROOF";

export type DocumentVerificationStatus =
  | "PENDING"
  | "NEEDS_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export type DocumentFieldVerification = {
  label: string;
  extracted: string;
  verified: string;
  confidence: number;
  status: string;
};

export type VendorDocument = {
  id: string;
  vendorId: string;
  documentType: string;
  fileUrl: string;
  documentHash?: string | null;
  tamperScore: number;
  verificationStatus: DocumentVerificationStatus;
  duplicateDetected: boolean;
  duplicateVendorCount: number;
  extractedFields?: DocumentFieldVerification[] | null;
  verificationReasons?: unknown;
  reviewNotes?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DuplicateSummary = {
  duplicateDetected: boolean;
  duplicateVendorCount: number;
  duplicateVendorIds: string[];
};

export type UploadDocumentInput = {
  vendorId: string;
  documentType: SupportedDocumentType;
  file: File;
};

export type UpdateDocumentVerificationInput = {
  verificationStatus: DocumentVerificationStatus;
  extractedFields?: DocumentFieldVerification[];
  reviewNotes?: string;
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

export function uploadDocument(input: UploadDocumentInput) {
  const formData = new FormData();
  formData.set("vendorId", input.vendorId);
  formData.set("documentType", input.documentType);
  formData.set("file", input.file);

  return requestJson<{
    success: boolean;
    message: string;
    data: VendorDocument;
    duplicateSummary: DuplicateSummary;
    graphSynced: boolean;
  }>("/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export function getVendorDocuments(vendorId: string) {
  return requestJson<{
    success: boolean;
    count: number;
    data: VendorDocument[];
  }>(`/documents/vendor/${encodeURIComponent(vendorId)}`);
}

export function getDocumentById(id: string) {
  return requestJson<{
    success: boolean;
    data: VendorDocument;
  }>(`/documents/${encodeURIComponent(id)}`);
}

export function updateDocumentVerification(
  id: string,
  input: UpdateDocumentVerificationInput,
) {
  return requestJson<{
    success: boolean;
    message: string;
    data: VendorDocument;
    graphSynced: boolean;
  }>(`/documents/${encodeURIComponent(id)}/verification`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function runDocumentChecks(id: string) {
  return requestJson<{
    success: boolean;
    message: string;
    data: VendorDocument;
    duplicateSummary: DuplicateSummary;
    graphSynced: boolean;
  }>(`/documents/${encodeURIComponent(id)}/run-checks`, {
    method: "POST",
  });
}

export const documentApi = {
  uploadDocument,
  getVendorDocuments,
  getDocumentById,
  updateDocumentVerification,
  runDocumentChecks,
};
