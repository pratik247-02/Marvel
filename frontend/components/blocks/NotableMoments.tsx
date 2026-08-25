import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BattleListItem } from "@/types";

/**
 * The battles a character fought in, as their record on the page.
 *
 * Derived entirely from the battle documents that already exist - who took
 * part, what the outcome was, who won - so this is a view over real data
 * rather than a "feats" field somebody would have to invent and maintain.
 *
 * Ordered by how much the fight mattered, then by film, so the entries that
 * justify the section come first rather than whatever the API returned first.
 */

const SIGNIFICANCE_RANK: Record<string, number> = {
  "universe-altering": 0,
  major: 1,
  minor: 2,
};

const SIGNIFICANCE_STYLE: Record<string, string> = {
  "universe-altering": "border-primary/40 bg-primary/10 text-primary",
  major: "border-secondary/40 bg-secondary/10 text-secondary",
  minor: "border-border bg-muted text-muted-foreground",
};

interface NotableMomentsProps {
  battles: BattleListItem[];
  /** Used to mark the fights this character came out of on top. */
  characterId: string;
  className?: string;
}

export function NotableMoments({
  battles,
  characterId,
  className,
}: NotableMomentsProps) {
  if (battles.length === 0) {
    return null;
  }

  const ordered = [...battles].sort((a, b) => {
    const bySignificance =
      (SIGNIFICANCE_RANK[a.significance ?? "minor"] ?? 2) -
      (SIGNIFICANCE_RANK[b.significance ?? "minor"] ?? 2);
    if (bySignificance !== 0) {
      return bySignificance;
    }
    return (a.movie?.releaseYear ?? 0) - (b.movie?.releaseYear ?? 0);
  });

  return (
    <section className={cn(className)}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold">Notable moments</h2>
        <span className="text-muted-foreground text-sm">
          {battles.length} {battles.length === 1 ? "battle" : "battles"}
        </span>
      </div>

      {/* Every battle, scrolled rather than truncated. This previously showed
          six and printed "and N more" as plain text, which read as a control
          but did nothing. The height cap matters because the section sits
          beside the biography column - an unbounded list would run past it. */}
      <ul className="max-h-112 space-y-2 overflow-y-auto pr-1">
        {ordered.map((battle) => {
          const won = battle.winner?._id === characterId;
          return (
            <li key={battle._id}>
              <Link
                href={`/battles/${battle._id}`}
                className="border-border hover:bg-accent flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 transition-colors"
              >
                <span className="font-medium">{battle.name}</span>

                {won && (
                  <span
                    className="text-secondary inline-flex items-center gap-1 text-xs font-semibold"
                    title="Won this fight"
                  >
                    <Trophy className="h-3 w-3" />
                    Won
                  </span>
                )}

                <span className="text-muted-foreground ml-auto flex items-center gap-3 text-sm">
                  {battle.movie?.title && (
                    <span className="hidden sm:inline">{battle.movie.title}</span>
                  )}
                  {battle.significance && (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                        SIGNIFICANCE_STYLE[battle.significance] ?? SIGNIFICANCE_STYLE.minor
                      )}
                    >
                      {battle.significance.replace("-", " ")}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
