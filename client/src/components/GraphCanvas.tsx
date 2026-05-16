import { useEffect, useMemo, useRef, useState } from "react";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import type NVL from "@neo4j-nvl/base";
import type { Node, Relationship } from "@neo4j-nvl/base";
import {
  Crosshair,
  Info,
  Maximize2,
  MousePointer2,
  RotateCcw,
  ScanSearch,
  X,
  ZoomIn,
} from "lucide-react";
import type { GraphEdge, GraphNode, GraphResponse } from "../lib/graphApi";
import { graphEntityStyles, transformGraphToNVL } from "../lib/graphLib";

type GraphCanvasProps = {
  graph: GraphResponse;
  title: string;
  subtitle?: string;
  height?: "compact" | "vendor" | "fraud";
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showLegend?: boolean;
};

const heightClassByType = {
  compact: "h-[420px]",
  vendor: "h-[600px] max-h-[74vh]",
  fraud: "h-[660px] max-h-[76vh]",
};

const preferredEntityOrder = [
  "Vendor",
  "Cluster",
  "Device",
  "Document",
  "BankAccount",
  "Transaction",
  "Transfer",
  "RiskScore",
  "Email",
  "Phone",
];

type SelectedGraphItem =
  | {
      kind: "node";
      id: string;
      type: string;
      caption?: string;
      data?: Record<string, unknown>;
    }
  | {
      kind: "relationship";
      id: string;
      caption?: string;
      from?: string;
      to?: string;
      type?: string;
    };

function visibleMetadata(data?: Record<string, unknown>) {
  if (!data) {
    return [];
  }

  return Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .filter(([key]) =>
      [
        "businessName",
        "riskLevel",
        "overallRiskScore",
        "riskType",
        "severity",
        "vendorCount",
        "documentType",
        "verificationStatus",
        "tamperScore",
        "aiGeneratedScore",
        "duplicateDetected",
        "duplicateVendorCount",
        "accountNumberLast4",
        "riskScore",
        "status",
        "provider",
        "amount",
        "currency",
      ].includes(key),
    )
    .slice(0, 10);
}

function sortEntityTypes(types: string[]) {
  return [...types].sort((a, b) => {
    const aIndex = preferredEntityOrder.indexOf(a);
    const bIndex = preferredEntityOrder.indexOf(b);

    if (aIndex === -1 && bIndex === -1) {
      return a.localeCompare(b);
    }

    if (aIndex === -1) {
      return 1;
    }

    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });
}

function filterGraphByHiddenTypes(
  graph: GraphResponse,
  hiddenTypes: string[],
): GraphResponse {
  if (hiddenTypes.length === 0) {
    return graph;
  }

  const hidden = new Set(hiddenTypes);
  const nodes = graph.nodes.filter((node) => !hidden.has(node.type));
  const visibleNodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
  );

  return { nodes, edges };
}

function graphNodeById(nodes: GraphNode[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function graphEdgeById(edges: GraphEdge[]) {
  return new Map(edges.map((edge) => [edge.id, edge]));
}

function captionForRelationship(relationship: Relationship) {
  return relationship.caption || relationship.type || relationship.id;
}

function DetailValue({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: unknown;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-xs font-semibold text-zinc-100 ${
          mono ? "break-all font-mono" : ""
        }`}
      >
        {String(value)}
      </p>
    </div>
  );
}

export default function GraphCanvas({
  graph,
  title,
  subtitle,
  height = "vendor",
  onRefresh,
  isRefreshing = false,
  showLegend = false,
}: GraphCanvasProps) {
  const graphRef = useRef<NVL | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedGraphItem | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);

  const entityTypes = useMemo(
    () => sortEntityTypes(Array.from(new Set(graph.nodes.map((node) => node.type)))),
    [graph.nodes],
  );
  const visibleGraph = useMemo(
    () => filterGraphByHiddenTypes(graph, hiddenTypes),
    [graph, hiddenTypes],
  );
  const visualGraph = useMemo(() => transformGraphToNVL(visibleGraph), [visibleGraph]);
  const nodeIds = useMemo(
    () => visibleGraph.nodes.map((node) => node.id),
    [visibleGraph.nodes],
  );
  const nodeIdSignature = useMemo(() => nodeIds.join("|"), [nodeIds]);
  const nodeMap = useMemo(() => graphNodeById(graph.nodes), [graph.nodes]);
  const edgeMap = useMemo(() => graphEdgeById(graph.edges), [graph.edges]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const selectedStillVisible =
      selectedItem.kind === "node"
        ? visibleGraph.nodes.some((node) => node.id === selectedItem.id)
        : visibleGraph.edges.some((edge) => edge.id === selectedItem.id);

    if (!selectedStillVisible) {
      setSelectedItem(null);
    }
  }, [selectedItem, visibleGraph.edges, visibleGraph.nodes]);

  const fitGraph = () => {
    if (nodeIds.length) {
      graphRef.current?.fit(nodeIds);
    }
  };

  const resetZoom = () => {
    graphRef.current?.resetZoom();
  };

  const focusNode = (nodeId?: string) => {
    if (nodeId) {
      graphRef.current?.fit([nodeId]);
    }
  };

  const focusRelationship = (relationship?: Pick<Relationship, "from" | "to">) => {
    const ids = [relationship?.from, relationship?.to].filter(Boolean) as string[];

    if (ids.length) {
      graphRef.current?.fit(ids);
    }
  };

  const focusSelected = () => {
    if (!selectedItem) {
      return;
    }

    if (selectedItem.kind === "node") {
      focusNode(selectedItem.id);
      return;
    }

    focusRelationship({ from: selectedItem.from ?? "", to: selectedItem.to ?? "" });
  };

  const clearSelection = () => {
    graphRef.current?.deselectAll();
    setSelectedItem(null);
  };

  const toggleType = (type: string) => {
    setHiddenTypes((current) =>
      current.includes(type)
        ? current.filter((hiddenType) => hiddenType !== type)
        : [...current, type],
    );
  };

  const allTypesVisible = hiddenTypes.length === 0;

  useEffect(() => {
    if (!nodeIds.length) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        graphRef.current?.fit(nodeIds);
      });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [nodeIdSignature]);

  return (
    <section className="panel-card p-4 shadow-cyber-soft md:p-5">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-box border border-sky-300/20 bg-sky-300/10">
              <ScanSearch className="h-4 w-4 text-sky-200" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-white">{title}</h2>
              {subtitle && (
                <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-300">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fitGraph}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 transition-all hover:bg-white/10 hover:text-white hover:shadow-cyber-active"
          >
            <Maximize2 className="h-4 w-4" />
            Fit
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 transition-all hover:bg-white/10 hover:text-white hover:shadow-cyber-active"
          >
            <ZoomIn className="h-4 w-4" />
            Reset
          </button>
          {selectedItem && (
            <>
              <button
                type="button"
                onClick={focusSelected}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-bold text-sky-100 transition-all hover:bg-sky-300/15 hover:shadow-cyber-active"
              >
                <Crosshair className="h-4 w-4" />
                Focus selected
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 transition-all hover:bg-white/10 hover:text-white hover:shadow-cyber-active"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-200 transition-all hover:bg-white/10 hover:text-white hover:shadow-cyber-active"
            >
              <RotateCcw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          )}
        </div>
      </div>

      {(showLegend || entityTypes.length > 1) && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/35 p-3 md:flex-row md:items-center md:justify-between">
          {showLegend && (
            <div className="flex flex-wrap items-center gap-2">
              {entityTypes.slice(0, 8).map((type) => {
                const style = graphEntityStyles[type] ?? {
                  dotClass: "bg-zinc-400",
                };

                return (
                  <span
                    key={type}
                    className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-zinc-200"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${style.dotClass}`} />
                    {type}
                  </span>
                );
              })}
            </div>
          )}

          {entityTypes.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setHiddenTypes([])}
                className={`inline-flex min-h-8 items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                  allTypesVisible
                    ? "border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-cyber-soft"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              {entityTypes.map((type) => {
                const visible = !hiddenTypes.includes(type);

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`inline-flex min-h-8 items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      visible
                        ? "border-white/15 bg-white/10 text-white"
                        : "border-white/10 bg-black/30 text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div
          className={`${heightClassByType[height]} min-w-0 rounded-2xl border border-white/10 bg-[#020203] shadow-[inset_0_0_52px_rgba(0,229,255,0.04)]`}
        >
          <InteractiveNvlWrapper
            ref={graphRef}
            nodes={visualGraph.nodes}
            rels={visualGraph.relationships}
            layout="forceDirected"
            interactionOptions={{
              selectOnClick: true,
              drawShadowOnHover: true,
              excludeNodeMargin: true,
            }}
            mouseEventCallbacks={{
              onPan: true,
              onNodeClick: (node: Node) => {
                const apiNode = nodeMap.get(node.id);

                setSelectedItem({
                  kind: "node",
                  id: node.id,
                  type: apiNode?.type ?? "Node",
                  caption: node.caption ?? apiNode?.label,
                  data: apiNode?.data,
                });
              },
              onNodeDoubleClick: (node: Node) => {
                const apiNode = nodeMap.get(node.id);

                setSelectedItem({
                  kind: "node",
                  id: node.id,
                  type: apiNode?.type ?? "Node",
                  caption: node.caption ?? apiNode?.label,
                  data: apiNode?.data,
                });
                focusNode(node.id);
              },
              onRelationshipClick: (relationship: Relationship) => {
                const apiEdge = edgeMap.get(relationship.id);

                setSelectedItem({
                  kind: "relationship",
                  id: relationship.id,
                  caption: captionForRelationship(relationship),
                  from: relationship.from,
                  to: relationship.to,
                  type: apiEdge?.type ?? relationship.type,
                });
              },
              onRelationshipDoubleClick: (relationship: Relationship) => {
                const apiEdge = edgeMap.get(relationship.id);

                setSelectedItem({
                  kind: "relationship",
                  id: relationship.id,
                  caption: captionForRelationship(relationship),
                  from: relationship.from,
                  to: relationship.to,
                  type: apiEdge?.type ?? relationship.type,
                });
                focusRelationship(relationship);
              },
              onCanvasClick: () => setSelectedItem(null),
              onCanvasDoubleClick: () => {
                clearSelection();
                fitGraph();
              },
            }}
            nvlOptions={{
              renderer: "canvas",
              allowDynamicMinZoom: true,
              relationshipThreshold: 0.35,
              maxZoom: 8,
              minZoom: 0.05,
              styling: {
                defaultRelationshipColor: "#71717A",
                dropShadowColor: "rgba(56,189,248,0.24)",
                nodeDefaultBorderColor: "rgba(244,244,245,0.72)",
                selectedBorderColor: "#38BDF8",
                selectedInnerBorderColor: "#FFFFFF",
              },
              disableTelemetry: true,
            }}
          />
        </div>

        <aside className="min-w-0 rounded-2xl border border-white/10 bg-black/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="mb-4 flex items-center gap-2">
            <span className="icon-box border border-sky-300/20 bg-sky-300/10">
              <Info className="h-4 w-4 text-sky-200" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">Graph details</p>
              <p className="text-[11px] font-medium text-zinc-500">
                Click to inspect. Double-click to zoom.
              </p>
            </div>
          </div>

          {!selectedItem && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.035] p-4">
              <MousePointer2 className="h-5 w-5 text-zinc-500" />
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Select a node or relationship to inspect metadata without
                crowding the graph.
              </p>
            </div>
          )}

          {selectedItem?.kind === "node" && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {selectedItem.type}
                </p>
                <p className="mt-1 break-words text-sm font-bold text-white">
                  {selectedItem.caption ?? selectedItem.id}
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">
                  {selectedItem.id}
                </p>
              </div>

              {visibleMetadata(selectedItem.data).map(([key, value]) => (
                <DetailValue key={key} label={key} value={value} />
              ))}

              {visibleMetadata(selectedItem.data).length === 0 && (
                <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-zinc-400">
                  No additional metadata is available for this node.
                </p>
              )}
            </div>
          )}

          {selectedItem?.kind === "relationship" && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Relationship
                </p>
                <p className="mt-1 break-words text-sm font-bold text-white">
                  {selectedItem.caption ?? selectedItem.id}
                </p>
              </div>
              <DetailValue label="Type" value={selectedItem.type ?? "Relationship"} />
              <DetailValue label="From" value={selectedItem.from ?? "Unknown"} mono />
              <DetailValue label="To" value={selectedItem.to ?? "Unknown"} mono />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
