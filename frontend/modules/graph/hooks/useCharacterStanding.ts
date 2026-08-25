"use client";

import { useState, useEffect } from "react";
import { graphService } from "../services/graph.service";

/**
 * Where one character sits in the connection graph.
 *
 * Reads the same `/graph/stats` the explore page uses and finds this character
 * in the ranking, rather than adding an endpoint. The stats response is a
 * single cached snapshot, so asking for it here costs nothing beyond the
 * request - and the whole point is that the detail page currently ignores the
 * project's flagship feature entirely.
 *
 * Returns null rather than throwing when the character is outside the returned
 * ranking, so the caller renders two stats instead of three.
 */
export function useCharacterStanding(characterId?: string) {
  const [standing, setStanding] = useState<{
    degree: number;
    rank: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!characterId) {
      return;
    }
    let cancelled = false;

    graphService
      .getStats(500)
      .then((response) => {
        if (cancelled) {
          return;
        }
        const ranked = response.data.mostConnected ?? [];
        const index = ranked.findIndex((node) => node.id === characterId);
        if (index === -1) {
          setStanding(null);
          return;
        }
        setStanding({
          degree: ranked[index].degree,
          rank: index + 1,
          total: response.data.nodeCount,
        });
      })
      .catch(() => {
        // The standing is an enhancement; a failure here should not take the
        // page down or surface an error for something nobody asked for.
        if (!cancelled) {
          setStanding(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  return standing;
}
