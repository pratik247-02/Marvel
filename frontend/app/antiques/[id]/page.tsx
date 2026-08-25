"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gem, Sparkles } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { DetailHeader } from "@/components/blocks/DetailHeader";
import { Appearances } from "@/components/blocks/Appearances";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useArtifact } from "@/modules/artifacts";

interface AntiquePageProps {
  params: Promise<{ id: string }>;
}

export default function AntiquePage({ params }: AntiquePageProps) {
  const { id } = use(params);
  const { artifact, isLoading, error } = useArtifact(id);

  if (isLoading) {
    return (
      <PageWrapper>
        <Container className="py-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
            <Skeleton className="aspect-square w-full shrink-0 rounded-xl sm:w-56 lg:w-64" />
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

  if (error || !artifact) {
    return (
      <PageWrapper>
        <Container className="py-32 text-center">
          <Gem className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold mb-4">Antique not found</h1>
          <p className="text-muted-foreground">{error || "Unable to load antique"}</p>
        </Container>
      </PageWrapper>
    );
  }

  const getStatusColor = () => {
    switch (artifact.status) {
      case "active":
        return "#22c55e";
      case "destroyed":
        return "#ef4444";
      case "lost":
        return "#eab308";
      case "unknown":
        return "#6b7280";
      default:
        return "#e74c3c";
    }
  };

  const facts = [
    artifact.origin && { label: "Origin", value: artifact.origin },
    artifact.holders?.length && { label: "Known Holders", value: artifact.holders.length.toString() },
    artifact.appearances?.length && { label: "Movie Appearances", value: artifact.appearances.length.toString() },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageWrapper>
      <DetailHeader
        title={artifact.name}
        eyebrow="MCU Antique"
        description={artifact.description}
        image={artifact.image}
        aspect="square"
        theme={{ colorPrimary: "#e74c3c" }}
        facts={facts}
      >
        <Badge
          style={{
            backgroundColor: `${getStatusColor()}20`,
            color: getStatusColor(),
          }}
        >
          {artifact.status}
        </Badge>
      </DetailHeader>

      <Container className="space-y-12 py-10">
        {/* Powers */}
        {artifact.powers && artifact.powers.length > 0 && (
          <div className="bg-card border-border rounded-lg border p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 text-red-400" />
              Powers &amp; abilities
            </h3>
            <ul className="space-y-2">
                  {artifact.powers.map((power, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2 text-muted-foreground"
                    >
                      <span className="text-red-400 mt-1">•</span>
                      {power}
                    </motion.li>
                  ))}
                </ul>
          </div>
        )}

        {/* Holders */}
        {artifact.holders && artifact.holders.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8 text-center">Known Holders</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {artifact.holders.map((holder, index) => (
                <motion.div
                  key={holder._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/characters/${holder._id}`} className="group block">
                    <div className="relative aspect-square rounded-full overflow-hidden border-2 border-border group-hover:border-red-500 transition-colors mb-2">
                      {holder.image ? (
                        <Image
                          src={holder.image}
                          alt={holder.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {holder.name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-center group-hover:text-red-400 transition-colors line-clamp-2">
                      {holder.alias || holder.name}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Appearances */}
        {artifact.appearances && artifact.appearances.length > 0 && (
          <Appearances
            movies={artifact.appearances.map((movie) => ({
              _id: movie._id,
              id: movie._id,
              title: movie.title,
              releaseYear: movie.releaseYear,
              phase: movie.phase,
              poster: movie.poster,
            }))}
            title="Movie Appearances"
            className="mt-16"
          />
        )}
      </Container>
    </PageWrapper>
  );
}
