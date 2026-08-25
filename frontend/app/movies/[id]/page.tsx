"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { DetailHeader } from "@/components/blocks/DetailHeader";
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
        <Container className="py-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
            <Skeleton className="aspect-2/3 w-full shrink-0 rounded-xl sm:w-56 lg:w-64" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
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
      <DetailHeader
        title={movie.title}
        eyebrow={movie.phase}
        description={movie.synopsis}
        image={movie.poster}
        imageAlt={`${movie.title} poster`}
        aspect="poster"
        theme={{ colorPrimary: "#518cca" }}
        facts={facts}
      />

      <Container className="space-y-12 py-10">
        {/* Characters */}
        {movie.characters && movie.characters.length > 0 && (
          <section>
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
                          sizes="96px"
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
