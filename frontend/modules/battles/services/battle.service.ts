// TODO: Uncomment when api service is configured
// import { api } from "@/services/main";
import type {
  Battle,
  BattleListItem,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

// const BASE_URL = "/battles";

export const battleService = {
  async getAll(_params?: QueryParams): Promise<PaginatedResponse<BattleListItem>> {
    // TODO: return api.get(BASE_URL, { params });
    return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  async getById(_id: string): Promise<ApiResponse<Battle>> {
    // TODO: return api.get(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async create(_data: Partial<Battle>): Promise<ApiResponse<Battle>> {
    // TODO: return api.post(BASE_URL, data);
    throw new Error("Not implemented");
  },

  async update(_id: string, _data: Partial<Battle>): Promise<ApiResponse<Battle>> {
    // TODO: return api.patch(`${BASE_URL}/${id}`, data);
    throw new Error("Not implemented");
  },

  async delete(_id: string): Promise<void> {
    // TODO: return api.delete(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async getByMovie(_movieId: string): Promise<ApiResponse<BattleListItem[]>> {
    // TODO: return api.get(`${BASE_URL}/movie/${movieId}`);
    return { success: true, data: [] };
  },

  async getByCharacter(_characterId: string): Promise<ApiResponse<BattleListItem[]>> {
    // TODO: return api.get(`${BASE_URL}/character/${characterId}`);
    return { success: true, data: [] };
  },
};
