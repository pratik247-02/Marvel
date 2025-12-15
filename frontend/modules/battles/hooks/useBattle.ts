"use client";

import { useState, useEffect, useCallback } from "react";
import { battleService } from "../services/battle.service";
import type { Battle } from "@/types";

export function useBattle(id: string) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBattle = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await battleService.getById(id);
      setBattle(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch battle");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBattle();
  }, [fetchBattle]);

  return {
    battle,
    isLoading,
    error,
    refetch: fetchBattle,
  };
}
