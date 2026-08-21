import { apiGet } from "@/services/main";
import type {
  ApiResponse,
  GraphPathResult,
  GraphNetworkResult,
  GraphStats,
  FullGraph,
} from "@/types";

const BASE_URL = "/graph";

export const graphService = {
  /** Shortest path between two characters. Accepts slugs or ids. */
  async getPath(
    from: string,
    to: string,
    mode: "weighted" | "hops" = "weighted"
  ): Promise<ApiResponse<GraphPathResult>> {
    return apiGet<GraphPathResult>(`${BASE_URL}/path`, {
      params: { from, to, mode },
    });
  },

  /** The neighbourhood around one character. */
  async getNetwork(ref: string, depth = 1): Promise<ApiResponse<GraphNetworkResult>> {
    return apiGet<GraphNetworkResult>(`${BASE_URL}/network/${ref}`, {
      params: { depth },
    });
  },

  /** Degree, tie strength and betweenness rankings. */
  async getStats(limit = 10): Promise<ApiResponse<GraphStats>> {
    return apiGet<GraphStats>(`${BASE_URL}/stats`, { params: { limit } });
  },

  /** The entire graph, for visualization. */
  async getFullGraph(): Promise<ApiResponse<FullGraph>> {
    return apiGet<FullGraph>(`${BASE_URL}/full`);
  },
};
