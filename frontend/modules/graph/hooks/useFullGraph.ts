"use client";

import { useState, useEffect, useCallback } from "react";
import { graphService } from "../services/graph.service";
import type { FullGraph } from "@/types";

/** Load the whole graph once, for the explorer view. */
export function useFullGraph() {
  const [graph, setGraph] = useState<FullGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await graphService.getFullGraph();
      setGraph(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the graph");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return { graph, isLoading, error, refetch: fetchGraph };
}
