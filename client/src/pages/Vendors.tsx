import { Search, Filter, Download, ArrowRight } from 'lucide-react'

export default function Vendors() {
  const vendors = [
    { name: 'Northline Exports', date: 'Oct 24, 2026', type: 'Supplier', score: 24, level: 'High risk', status: 'Rejected', statusColor: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { name: 'Koro Market Services', date: 'Oct 24, 2026', type: 'Contractor', score: 59, level: 'Review', status: 'Pending', statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { name: 'Adenike Supplies Ltd', date: 'Oct 23, 2026', type: 'Supplier', score: 84, level: 'Low risk', status: 'Approved', statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Global Tech Ventures', date: 'Oct 23, 2026', type: 'Consultant', score: 42, level: 'High risk', status: 'Rejected', statusColor: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { name: 'Apex Build Group', date: 'Oct 22, 2026', type: 'Contractor', score: 91, level: 'Low risk', status: 'Approved', statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Zenith Logistics', date: 'Oct 22, 2026', type: 'Supplier', score: 68, level: 'Review', status: 'Pending', statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Vendors Directory</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and review all vendor applications.</p>
        </div>
        <button className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold text-white transition-colors">
          <Download className="h-4 w-4 text-emerald-400" />
          Export CSV
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 bg-black/20">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by vendor name, ID, or email..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <button className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            <Filter className="h-4 w-4" />
            Filter by Risk Level
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Vendor Details</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4">Trust Score</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vendors.map((vendor, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{vendor.name}</div>
                    <div className="text-xs text-gray-500">{vendor.type}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{vendor.date}</td>
                  <td className="px-6 py-4 font-black text-white text-lg">{vendor.score}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${vendor.statusColor}`}>
                      {vendor.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300 font-semibold">{vendor.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Review <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-white/5 bg-black/20 text-center text-xs text-gray-500">
          Showing 6 of 12,840 vendors
        </div>
      </div>
    </div>
  )
}
