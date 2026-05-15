import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, GitBranch, ShieldAlert } from "lucide-react";
import { graphApi, type GraphResponse } from "../lib/graphApi";
import { SkeletonGraphPanel } from "../Skeletons";
import { useSession } from "../lib/authClient";
import GraphCanvas from "../components/GraphCanvas";

type ClusterFilter = "ALL" | "SHARED_DEVICE" | "SHARED_ACCOUNT" | "DUPLICATE_DOCUMENT";

const filters: Array<{ label: string; value: ClusterFilter }> = [
  { label: "All clusters", value: "ALL" },
  { label: "Shared devices", value: "SHARED_DEVICE" },
  { label: "Shared accounts", value: "SHARED_ACCOUNT" },
  { label: "Duplicate documents", value: "DUPLICATE_DOCUMENT" },
];

function filterGraph(graph: GraphResponse, filter: ClusterFilter): GraphResponse {
  if (filter === "ALL") {
    return graph;
  }

  const clusterIds = new Set(
    graph.nodes
      .filter((node) => node.type === "Cluster" && node.data?.riskType === filter)
      .map((node) => node.id),
  );
  const edges = graph.edges.filter(
    (edge) => clusterIds.has(edge.source) || clusterIds.has(edge.target),
  );
  const nodeIds = new Set<string>([...clusterIds]);

  for (const edge of edges) {
    nodeIds.add(edge.source);
    nodeIds.add(edge.target);
  }

  return {
    nodes: graph.nodes.filter((node) => nodeIds.has(node.id)),
    edges,
  };
}

export default function FraudGraph() {
  const [activeFilter, setActiveFilter] = useState<ClusterFilter>("ALL");
  const { data: session } = useSession();
  const fraudGraphQuery = useQuery({
    queryKey: ["fraud_clusters"],
    queryFn: graphApi.getFraudClusters,
    enabled: !!session?.user,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const filteredGraph = useMemo(
    () =>
      filterGraph(
        fraudGraphQuery.data ?? { nodes: [], edges: [] },
        activeFilter,
      ),
    [activeFilter, fraudGraphQuery.data],
  );
  const clusterCount =
    fraudGraphQuery.data?.nodes.filter((node) => node.type === "Cluster").length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <GitBranch className="h-7 w-7 text-violet-300" />
            <h1 className="text-3xl font-black tracking-tight text-white">
              Fraud Graph
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Relationship clusters from shared devices, shared bank accounts, and
            duplicate documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Clusters
          </p>
          <p className="mt-2 text-3xl font-black text-red-300">{clusterCount}</p>
        </div>
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Nodes shown
          </p>
          <p className="mt-2 text-3xl font-black text-cyan-300">
            {filteredGraph.nodes.length}
          </p>
        </div>
        <div className="panel-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Relationships shown
          </p>
          <p className="mt-2 text-3xl font-black text-zinc-100">
            {filteredGraph.edges.length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <h2 className="text-xl font-bold text-white">Cluster view</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  activeFilter === filter.value
                    ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {fraudGraphQuery.isLoading && <SkeletonGraphPanel />}

        {!fraudGraphQuery.isLoading && filteredGraph.nodes.length === 0 && (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/30 text-center">
            <AlertTriangle className="h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm font-bold text-white">
              No fraud clusters found
            </p>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              Shared-device, shared-account, and duplicate-document clusters
              appear here after graph sync has enough related vendor data.
            </p>
          </div>
        )}

        {!fraudGraphQuery.isLoading && filteredGraph.nodes.length > 0 && (
          <GraphCanvas
            graph={filteredGraph}
            title="Fraud cluster graph"
            subtitle="Combined graph for shared devices, duplicate documents, and shared accounts."
            height="fraud"
            onRefresh={() => fraudGraphQuery.refetch()}
            isRefreshing={fraudGraphQuery.isFetching}
            showLegend
          />
        )}
      </div>
    </div>
  );
}
