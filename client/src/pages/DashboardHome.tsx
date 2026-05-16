import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  FileSearch,
  Fingerprint,
  GitBranch,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GraphCanvas from "../components/GraphCanvas";
import { graphApi } from "../lib/graphApi";
import { useSession } from "../lib/authClient";
import {
  alertsApi,
  type AlertRecord,
  type AlertSeverity,
} from "../lib/alertsApi";

const exposureMetrics = [
  {
    label: "Fraud exposure",
    value: "18.4%",
    detail: "Weighted from document, device, graph, and payment signals.",
    icon: ShieldAlert,
    tone: "text-red-300",
  },
  {
    label: "Vendors screened",
    value: "12,840",
    detail: "Profiles evaluated through the current verification workflow.",
    icon: Users,
    tone: "text-white",
  },
  {
    label: "High-risk vendors",
    value: "547",
    detail: "Require senior review before approval or payout activity.",
    icon: AlertTriangle,
    tone: "text-orange-300",
  },
  {
    label: "Active investigations",
    value: "91",
    detail: "Cases with open evidence, graph links, or reviewer notes.",
    icon: Activity,
    tone: "text-sky-200",
  },
];

const riskQueue = [
  {
    vendor: "Northline Exports",
    score: 84,
    level: "Critical",
    badge: "badge-critical",
    reason: "Business name mismatch, document field conflict, shared device.",
    signal: "Document intelligence",
  },
  {
    vendor: "Koro Market Services",
    score: 72,
    level: "High Risk",
    badge: "badge-high",
    reason: "Same browser fingerprint appears on another pending vendor.",
    signal: "Device intelligence",
  },
  {
    vendor: "Adenike Supplies Ltd",
    score: 46,
    level: "Review",
    badge: "badge-review",
    reason: "Payment event pending and bank account lookup needs review.",
    signal: "Squad telemetry",
  },
  {
    vendor: "Apex Build Group",
    score: 12,
    level: "Low Risk",
    badge: "badge-low",
    reason: "Clean document hash and no graph cluster membership.",
    signal: "Trust graph",
  },
];

const signalSummary = [
  { label: "Duplicate documents", value: "23", icon: FileSearch, tone: "text-yellow-200" },
  { label: "Shared devices", value: "18", icon: Fingerprint, tone: "text-red-300" },
  { label: "Shared accounts", value: "9", icon: Banknote, tone: "text-orange-300" },
  { label: "Graph clusters", value: "31", icon: GitBranch, tone: "text-violet-300" },
];

function severityBadge(severity: AlertSeverity) {
  if (severity === "CRITICAL") {
    return "badge-critical";
  }

  if (severity === "HIGH") {
    return "badge-high";
  }

  if (severity === "REVIEW") {
    return "badge-review";
  }

  return "border-sky-300/25 bg-sky-300/10 text-sky-100";
}

function severityLabel(severity: AlertSeverity) {
  if (severity === "HIGH") {
    return "High Risk";
  }

  return severity.charAt(0) + severity.slice(1).toLowerCase();
}

function formatAlertDate(alert: AlertRecord) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(alert.createdAt));
}

export default function DashboardHome() {
  const { data: session } = useSession();
  const fraudGraphQuery = useQuery({
    queryKey: ["risk_console_fraud_clusters"],
    queryFn: graphApi.getFraudClusters,
    enabled: !!session?.user,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
  const alertsQuery = useQuery({
    queryKey: ["dashboard_active_alerts"],
    queryFn: alertsApi.getActiveAlerts,
    enabled: !!session?.user,
    retry: false,
    staleTime: 60 * 1000,
  });
  const fraudGraph = fraudGraphQuery.data ?? { nodes: [], edges: [] };
  const graphClusterCount = fraudGraph.nodes.filter(
    (node) => node.type === "Cluster",
  ).length;
  const recentAlerts = (alertsQuery.data ?? []).slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="panel-card p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
              Risk console
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white">
              Vendor fraud intelligence, graph evidence, and review operations.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              VeriSphere combines document integrity, device fingerprints,
              payment-linked telemetry, and Neo4j relationship clusters into a
              reviewer-ready investigation workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/vendors/new" className="button-primary">
              <Plus className="h-4 w-4" />
              New vendor
            </Link>
            <Link to="/dashboard/fraud-graph" className="button-secondary">
              <GitBranch className="h-4 w-4 text-sky-300" />
              Open trust graph
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {exposureMetrics.map((metric) => (
          <article key={metric.label} className="panel-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {metric.label}
                </p>
                <p className={`mt-4 text-4xl font-black ${metric.tone}`}>
                  {metric.value}
                </p>
              </div>
              <metric.icon className={`h-5 w-5 ${metric.tone}`} />
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.8fr)]">
        <div className="xl:col-span-2">
          {fraudGraphQuery.isLoading && (
            <div className="panel-card flex min-h-[420px] items-center justify-center p-6 text-sm font-semibold text-zinc-400">
              Loading fraud cluster graph...
            </div>
          )}
          {!fraudGraphQuery.isLoading && fraudGraph.nodes.length === 0 && (
            <div className="panel-card flex min-h-[420px] flex-col items-center justify-center p-6 text-center">
              <GitBranch className="h-9 w-9 text-zinc-600" />
              <p className="mt-4 text-sm font-bold text-white">
                No graph clusters available
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                Shared-device, shared-account, and duplicate-document clusters
                appear here after graph sync has enough linked vendor data.
              </p>
            </div>
          )}
          {!fraudGraphQuery.isLoading && fraudGraph.nodes.length > 0 && (
            <GraphCanvas
              graph={fraudGraph}
              title="Fraud cluster graph"
              subtitle={`${graphClusterCount} cluster${graphClusterCount === 1 ? "" : "s"} detected across ${fraudGraph.nodes.length} graph nodes and ${fraudGraph.edges.length} relationships.`}
              height="compact"
              onRefresh={() => fraudGraphQuery.refetch()}
              isRefreshing={fraudGraphQuery.isFetching}
              showLegend
            />
          )}
        </div>

        <div className="panel-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-vs-border-soft p-6">
            <div>
              <h2 className="text-xl font-bold text-white">Manual review queue</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Highest-signal vendors awaiting reviewer action.
              </p>
            </div>
            <Link
              to="/dashboard/vendors"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white"
            >
              View vendors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-vs-border-soft bg-black/30 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4">Primary signal</th>
                  <th className="px-6 py-4">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vs-border-soft">
                {riskQueue.map((item) => (
                  <tr key={item.vendor} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-5">
                      <p className="font-bold text-white">{item.vendor}</p>
                      <p className="mt-1 font-mono text-xs text-zinc-600">
                        score_{item.score}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`risk-badge ${item.badge}`}>
                        {item.level}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-zinc-300">{item.signal}</td>
                    <td className="max-w-sm px-6 py-5 text-zinc-500">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Graph signal summary</h2>
              <GitBranch className="h-5 w-5 text-violet-300" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {signalSummary.map((signal) => (
                <div key={signal.label} className="panel-compact p-4">
                  <signal.icon className={`h-5 w-5 ${signal.tone}`} />
                  <p className="mt-4 text-2xl font-black text-white">
                    {signal.label === "Graph clusters"
                      ? graphClusterCount
                      : signal.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">
                    {signal.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Recent alerts</h2>
              <ShieldCheck className="h-5 w-5 text-zinc-500" />
            </div>
            <div className="mt-5 space-y-3">
              {alertsQuery.isLoading && (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-sm font-semibold text-zinc-500">
                  Loading active alerts...
                </div>
              )}
              {!alertsQuery.isLoading && recentAlerts.length === 0 && (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-zinc-400">
                    No active alerts.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    New risk signals will appear here after checks run.
                  </p>
                </div>
              )}
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-white/5 bg-black/30 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`status-badge ${severityBadge(alert.severity)}`}>
                      {severityLabel(alert.severity)}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-600">
                      {formatAlertDate(alert)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-white">
                    {alert.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
