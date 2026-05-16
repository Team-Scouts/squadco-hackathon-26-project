import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  Fingerprint,
  GitBranch,
  History,
  LucideClockArrowUp,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IndividualVendorDetails } from "../typesAndInterfaces";
import { VendorDetailSkeleton, SkeletonGraphPanel } from "../Skeletons";
import GraphCanvas from "../components/GraphCanvas";
import { graphApi } from "../lib/graphApi";
import {
  documentApi,
  type DocumentFieldVerification,
  type DocumentVerificationStatus,
  type VendorDocument,
} from "../lib/documentApi";
import { deviceApi } from "../lib/deviceApi";
import {
  financialActivityApi,
  type FinancialActivityItem,
  type VirtualAccountRequest,
} from "../lib/financialActivityApi";
import { useSession } from "../lib/authClient";
import type { GraphResponse } from "../lib/graphApi";

const panelTitle = "text-xs font-bold text-gray-400 uppercase tracking-wider";

const fieldInput =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white transition-all focus:border-sky-300/50 focus:outline-none focus:ring-1 focus:ring-sky-300/40";

function statusTone(status?: DocumentVerificationStatus) {
  if (status === "VERIFIED") {
    return "text-green-300 bg-green-500/10 border-green-500/20";
  }

  if (status === "REJECTED") {
    return "text-red-400 bg-red-500/10 border-red-500/20";
  }

  if (status === "NEEDS_REVIEW") {
    return "text-amber-300 bg-amber-500/10 border-amber-500/20";
  }

  return "text-zinc-200 bg-white/10 border-white/20";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(amount: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency} ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
  }
}

function isSuccessfulStatus(status: string) {
  return ["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(
    status.trim().toUpperCase(),
  );
}

function isFailedStatus(status: string) {
  return ["FAILED", "FAIL", "DECLINED", "REJECTED"].includes(
    status.trim().toUpperCase(),
  );
}

function financialStatusClass(status: string) {
  if (isSuccessfulStatus(status)) {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (isFailedStatus(status)) {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

function asReasonList(value: unknown) {
  return Array.isArray(value)
    ? (value as Array<{
        code?: string;
        message?: string;
        severity?: string;
        scoreImpact?: number;
      }>)
    : [];
}

function asSignalList(value: unknown) {
  return Array.isArray(value)
    ? (value as Array<{
        code?: string;
        message?: string;
        weight?: number;
      }>)
    : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not captured";
  }

  return String(value);
}

function highestDeviceRisk(devices: unknown[]) {
  return devices.reduce<number>((highest, device) => {
    const risk = Number(asRecord(device).riskScore ?? 0);
    return Number.isFinite(risk) && risk > highest ? risk : highest;
  }, 0);
}

function vendorInitials(name?: string | null) {
  const words = String(name ?? "Vendor")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return words.map((word) => word[0]?.toUpperCase()).join("") || "V";
}

function riskBadgeClass(riskLevel?: string | null) {
  const risk = riskLevel?.toLowerCase() ?? "";

  if (risk.includes("critical")) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (risk.includes("high")) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  if (risk.includes("medium") || risk.includes("review")) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  return "border-green-500/25 bg-green-500/10 text-green-300";
}

function EvidenceMetric({
  label,
  value,
  icon: Icon,
  tone = "text-zinc-100",
}: {
  label: string;
  value: unknown;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3">
      <span className="icon-box border border-white/10 bg-white/[0.04]">
        <Icon className={`h-4 w-4 ${tone}`} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <p className={`mt-1 truncate text-lg font-black ${tone}`}>
          {displayValue(value)}
        </p>
      </div>
    </div>
  );
}

function EvidenceSummaryStrip({
  vendor,
  graph,
}: {
  vendor: IndividualVendorDetails;
  graph?: GraphResponse;
}) {
  const deviceRisk = highestDeviceRisk(vendor.devices ?? []);
  const graphLinks = graph?.edges.length ?? 0;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <EvidenceMetric
        label="Risk score"
        value={Math.round(Number(vendor.overallRiskScore ?? 0))}
        icon={ShieldAlert}
        tone="text-red-300"
      />
      <EvidenceMetric
        label="Documents"
        value={vendor.documents?.length ?? 0}
        icon={FileText}
        tone="text-sky-200"
      />
      <EvidenceMetric
        label="Devices"
        value={vendor.devices?.length ?? 0}
        icon={Fingerprint}
        tone={deviceRisk >= 70 ? "text-red-300" : "text-green-300"}
      />
      <EvidenceMetric
        label="Graph links"
        value={graphLinks}
        icon={GitBranch}
        tone="text-violet-200"
      />
      <EvidenceMetric
        label="Device risk"
        value={`${deviceRisk}%`}
        icon={Fingerprint}
        tone={deviceRisk >= 70 ? "text-red-300" : "text-zinc-100"}
      />
    </section>
  );
}

function EntityProfilePanel({ vendor }: { vendor: IndividualVendorDetails }) {
  const deviceRisk = highestDeviceRisk(vendor.devices ?? []);
  const snapshotItems = [
    [Building2, "Business name", vendor.businessName],
    [ShieldAlert, "Registration number", vendor.registrationNumber],
    [User, "Primary contact", vendor.contactName],
    [Building2, "Vendor type", vendor.vendorType],
    [GitBranch, "Sector", vendor.sector],
    [Mail, "Email", vendor.email],
    [Phone, "Phone", vendor.phone],
    [MapPin, "Address", [vendor.address, vendor.state, vendor.country].filter(Boolean).join(", ")],
    [ShieldAlert, "Status", vendor.status],
    [Banknote, "Risk level", vendor.riskLevel],
    [Fingerprint, "Highest device risk", `${deviceRisk}%`],
  ] satisfies Array<[LucideIcon, string, unknown]>;

  return (
    <section className="panel-compact min-w-0 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-base font-black text-sky-100 shadow-cyber-soft">
          {vendorInitials(vendor.businessName)}
        </div>
        <div className="min-w-0">
          <p className={panelTitle}>Entity profile</p>
          <p className="mt-1 truncate text-sm font-bold text-white">
            {displayValue(vendor.businessName)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {snapshotItems.map(([Icon, label, value]) => (
          <div
            key={label}
            className="flex min-w-0 items-start gap-3 rounded-xl border border-white/10 bg-black/45 p-3"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
              <Icon className="h-4 w-4 text-zinc-400" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {label}
              </span>
              <span className="mt-1 block break-words text-sm font-semibold text-zinc-100">
                {displayValue(value)}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Vendor ID
        </p>
        <p className="mt-1 break-all font-mono text-[11px] text-zinc-300">
          {displayValue(vendor.id)}
        </p>
      </div>
    </section>
  );
}

function ReviewerDecisionPanel({
  vendor,
  graph,
  onSync,
  isSyncing,
}: {
  vendor: IndividualVendorDetails;
  graph?: GraphResponse;
  onSync: () => void;
  isSyncing: boolean;
}) {
  const checks = [
    ["Documents uploaded", (vendor.documents?.length ?? 0) > 0],
    ["Device captured", (vendor.devices?.length ?? 0) > 0],
    ["Graph evidence loaded", (graph?.nodes.length ?? 0) > 0],
    ["Risk score available", vendor.overallRiskScore !== null],
  ] satisfies Array<[string, boolean]>;

  return (
    <section className="panel-compact min-w-0 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className={panelTitle}>Reviewer decision</p>
        <span
          className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${riskBadgeClass(vendor.riskLevel)}`}
        >
          {displayValue(vendor.riskLevel)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {checks.map(([label, complete]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/45 p-3"
          >
            <span className="text-xs font-semibold text-zinc-200">{label}</span>
            <span
              className={`grid h-5 w-5 place-items-center rounded-full border ${
                complete
                  ? "border-green-500 bg-green-500 text-black"
                  : "border-white/20 text-transparent"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
          </div>
        ))}
      </div>

      <textarea
        rows={4}
        placeholder="Add concise reviewer context..."
        className="field-control mt-4 min-h-28 resize-none"
      />

      <div className="mt-3 grid grid-cols-1 gap-2">
        <button
          onClick={onSync}
          className={`button-secondary min-h-0 rounded-xl px-3 py-2 text-xs ${isSyncing ? "opacity-70" : "opacity-100"}`}
        >
          <LucideClockArrowUp className="h-4 w-4 text-zinc-400" />
          {isSyncing ? "Syncing graph..." : "Refresh graph"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="button-danger min-h-0 rounded-xl px-3 py-2 text-xs">
            <X className="h-4 w-4" />
            Reject
          </button>
          <button className="button-primary min-h-0 rounded-xl px-3 py-2 text-xs">
            <Check className="h-4 w-4" />
            Approve
          </button>
        </div>
      </div>
    </section>
  );
}

function DocumentModification({ vendorId }: { vendorId: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [activeDocumentId, setActiveDocumentId] = useState("");
  const [fields, setFields] = useState<DocumentFieldVerification[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");

  const documentsQuery = useQuery({
    queryKey: ["vendor_documents", vendorId],
    queryFn: () => documentApi.getVendorDocuments(vendorId),
    enabled: vendorId.length > 0 && !!session?.user,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const documents = useMemo(
    () => documentsQuery.data?.data ?? [],
    [documentsQuery.data],
  );

  const activeDocument = useMemo(
    () =>
      documents.find((document) => document.id === activeDocumentId) ??
      documents[0],
    [activeDocumentId, documents],
  );

  useEffect(() => {
    if (!activeDocumentId && documents[0]) {
      setActiveDocumentId(documents[0].id);
    }
  }, [activeDocumentId, documents]);

  useEffect(() => {
    setFields(activeDocument?.extractedFields ?? []);
    setReviewNotes(activeDocument?.reviewNotes ?? "");
  }, [activeDocument]);

  const invalidateDocumentState = async (document?: VendorDocument) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["vendor_documents", vendorId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vendor_details", vendorId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vendorGraph", vendorId],
      }),
    ]);

    if (document) {
      setActiveDocumentId(document.id);
    }
  };

  const runChecksMutation = useMutation({
    mutationFn: (documentId: string) =>
      documentApi.runDocumentChecks(documentId),
    onSuccess: (response) => invalidateDocumentState(response.data),
  });
  const runAllDocumentChecksMutation = useMutation({
    mutationFn: () => documentApi.runVendorDocumentChecks(vendorId),
    onSuccess: () => invalidateDocumentState(),
  });

  const updateVerificationMutation = useMutation({
    mutationFn: (verificationStatus: DocumentVerificationStatus) => {
      if (!activeDocument) {
        throw new Error("No active document selected");
      }

      return documentApi.updateDocumentVerification(activeDocument.id, {
        verificationStatus,
        extractedFields: fields,
        reviewNotes,
      });
    },
    onSuccess: (response) => invalidateDocumentState(response.data),
  });

  const updateField = (label: string, value: string) => {
    setFields((current) =>
      current.map((field) =>
        field.label === label
          ? {
              ...field,
              verified: value,
              status: value === field.extracted ? "match" : "edited",
            }
          : field,
      ),
    );
  };

  const reasons = asReasonList(activeDocument?.verificationReasons);
  const signals = asSignalList(activeDocument?.forensicSignals);
  const pendingFieldCount = fields.filter((field) =>
    ["edited", "flagged", "missing"].includes(field.status),
  ).length;

  return (
    <section className="panel-card min-w-0 p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="icon-box border border-violet-300/20 bg-violet-300/10">
              <Edit3 className="h-4 w-4 text-violet-200" />
            </span>
            <h2 className="text-xl font-bold text-white">
              Document intelligence
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Run document checks, correct OCR fields, and save reviewer
            decisions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={!activeDocument || runChecksMutation.isPending}
            onClick={() =>
              activeDocument && runChecksMutation.mutate(activeDocument.id)
            }
            className="button-secondary min-h-0 rounded-xl px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            <History className="h-4 w-4" />
            {runChecksMutation.isPending ? "Running..." : "Run checks"}
          </button>
          <button
            disabled={documents.length === 0 || runAllDocumentChecksMutation.isPending}
            onClick={() => runAllDocumentChecksMutation.mutate()}
            className="button-secondary min-h-0 rounded-xl px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            <History className="h-4 w-4" />
            {runAllDocumentChecksMutation.isPending
              ? "Running all..."
              : "Run all documents"}
          </button>
          <button
            disabled={!activeDocument || updateVerificationMutation.isPending}
            onClick={() => updateVerificationMutation.mutate("VERIFIED")}
            className="button-primary min-h-0 rounded-xl px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Verify
          </button>
          <button
            disabled={!activeDocument || updateVerificationMutation.isPending}
            onClick={() => updateVerificationMutation.mutate("REJECTED")}
            className="inline-flex min-h-0 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-all hover:bg-red-500/20 hover:shadow-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          {documentsQuery.isLoading && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
              Loading documents...
            </div>
          )}
          {!documentsQuery.isLoading && documents.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
              No documents uploaded for this vendor yet.
            </div>
          )}
          {documents.map((document) => (
            <button
              key={document.id}
              onClick={() => setActiveDocumentId(document.id)}
              className={`w-full min-w-0 rounded-2xl border p-4 text-left transition-all hover:shadow-cyber-soft ${
                activeDocument?.id === document.id
                  ? "border-violet-300/40 bg-violet-300/10"
                  : "border-white/10 bg-black/30 hover:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-200" />
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusTone(document.verificationStatus)}`}
                >
                  {document.verificationStatus.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-white">
                {document.documentType.replace("_", " ")}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-zinc-500">
                {document.id}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Tamper {document.tamperScore}% - AI {document.aiGeneratedScore}%
              </p>
            </button>
          ))}
        </div>

        {activeDocument && (
          <div className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="flex items-center justify-between">
                <p className={panelTitle}>Document preview</p>
                <div className="flex items-center gap-2">
                  <a
                    href={activeDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <a
                    href={activeDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#020203] p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">OCR provider</span>
                    <span className="break-words text-right font-semibold text-white">
                      {activeDocument.ocrProvider ?? "Not run"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">OCR confidence</span>
                    <span className="text-right font-semibold text-white">
                      {activeDocument.ocrConfidence ?? 0}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Duplicate vendors</span>
                    <span className="text-right font-semibold text-white">
                      {activeDocument.duplicateVendorCount}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Processed</span>
                    <span className="text-right font-semibold text-white">
                      {formatDate(activeDocument.processedAt)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    OCR text
                  </p>
                  <p className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-200">
                    {activeDocument.ocrText ||
                      "Run checks to populate OCR text."}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className={panelTitle}>Extracted fields</p>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                  {pendingFieldCount} review field
                  {pendingFieldCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {fields.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
                    Run document checks to extract fields.
                  </div>
                )}
                {fields.map((field) => (
                  <div
                    key={field.label}
                    className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {field.label}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          OCR confidence {field.confidence}%
                        </p>
                      </div>
                      {field.status === "match" && (
                        <CheckCircle2 className="h-5 w-5 text-green-300" />
                      )}
                      {field.status === "edited" && (
                        <Edit3 className="h-5 w-5 text-violet-200" />
                      )}
                      {field.status === "flagged" && (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                    <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Extracted
                        </span>
                        <input
                          readOnly
                          value={field.extracted}
                          className={`${fieldInput} break-all text-zinc-400`}
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Verified
                        </span>
                        <input
                          value={field.verified}
                          onChange={(event) =>
                            updateField(field.label, event.target.value)
                          }
                          className={fieldInput}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Review notes
                </span>
                <textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  rows={3}
                  className={`${fieldInput} resize-none`}
                  placeholder="Add reviewer notes..."
                />
              </label>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className={panelTitle}>Verification reasons</p>
                  <div className="mt-3 space-y-2">
                    {reasons.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No reasons recorded.
                      </p>
                    )}
                    {reasons.map((reason, index) => (
                      <p
                        key={`${reason.code}-${index}`}
                        className="break-words text-xs leading-5 text-zinc-300"
                      >
                        <span className="font-bold text-amber-300">
                          {reason.code ?? "REASON"}
                        </span>{" "}
                        {reason.message ?? ""}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className={panelTitle}>Forensic signals</p>
                  <div className="mt-3 space-y-2">
                    {signals.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No signals recorded.
                      </p>
                    )}
                    {signals.map((signal, index) => (
                      <p
                        key={`${signal.code}-${index}`}
                        className="break-words text-xs leading-5 text-zinc-300"
                      >
                        <span className="font-bold text-sky-200">
                          {signal.code ?? "SIGNAL"}
                        </span>{" "}
                        {signal.message ?? ""}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DeviceIntelligencePanel({ vendorId }: { vendorId: string }) {
  const { data: session } = useSession();
  const devicesQuery = useQuery({
    queryKey: ["vendor_devices", vendorId],
    queryFn: () => deviceApi.getVendorDevices(vendorId),
    enabled: vendorId.length > 0 && !!session?.user,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const devices = devicesQuery.data?.data ?? [];

  return (
    <section className="panel-card min-w-0 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="icon-box border border-sky-300/20 bg-sky-300/10">
              <Fingerprint className="h-4 w-4 text-sky-200" />
            </span>
            <h2 className="text-xl font-bold text-white">
              Device intelligence
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Captured FingerprintJS devices linked to this vendor.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-gray-300">
          {devices.length} device{devices.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        {devicesQuery.isLoading && (
          <p className="text-sm text-gray-400">Loading devices...</p>
        )}
        {!devicesQuery.isLoading && devices.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm text-zinc-400">
            No device fingerprint has been captured for this vendor yet.
          </p>
        )}
        {devices.length > 0 && (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3 pr-4">Fingerprint</th>
                <th className="py-3 pr-4">Risk</th>
                <th className="py-3 pr-4">Timezone</th>
                <th className="py-3 pr-4">IP</th>
                <th className="py-3 pr-4">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {devices.map((device) => {
                const highRisk = device.riskScore >= 70;

                return (
                  <tr key={device.id}>
                    <td className="max-w-64 py-3 pr-4 font-mono text-xs text-zinc-200">
                      <span className="block truncate">
                        {device.deviceHash}
                      </span>
                      <span className="mt-1 block truncate text-gray-600">
                        {device.browser}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-bold ${
                          highRisk
                            ? "border-red-500/20 bg-red-500/10 text-red-300"
                            : "border-green-500/20 bg-green-500/10 text-green-300"
                        }`}
                      >
                        {device.riskScore}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-300">
                      {device.timezone}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-400">
                      {device.ipAddress || "Unknown"}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {formatDate(device.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function FinancialActivityPanel({ vendorId }: { vendorId: string }) {
  const { data: session } = useSession();
  const activityQuery = useQuery({
    queryKey: ["vendor_financial_activity", vendorId],
    queryFn: () => financialActivityApi.getVendorFinancialActivity(vendorId),
    enabled: vendorId.length > 0 && !!session?.user,
    retry: false,
    staleTime: 60 * 1000,
  });
  const activity = activityQuery.data?.data ?? [];

  const destinationLabel = (item: FinancialActivityItem) => {
    if (item.kind !== "TRANSFER") {
      return item.channel ?? "Squad payment";
    }

    return `${item.bankAccount?.bankName ?? "Bank"} - ****${item.bankAccount?.accountNumberLast4 ?? "----"}`;
  };

  return (
    <section className="panel-card min-w-0 p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="icon-box border border-white/10 bg-white/[0.04]">
              <Banknote className="h-4 w-4 text-zinc-100" />
            </span>
            <h2 className="text-xl font-bold text-white">
              Financial activity
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            PostgreSQL-backed payments and transfers linked to this vendor.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-gray-300">
          {activity.length} event{activity.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
          <p className={panelTitle}>Volume</p>
          <p className="mt-2 text-xl font-black text-white">
            {formatCurrency(activityQuery.data?.summary.totalVolume ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
          <p className={panelTitle}>Transactions</p>
          <p className="mt-2 text-xl font-black text-sky-200">
            {activityQuery.data?.summary.transactionCount ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
          <p className={panelTitle}>Transfers</p>
          <p className="mt-2 text-xl font-black text-violet-200">
            {activityQuery.data?.summary.transferCount ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        {activityQuery.isLoading && (
          <p className="text-sm text-gray-400">Loading financial activity...</p>
        )}
        {activityQuery.isError && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {(activityQuery.error as Error).message}
          </p>
        )}
        {!activityQuery.isLoading && !activityQuery.isError && activity.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm text-zinc-400">
            No transaction or transfer webhook has been recorded for this vendor
            yet.
          </p>
        )}
        {activity.length > 0 && (
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3 pr-4">Reference</th>
                <th className="py-3 pr-4">Kind</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Destination / Channel</th>
                <th className="py-3 pr-4">Webhook</th>
                <th className="py-3 pr-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activity.map((item) => (
                <tr key={`${item.kind}-${item.id}`}>
                  <td className="max-w-56 py-3 pr-4">
                    <span className="block truncate font-mono text-xs text-zinc-200">
                      {item.reference}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10px] text-zinc-600">
                      {item.id}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs font-bold ${
                        item.kind === "TRANSFER"
                          ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
                          : "border-sky-400/20 bg-sky-400/10 text-sky-200"
                      }`}
                    >
                      {item.kind === "TRANSFER" ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {item.kind}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-black text-white">
                    {formatCurrency(item.amount, item.currency)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded border px-2 py-1 text-xs font-bold ${financialStatusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-300">
                    {destinationLabel(item)}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="block text-xs text-zinc-300">
                      {item.latestWebhookEventType ?? "No webhook event"}
                    </span>
                    <span className="mt-1 block text-[10px] text-zinc-600">
                      {item.webhookEventCount} event
                      {item.webhookEventCount === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-500">
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default function VendorDetail() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [virtual_account, updateVA] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const {
    data: vendorDetails,
    isLoading,
    isSuccess,
  } = useQuery<{
    data: IndividualVendorDetails;
  }>({
    queryKey: ["vendor_details", vendorId],
    staleTime: 30 * 60 * 1000,
    enabled: !!vendorId && !!session?.user,
    retry: false,
    queryFn: async () => {
      const request = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/vendors/${vendorId}`,
        {
          credentials: "include",
        },
      );
      const response = await request.json();
      console.log(response);
      return response;
    },
  });

  const {
    data: userGraph,
    isLoading: loadingGraph,
    isSuccess: graphLoaded,
  } = useQuery({
    queryKey: ["vendorGraph", vendorId],
    enabled: !!vendorId && !!session?.user,
    retry: false,
    queryFn: () => graphApi.getVendorGraph(String(vendorId)),
    staleTime: 30 * 60 * 1000,
  });

  const starterObjVirtual = {
    customer_identifier: "SQUAD_101",
    first_name: "Joesph",
    last_name: "Ayodele",
    mobile_num: "08123456789",
    email: "ayo@squadco.com",
    bvn: "22343211654",
    dob: "07/19/1990",
    address: "22 Kota street, UK",
    gender: "1",
    beneficiary_account: "4920299492",
  };

  const virtualAccountsQuery = useQuery({
    queryKey: ["vendor_virtual_accounts", vendorId],
    queryFn: () => financialActivityApi.getVendorVirtualAccounts(String(vendorId)),
    enabled: !!vendorId && !!session?.user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const savedVirtualAccount = virtualAccountsQuery.data?.data?.[0];
  const activeVirtualAccountNumber =
    virtual_account || savedVirtualAccount?.virtualAccountNumber || "";

  //User VA generation mutation
  const {
    isPending: isGenerating,
    mutateAsync: getVirtual,
  } = useMutation({
    mutationFn: async (body: VirtualAccountRequest) => {
      const response = await financialActivityApi.createVirtualAccount(body);
      updateVA(
        response.virtualAccount.virtualAccountNumber ??
          response.data.virtual_account_number ??
          "",
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vendor_virtual_accounts", vendorId],
      });
    },
  });

  const {
    isSuccess: isSimulated,
    isPending: isSimulating,
    mutateAsync: simulate,
  } = useMutation({
    mutationFn: async (body: any) => {
      const request = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/squad/simulate/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        },
      );
      const response = await request.json();
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vendor_financial_activity", vendorId],
      });
    },
  });

  const { isPending: isSyncing, mutateAsync: synchronise } = useMutation({
    mutationFn: async () => {
      const request = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/graph/sync`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const response = await request.json();
      return response;
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["vendorGraph", vendorId],
      }),
  });

  const { isPending: isRunningAllChecks, mutateAsync: runAllChecks } =
    useMutation({
      mutationFn: async () => {
        const request = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL}/vendors/${vendorId}/run-checks`,
          {
            method: "POST",
            credentials: "include",
          },
        );
        const response = await request.json();

        if (!request.ok || !response.success) {
          throw new Error(response.message ?? "Vendor checks failed");
        }

        return response;
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["vendor_details", vendorId] }),
          queryClient.invalidateQueries({ queryKey: ["vendor_documents", vendorId] }),
          queryClient.invalidateQueries({
            queryKey: ["vendor_financial_activity", vendorId],
          }),
          queryClient.invalidateQueries({ queryKey: ["vendorGraph", vendorId] }),
        ]);
      },
    });

  const { isPending: isDeleting, mutateAsync: deleteVendor } = useMutation({
    mutationFn: async () => {
      const request = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/vendors/${vendorId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const response = await request.json();

      if (!request.ok || !response.success) {
        throw new Error(response.message ?? "Vendor deletion failed");
      }

      return response;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vendors_list"] }),
        queryClient.removeQueries({ queryKey: ["vendor_details", vendorId] }),
        queryClient.removeQueries({ queryKey: ["vendor_documents", vendorId] }),
        queryClient.removeQueries({ queryKey: ["vendorGraph", vendorId] }),
        queryClient.removeQueries({
          queryKey: ["vendor_financial_activity", vendorId],
        }),
        queryClient.removeQueries({
          queryKey: ["vendor_virtual_accounts", vendorId],
        }),
      ]);
      navigate("/dashboard/vendors");
    },
  });

  const handleDeleteVendor = async () => {
    if (!vendorId || !vendorDetails?.data) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${vendorDetails.data.businessName}? This removes the vendor and its related documents, devices, risk scores, financial records, alerts, and virtual accounts from PostgreSQL.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");

    try {
      await deleteVendor();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Vendor deletion failed",
      );
    }
  };

  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  return (
    isSuccess && (
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="panel-card p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <Link
                to="/dashboard/vendors"
                className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to vendors
              </Link>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <h1 className="min-w-0 break-words text-3xl font-black tracking-tight text-white">
                  {displayValue(vendorDetails.data.businessName)}
                </h1>
                <span
                  className={`rounded-lg border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${riskBadgeClass(vendorDetails.data.riskLevel)}`}
                >
                  {displayValue(vendorDetails.data.riskLevel)} risk
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                Review identity, document evidence, device intelligence, and
                trust graph relationships before making a vendor decision.
              </p>
              <p className="mt-2 break-all font-mono text-[11px] text-zinc-500">
                {vendorId ?? "Unknown vendor"}
              </p>
            </div>

            <div className="flex flex-col gap-2 xl:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => runAllChecks()}
                  disabled={isRunningAllChecks || isDeleting}
                  className="button-secondary rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <History className="h-4 w-4 text-zinc-400" />
                  {isRunningAllChecks ? "Running checks..." : "Run all checks"}
                </button>
                <button
                  onClick={() => synchronise()}
                  disabled={isDeleting}
                  className={`button-secondary rounded-xl disabled:cursor-not-allowed disabled:opacity-60 ${isSyncing ? "opacity-70" : "opacity-100"}`}
                >
                  <LucideClockArrowUp className="h-4 w-4 text-zinc-400" />
                  {isSyncing ? "Syncing..." : "Update graph"}
                </button>
                <button className="button-danger rounded-xl" disabled={isDeleting}>
                  <X className="h-4 w-4" />
                  Reject
                </button>
                <button className="button-primary rounded-xl" disabled={isDeleting}>
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={handleDeleteVendor}
                  disabled={isDeleting}
                  className="button-danger rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete vendor"}
                </button>
              </div>
              {deleteError && (
                <p className="max-w-xl rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
                  {deleteError}
                </p>
              )}
            </div>
          </div>
        </section>

        <EvidenceSummaryStrip vendor={vendorDetails.data} graph={userGraph} />
        <section className="panel-card min-w-0 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className={panelTitle}>Sandbox tools</p>
              <h2 className="mt-2 text-xl font-bold text-white">
                Virtual account simulation
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                Generate a Squad virtual account and simulate sandbox payment
                events. Real payment history is shown in Financial Activity
                below.
              </p>
            </div>
            {activeVirtualAccountNumber && (
              <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Virtual account
                </p>
                <p className="mt-1 font-mono text-lg font-black text-white">
                  {activeVirtualAccountNumber}
                </p>
                {savedVirtualAccount && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    Persisted account
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={isGenerating}
              className="button-secondary rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                if (vendorDetails.data) {
                  getVirtual({
                    ...starterObjVirtual,
                    vendorId: String(vendorDetails.data.id),
                    customer_identifier: String(vendorDetails.data.id),
                    mobile_num: String(vendorDetails.data.phone),
                    bvn: `22${String(vendorDetails.data.phone).slice(2, 11)}`,
                    first_name: String(
                      vendorDetails.data.businessName?.split(" ")[0],
                    ),
                  });
                }
              }}
            >
              <Banknote className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate virtual account"}
            </button>
            <button
              disabled={isSimulating || activeVirtualAccountNumber.length <= 1}
              className="button-primary rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                if (activeVirtualAccountNumber.length > 1) {
                  simulate({
                    virtual_account_number: activeVirtualAccountNumber,
                    amount: String(Math.floor(Math.random() * 10000)),
                  });
                }
              }}
            >
              <ArrowDownRight className="h-4 w-4" />
              {isSimulating ? "Simulating..." : "Simulate payment"}
            </button>
          </div>
          {isSimulated && (
            <p className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
              Simulated transaction submitted. The financial activity table will
              update when the webhook is processed.
            </p>
          )}
        </section>

        <section className="min-w-0">
          {graphLoaded && userGraph && (
            <GraphCanvas
              graph={userGraph}
              title="Vendor trust graph"
              subtitle="Relationship evidence for this vendor. Node labels stay compact; select an entity to inspect full details."
              height="vendor"
              onRefresh={() => synchronise()}
              isRefreshing={isSyncing}
              showLegend
            />
          )}
          {loadingGraph && <SkeletonGraphPanel />}
        </section>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-6">
            <FinancialActivityPanel vendorId={String(vendorId ?? "")} />
            <DocumentModification vendorId={String(vendorId ?? "")} />
            <DeviceIntelligencePanel vendorId={String(vendorId ?? "")} />
          </div>

          <aside className="min-w-0 space-y-6">
            <EntityProfilePanel vendor={vendorDetails.data} />
            <ReviewerDecisionPanel
              vendor={vendorDetails.data}
              graph={userGraph}
              onSync={() => synchronise()}
              isSyncing={isSyncing}
            />
          </aside>
        </div>
      </div>
    )
  );
}
