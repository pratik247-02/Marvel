import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from "@/services/main";
import type {
  Quiz,
  QuizListItem,
  QuizForPlay,
  QuizResult,
  QuizAnswers,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
} from "@/types";

const BASE_URL = "/quiz";

export const quizService = {
  async getAll(params?: QueryParams): Promise<PaginatedResponse<QuizListItem>> {
    return apiGetPaginated<QuizListItem>(BASE_URL, { params });
  },

  async getById(id: string): Promise<ApiResponse<Quiz>> {
    return apiGet<Quiz>(`${BASE_URL}/${id}`);
  },

  async getForPlay(id: string): Promise<ApiResponse<QuizForPlay>> {
    return apiGet<QuizForPlay>(`${BASE_URL}/${id}/play`);
  },

  async getActive(): Promise<ApiResponse<QuizForPlay>> {
    return apiGet<QuizForPlay>(`${BASE_URL}/active`);
  },

  async create(data: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    return apiPost<Quiz, Partial<Quiz>>(BASE_URL, data);
  },

  async update(id: string, data: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    return apiPatch<Quiz, Partial<Quiz>>(`${BASE_URL}/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiDelete<void>(`${BASE_URL}/${id}`);
  },

  async submit(id: string, answers: QuizAnswers): Promise<ApiResponse<QuizResult>> {
    return apiPost<QuizResult, { answers: QuizAnswers }>(`${BASE_URL}/${id}/submit`, {
      answers,
    });
  },
};
