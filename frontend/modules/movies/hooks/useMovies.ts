"use client";

import { useState, useEffect, useCallback } from "react";
import { movieService } from "../services/movie.service";
import type { MovieListItem, Pagination, QueryParams } from "@/types";

export function useMovies(initialParams?: QueryParams) {
  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await movieService.getAll(params);
      setMovies(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch movies");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies(initialParams);
  }, [fetchMovies, initialParams]);

  return {
    movies,
    pagination,
    isLoading,
    error,
    refetch: fetchMovies,
  };
}
