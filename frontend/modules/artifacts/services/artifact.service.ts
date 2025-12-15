// TODO: Uncomment when api service is configured
// import { api } from "@/services/main";
import type {
  Artifact,
  ArtifactListItem,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

// const BASE_URL = "/artifacts";

export const artifactService = {
  async getAll(_params?: QueryParams): Promise<PaginatedResponse<ArtifactListItem>> {
    // TODO: return api.get(BASE_URL, { params });
    return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  async getById(_id: string): Promise<ApiResponse<Artifact>> {
    // TODO: return api.get(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async create(_data: Partial<Artifact>): Promise<ApiResponse<Artifact>> {
    // TODO: return api.post(BASE_URL, data);
    throw new Error("Not implemented");
  },

  async update(_id: string, _data: Partial<Artifact>): Promise<ApiResponse<Artifact>> {
    // TODO: return api.patch(`${BASE_URL}/${id}`, data);
    throw new Error("Not implemented");
  },

  async delete(_id: string): Promise<void> {
    // TODO: return api.delete(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },
};
