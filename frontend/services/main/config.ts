import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import { APP_CONFIG } from "@/config";

const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or refresh token
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
export type { AxiosRequestConfig };
