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

  useEffect(() => {
    fetchArtifacts(initialParams);
  }, [fetchArtifacts, initialParams]);

  return {
    artifacts,
    pagination,
    isLoading,
    error,
    refetch: fetchArtifacts,
  };
}
