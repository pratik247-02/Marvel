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

  // `initialParams` is typically an object literal from the caller, so it has a
  // new identity every render. Depending on it directly would refetch in a loop.
  // Serializing gives a stable primitive dep keyed on the actual values.
  const serializedParams = JSON.stringify(initialParams ?? {});

  useEffect(() => {
    fetchMovies(JSON.parse(serializedParams) as QueryParams);
  }, [fetchMovies, serializedParams]);

  return {
    movies,
    pagination,
    isLoading,
    error,
    refetch: fetchMovies,
  };
}
