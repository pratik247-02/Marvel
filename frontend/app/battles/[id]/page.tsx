"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Trophy } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { DetailHeader } from "@/components/blocks/DetailHeader";
import { Gallery } from "@/components/blocks/Gallery";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBattle } from "@/modules/battles";

interface BattlePageProps {
  params: Promise<{ id: string }>;
}

export default function BattlePage({ params }: Readonly<BattlePageProps>) {
  const { id } = use(params);
  const { battle, isLoading, error } = useBattle(id);

  if (isLoading) {
    return (
      <PageWrapper>
        <Container className="py-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
            <Skeleton className="aspect-2/3 w-full shrink-0 rounded-xl sm:w-56 lg:w-64" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </Container>
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
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageWrapper>
      {/* Most battles have no art of their own and borrow the poster of the
          film they happened in - which was previously buried in a side card
          below. The frame follows the source: a wiki battle image is a wide
          film still, a poster is 2:3, and cropping either to the other's
          shape is what makes these look broken. */}
      <DetailHeader
        title={battle.name}
        eyebrow={battle.movie?.title}
        description={battle.description}
        image={battle.image ?? battle.movie?.poster}
        imageAlt={
          battle.imageOrigin === "wiki"
            ? battle.name
            : battle.movie
              ? `${battle.movie.title} poster`
              : undefined
        }
        aspect={battle.imageOrigin === "wiki" ? "square" : "poster"}
        theme={{ colorPrimary: getSignificanceColor() }}
        facts={facts}
      >
        {battle.significance && (
          <Badge
            style={{
              backgroundColor: `${getSignificanceColor()}20`,
              color: getSignificanceColor(),
            }}
          >
            {battle.significance.replace("-", " ")}
          </Badge>
        )}
      </DetailHeader>

      <Container className="space-y-12 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
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
                        sizes="64px"
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
              <h3 className="mb-3 font-semibold">Featured in</h3>
              <Link
                href={`/movies/${battle.movie._id}`}
                className="border-border hover:border-primary/50 hover:bg-accent/40 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors"
              >
                <span>
                  <span className="block font-medium">{battle.movie.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {battle.movie.releaseYear}
                  </span>
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Participants */}
        {battle.participants && battle.participants.length > 0 && (
          <section>
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
