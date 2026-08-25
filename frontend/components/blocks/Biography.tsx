"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CharacterBio } from "@/types";

/**
 * The character's biography, minus the lede.
 *
 * The header already prints `bio.lede`, so this renders paragraphs 2..n and
 * nothing at all for the many characters whose wiki page is a single
 * paragraph. That keeps the section honest: it appears when there is more to
 * say, rather than as an empty heading.
 *
 * Length varies by an order of magnitude - Goose has one paragraph, Thor has
 * eight totalling ~5900 characters - so anything past the first two is behind
 * a toggle. A wall of text under a portrait is not a reading experience, and
 * clamping every character to the same height would truncate the ones people
 * actually came to read.
 *
 * The attribution line is a licence condition, not decoration: the MCU wiki
 * is CC-BY-SA.
 */

interface BiographyProps {
  bio?: CharacterBio;
  characterName: string;
  /** Paragraphs shown before the toggle appears. */
  visible?: number;
  className?: string;
}

export function Biography({
  bio,
  characterName,
  visible = 2,
  className,
}: BiographyProps) {
  const [expanded, setExpanded] = useState(false);

  // Paragraph 0 is the lede, already rendered in the header.
  const rest = bio?.paragraphs?.slice(1) ?? [];
  if (rest.length === 0) {
    return null;
  }

  const shown = expanded ? rest : rest.slice(0, visible);
  const hidden = rest.length - shown.length;

  return (
    <section className={cn(className)}>
      <h2 className="mb-4 text-xl font-bold">Biography</h2>

      <div className="max-w-3xl space-y-4 leading-relaxed">
        {shown.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          Read the rest of {characterName}&apos;s story
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {bio?.source && (
        <p className="text-muted-foreground mt-6 text-xs">
          Biography adapted from{" "}
          <a
            href={bio.source}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {bio.sourceTitle ?? "the MCU Wiki"}
          </a>{" "}
          on the Marvel Cinematic Universe Wiki, licensed under CC-BY-SA.
        </p>
      )}
    </section>
  );
}
