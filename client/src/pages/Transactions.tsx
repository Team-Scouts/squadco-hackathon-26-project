import { Search, Filter, Activity, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function Transactions() {
  const transactions = [
    { id: 'sq_txn_9x2b4...', vendor: 'Northline Exports', amount: '₦15,000', type: 'Verification Fee', status: 'Success', date: 'Oct 24, 2026 14:32', icon: CheckCircle, color: 'text-emerald-400' },
    { id: 'sq_txn_2m4n5...', vendor: 'Koro Market Services', amount: '₦15,000', type: 'Verification Fee', status: 'Pending', date: 'Oct 24, 2026 12:15', icon: Clock, color: 'text-amber-400' },
    { id: 'sq_txn_7v8c2...', vendor: 'Adenike Supplies Ltd', amount: '₦500,000', type: 'Payout', status: 'Success', date: 'Oct 23, 2026 09:41', icon: CheckCircle, color: 'text-emerald-400' },
    { id: 'sq_txn_4b5n6...', vendor: 'Global Tech Ventures', amount: '₦15,000', type: 'Verification Fee', status: 'Failed', date: 'Oct 23, 2026 16:20', icon: XCircle, color: 'text-red-400' },
    { id: 'sq_txn_1z2x3...', vendor: 'Apex Build Group', amount: '₦2,500,000', type: 'Payout', status: 'Success', date: 'Oct 22, 2026 11:05', icon: CheckCircle, color: 'text-emerald-400' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Squad Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">Payment telemetry and webhook events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Volume</p>
            <p className="text-2xl font-black text-white">₦42.5M</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Activity className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Success Rate</p>
            <p className="text-2xl font-black text-white">98.2%</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending Verifications</p>
            <p className="text-2xl font-black text-white">112</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex gap-4 bg-black/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by Transaction ID or Vendor..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            <Filter className="h-4 w-4" />
            Status
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((txn, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{txn.id}</td>
                  <td className="px-6 py-4 font-bold text-white">{txn.vendor}</td>
                  <td className="px-6 py-4 font-black text-white">{txn.amount}</td>
                  <td className="px-6 py-4 text-gray-300">{txn.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 font-bold ${txn.color}`}>
                      <txn.icon className="h-4 w-4" />
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
