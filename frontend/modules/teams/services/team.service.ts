import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from "@/services/main";
import type {
  Team,
  TeamListItem,
  CreateTeamInput,
  UpdateTeamInput,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

const BASE_URL = "/teams";

export const teamService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<TeamListItem>> {
    return apiGetPaginated<TeamListItem>(BASE_URL, { params });
  },

  async getById(id: string): Promise<ApiResponse<Team>> {
    return apiGet<Team>(`${BASE_URL}/${id}`);
  },

  async create(data: CreateTeamInput): Promise<ApiResponse<Team>> {
    return apiPost<Team, CreateTeamInput>(BASE_URL, data);
  },

  async update(id: string, data: UpdateTeamInput): Promise<ApiResponse<Team>> {
    return apiPatch<Team, UpdateTeamInput>(`${BASE_URL}/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiDelete<void>(`${BASE_URL}/${id}`);
  },

  async addMember(teamId: string, memberId: string): Promise<ApiResponse<Team>> {
    return apiPost<Team, { memberId: string }>(`${BASE_URL}/${teamId}/members`, {
      memberId,
    });
  },

  async removeMember(teamId: string, memberId: string): Promise<ApiResponse<Team>> {
    // DELETE with a body - the route reads `memberId` from req.body.
    return apiDelete<Team>(`${BASE_URL}/${teamId}/members`, {
      data: { memberId },
    });
  },
};
