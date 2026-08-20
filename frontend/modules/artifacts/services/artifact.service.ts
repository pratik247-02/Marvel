import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from "@/services/main";
import type {
  Artifact,
  ArtifactListItem,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

const BASE_URL = "/artifacts";

export const artifactService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<ArtifactListItem>> {
    return apiGetPaginated<ArtifactListItem>(BASE_URL, { params });
  },

  async getById(id: string): Promise<ApiResponse<Artifact>> {
    return apiGet<Artifact>(`${BASE_URL}/${id}`);
  },

  async create(data: Partial<Artifact>): Promise<ApiResponse<Artifact>> {
    return apiPost<Artifact, Partial<Artifact>>(BASE_URL, data);
  },

  async update(id: string, data: Partial<Artifact>): Promise<ApiResponse<Artifact>> {
    return apiPatch<Artifact, Partial<Artifact>>(`${BASE_URL}/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiDelete<void>(`${BASE_URL}/${id}`);
  },
};
