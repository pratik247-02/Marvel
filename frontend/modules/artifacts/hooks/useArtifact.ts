"use client";

import { useState, useEffect, useCallback } from "react";
import { artifactService } from "../services/artifact.service";
import type { Artifact } from "@/types";

export function useArtifact(id: string) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifact = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await artifactService.getById(id);
      setArtifact(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch artifact");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArtifact();
  }, [fetchArtifact]);

  return {
    artifact,
    isLoading,
    error,
    refetch: fetchArtifact,
  };
}
