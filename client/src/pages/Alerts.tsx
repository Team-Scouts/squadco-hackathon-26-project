import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  alertsApi,
  type AlertRecord,
  type AlertSeverity,
} from "../lib/alertsApi";
import { useSession } from "../lib/authClient";

type AlertTab = "active" | "resolved";

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

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

function alertIcon(alert: AlertRecord) {
  if (alert.severity === "CRITICAL") {
    return ShieldAlert;
  }

  if (alert.severity === "HIGH" || alert.severity === "REVIEW") {
    return AlertTriangle;
  }

  return Info;
}

function EmptyState({ tab }: { tab: AlertTab }) {
  return (
    <div className="panel-card flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <AlertCircle className="h-7 w-7 text-zinc-500" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-white">
        {tab === "active" ? "No active alerts" : "No resolved alerts"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
        {tab === "active"
          ? "Risk signals will appear here when document, device, transaction, or graph checks require reviewer attention."
          : "Resolved alerts will appear here after reviewers clear active risk flags."}
      </p>
    </div>
  );
}

export default function Alerts() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AlertTab>("active");

  const alertsQuery = useQuery({
    queryKey: ["alerts", tab],
    queryFn: tab === "active" ? alertsApi.getActiveAlerts : alertsApi.getAlerts,
    enabled: !!session?.user,
    retry: false,
    staleTime: 30 * 1000,
  });

  const resolveMutation = useMutation({
    mutationFn: alertsApi.resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const alerts = useMemo(() => {
    const data = alertsQuery.data ?? [];

    if (tab === "resolved") {
      return data.filter((alert) => alert.resolved);
    }

    return data;
  }, [alertsQuery.data, tab]);

  const activeCount = tab === "active" ? alerts.length : undefined;
  const resolvedCount = tab === "resolved" ? alerts.length : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
            Investigation queue
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Alerts Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            PostgreSQL-backed risk flags generated from document intelligence,
            device reuse, transaction anomalies, and fraud graph signals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alertsQuery.refetch()}
          className="button-secondary self-start py-2.5 lg:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${alertsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="flex w-max rounded-2xl border border-white/10 bg-black/50 p-1 shadow-cyber-soft">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-xl px-6 py-2 text-sm font-bold transition-all ${
            tab === "active"
              ? "bg-white/10 text-white shadow-cyber-soft"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Active{activeCount !== undefined ? ` (${activeCount})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setTab("resolved")}
          className={`rounded-xl px-6 py-2 text-sm font-bold transition-all ${
            tab === "resolved"
              ? "bg-white/10 text-white shadow-cyber-soft"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Resolved{resolvedCount !== undefined ? ` (${resolvedCount})` : ""}
        </button>
      </div>

      {alertsQuery.isLoading && (
        <div className="panel-card flex min-h-[300px] items-center justify-center p-8 text-sm font-semibold text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading alerts
        </div>
      )}

      {alertsQuery.isError && (
        <div className="panel-card border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm font-bold text-red-200">Failed to load alerts</p>
          <p className="mt-2 text-sm leading-6 text-red-100/70">
            {alertsQuery.error instanceof Error
              ? alertsQuery.error.message
              : "The alerts service returned an unexpected error."}
          </p>
        </div>
      )}

      {!alertsQuery.isLoading && !alertsQuery.isError && alerts.length === 0 && (
        <EmptyState tab={tab} />
      )}

      {!alertsQuery.isLoading && !alertsQuery.isError && alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = alertIcon(alert);
            const vendorName = alert.vendor?.businessName ?? "Unknown vendor";
            const resolving =
              resolveMutation.isPending &&
              resolveMutation.variables === alert.id;

            return (
              <article
                key={alert.id}
                className="panel-card flex items-start gap-5 p-6 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/50 shadow-cyber-soft">
                  <Icon className="h-6 w-6 text-zinc-200" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-xs text-zinc-600">
                        {alert.id}
                      </p>
                      <h3 className="mt-1 break-words text-lg font-bold text-white">
                        {alert.title}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        Related to{" "}
                        <strong className="text-white">{vendorName}</strong>
                      </p>
                    </div>
                    <div className="shrink-0 md:text-right">
                      <span className={`status-badge ${severityBadge(alert.severity)}`}>
                        {severityLabel(alert.severity)}
                      </span>
                      <span className="mt-2 block font-mono text-xs text-zinc-600">
                        {formatDate(alert.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 break-words rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-zinc-300">
                    {alert.message}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {alert.vendorId && (
                      <Link
                        to={`/dashboard/vendors/${alert.vendorId}`}
                        className="button-secondary rounded-xl py-2 text-xs"
                      >
                        Investigate
                      </Link>
                    )}
                    {!alert.resolved && (
                      <button
                        type="button"
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolving}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-bold text-green-300 transition-all hover:bg-green-500/20 hover:shadow-cyber-active disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resolving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Resolve
                      </button>
                    )}
                    {alert.resolved && (
                      <span className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-400">
                        Resolved {formatDate(alert.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
