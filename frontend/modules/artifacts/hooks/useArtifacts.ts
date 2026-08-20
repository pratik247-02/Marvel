"use client";

import { useState, useEffect, useCallback } from "react";
import { artifactService } from "../services/artifact.service";
import type { ArtifactListItem, Pagination, QueryParams } from "@/types";

export function useArtifacts(initialParams?: QueryParams) {
  const [artifacts, setArtifacts] = useState<ArtifactListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await artifactService.getAll(params);
      setArtifacts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch artifacts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // `initialParams` is typically an object literal from the caller, so it has a
  // new identity every render. Depending on it directly would refetch in a loop.
  // Serializing gives a stable primitive dep keyed on the actual values.
  const serializedParams = JSON.stringify(initialParams ?? {});

  useEffect(() => {
    fetchArtifacts(JSON.parse(serializedParams) as QueryParams);
  }, [fetchArtifacts, serializedParams]);

  return {
    artifacts,
    pagination,
    isLoading,
    error,
    refetch: fetchArtifacts,
  };
}
