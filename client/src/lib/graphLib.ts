import type { GraphResponse } from "../typesAndInterfaces";

class GraphApi {
  static async getGraph(vendorID: string): Promise<GraphResponse> {
    const request = await fetch(
      `${import.meta.env.VITE_SERVER_BASE_URL}/graph/vendors/${vendorID}`,
      {
        credentials: "include",
      },
    );
    const response = await request.json();
    return response;
  }
}
export function transformNeo4jToNVL(apiResponse: GraphResponse) {
  const nodes = apiResponse.nodes.map((node) => ({
    id: node.id,
    caption: node.label || node.id,
    labels: node.label,
  }));

  const relationships = apiResponse.edges.map((edge) => ({
    id: edge.id,
    from: edge.source, // "source" → "from"
    to: edge.target, // "target" → "to"
    caption: edge.type,
  }));

  return { nodes, relationships };
}
export default GraphApi;
