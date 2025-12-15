"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, Star, DollarSign } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { FactList } from "@/components/blocks/FactList";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMovie } from "@/modules/movies";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default function MoviePage({ params }: MoviePageProps) {
  const { id } = use(params);
  const { movie, isLoading, error } = useMovie(id);

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

  if (error || !movie) {
    return (
      <PageWrapper>
        <Container className="py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <p className="text-muted-foreground">{error || "Unable to load movie"}</p>
        </Container>
      </PageWrapper>
    );
  }

  const facts = [
    { label: "Release Year", value: movie.releaseYear.toString() },
    { label: "Phase", value: movie.phase },
    movie.director && { label: "Director", value: movie.director },
    movie.runtime && { label: "Runtime", value: `${movie.runtime} min` },
    movie.rating && { label: "Rating", value: `${movie.rating}/10` },
    movie.boxOffice && { label: "Box Office", value: `$${(movie.boxOffice / 1000000).toFixed(0)}M` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageWrapper>
      <HeroBanner
        title={movie.title}
        subtitle={movie.phase}
        description={movie.synopsis}
        image={movie.poster}
        theme={{ colorPrimary: "#518cca" }}
      />

      <Container className="py-16">
        {/* Movie Details */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Poster */}
          <div className="md:col-span-1">
            <Card className="overflow-hidden">
              <div className="relative aspect-2/3">
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-muted-foreground text-center px-4">
                      {movie.title}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Info */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <Badge variant="outline" className="mb-4">
                {movie.phase}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {movie.releaseYear}
                </span>
                {movie.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {movie.runtime} min
                  </span>
                )}
                {movie.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {movie.rating}/10
                  </span>
                )}
                {movie.boxOffice && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    ${(movie.boxOffice / 1000000).toFixed(0)}M
                  </span>
                )}
              </div>

              {movie.synopsis && (
                <p className="text-muted-foreground leading-relaxed">
                  {movie.synopsis}
                </p>
              )}
            </div>

            {movie.director && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Director</h3>
                <p className="text-lg">{movie.director}</p>
              </div>
            )}
          </div>
        </div>

        {/* Facts */}
        <FactList facts={facts} columns={3} title="Movie Details" />

        {/* Characters */}
        {movie.characters && movie.characters.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Featured Characters</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {movie.characters.map((character, index) => (
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
      </Container>
    </PageWrapper>
  );
}
