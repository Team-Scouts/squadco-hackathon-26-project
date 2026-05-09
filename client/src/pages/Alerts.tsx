import { AlertCircle, AlertTriangle, Info, Check } from 'lucide-react'

export default function Alerts() {
  const alerts = [
    { id: 'AL-9021', title: 'Shared device detected', entity: 'Koro Market Services', severity: 'Critical', time: '10m ago', description: 'Device fingerprint matches 3 other pending vendor applications.', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { id: 'AL-9020', title: 'Duplicate document hash', entity: 'Northline Exports', severity: 'Critical', time: '45m ago', description: 'CAC image hash matches a document uploaded by a different vendor 3 weeks ago.', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { id: 'AL-9019', title: 'Bank account reused', entity: 'Northline Exports', severity: 'Warning', time: '1h ago', description: 'Bank account number exists in 2 previously rejected applications.', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { id: 'AL-9018', title: 'Unusual payment pattern', entity: 'Zenith Logistics', severity: 'Warning', time: '2h ago', description: 'Multiple failed verification fee attempts before success.', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { id: 'AL-9017', title: 'Name/account mismatch', entity: 'Global Tech Ventures', severity: 'Info', time: '3h ago', description: 'Vendor name does not perfectly match the verified bank account name.', icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Alerts Center</h1>
          <p className="text-sm text-gray-400 mt-1">Review and manage system-generated risk flags.</p>
        </div>
      </div>

      <div className="flex p-1 bg-black/40 rounded-xl w-max border border-white/5 mb-6">
        <button className="px-6 py-2 text-sm font-bold rounded-lg bg-white/10 text-white shadow-md transition-all">
          Active (5)
        </button>
        <button className="px-6 py-2 text-sm font-bold rounded-lg text-gray-400 hover:text-white transition-all">
          Resolved
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="glass-panel rounded-2xl p-6 flex gap-6 items-start hover:bg-white/5 transition-colors group">
            <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center border ${alert.bg}`}>
              <alert.icon className={`h-6 w-6 ${alert.color}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{alert.title}</h3>
                  <p className="text-sm text-gray-400">Related to: <strong className="text-white">{alert.entity}</strong></p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border mb-1 ${alert.bg} ${alert.color}`}>
                    {alert.severity}
                  </span>
                  <span className="block text-xs text-gray-500">{alert.time}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 bg-black/30 p-3 rounded-lg border border-white/5 mb-4">
                {alert.description}
              </p>
              
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border border-white/10">
                  Investigate
                </button>
                <button className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-colors border border-emerald-500/20 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Resolve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
