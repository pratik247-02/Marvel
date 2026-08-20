"use client";

import { useState, useEffect, useCallback } from "react";
import { characterService } from "../services/character.service";
import type { CharacterListItem, Pagination, QueryParams } from "@/types";

export function useCharacters(initialParams?: QueryParams) {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = useCallback(async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await characterService.getAll(params);
      setCharacters(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch characters");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // `initialParams` is typically an object literal from the caller, so it has a
  // new identity every render. Depending on it directly would refetch in a loop.
  // Serializing gives a stable primitive dep keyed on the actual values.
  const serializedParams = JSON.stringify(initialParams ?? {});

  useEffect(() => {
    fetchCharacters(JSON.parse(serializedParams) as QueryParams);
  }, [fetchCharacters, serializedParams]);

  return {
    characters,
    pagination,
    isLoading,
    error,
    refetch: fetchCharacters,
  };
}
