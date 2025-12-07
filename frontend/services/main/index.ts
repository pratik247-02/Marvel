import { apiClient, type AxiosRequestConfig } from "./config";
import type { ApiResponse, ApiError } from "@/types";
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

export async function apiDelete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
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
