"use client";

import Image from "next/image";
import { EntityPortrait } from "./EntityPortrait";
import type { Character, Movie } from "@/types";

/**
 * The top of a character page: who they are, who played them, and where they
 * sit in the graph.
 *
 * Two portraits of equal weight - the character and the performer - with the
 * written detail between them. The actor was previously a 44px circle tucked
 * under the stats, which read as a footnote rather than half the answer to
 * "who is this".
 *
 * The middle column cannot be `description` alone: those run ~110 characters,
 * so a single sentence between two 15rem portraits leaves an obvious hole.
 * Everything below the description is derived from relations already loaded on
 * this page - span of appearances, phases, debut, artifacts - so the column
 * fills with facts rather than filler, and nothing here is scored or invented.
 */

interface CharacterHeaderProps {
  character: Character;
  /** Degree and rank from the graph, once loaded. Absent while fetching. */
  standing?: { degree: number; rank: number; total: number } | null;
}

export function CharacterHeader({ character, standing }: CharacterHeaderProps) {
  const appearances = character.appearances ?? [];
  const facts = buildFacts(character, appearances);

  return (
    <header className="border-border border-b">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/* Character portrait. */}
          <figure className="shrink-0">
            <div
              className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:w-56 lg:w-60"
              style={{
                boxShadow: `0 0 0 1px ${character.theme?.colorPrimary ?? "hsl(var(--border))"}40`,
              }}
            >
              <EntityPortrait
                name={character.name}
                image={character.image}
                theme={character.theme}
                sizes="(min-width: 640px) 240px, 100vw"
                priority
              />
            </div>
            <figcaption className="text-muted-foreground mt-2 text-center text-xs tracking-wide uppercase">
              Character
            </figcaption>
          </figure>

          {/* The written detail, between the two faces. */}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {character.name}
            </h1>
            {character.alias && (
              <p
                className="mt-1 text-lg font-semibold"
                style={{ color: character.theme?.colorPrimary ?? undefined }}
              >
                {character.alias}
              </p>
            )}

            {/* Powers sit here rather than in a section of their own further
                down. They are four short strings - as a full-width section
                they were a heading over a single line of chips, while the
                space beside the name sat empty. */}
            {character.powers && character.powers.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {character.powers.map((power) => (
                  <li
                    key={power}
                    className="border-border/80 bg-muted/40 rounded-full border px-3 py-1 text-xs font-medium"
                  >
                    {power}
                  </li>
                ))}
              </ul>
            )}

            {/* The wiki lede, falling back to the curated one-liner for the
                one character the fetch could not resolve. The remaining
                paragraphs render as the Biography section further down. */}
            {(character.bio?.lede || character.description) && (
              <p className="mt-4 leading-relaxed">
                {character.bio?.lede ?? character.description}
              </p>
            )}

            {facts.length > 0 && (
              <dl className="border-border/60 mt-5 grid gap-x-8 gap-y-3 border-t pt-5 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Films and allies were dropped: the appearances grid and the
                connections section below already show both, at full size.
                Graph rank has no such counterpart on the page, so it stays -
                and renders only once the stats request resolves. */}
            {standing && (
              <div className="border-border/60 mt-5 border-t pt-5">
                <Stat
                  label="most connected"
                  value={`#${standing.rank}`}
                  title={`${standing.degree} connections, ranked ${standing.rank} of ${standing.total}`}
                />
              </div>
            )}
          </div>

          {/* The performer, at the same size as the character. */}
          {character.actor?.name && (
            <figure className="shrink-0">
              <div className="border-border relative aspect-[3/4] w-full overflow-hidden rounded-xl border sm:w-56 lg:w-60">
                {character.actor.photo ? (
                  <Image
                    src={character.actor.photo}
                    alt={character.actor.name}
                    fill
                    sizes="(min-width: 640px) 240px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <span className="text-muted-foreground text-4xl font-bold">
                      {character.actor.name[0]}
                    </span>
                  </div>
                )}
              </div>
              <figcaption className="mt-2 text-center">
                <span className="text-muted-foreground block text-xs tracking-wide uppercase">
                  Played by
                </span>
                <span className="mt-0.5 block text-sm font-semibold">
                  {character.actor.name}
                </span>
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Facts worth printing, skipping any the data cannot support.
 *
 * `appearances` arrives in curated order rather than sorted, so debut and span
 * are computed from release years instead of trusting position.
 */
function buildFacts(character: Character, appearances: Movie[]) {
  const facts: { label: string; value: string }[] = [];

  const years = appearances
    .map((movie) => movie.releaseYear)
    .filter((year): year is number => typeof year === "number")
    .sort((a, b) => a - b);

  const debut = appearances.find((movie) => movie.releaseYear === years[0]);
  if (debut?.title) {
    facts.push({
      label: "First appearance",
      value: years[0] ? `${debut.title} (${years[0]})` : debut.title,
    });
  }

  if (years.length > 1) {
    const latest = years[years.length - 1];
    facts.push({
      label: "Active across",
      value:
        years[0] === latest ? `${latest}` : `${years[0]} – ${latest}`,
    });
  }

  // Only worth saying when the credit differs from the name we display -
  // otherwise it repeats the heading back at the reader.
  const creditedAs = character.actor?.creditedAs;
  if (
    creditedAs &&
    creditedAs !== character.name &&
    creditedAs !== character.alias
  ) {
    facts.push({ label: "Credited as", value: creditedAs });
  }

  return facts;
}

function Stat({
  label,
  value,
  title,
}: {
  label: string;
  value: string | number;
  title?: string;
}) {
  return (
    <div title={title}>
      <dd className="text-2xl font-bold tabular-nums">{value}</dd>
      <dt className="text-muted-foreground text-xs">{label}</dt>
    </div>
  );
}
