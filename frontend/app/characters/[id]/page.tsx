"use client";

import { use } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { PowerStats } from "@/components/blocks/PowerStats";
import { Appearances } from "@/components/blocks/Appearances";
import { RelationshipGraph } from "@/components/blocks/RelationshipGraph";
import { FactList } from "@/components/blocks/FactList";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useCharacter } from "@/modules/characters";

interface CharacterPageProps {
  params: Promise<{ id: string }>;
}

export default function CharacterPage({ params }: CharacterPageProps) {
  const { id } = use(params);
  const { character, isLoading, error } = useCharacter(id);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Skeleton className="w-full h-[60vh]" />
        </div>
        <Container className="py-16">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !character) {
    return (
      <PageWrapper>
        <Container className="py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Character not found</h1>
          <p className="text-muted-foreground">{error || "Unable to load character"}</p>
        </Container>
      </PageWrapper>
    );
  }

  const facts = [
    character.alias && { label: "Alias", value: character.alias },
    character.powers?.length && { label: "Powers", value: character.powers.length.toString() },
    character.appearances?.length && { label: "Movie Appearances", value: character.appearances.length.toString() },
    character.artifactsUsed?.length && { label: "Artifacts Used", value: character.artifactsUsed.length.toString() },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageWrapper>
      <HeroBanner
        title={character.name}
        subtitle={character.alias}
        description={character.description}
        image={character.image}
        theme={character.theme}
      />

      <Container className="py-16">
        {/* Powers */}
        {character.powers && character.powers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Powers & Abilities</h2>
            <div className="flex flex-wrap gap-2">
              {character.powers.map((power, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm"
                  style={{
                    borderColor: character.theme?.colorPrimary,
                    color: character.theme?.colorPrimary,
                  }}
                >
                  {power}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Facts */}
        {facts.length > 0 && <FactList facts={facts} columns={4} />}

        {/* Stats */}
        {character.stats && <PowerStats stats={character.stats} theme={character.theme} />}

        {/* Appearances */}
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

        {/* Affiliations */}
        {character.affiliations && character.affiliations.length > 0 && (
          <RelationshipGraph
            characters={character.affiliations.map((char) => ({
              _id: char._id,
              id: char._id,
              name: char.name,
              alias: char.alias,
              image: char.image,
            }))}
            title="Affiliations"
            centerCharacter={{
              name: character.name,
              image: character.image,
            }}
          />
        )}
      </Container>
    </PageWrapper>
  );
}
