// TODO: Uncomment when api service is configured
// import { api } from "@/services/main";
import type {
  Character,
  CharacterListItem,
  CharacterStats,
  CharacterSection,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

// const BASE_URL = "/characters";

export const characterService = {
  async getAll(_params?: QueryParams): Promise<PaginatedResponse<CharacterListItem>> {
    // TODO: return api.get(BASE_URL, { params });
    return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  async getById(_id: string): Promise<ApiResponse<Character>> {
    // TODO: return api.get(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async create(_data: Partial<Character>): Promise<ApiResponse<Character>> {
    // TODO: return api.post(BASE_URL, data);
    throw new Error("Not implemented");
  },

  async update(_id: string, _data: Partial<Character>): Promise<ApiResponse<Character>> {
    // TODO: return api.patch(`${BASE_URL}/${id}`, data);
    throw new Error("Not implemented");
  },

  async delete(_id: string): Promise<void> {
    // TODO: return api.delete(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async addSection(_id: string, _section: CharacterSection): Promise<ApiResponse<Character>> {
    // TODO: return api.post(`${BASE_URL}/${id}/sections`, section);
    throw new Error("Not implemented");
  },

  async updateStats(_id: string, _stats: Partial<CharacterStats>): Promise<ApiResponse<Character>> {
    // TODO: return api.patch(`${BASE_URL}/${id}/stats`, stats);
    throw new Error("Not implemented");
  },
};
