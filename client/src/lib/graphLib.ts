import { graphApi, type GraphNode, type GraphResponse } from "./graphApi";

class GraphApi {
  static async getGraph(vendorID: string): Promise<GraphResponse> {
    return graphApi.getVendorGraph(vendorID);
  }
}

export const graphEntityStyles: Record<
  string,
  { color: string; dotClass: string; size: number; captionSize: number }
> = {
  Vendor: {
    color: "#334155",
    dotClass: "bg-zinc-200",
    size: 54,
    captionSize: 11,
  },
  Cluster: {
    color: "#7F1D1D",
    dotClass: "bg-red-500",
    size: 58,
    captionSize: 11,
  },
  Device: {
    color: "#164E63",
    dotClass: "bg-cyan-500",
    size: 42,
    captionSize: 10,
  },
  Document: {
    color: "#78350F",
    dotClass: "bg-amber-500",
    size: 42,
    captionSize: 10,
  },
  BankAccount: {
    color: "#4C1D95",
    dotClass: "bg-violet-500",
    size: 42,
    captionSize: 10,
  },
  Transaction: {
    color: "#14532D",
    dotClass: "bg-green-500",
    size: 40,
    captionSize: 9,
  },
  Transfer: {
    color: "#134E4A",
    dotClass: "bg-teal-500",
    size: 40,
    captionSize: 9,
  },
  RiskScore: {
    color: "#881337",
    dotClass: "bg-rose-500",
    size: 42,
    captionSize: 9,
  },
  Email: {
    color: "#71717A",
    dotClass: "bg-zinc-500",
    size: 36,
    captionSize: 9,
  },
  Phone: {
    color: "#71717A",
    dotClass: "bg-zinc-500",
    size: 36,
    captionSize: 9,
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

export function graphNodeCaption(node: GraphNode) {
  const data = node.data ?? {};

  if (node.type === "Vendor") {
    return normalizeCaption(data.businessName ?? node.label, node.id, 20);
  }

  if (node.type === "Cluster") {
    return normalizeCaption(data.riskType ?? node.label, "Cluster", 16);
  }

  if (node.type === "Device") {
    return `Device ${shortValue(data.deviceHash ?? node.id, 6)}`;
  }

  if (node.type === "Document") {
    return normalizeCaption(data.documentType ?? node.label, "Document", 16);
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
    captionSize: suspicious ? 7 : 6,
  };
}

export function transformGraphToNVL(apiResponse: GraphResponse) {
  const nodes = apiResponse.nodes.map((node) => {
    const style = graphEntityStyles[node.type] ?? {
      color: "#3F3F46",
      dotClass: "bg-zinc-300",
      size: 38,
      captionSize: 9,
    };
    const caption = graphNodeCaption(node);

    return {
      id: node.id,
      caption,
      captionAlign: "center" as const,
      captionSize: style.captionSize,
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
