"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { CharacterHeader } from "@/components/blocks/CharacterHeader";
import { NotableMoments } from "@/components/blocks/NotableMoments";
import { Biography } from "@/components/blocks/Biography";
import { Appearances } from "@/components/blocks/Appearances";
import { ArtifactCard } from "@/components/blocks/ArtifactCard";
import { RelationshipGraph } from "@/components/blocks/RelationshipGraph";
import { Skeleton } from "@/components/ui/Skeleton";
import { EntityTheme } from "@/components/layout/EntityTheme";
import { useCharacter } from "@/modules/characters";
import { useCharacterStanding } from "@/modules/graph";
import { battleService } from "@/modules/battles";
import type { BattleListItem } from "@/types";

interface CharacterPageProps {
  params: Promise<{ id: string }>;
}

export default function CharacterPage({ params }: CharacterPageProps) {
  const { id } = use(params);
  const { character, isLoading, error } = useCharacter(id);
  const standing = useCharacterStanding(character?._id);

  // Battles are a separate request rather than being populated onto the
  // character, so a character with none simply renders nothing here.
  const [battles, setBattles] = useState<BattleListItem[]>([]);
  useEffect(() => {
    if (!character?._id) {
      return;
    }
    let cancelled = false;
    battleService
      .getByCharacter(character._id)
      .then((response) => {
        if (!cancelled) {
          setBattles(response.data ?? []);
        }
      })
      .catch(() => {
        // A missing battle list is not worth failing the page over.
        if (!cancelled) {
          setBattles([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [character?._id]);

  if (isLoading) {
    return (
      <PageWrapper>
        <Container className="py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <Skeleton className="aspect-[3/4] w-full shrink-0 rounded-xl sm:w-56 lg:w-60" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="hidden aspect-[3/4] w-full shrink-0 rounded-xl sm:w-56 lg:block lg:w-60" />
          </div>
          <div className="mt-10 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !character) {
    return (
      <PageWrapper>
        <Container className="py-32 text-center">
          <h1 className="mb-4 text-2xl font-bold">Character not found</h1>
          <p className="text-muted-foreground">{error || "Unable to load character"}</p>
          <Link
            href="/characters"
            className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            Back to characters
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <EntityTheme theme={character.theme}>
        <CharacterHeader character={character} standing={standing} />

        <Container className="space-y-12 py-10">
          {/* Biography is a column of prose and never fills the width, so the
              battles sit beside it rather than under a half-empty page.
              `items-start` keeps each column its own height - stretching them
              to match would pad whichever is shorter. */}
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <Biography bio={character.bio} characterName={character.name} />
            <NotableMoments battles={battles} characterId={character._id} />
          </div>

          {character.artifactsUsed && character.artifactsUsed.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">Artifacts wielded</h2>
              {/* The same card the antiques listing renders, so an artifact
                  looks like itself wherever you meet it. Centred and wrapped
                  rather than gridded: most characters wield one or two, and a
                  three-column grid left them stranded at the left edge. */}
              <div className="flex flex-wrap justify-center gap-6">
                {character.artifactsUsed.map((artifact) => (
                  <div
                    key={artifact._id}
                    className="w-full sm:w-[calc(50%-0.75rem)] lg:w-80"
                  >
                    <ArtifactCard
                      artifact={artifact}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {character.appearances && character.appearances.length > 0 && (
            <Appearances
              movies={character.appearances.map((movie) => ({
                _id: movie._id,
                id: movie._id,
                title: movie.title,
                releaseYear: movie.releaseYear,
                phase: movie.phase,
                poster: movie.poster,
              }))}
            />
          )}

          {character.affiliations && character.affiliations.length > 0 && (
            <div>
              <RelationshipGraph
                characters={character.affiliations.map((char) => ({
                  _id: char._id,
                  id: char._id,
                  name: char.name,
                  alias: char.alias,
                  image: char.image,
                }))}
                title="Connections"
              />

              {/* The detail page showed direct allies and stopped there. This
                  hands the reader to the traversal engine, centred on the
                  character they are already looking at - the one link on the
                  page that leads to the project's flagship, so it is a full
                  width action rather than a text link under a grid. */}
              {character.slug && (
                <Link
                  href={`/explore?focus=${character.slug}`}
                  className="group bg-entity text-on-entity mt-6 flex w-full items-center justify-between gap-4 rounded-xl px-6 py-5 transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      Explore {character.name}&apos;s full network
                    </span>
                    <span className="mt-0.5 block text-sm opacity-80">
                      Trace the shortest path from {character.name} to anyone
                      else in the MCU
                    </span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current/40 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )}
            </div>
          )}
        </Container>
      </EntityTheme>
    </PageWrapper>
  );
}
