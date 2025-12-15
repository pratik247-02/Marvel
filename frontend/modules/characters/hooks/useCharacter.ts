"use client";

import { useState, useEffect, useCallback } from "react";
import { characterService } from "../services/character.service";
import type { Character } from "@/types";

export function useCharacter(id: string) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacter = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await characterService.getById(id);
      setCharacter(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch character");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  return {
    character,
    isLoading,
    error,
    refetch: fetchCharacter,
  };
}
