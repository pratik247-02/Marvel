import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from "@/services/main";
import type {
  Battle,
  BattleListItem,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

const BASE_URL = "/battles";

export const battleService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<BattleListItem>> {
    return apiGetPaginated<BattleListItem>(BASE_URL, { params });
  },

  async getById(id: string): Promise<ApiResponse<Battle>> {
    return apiGet<Battle>(`${BASE_URL}/${id}`);
  },

  async create(data: Partial<Battle>): Promise<ApiResponse<Battle>> {
    return apiPost<Battle, Partial<Battle>>(BASE_URL, data);
  },

  async update(id: string, data: Partial<Battle>): Promise<ApiResponse<Battle>> {
    return apiPatch<Battle, Partial<Battle>>(`${BASE_URL}/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiDelete<void>(`${BASE_URL}/${id}`);
  },

  async getByMovie(movieId: string): Promise<ApiResponse<BattleListItem[]>> {
    return apiGet<BattleListItem[]>(`${BASE_URL}/movie/${movieId}`);
  },

  async getByCharacter(characterId: string): Promise<ApiResponse<BattleListItem[]>> {
    return apiGet<BattleListItem[]>(`${BASE_URL}/character/${characterId}`);
  },
};
