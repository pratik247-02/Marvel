"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { characterService } from "../services/character.service";
import type { CharacterListItem, QueryParams } from "@/types";

/**
 * Characters loaded a page at a time and appended, for infinite scroll.
 *
 * Separate from `useCharacters` rather than a flag on it, because the two
 * differ in the one thing that matters: this appends to the list where the
 * other replaces it. Folding both into one hook would mean every caller
 * carrying a mode it does not use.
 *
 * The caller owns the sentinel element and the observer; this owns the data.
 */
export function useInfiniteCharacters(pageSize = 24, search?: string, sort = "name") {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  /** True only for the first page, so the grid can show skeletons rather than a spinner. */
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pages can resolve out of order, and a search change invalidates everything
  // already in flight. Only the newest request may write state.
  const requestId = useRef(0);
  // Guards against the observer firing again while a page is still loading.
  const inFlight = useRef(false);

  const load = useCallback(
    async (targetPage: number, term: string | undefined, replace: boolean) => {
      if (inFlight.current) {
        return;
      }
      inFlight.current = true;

      const id = ++requestId.current;
      if (replace) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        // Sorting has to be server-side. Ordering each page as it arrives
        // would only sort within that page, so page two would start over at A.
        const params: QueryParams = { page: targetPage, limit: pageSize, sort };
        if (term) {
          params.search = term;
        }
        const response = await characterService.getAll(params);

        if (id !== requestId.current) {
          return;
        }

        setCharacters((current) =>
          replace ? response.data : [...current, ...response.data]
        );
        setTotal(response.pagination?.total ?? 0);
        setPage(targetPage);
        setHasMore(targetPage < (response.pagination?.pages ?? 0));
      } catch (err) {
        if (id === requestId.current) {
          setError(err instanceof Error ? err.message : "Could not load characters");
          setHasMore(false);
        }
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
        inFlight.current = false;
      }
    },
    [pageSize, sort]
  );

  // A new search term or sort order starts over from page one. `load` already
  // depends on sort, so changing it re-runs this.
  useEffect(() => {
    setHasMore(true);
    load(1, search, true);
  }, [load, search]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) {
      return;
    }
    load(page + 1, search, false);
  }, [hasMore, isLoading, isLoadingMore, load, page, search]);

  return {
    characters,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
  };
}
