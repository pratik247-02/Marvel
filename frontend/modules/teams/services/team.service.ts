// TODO: Uncomment when api service is configured
// import { api } from "@/services/main";
import type {
  Team,
  TeamListItem,
  CreateTeamInput,
  UpdateTeamInput,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

// const BASE_URL = "/teams";

export const teamService = {
  async getAll(_params?: QueryParams): Promise<PaginatedResponse<TeamListItem>> {
    // TODO: return api.get(BASE_URL, { params });
    return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  async getById(_id: string): Promise<ApiResponse<Team>> {
    // TODO: return api.get(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async create(_data: CreateTeamInput): Promise<ApiResponse<Team>> {
    // TODO: return api.post(BASE_URL, data);
    throw new Error("Not implemented");
  },

  async update(_id: string, _data: UpdateTeamInput): Promise<ApiResponse<Team>> {
    // TODO: return api.patch(`${BASE_URL}/${id}`, data);
    throw new Error("Not implemented");
  },

  async delete(_id: string): Promise<void> {
    // TODO: return api.delete(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async addMember(_teamId: string, _memberId: string): Promise<ApiResponse<Team>> {
    // TODO: return api.post(`${BASE_URL}/${teamId}/members`, { memberId });
    throw new Error("Not implemented");
  },

  async removeMember(_teamId: string, _memberId: string): Promise<ApiResponse<Team>> {
    // TODO: return api.delete(`${BASE_URL}/${teamId}/members`, { data: { memberId } });
    throw new Error("Not implemented");
  },
};
