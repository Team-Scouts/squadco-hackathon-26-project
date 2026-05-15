import {
  Activity,
  CheckCircle,
  Clock,
  CreditCard,
  Filter,
  Search,
  XCircle,
} from "lucide-react";

const transactions = [
  {
    id: "sq_txn_9x2b4...",
    vendor: "Northline Exports",
    amount: "NGN 15,000",
    type: "Verification Fee",
    status: "Success",
    date: "Oct 24, 2026 14:32",
    icon: CheckCircle,
    tone: "text-green-300",
  },
  {
    id: "sq_txn_2m4n5...",
    vendor: "Koro Market Services",
    amount: "NGN 15,000",
    type: "Verification Fee",
    status: "Pending",
    date: "Oct 24, 2026 12:15",
    icon: Clock,
    tone: "text-yellow-200",
  },
  {
    id: "sq_txn_7v8c2...",
    vendor: "Adenike Supplies Ltd",
    amount: "NGN 500,000",
    type: "Payout",
    status: "Success",
    date: "Oct 23, 2026 09:41",
    icon: CheckCircle,
    tone: "text-green-300",
  },
  {
    id: "sq_txn_4b5n6...",
    vendor: "Global Tech Ventures",
    amount: "NGN 15,000",
    type: "Verification Fee",
    status: "Failed",
    date: "Oct 23, 2026 16:20",
    icon: XCircle,
    tone: "text-red-300",
  },
  {
    id: "sq_txn_1z2x3...",
    vendor: "Apex Build Group",
    amount: "NGN 2,500,000",
    type: "Payout",
    status: "Success",
    date: "Oct 22, 2026 11:05",
    icon: CheckCircle,
    tone: "text-green-300",
  },
];

const metrics = [
  { label: "Total volume", value: "NGN 42.5M", icon: CreditCard, tone: "text-cyan-200" },
  { label: "Success rate", value: "98.2%", icon: Activity, tone: "text-green-300" },
  { label: "Pending verification", value: "112", icon: Clock, tone: "text-yellow-200" },
];

export default function Transactions() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
          Payment intelligence
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          Squad Transactions
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Payment telemetry and webhook events. This route remains visually
          prepared while full transaction wiring is deferred.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="panel-card flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
              <metric.icon className={`h-6 w-6 ${metric.tone}`} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-black text-white">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-vs-border-soft bg-black/20 p-5 lg:flex-row">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search by transaction ID or vendor..."
              className="field-control py-2.5 pl-10"
            />
          </div>
          <button className="button-secondary py-2.5">
            <Filter className="h-4 w-4" />
            Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-vs-border-soft bg-black/40 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vs-border-soft">
              {transactions.map((txn) => (
                <tr key={txn.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                    {txn.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">{txn.vendor}</td>
                  <td className="px-6 py-4 font-black text-white">{txn.amount}</td>
                  <td className="px-6 py-4 text-zinc-300">{txn.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 font-bold ${txn.tone}`}>
                      <txn.icon className="h-4 w-4" />
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
