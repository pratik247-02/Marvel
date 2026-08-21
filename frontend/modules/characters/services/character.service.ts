import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from "@/services/main";
import type {
  Character,
  CharacterListItem,
  CharacterSection,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

const BASE_URL = "/characters";

export const characterService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<CharacterListItem>> {
    return apiGetPaginated<CharacterListItem>(BASE_URL, { params });
  },

  async getById(id: string): Promise<ApiResponse<Character>> {
    return apiGet<Character>(`${BASE_URL}/${id}`);
  },

  async create(data: Partial<Character>): Promise<ApiResponse<Character>> {
    return apiPost<Character, Partial<Character>>(BASE_URL, data);
  },

  async update(id: string, data: Partial<Character>): Promise<ApiResponse<Character>> {
    return apiPatch<Character, Partial<Character>>(`${BASE_URL}/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiDelete<void>(`${BASE_URL}/${id}`);
  },

  async addSection(id: string, section: CharacterSection): Promise<ApiResponse<Character>> {
    return apiPost<Character, CharacterSection>(`${BASE_URL}/${id}/sections`, section);
  },
};
