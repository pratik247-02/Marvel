// TODO: Uncomment when api service is configured
// import { api } from "@/services/main";
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

// const BASE_URL = "/quiz";

export const quizService = {
  async getAll(_params?: QueryParams): Promise<PaginatedResponse<QuizListItem>> {
    // TODO: return api.get(BASE_URL, { params });
    return { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  async getById(_id: string): Promise<ApiResponse<Quiz>> {
    // TODO: return api.get(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async getForPlay(_id: string): Promise<ApiResponse<QuizForPlay>> {
    // TODO: return api.get(`${BASE_URL}/${id}/play`);
    throw new Error("Not implemented");
  },

  async getActive(): Promise<ApiResponse<QuizForPlay>> {
    // TODO: return api.get(`${BASE_URL}/active`);
    throw new Error("Not implemented");
  },

  async create(_data: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    // TODO: return api.post(BASE_URL, data);
    throw new Error("Not implemented");
  },

  async update(_id: string, _data: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    // TODO: return api.patch(`${BASE_URL}/${id}`, data);
    throw new Error("Not implemented");
  },

  async delete(_id: string): Promise<void> {
    // TODO: return api.delete(`${BASE_URL}/${id}`);
    throw new Error("Not implemented");
  },

  async submit(_id: string, _answers: QuizAnswers): Promise<ApiResponse<QuizResult>> {
    // TODO: return api.post(`${BASE_URL}/${id}/submit`, { answers });
    throw new Error("Not implemented");
  },
};
