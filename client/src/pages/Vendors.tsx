import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Download, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { VendorEntityFromVendorsList } from "../typesAndInterfaces";
import { VendorsSkeleton } from "../Skeletons";

function riskBadgeClass(riskLevel?: string | null) {
  const normalized = riskLevel?.toLowerCase() ?? "";

  if (normalized.includes("critical")) {
    return "badge-critical";
  }

  if (normalized.includes("high")) {
    return "badge-high";
  }

  if (normalized.includes("medium") || normalized.includes("review")) {
    return "badge-review";
  }

  return "badge-low";
}

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

  if (isLoading) {
    return <VendorsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
            Review inventory
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Vendors Directory
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Manage vendor applications, review risk posture, and open the
            investigation workspace for document, device, and graph evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/vendors/new" className="button-primary">
            <Plus className="h-4 w-4" />
            New Vendor
          </Link>
          <button className="button-secondary">
            <Download className="h-4 w-4 text-zinc-400" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-vs-border-soft bg-black/20 p-5 lg:flex-row">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search by vendor name, ID, or email..."
              className="field-control py-2.5 pl-10"
            />
          </div>
          <button className="button-secondary py-2.5">
            <Filter className="h-4 w-4" />
            Risk level
          </button>

          <button className="button-secondary py-2.5">
            <Filter className="h-4 w-4" />
            Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-vs-border-soft bg-black/40 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Vendor Details</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4">Trust Score</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vs-border-soft">
              {isSuccess &&
                allVendors?.data.map((vendor, i) => (
                  <tr
                    key={i}
                    className="group transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">
                        {vendor.businessName}
                      </div>
                      <div className="mt-1 font-mono text-xs text-zinc-600">
                        {vendor.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {makeDate(String(vendor.createdAt))}
                    </td>
                    <td className="px-6 py-4 text-lg font-black text-white">
                      {vendor.overallRiskScore}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`risk-badge ${riskBadgeClass(vendor.riskLevel)}`}
                      >
                        {vendor.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="status-badge border-white/10 bg-white/5 text-zinc-300">
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/dashboard/vendors/${vendor.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        Review <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-vs-border-soft bg-black/20 p-4 text-center text-xs text-zinc-600">
          Showing {allVendors?.data.length ?? 0} vendors from the current
          workspace
        </div>
      </div>
    </div>
  );
}
