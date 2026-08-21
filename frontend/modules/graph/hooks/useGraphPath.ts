"use client";

import { useState, useCallback } from "react";
import { graphService } from "../services/graph.service";
import type { GraphPathResult } from "@/types";

/**
 * Find a path between two characters.
 *
 * Deliberately imperative rather than fetching on mount: the user picks two
 * characters and asks, so the request belongs to that action.
 */
export function useGraphPath() {
  const [result, setResult] = useState<GraphPathResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findPath = useCallback(
    async (from: string, to: string, mode: "weighted" | "hops" = "weighted") => {
      if (!from || !to) {
        setError("Pick two characters first");
        return null;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await graphService.getPath(from, to, mode);
        setResult(response.data);
        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not find a path";
        setError(message);
        setResult(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, findPath, reset };
}
