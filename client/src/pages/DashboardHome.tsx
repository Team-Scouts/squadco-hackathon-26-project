import {
  Users,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Activity,
  CreditCard,
  Plus,
  FileUp,
  Zap,
  Download,
  PlayCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardHome() {
  const summaryMetrics = [
    {
      label: "Total vendors screened",
      value: "12,840",
      icon: Users,
      color: "text-gray-400",
    },
    {
      label: "Low-risk vendors",
      value: "11,402",
      icon: ShieldCheck,
      color: "text-emerald-400",
    },
    {
      label: "Review-required",
      value: "891",
      icon: AlertTriangle,
      color: "text-amber-400",
    },
    {
      label: "High-risk vendors",
      value: "547",
      icon: ShieldAlert,
      color: "text-red-400",
    },
    {
      label: "Pending Squad pymt.",
      value: "112",
      icon: CreditCard,
      color: "text-cyan-400",
    },
    {
      label: "Alerts today",
      value: "34",
      icon: Activity,
      color: "text-amber-400",
    },
  ];

  const quickActions = [
    { label: "Add new vendor", icon: Plus, path: "/dashboard/vendors/new" },
    { label: "Upload document", icon: FileUp },
    { label: "Run risk check", icon: Zap },
    { label: "Replay demo webhook", icon: PlayCircle },
    { label: "Export review report", icon: Download },
  ];

  const alerts = [
    { text: "Shared device detected", type: "danger", time: "10m ago" },
    { text: "Duplicate document hash", type: "danger", time: "45m ago" },
    { text: "Bank account reused", type: "danger", time: "1h ago" },
    { text: "Unusual payment pattern", type: "warning", time: "2h ago" },
    { text: "Name/account mismatch", type: "warning", time: "3h ago" },
  ];

  const squadTelemetry = [
    {
      event: "Verification fee paid",
      id: "sq_pay_8x9...",
      status: "success",
      time: "2m ago",
    },
    {
      event: "Transaction verified",
      id: "sq_txn_2m4...",
      status: "success",
      time: "5m ago",
    },
    {
      event: "Webhook received",
      id: "wh_evt_9k1...",
      status: "info",
      time: "5m ago",
    },
    {
      event: "Virtual account activity",
      id: "va_acc_7b2...",
      status: "info",
      time: "12m ago",
    },
    {
      event: "Account lookup result",
      id: "lkp_res_4n5...",
      status: "success",
      time: "15m ago",
    },
  ];

  const riskQueue = [
    {
      vendor: "Northline Exports",
      type: "Supplier",
      score: 24,
      level: "High risk",
      reason: "Reused bank account, duplicate CAC image",
      payment: "Verified",
      activity: "2h ago",
      statusColor: "text-red-400 bg-red-500/10 border-red-500/20",
    },
    {
      vendor: "Koro Market Services",
      type: "Contractor",
      score: 59,
      level: "Review",
      reason: "Shared device across 3 pending applications",
      payment: "Pending",
      activity: "5h ago",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      vendor: "Adenike Supplies Ltd",
      type: "Supplier",
      score: 84,
      level: "Low risk",
      reason: "Clean document hash, verified payment",
      payment: "Verified",
      activity: "1d ago",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      vendor: "Global Tech Ventures",
      type: "Consultant",
      score: 42,
      level: "High risk",
      reason: "Name mismatch on bank account, IP velocity",
      payment: "Failed",
      activity: "1d ago",
      statusColor: "text-red-400 bg-red-500/10 border-red-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryMetrics.map((metric, i) => (
          <div
            key={i}
            className="glass-panel rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-tight">
                {metric.label}
              </span>
              <metric.icon className={`h-4 w-4 ${metric.color} shrink-0`} />
            </div>
            <span className={`text-2xl font-black ${metric.color}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (Main Focus) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Featured Case Panel */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border-red-500/30">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Featured Case{" "}
                  <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-xs font-extrabold uppercase tracking-widest border border-red-500/30">
                    Highest Priority
                  </span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Vendor:{" "}
                  <strong className="text-white">Northline Exports</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="block text-4xl font-black text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">
                  24
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Overall Trust Score
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Document",
                  score: "High Risk",
                  color: "text-red-400",
                },
                { label: "Device", score: "High Risk", color: "text-red-400" },
                {
                  label: "Financial",
                  score: "Medium",
                  color: "text-amber-400",
                },
                { label: "Network", score: "Critical", color: "text-red-500" },
              ].map((r) => (
                <div
                  key={r.label}
                  className="bg-black/30 rounded-lg p-3 border border-white/5"
                >
                  <span className="block text-xs text-gray-500 font-semibold mb-1">
                    {r.label}
                  </span>
                  <span className={`text-sm font-bold ${r.color}`}>
                    {r.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-red-400">High risk because</strong> this
                device registered 6 vendors in 2 hours and the bank account
                appears in 2 previously rejected applications. The provided CAC
                image hash matches a document uploaded by a different vendor 3
                weeks ago.
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-lg transition-colors border border-white/10">
                View Full Profile
              </button>
              <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold rounded-lg transition-colors border border-red-500/30">
                Reject Application
              </button>
            </div>
          </div>

          {/* Trust Graph Preview */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">
                Trust Graph Overview
              </h2>
              <button className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1">
                Open Full Graph <ExternalLink className="h-3 w-3" />
              </button>
            </div>
            <div className="relative h-64 w-full bg-gray-950 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0,transparent_100%)]"></div>

              {/* Abstract mini-graph visualization */}
              <svg className="absolute inset-0 w-full h-full opacity-40">
                <path
                  d="M 30% 30% Q 50% 50% 70% 30%"
                  stroke="#f87171"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="4 4"
                  className="animate-pulse-glow"
                />
                <path
                  d="M 50% 50% L 30% 70%"
                  stroke="#10b981"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d="M 50% 50% L 70% 70%"
                  stroke="#fbbf24"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d="M 70% 30% L 80% 50%"
                  stroke="#f87171"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>

              <div className="absolute top-[30%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.3)] animate-pulse flex items-center justify-center">
                  <Users className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Vendor A</span>
              </div>
              <div className="absolute top-[30%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.3)] flex items-center justify-center">
                  <Users className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Vendor B</span>
              </div>
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-[10px] text-amber-400 font-bold mt-1 bg-black/50 px-2 py-0.5 rounded">
                  Shared Device
                </span>
              </div>
              <div className="absolute top-[70%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <FileUp className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Doc 1</span>
              </div>
              <div className="absolute top-[70%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                  Bank Acct
                </span>
              </div>
              <div className="absolute top-[50%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                  <FileUp className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Doc 2</span>
              </div>
            </div>
          </div>

          {/* Risk Queue */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Risk Queue</h2>
              <button className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/40 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3">Vendor</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Risk Level</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {riskQueue.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">
                          {item.vendor}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.type} • {item.activity}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-white">
                        {item.score}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${item.statusColor}`}
                        >
                          {item.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 truncate max-w-50">
                        {item.reason}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {item.payment}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-bold transition-colors">
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((action, i) => {
                const content = (
                  <>
                    <action.icon className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    {action.label}
                  </>
                );

                return action.path ? (
                  <Link
                    key={i}
                    to={action.path}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all group"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all group"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between items-center">
              Recent Alerts
              <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px]">
                5 New
              </span>
            </h2>
            <div className="space-y-4">
              {alerts.map((alert, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${alert.type === "danger" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"}`}
                  ></div>
                  <div>
                    <p className="text-sm text-gray-300 leading-tight">
                      {alert.text}
                    </p>
                    <span className="text-xs text-gray-600">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors border-t border-white/5">
              View All Alerts
            </button>
          </div>

          {/* Squad Telemetry Feed */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              Squad Telemetry
            </h2>
            <div className="relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {squadTelemetry.map((item, i) => (
                <div
                  key={i}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-4 last:mb-0 pl-6 md:pl-0"
                >
                  <div
                    className={`absolute left-0 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-gray-950 ${item.status === "success" ? "bg-emerald-500" : "bg-cyan-500"} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
                  ></div>
                  <div className="w-full md:w-[calc(50%-1.5rem)] md:group-odd:text-right">
                    <p className="text-xs font-bold text-gray-300">
                      {item.event}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {item.id} • {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
