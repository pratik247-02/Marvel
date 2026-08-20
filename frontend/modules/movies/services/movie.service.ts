import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from "@/services/main";
import type {
  Movie,
  MovieListItem,
  MovieTimeline,
  Phase,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

const BASE_URL = "/movies";

export const movieService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<MovieListItem>> {
    return apiGetPaginated<MovieListItem>(BASE_URL, { params });
  },

  async getById(id: string): Promise<ApiResponse<Movie>> {
    return apiGet<Movie>(`${BASE_URL}/${id}`);
  },

  async create(data: Partial<Movie>): Promise<ApiResponse<Movie>> {
    return apiPost<Movie, Partial<Movie>>(BASE_URL, data);
  },

  async update(id: string, data: Partial<Movie>): Promise<ApiResponse<Movie>> {
    return apiPatch<Movie, Partial<Movie>>(`${BASE_URL}/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiDelete<void>(`${BASE_URL}/${id}`);
  },

  async getByPhase(phase: Phase): Promise<ApiResponse<MovieListItem[]>> {
    return apiGet<MovieListItem[]>(`${BASE_URL}/phase/${encodeURIComponent(phase)}`);
  },

  async getTimeline(): Promise<ApiResponse<MovieTimeline[]>> {
    return apiGet<MovieTimeline[]>(`${BASE_URL}/timeline`);
  },
};
