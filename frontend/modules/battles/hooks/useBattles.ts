"use client";

import { useState, useEffect, useCallback } from "react";
import { battleService } from "../services/battle.service";
import type { BattleListItem, Pagination, QueryParams } from "@/types";

export function useBattles(initialParams?: QueryParams) {
  const [battles, setBattles] = useState<BattleListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBattles = useCallback(async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await battleService.getAll(params);
      setBattles(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch battles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // `initialParams` is typically an object literal from the caller, so it has a
  // new identity every render. Depending on it directly would refetch in a loop.
  // Serializing gives a stable primitive dep keyed on the actual values.
  const serializedParams = JSON.stringify(initialParams ?? {});

  useEffect(() => {
    fetchBattles(JSON.parse(serializedParams) as QueryParams);
  }, [fetchBattles, serializedParams]);

  return {
    battles,
    pagination,
    isLoading,
    error,
    refetch: fetchBattles,
  };
}
