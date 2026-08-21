"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMovies } from "@/modules/movies";
import type { Phase } from "@/types";

const phases: Phase[] = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"];

export default function MoviesPage() {
  const [search, setSearch] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<Phase | "">("");
  const { movies, isLoading, pagination, refetch } = useMovies();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch({ search, phase: selectedPhase || undefined, page: 1 });
  };

  const handlePhaseFilter = (phase: Phase | "") => {
    setSelectedPhase(phase);
    refetch({ search, phase: phase || undefined, page: 1 });
  };

  return (
    <PageWrapper>
      <HeroBanner
        title="Movies"
        subtitle="MCU Film Saga"
        description="Journey through the complete Marvel Cinematic Universe timeline"
        theme={{ colorPrimary: "#518cca" }}
      />

      <Container className="py-16">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePhaseFilter("")}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                selectedPhase === ""
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-accent"
              }`}
            >
              All
            </button>
            {phases.map((phase) => (
              <button
                key={phase}
                onClick={() => handlePhaseFilter(phase)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  selectedPhase === phase
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[2/3]" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie, index) => (
              <motion.div
                key={movie._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/movies/${movie._id}`}>
                  <Card interactive className="group overflow-hidden">
                    <div className="relative aspect-[2/3] overflow-hidden">
                      {movie.poster ? (
                        <Image
                          src={movie.poster}
                          alt={movie.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-lg font-bold text-muted-foreground text-center px-2">
                            {movie.title}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {movie.phase}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {movie.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {movie.releaseYear}
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No movies found.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => refetch({ search, phase: selectedPhase || undefined, page: i + 1 })}
                className={`px-4 py-2 rounded-md transition-colors ${
                  pagination.page === i + 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
