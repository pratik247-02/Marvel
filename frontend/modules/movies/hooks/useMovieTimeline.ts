"use client";

import { useState, useEffect, useCallback } from "react";
import { movieService } from "../services/movie.service";
import type { MovieTimeline } from "@/types";

export function useMovieTimeline() {
  const [timeline, setTimeline] = useState<MovieTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await movieService.getTimeline();
      setTimeline(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch timeline");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    timeline,
    isLoading,
    error,
    refetch: fetchTimeline,
  };
}
