"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PaginatedResponse, QueryParams } from "@/types";

/**
 * A paginated list loaded a page at a time and appended, for infinite scroll.
 *
 * Generic over the item type and driven by whatever `getAll` is passed, because
 * every list service in the app has the same shape - characters, movies, teams,
 * battles and artifacts all take `QueryParams` and return a
 * `PaginatedResponse`. Copying the same hook five times would mean five places
 * to fix the next race condition.
 *
 * The caller owns the sentinel element and the observer; this owns the data.
 *
 * Sorting and filtering are server-side on purpose. Ordering each page as it
 * arrives would only sort within that page, so page two would start over at A.
 */

interface UseInfiniteListOptions {
  /** Enough to fill a tall screen, so the first scroll has somewhere to go. */
  pageSize?: number;
  /** Passed straight through to the API, which sorts in Mongo. */
  sort?: string;
  search?: string;
  /**
   * Extra query params - a phase, a status, a significance. Changing any value
   * restarts from page one, the same as a new search would.
   */
  filters?: Record<string, string | number | undefined>;
}

export function useInfiniteList<T>(
  getAll: (params?: QueryParams) => Promise<PaginatedResponse<T>>,
  { pageSize = 24, sort = "name", search, filters }: UseInfiniteListOptions = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  /** True only for the first page, so the grid can show skeletons not a spinner. */
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pages can resolve out of order, and any change to the query invalidates
  // everything already in flight. Only the newest request may write state.
  const requestId = useRef(0);
  // Stops the observer firing again while a page is still loading.
  const inFlight = useRef(false);

  // `getAll` is usually a method reference that is stable, but a caller could
  // pass an inline arrow. Holding it in a ref keeps it out of the dep array so
  // that would not restart the list on every render.
  const fetcher = useRef(getAll);
  fetcher.current = getAll;

  // `filters` is an object literal from the caller, so it has a new identity
  // every render. Serializing gives a stable primitive keyed on the values.
  const filterKey = JSON.stringify(filters ?? {});

  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
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
        const params: QueryParams = { page: targetPage, limit: pageSize, sort };
        if (search) {
          params.search = search;
        }
        for (const [key, value] of Object.entries(
          JSON.parse(filterKey) as Record<string, string | number | undefined>
        )) {
          if (value !== undefined && value !== "") {
            params[key] = value;
          }
        }

        const response = await fetcher.current(params);
        if (id !== requestId.current) {
          return;
        }

        setItems((current) => (replace ? response.data : [...current, ...response.data]));
        setTotal(response.pagination?.total ?? 0);
        setPage(targetPage);
        setHasMore(targetPage < (response.pagination?.pages ?? 0));
      } catch (err) {
        if (id === requestId.current) {
          setError(err instanceof Error ? err.message : "Could not load this list");
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
    [pageSize, sort, search, filterKey]
  );

  // Any change to search, sort or filters starts over from page one.
  useEffect(() => {
    setHasMore(true);
    load(1, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) {
      return;
    }
    load(page + 1, false);
  }, [hasMore, isLoading, isLoadingMore, load, page]);

  return { items, total, hasMore, isLoading, isLoadingMore, error, loadMore };
}
