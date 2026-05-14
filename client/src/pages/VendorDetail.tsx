import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  Fingerprint,
  GitBranch,
  History,
  Link2,
  LucideClockArrowUp,
  MapPin,
  MoreHorizontal,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import type { IndividualVendorDetails } from "../typesAndInterfaces";
import GraphApi, { transformNeo4jToNVL } from "../lib/graphLib";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import { VendorDetailSkeleton, SkeletonGraphPanel } from "../Skeletons";

type DocumentField = {
  label: string;
  extracted: string;
  verified: string;
  confidence: number;
  status: "match" | "edited" | "flagged";
};

// type GraphNode = {
//   id: string;
//   label: string;
//   type: string;
//   x: number;
//   y: number;
//   tone: "vendor" | "risk" | "safe" | "warn" | "neutral";
// };

type SnapshotItem = [LucideIcon, string];
type ChecklistItem = [LucideIcon, string, boolean];

const panelTitle = "text-xs font-bold text-gray-400 uppercase tracking-wider";

const fieldInput =
  "w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all";

const documents = [
  {
    name: "CAC certificate",
    id: "doc_cac_8f2",
    risk: "Duplicate hash",
    updated: "12 minutes ago",
    status: "Needs edit",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  {
    name: "Tax identification",
    id: "doc_tax_19a",
    risk: "Clean",
    updated: "38 minutes ago",
    status: "Verified",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    name: "Director ID",
    id: "doc_id_46c",
    risk: "Name mismatch",
    updated: "1 hour ago",
    status: "Review",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
];

const initialFields: DocumentField[] = [
  {
    label: "Legal business name",
    extracted: "Northline Export Ltd",
    verified: "Northline Exports Ltd",
    confidence: 91,
    status: "edited",
  },
  {
    label: "Registration number",
    extracted: "RC 8129402",
    verified: "RC 8129402",
    confidence: 98,
    status: "match",
  },
  {
    label: "Director name",
    extracted: "Emeka Nwosu",
    verified: "Emeka Nwosu",
    confidence: 96,
    status: "match",
  },
  {
    label: "Registered address",
    extracted: "14 Balogun Street, Lagos",
    verified: "14 Balogun St, Lagos Island",
    confidence: 76,
    status: "flagged",
  },
];

function DocumentModification() {
  const [activeDocument, setActiveDocument] = useState(documents[0].id);
  const [fields, setFields] = useState(initialFields);

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

  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">
              Document Modification
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Correct OCR fields, compare document evidence, and preserve the
            review history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
            <History className="h-4 w-4" />
            History
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-gray-950 transition-all hover:-translate-y-0.5 hover:bg-emerald-400">
            <Save className="h-4 w-4" />
            Save edits
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[17rem_1fr]">
        <div className="space-y-3">
          {documents.map((document) => (
            <button
              key={document.id}
              onClick={() => setActiveDocument(document.id)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                activeDocument === document.id
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/10 bg-black/30 hover:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold ${document.color}`}
                >
                  {document.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-white">
                {document.name}
              </p>
              <p className="mt-1 text-xs text-gray-500 font-mono">
                {document.id}
              </p>
              <p className="mt-2 text-xs text-gray-400">{document.risk}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <p className={panelTitle}>Document preview</p>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:text-white">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:text-white">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 aspect-4/5 rounded-xl border border-white/10 bg-gray-950 p-5">
              <div className="h-full rounded-lg border border-dashed border-white/15 bg-white/3 p-5">
                <div className="mb-6 h-8 w-32 rounded bg-white/10" />
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-10/12 rounded bg-white/10" />
                  <div className="h-3 w-11/12 rounded bg-white/10" />
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="h-20 rounded border border-red-500/30 bg-red-500/10" />
                  <div className="h-20 rounded border border-white/10 bg-white/5" />
                </div>
                <div className="mt-8 space-y-3">
                  <div className="h-3 w-8/12 rounded bg-white/10" />
                  <div className="h-3 w-7/12 rounded bg-white/10" />
                  <div className="h-3 w-9/12 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className={panelTitle}>Extracted fields</p>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                2 edits pending
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl border border-white/10 bg-black/30 p-4"
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
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    )}
                    {field.status === "edited" && (
                      <Edit3 className="h-5 w-5 text-cyan-400" />
                    )}
                    {field.status === "flagged" && (
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label>
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Extracted
                      </span>
                      <input
                        readOnly
                        value={field.extracted}
                        className={`${fieldInput} text-gray-400`}
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default function VendorDetail() {
  const { vendorId } = useParams();
  const {
    data: vendorDetails,
    isLoading,
    isSuccess,
  } = useQuery<{
    data: IndividualVendorDetails;
  }>({
    queryKey: ["vendor_details", vendorId],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const request = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/vendors/${vendorId} `,
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
    queryFn: async () => {
      const neo4jRawResponse = await GraphApi.getGraph(String(vendorId));
      console.log(neo4jRawResponse);
      return transformNeo4jToNVL(neo4jRawResponse);
    },
    staleTime: 30 * 60 * 1000,
  });

  const queryClient = new QueryClient();

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

  const metrics = [
    {
      label: "Trust score",
      value: vendorDetails?.data.overallRiskScore,
      icon: ShieldAlert,
      color: "text-red-400",
    },
    {
      label: "Documents",
      value: vendorDetails?.data.documents.length,
      icon: FileText,
      color: "text-emerald-400",
    },
    {
      label: "Graph links",
      value: "18",
      icon: GitBranch,
      color: "text-cyan-400",
    },
    {
      label: "Open alerts",
      value: "5",
      icon: AlertTriangle,
      color: "text-amber-400",
    },
  ];

  const timeline = [
    [
      "Document hash collision",
      "CAC image matched Koro Market Services",
      "12m ago",
      "critical",
    ],
    [
      "Reviewer edited field",
      "Business name normalized after OCR check",
      "18m ago",
      "info",
    ],
    [
      "Squad fee verified",
      "sq_txn_9x2b4 confirmed NGN 15,000",
      "24m ago",
      "safe",
    ],
    [
      "Device cluster detected",
      "6 applications from same fingerprint",
      "41m ago",
      "critical",
    ],
  ];

  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  return (
    isSuccess && (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link
              to="/dashboard/vendors"
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to vendors
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white">
                {vendorDetails.data.businessName}
              </h1>
              <span className="rounded border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-red-400">
                {vendorDetails.data.riskLevel?.toUpperCase()} risk
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-gray-300">
                Vendor ID: {vendorId ?? "Unknown"}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Individual vendor review workspace for trust scoring, document
              correction, entity graph analysis, Squad payment telemetry, and
              final reviewer decision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => synchronise()}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 ${isSyncing ? "opacity-70" : "opacity-100"}`}
            >
              <LucideClockArrowUp className="h-4 w-4 text-gray-400" />
              {isSyncing ? "Syncing..." : "Update Vendor Graph"}
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20">
              <X className="h-4 w-4" />
              Reject
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-gray-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400">
              <Check className="h-4 w-4" />
              Approve
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="glass-panel rounded-xl p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {metric.label}
                </p>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <p className={`text-3xl font-black ${metric.color}`}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <p className="text-2xl font-bold">Vendor Graph</p>
            {graphLoaded && userGraph && (
              <div className="h-125">
                <InteractiveNvlWrapper
                  nodes={userGraph?.nodes}
                  rels={userGraph.relationships}
                />
              </div>
            )}
            {loadingGraph && <SkeletonGraphPanel />}
            <DocumentModification />
          </div>

          <aside className="space-y-6">
            <section className="glass-panel rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <p className={panelTitle}>Vendor snapshot</p>
                <button className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-lg font-black text-cyan-300">
                  NE
                </div>
                <div>
                  <p className="font-bold text-white">
                    {vendorDetails.data.businessName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Supplier - Lagos, Nigeria
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(
                  [
                    [Building2, "RC 8129402"],
                    [UserRound, "Emeka Nwosu"],
                    [MapPin, "Lagos Island"],
                    [Banknote, "Access Bank - 0192"],
                    [Fingerprint, "Device fp_7ca91"],
                  ] satisfies SnapshotItem[]
                ).map(([Icon, value]) => (
                  <div
                    key={String(value)}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/30 p-3"
                  >
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-300">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-2xl p-6">
              <p className={panelTitle}>Decision checklist</p>
              <div className="mt-4 space-y-3">
                {(
                  [
                    [ShieldCheck, "Business registry checked", true],
                    [FileCheck2, "Document edits reviewed", false],
                    [Link2, "Trust graph explained", false],
                    [Banknote, "Squad payment verified", true],
                  ] satisfies ChecklistItem[]
                ).map(([Icon, label, complete]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 ${complete ? "text-emerald-400" : "text-gray-500"}`}
                      />
                      <span className="text-sm font-semibold text-gray-300">
                        {String(label)}
                      </span>
                    </div>
                    <span
                      className={`h-5 w-5 rounded-full border ${complete ? "border-emerald-500 bg-emerald-500 text-gray-950" : "border-white/20"}`}
                    >
                      {complete && <Check className="h-4 w-4" />}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className={panelTitle}>Activity timeline</p>
                <Clock3 className="h-4 w-4 text-gray-500" />
              </div>
              <div className="space-y-4">
                {timeline.map(([title, detail, time, tone]) => (
                  <div key={title} className="flex gap-3">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        tone === "critical"
                          ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                          : tone === "safe"
                            ? "bg-emerald-500"
                            : "bg-cyan-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-400">
                        {detail}
                      </p>
                      <p className="mt-1 text-[10px] font-mono text-gray-600">
                        {time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-2xl p-6">
              <p className={panelTitle}>Reviewer notes</p>
              <textarea
                rows={4}
                placeholder="Add investigation context..."
                className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10">
                  <Copy className="h-4 w-4 text-gray-400" />
                  Copy
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-gray-950 transition-colors hover:bg-emerald-400">
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    )
  );
}
