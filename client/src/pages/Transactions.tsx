import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  Filter,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  financialActivityApi,
  type FinancialActivityItem,
} from "../lib/financialActivityApi";
import { useSession } from "../lib/authClient";

type ActivityFilter =
  | "all"
  | "transactions"
  | "transfers"
  | "successful"
  | "failed"
  | "pending";

const filters: Array<{ label: string; value: ActivityFilter }> = [
  { label: "All", value: "all" },
  { label: "Transactions", value: "transactions" },
  { label: "Transfers", value: "transfers" },
  { label: "Successful", value: "successful" },
  { label: "Failed", value: "failed" },
  { label: "Pending", value: "pending" },
];

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

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function isSuccessfulStatus(status: string) {
  return ["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(
    normalizeStatus(status),
  );
}

function isFailedStatus(status: string) {
  return ["FAILED", "FAIL", "DECLINED", "REJECTED"].includes(
    normalizeStatus(status),
  );
}

function isPendingStatus(status: string) {
  return ["PENDING", "PROCESSING", "INITIATED"].includes(
    normalizeStatus(status),
  );
}

function statusStyle(status: string) {
  if (isSuccessfulStatus(status)) {
    return {
      icon: CheckCircle,
      tone: "border-green-500/20 bg-green-500/10 text-green-300",
    };
  }

  if (isFailedStatus(status)) {
    return {
      icon: XCircle,
      tone: "border-red-500/20 bg-red-500/10 text-red-300",
    };
  }

  return {
    icon: Clock,
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  };
}

function matchesFilter(item: FinancialActivityItem, filter: ActivityFilter) {
  if (filter === "transactions") {
    return item.kind === "TRANSACTION";
  }

  if (filter === "transfers") {
    return item.kind === "TRANSFER";
  }

  if (filter === "successful") {
    return isSuccessfulStatus(item.status);
  }

  if (filter === "failed") {
    return isFailedStatus(item.status);
  }

  if (filter === "pending") {
    return isPendingStatus(item.status);
  }

  return true;
}

export default function Transactions() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [search, setSearch] = useState("");

  const activityQuery = useQuery({
    queryKey: ["financial_activity"],
    queryFn: financialActivityApi.getFinancialActivity,
    enabled: !!session?.user,
    retry: false,
    staleTime: 60 * 1000,
  });

  const summary = activityQuery.data?.summary;
  const activity = activityQuery.data?.data ?? [];
  const visibleActivity = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return activity.filter((item) => {
      const searchMatches =
        normalizedSearch.length === 0 ||
        [
          item.reference,
          item.vendorName,
          item.status,
          item.kind,
          item.latestWebhookEventType,
          item.bankAccount?.bankName,
          item.bankAccount?.accountName,
          item.bankAccount?.accountNumberLast4,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      return searchMatches && matchesFilter(item, filter);
    });
  }, [activity, filter, search]);

  const metrics = [
    {
      label: "Total volume",
      value: formatCurrency(summary?.totalVolume ?? 0),
      icon: CreditCard,
      tone: "text-zinc-100",
    },
    {
      label: "Transactions",
      value: summary?.transactionCount ?? 0,
      icon: ArrowDownRight,
      tone: "text-sky-200",
    },
    {
      label: "Transfers",
      value: summary?.transferCount ?? 0,
      icon: ArrowUpRight,
      tone: "text-violet-200",
    },
    {
      label: "Failed / Pending",
      value: `${summary?.failedCount ?? 0} / ${summary?.pendingCount ?? 0}`,
      icon: Activity,
      tone: "text-amber-200",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
            Payment intelligence
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Squad Financial Activity
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            PostgreSQL-backed payment and payout telemetry created from Squad
            webhooks. Transfers shown here are outgoing payouts, not live Squad
            proxy data.
          </p>
        </div>
        <button
          onClick={() => activityQuery.refetch()}
          className="button-secondary self-start py-2.5 lg:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${activityQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="panel-card flex items-center gap-4 p-5">
            <div className="icon-box border border-white/10 bg-black/40">
              <metric.icon className={`h-5 w-5 ${metric.tone}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {metric.label}
              </p>
              <p className="mt-1 truncate text-2xl font-black text-white">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-vs-border-soft bg-black/20 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by reference, vendor, bank, or status..."
              className="field-control py-2.5 pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Filter className="h-4 w-4" />
              Filter
            </span>
            {filters.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                  filter === item.value
                    ? "border-white/40 bg-white/15 text-white shadow-cyber-soft"
                    : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] whitespace-nowrap text-left text-sm">
            <thead className="border-b border-vs-border-soft bg-black/40 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Kind</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Destination / Channel</th>
                <th className="px-6 py-4">Webhook</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vs-border-soft">
              {activityQuery.isLoading && (
                <tr>
                  <td className="px-6 py-8 text-zinc-400" colSpan={8}>
                    Loading financial activity...
                  </td>
                </tr>
              )}
              {activityQuery.isError && (
                <tr>
                  <td className="px-6 py-8 text-red-300" colSpan={8}>
                    {(activityQuery.error as Error).message}
                  </td>
                </tr>
              )}
              {!activityQuery.isLoading &&
                !activityQuery.isError &&
                visibleActivity.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-zinc-400" colSpan={8}>
                      No matching financial activity yet.
                    </td>
                  </tr>
                )}
              {visibleActivity.map((item) => {
                const StatusIcon = statusStyle(item.status).icon;
                const destination =
                  item.kind === "TRANSFER"
                    ? `${item.bankAccount?.bankName ?? "Bank"} - ****${item.bankAccount?.accountNumberLast4 ?? "----"}`
                    : item.channel ?? "Squad";

                return (
                  <tr
                    key={`${item.kind}-${item.id}`}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4">
                      <span className="block font-mono text-xs text-zinc-300">
                        {item.reference}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] text-zinc-600">
                        {item.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {item.vendorName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-bold ${
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
                    <td className="px-6 py-4 font-black text-white">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${statusStyle(item.status).tone}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{destination}</td>
                    <td className="px-6 py-4">
                      <span className="block text-xs text-zinc-300">
                        {item.latestWebhookEventType ?? "No webhook event"}
                      </span>
                      <span className="mt-1 block text-[10px] text-zinc-600">
                        {item.webhookEventCount} event
                        {item.webhookEventCount === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
