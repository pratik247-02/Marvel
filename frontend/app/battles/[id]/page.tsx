"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Users, Trophy } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Gallery } from "@/components/blocks/Gallery";
import { FactList } from "@/components/blocks/FactList";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBattle } from "@/modules/battles";

interface BattlePageProps {
  params: Promise<{ id: string }>;
}

export default function BattlePage({ params }: BattlePageProps) {
  const { id } = use(params);
  const { battle, isLoading, error } = useBattle(id);

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

  if (error || !battle) {
    return (
      <PageWrapper>
        <Container className="py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Battle not found</h1>
          <p className="text-muted-foreground">{error || "Unable to load battle"}</p>
        </Container>
      </PageWrapper>
    );
  }

  const getSignificanceColor = () => {
    switch (battle.significance) {
      case "minor":
        return "#3b82f6";
      case "major":
        return "#eab308";
      case "universe-altering":
        return "#ef4444";
      default:
        return "#f0a500";
    }
  };

  const facts = [
    battle.location && { label: "Location", value: battle.location },
    battle.casualties !== undefined && { label: "Casualties", value: battle.casualties.toString() },
    battle.significance && { label: "Significance", value: battle.significance },
    battle.movie && { label: "Movie", value: battle.movie.title },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageWrapper>
      <HeroBanner
        title={battle.name}
        subtitle={battle.movie?.title}
        description={battle.description}
        theme={{ colorPrimary: getSignificanceColor() }}
      />

      <Container className="py-16">
        {/* Battle Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <Badge
              className="mb-4"
              style={{
                backgroundColor: `${getSignificanceColor()}20`,
                color: getSignificanceColor(),
              }}
            >
              {battle.significance}
            </Badge>

            {battle.location && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-5 h-5" />
                <span>{battle.location}</span>
              </div>
            )}

            {battle.outcome && (
              <div className="bg-card border border-border rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Outcome
                </h3>
                <p className="text-muted-foreground">{battle.outcome}</p>
              </div>
            )}

            {battle.winner && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Winner</h3>
                <Link
                  href={`/characters/${battle.winner._id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500">
                    {battle.winner.image ? (
                      <Image
                        src={battle.winner.image}
                        alt={battle.winner.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-bold text-muted-foreground">
                          {battle.winner.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="group-hover:text-primary transition-colors">
                    {battle.winner.alias || battle.winner.name}
                  </span>
                </Link>
              </div>
            )}
          </div>

          {battle.movie && (
            <div>
              <h3 className="font-semibold mb-4">Featured In</h3>
              <Link href={`/movies/${battle.movie._id}`}>
                <Card className="group overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="relative aspect-video">
                    {battle.movie.poster ? (
                      <Image
                        src={battle.movie.poster}
                        alt={battle.movie.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-bold text-muted-foreground">
                          {battle.movie.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {battle.movie.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {battle.movie.releaseYear}
                    </p>
                  </div>
                </Card>
              </Link>
            </div>
          )}
        </div>

        {/* Facts */}
        {facts.length > 0 && <FactList facts={facts} columns={4} title="Battle Details" />}

        {/* Participants */}
        {battle.participants && battle.participants.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              Participants
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {battle.participants.map((character, index) => (
                <motion.div
                  key={character._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/characters/${character._id}`} className="group block">
                    <div className="relative aspect-square rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors mb-2">
                      {character.image ? (
                        <Image
                          src={character.image}
                          alt={character.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {character.name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-center group-hover:text-primary transition-colors line-clamp-2">
                      {character.alias || character.name}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {battle.images && battle.images.length > 0 && (
          <Gallery images={battle.images} title="Battle Gallery" className="mt-16" />
        )}
      </Container>
    </PageWrapper>
  );
}
