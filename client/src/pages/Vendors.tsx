import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Download, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { VendorEntityFromVendorsList } from "../typesAndInterfaces";

export default function Vendors() {
  // const vendors = [
  //   {
  //     name: "Northline Exports",
  //     date: "Oct 24, 2026",
  //     type: "Supplier",
  //     score: 24,
  //     level: "High risk",
  //     status: "Rejected",
  //     statusColor: "text-red-400 bg-red-500/10 border-red-500/20",
  //   },
  //   {
  //     name: "Koro Market Services",
  //     date: "Oct 24, 2026",
  //     type: "Contractor",
  //     score: 59,
  //     level: "Review",
  //     status: "Pending",
  //     statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  //   },
  //   {
  //     name: "Adenike Supplies Ltd",
  //     date: "Oct 23, 2026",
  //     type: "Supplier",
  //     score: 84,
  //     level: "Low risk",
  //     status: "Approved",
  //     statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  //   },
  //   {
  //     name: "Global Tech Ventures",
  //     date: "Oct 23, 2026",
  //     type: "Consultant",
  //     score: 42,
  //     level: "High risk",
  //     status: "Rejected",
  //     statusColor: "text-red-400 bg-red-500/10 border-red-500/20",
  //   },
  //   {
  //     name: "Apex Build Group",
  //     date: "Oct 22, 2026",
  //     type: "Contractor",
  //     score: 91,
  //     level: "Low risk",
  //     status: "Approved",
  //     statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  //   },
  //   {
  //     name: "Zenith Logistics",
  //     date: "Oct 22, 2026",
  //     type: "Supplier",
  //     score: 68,
  //     level: "Review",
  //     status: "Pending",
  //     statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  //   },
  // ];

  const {
    data: allVendors,
    isLoading,
    isSuccess,
  } = useQuery<{
    data: VendorEntityFromVendorsList[];
  }>({
    queryKey: ["vendors_list"],
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const request = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/vendors`,
        {
          credentials: "include",
        },
      );
      const response = await request.json();
      return response;
    },
  });

  const makeDate = (string: string) => {
    const date = new Date(string);
    return date.toDateString();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Vendors Directory
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage and review all vendor applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/vendors/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-gray-950 rounded-lg text-sm font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            New Vendor
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold text-white transition-colors">
            <Download className="h-4 w-4 text-emerald-400" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex gap-4 bg-black/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by vendor name, ID, or email..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            <Filter className="h-4 w-4" />
            Filter by Risk Level
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            <Filter className="h-4 w-4" />
            Filter by Application Status
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
              {isSuccess &&
                allVendors?.data.map((vendor, i) => (
                  <tr
                    key={i}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">
                        {vendor.businessName}
                      </div>
                      {/* <div className="text-xs text-gray-500">{vendor.}</div> */}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {makeDate(String(vendor.createdAt))}
                    </td>
                    <td className="px-6 py-4 font-black text-white text-lg">
                      {vendor.overallRiskScore}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border `}
                      >
                        {vendor.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 font-semibold">
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/dashboard/vendors/${vendor.id}`}
                        className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Review <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              {isLoading && <p>Loading Vendors...</p>}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-white/5 bg-black/20 text-center text-xs text-gray-500">
          Showing 6 of 12,840 vendors
        </div>
      </div>
    </div>
  );
}
