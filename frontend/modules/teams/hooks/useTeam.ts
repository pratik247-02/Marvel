"use client";

import { useState, useEffect, useCallback } from "react";
import { teamService } from "../services/team.service";
import type { Team } from "@/types";

export function useTeam(id: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await teamService.getById(id);
      setTeam(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch team");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    team,
    isLoading,
    error,
    refetch: fetchTeam,
  };
}
