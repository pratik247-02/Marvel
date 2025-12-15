"use client";

import { useState, useEffect, useCallback } from "react";
// import { movieService } from "../services/movie.service";
import type { Movie } from "@/types";

export function useMovie(id: string) {
  const [movie, _setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovie = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      // const response = await movieService.getById(id);
      // setMovie(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch movie");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  return {
    movie,
    isLoading,
    error,
    refetch: fetchMovie,
  };
}
