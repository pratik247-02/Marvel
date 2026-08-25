"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gem, Sparkles } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Appearances } from "@/components/blocks/Appearances";
import { FactList } from "@/components/blocks/FactList";
import { Card } from "@/components/ui/Card";
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
    { label: "Status", value: artifact.status },
    artifact.origin && { label: "Origin", value: artifact.origin },
    artifact.holders?.length && { label: "Known Holders", value: artifact.holders.length.toString() },
    artifact.appearances?.length && { label: "Movie Appearances", value: artifact.appearances.length.toString() },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PageWrapper>
      <HeroBanner
        title={artifact.name}
        subtitle="MCU Antique"
        description={artifact.description}
        image={artifact.image}
        theme={{ colorPrimary: "#e74c3c" }}
      />

      <Container className="py-16">
        {/* Antique Details */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Image */}
          <div className="md:col-span-1">
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                {artifact.image ? (
                  <Image
                    src={artifact.image}
                    alt={artifact.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <Gem className="w-24 h-24 text-red-400/50" />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Info */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <Badge
                className="mb-4"
                style={{
                  backgroundColor: `${getStatusColor()}20`,
                  color: getStatusColor(),
                }}
              >
                {artifact.status}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{artifact.name}</h1>

              {artifact.origin && (
                <p className="text-muted-foreground mb-4">
                  <span className="font-medium">Origin:</span> {artifact.origin}
                </p>
              )}

              {artifact.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {artifact.description}
                </p>
              )}
            </div>

            {/* Powers */}
            {artifact.powers && artifact.powers.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-400" />
                  Powers & Abilities
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
          </div>
        </div>

        {/* Facts */}
        {facts.length > 0 && <FactList facts={facts} columns={4} title="Antique Details" />}

        {/* Holders */}
        {artifact.holders && artifact.holders.length > 0 && (
          <section className="mt-16">
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
