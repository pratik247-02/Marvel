"use client";

import { useState, useEffect, useCallback } from "react";
import { teamService } from "../services/team.service";
import type { TeamListItem, Pagination, QueryParams } from "@/types";

export function useTeams(initialParams?: QueryParams) {
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await teamService.getAll(params);
      setTeams(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // `initialParams` is typically an object literal from the caller, so it has a
  // new identity every render. Depending on it directly would refetch in a loop.
  // Serializing gives a stable primitive dep keyed on the actual values.
  const serializedParams = JSON.stringify(initialParams ?? {});

  useEffect(() => {
    fetchTeams(JSON.parse(serializedParams) as QueryParams);
  }, [fetchTeams, serializedParams]);

  return {
    teams,
    pagination,
    isLoading,
    error,
    refetch: fetchTeams,
  };
}
