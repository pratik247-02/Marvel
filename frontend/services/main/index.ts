import { apiClient, type AxiosRequestConfig } from "./config";
import type { ApiResponse, PaginatedResponse, ApiError } from "@/types";
import { AxiosError } from "axios";

type RequestConfig = Omit<AxiosRequestConfig, "url" | "method" | "data">;

export async function apiGet<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * GET a list endpoint that returns the paginated envelope
 * (`{ success, data: T[], pagination }`) rather than `{ success, data }`.
 *
 * The API sends `pagination.totalPages`, while the client type uses `pages`;
 * both are normalized here so callers get a consistent shape.
 */
export async function apiGetPaginated<T>(
  url: string,
  config?: RequestConfig
): Promise<PaginatedResponse<T>> {
  try {
    const response = await apiClient.get<PaginatedResponse<T> & {
      pagination?: { totalPages?: number };
    }>(url, config);
    const { data, pagination } = response.data;

    return {
      success: true,
      data: data ?? [],
      pagination: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 10,
        total: pagination?.total ?? 0,
        pages: pagination?.pages ?? pagination?.totalPages ?? 0,
      },
    };
  } catch (error) {
    throw handleApiError(error);
  }
}

export async function apiPost<T, D = unknown>(
  url: string,
  data?: D,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

export async function apiPut<T, D = unknown>(
  url: string,
  data?: D,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

export async function apiPatch<T, D = unknown>(
  url: string,
  data?: D,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * DELETE permits a request body (`config.data`) - some routes, such as
 * `DELETE /teams/:id/members`, identify the target in the body rather than
 * the URL.
 */
export async function apiDelete<T>(
  url: string,
  config?: RequestConfig & { data?: unknown }
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

function handleApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "An error occurred",
      errors: error.response?.data?.errors,
    };
  }
  return {
    success: false,
    message: "An unexpected error occurred",
  };
}

export { apiClient } from "./config";
