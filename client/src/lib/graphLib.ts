import { graphApi, type GraphNode, type GraphResponse } from "./graphApi";

class GraphApi {
  static async getGraph(vendorID: string): Promise<GraphResponse> {
    return graphApi.getVendorGraph(vendorID);
  }
}

export const graphEntityStyles: Record<
  string,
  { color: string; dotClass: string; size: number; maxCaptionSize: number }
> = {
  Vendor: {
    color: "#020203",
    dotClass: "bg-zinc-200",
    size: 54,
    maxCaptionSize: 3,
  },
  Cluster: {
    color: "#020203",
    dotClass: "bg-red-500",
    size: 58,
    maxCaptionSize: 3,
  },
  Device: {
    color: "#020203",
    dotClass: "bg-sky-400",
    size: 42,
    maxCaptionSize: 2,
  },
  Document: {
    color: "#020203",
    dotClass: "bg-amber-500",
    size: 42,
    maxCaptionSize: 2,
  },
  BankAccount: {
    color: "#020203",
    dotClass: "bg-violet-500",
    size: 42,
    maxCaptionSize: 2,
  },
  Transaction: {
    color: "#020203",
    dotClass: "bg-green-500",
    size: 40,
    maxCaptionSize: 2,
  },
  Transfer: {
    color: "#020203",
    dotClass: "bg-teal-500",
    size: 40,
    maxCaptionSize: 2,
  },
  RiskScore: {
    color: "#020203",
    dotClass: "bg-rose-500",
    size: 42,
    maxCaptionSize: 2,
  },
  Email: {
    color: "#020203",
    dotClass: "bg-zinc-500",
    size: 36,
    maxCaptionSize: 2,
  },
  Phone: {
    color: "#020203",
    dotClass: "bg-zinc-500",
    size: 36,
    maxCaptionSize: 2,
  },
};

function shortValue(value: unknown, length = 14) {
  const text = String(value ?? "");

  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function normalizeCaption(value: unknown, fallback: string, length = 28) {
  const text = String(value ?? fallback)
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();

  return shortValue(text || fallback, length);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function dynamicNodeCaptionSize({
  caption,
  nodeType,
  nodeSize,
  maxCaptionSize,
}: {
  caption: string;
  nodeType: string;
  nodeSize: number;
  maxCaptionSize: number;
}) {
  const compactCaptionLength = caption.replace(/\s/g, "").length;
  const sizeAllowance = Math.floor(nodeSize / 24);
  const lengthPenalty =
    compactCaptionLength > 16 ? 2 : compactCaptionLength > 10 ? 1 : 0;
  const typePenalty = ["Document", "BankAccount", "Transaction", "Transfer"].includes(
    nodeType,
  )
    ? 1
    : 0;

  return clamp(maxCaptionSize - lengthPenalty - typePenalty + sizeAllowance - 1, 1, 3);
}

export function graphNodeCaption(node: GraphNode) {
  const data = node.data ?? {};

  if (node.type === "Vendor") {
    return normalizeCaption(data.businessName ?? node.label, node.id, 16);
  }

  if (node.type === "Cluster") {
    return normalizeCaption(data.riskType ?? node.label, "Cluster", 14);
  }

  if (node.type === "Device") {
    return `Device ${shortValue(data.deviceHash ?? node.id, 6)}`;
  }

  if (node.type === "Document") {
    return normalizeCaption(data.documentType ?? node.label, "Document", 14);
  }

  if (node.type === "BankAccount") {
    return `Account ${
      data.accountNumberLast4
        ? `...${data.accountNumberLast4}`
        : shortValue(data.accountNumberHash ?? node.id, 8)
    }`;
  }

  if (node.type === "Transaction") {
    return `Txn ${shortValue(data.transactionReference ?? data.reference ?? node.id, 8)}`;
  }

  if (node.type === "Transfer") {
    return `Transfer ${shortValue(data.transferReference ?? data.reference ?? node.id, 8)}`;
  }

  if (node.type === "RiskScore") {
    const score = data.overallRisk ?? data.overallRiskScore;
    const level = data.riskLevel ? String(data.riskLevel).replaceAll("_", " ") : "Risk";

    return score === undefined ? level : `${level} ${score}`;
  }

  return normalizeCaption(node.label, node.id, 18);
}

function relationshipCaption(type: string) {
  return type.replaceAll("_", " ");
}

function relationshipStyle(type: string) {
  const suspicious =
    type.includes("SHARED") ||
    type.includes("DUPLICATE") ||
    type.includes("MATCHES") ||
    type.includes("RISK");

  return {
    color: suspicious ? "#FF2E63" : "#71717A",
    width: suspicious ? 2 : 1,
    captionSize: 2,
  };
}

export function transformGraphToNVL(apiResponse: GraphResponse) {
  const nodes = apiResponse.nodes.map((node) => {
    const style = graphEntityStyles[node.type] ?? {
      color: "#020203",
      dotClass: "bg-zinc-300",
      size: 38,
      maxCaptionSize: 2,
    };
    const caption = graphNodeCaption(node);

    return {
      id: node.id,
      caption,
      captionAlign: "center" as const,
      captionSize: dynamicNodeCaptionSize({
        caption,
        nodeType: node.type,
        nodeSize: style.size,
        maxCaptionSize: style.maxCaptionSize,
      }),
      color: style.color,
      size: style.size,
    };
  });

  const relationships = apiResponse.edges.map((edge) => {
    const style = relationshipStyle(edge.type);

    return {
      id: edge.id,
      from: edge.source,
      to: edge.target,
      caption: relationshipCaption(edge.type),
      type: edge.type,
      captionAlign: "top" as const,
      captionSize: style.captionSize,
      color: style.color,
      width: style.width,
    };
  });

  return { nodes, relationships };
}

export const transformNeo4jToNVL = transformGraphToNVL;

export default GraphApi;
