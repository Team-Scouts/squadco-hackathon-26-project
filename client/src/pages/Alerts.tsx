import { AlertCircle, AlertTriangle, Check, Info } from "lucide-react";

const alerts = [
  {
    id: "AL-9021",
    title: "Shared device detected",
    entity: "Koro Market Services",
    severity: "Critical",
    time: "10m ago",
    description: "Device fingerprint matches 3 other pending vendor applications.",
    icon: AlertCircle,
    badge: "badge-critical",
  },
  {
    id: "AL-9020",
    title: "Duplicate document hash",
    entity: "Northline Exports",
    severity: "Critical",
    time: "45m ago",
    description: "CAC image hash matches a document uploaded by a different vendor.",
    icon: AlertCircle,
    badge: "badge-critical",
  },
  {
    id: "AL-9019",
    title: "Bank account reused",
    entity: "Northline Exports",
    severity: "High Risk",
    time: "1h ago",
    description: "Bank account number exists in 2 previously rejected applications.",
    icon: AlertTriangle,
    badge: "badge-high",
  },
  {
    id: "AL-9018",
    title: "Unusual payment pattern",
    entity: "Zenith Logistics",
    severity: "Review",
    time: "2h ago",
    description: "Multiple failed verification fee attempts before success.",
    icon: AlertTriangle,
    badge: "badge-review",
  },
  {
    id: "AL-9017",
    title: "Name/account mismatch",
    entity: "Global Tech Ventures",
    severity: "Info",
    time: "3h ago",
    description: "Vendor name does not perfectly match the verified bank account name.",
    icon: Info,
    badge: "border-sky-300/25 bg-sky-300/10 text-sky-100",
  },
];

export default function Alerts() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
          Investigation queue
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          Alerts Center
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Review system-generated risk flags before approving vendors or
          treating evidence as confirmed.
        </p>
      </div>

      <div className="flex w-max rounded-2xl border border-white/5 bg-black/40 p-1">
        <button className="rounded-xl bg-white/10 px-6 py-2 text-sm font-bold text-white">
          Active (5)
        </button>
        <button className="rounded-xl px-6 py-2 text-sm font-bold text-zinc-500 transition-all hover:text-white">
          Resolved
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className="panel-card flex items-start gap-5 p-6 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
              <alert.icon className="h-6 w-6 text-zinc-300" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs text-zinc-600">{alert.id}</p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    {alert.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Related to <strong className="text-white">{alert.entity}</strong>
                  </p>
                </div>
                <div className="md:text-right">
                  <span className={`status-badge ${alert.badge}`}>
                    {alert.severity}
                  </span>
                  <span className="mt-2 block font-mono text-xs text-zinc-600">
                    {alert.time}
                  </span>
                </div>
              </div>

              <p className="mt-4 rounded-2xl border border-white/5 bg-black/30 p-4 text-sm leading-6 text-zinc-300">
                {alert.description}
              </p>

              <div className="mt-4 flex gap-3">
                <button className="button-secondary rounded-xl py-2 text-xs">
                  Investigate
                </button>
                <button className="inline-flex items-center gap-1 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-bold text-green-300 transition-colors hover:bg-green-500/20">
                  <Check className="h-3 w-3" /> Resolve
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
