"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { movieService } from "@/modules/movies";
import { useInfiniteList } from "@/modules/shared/useInfiniteList";
import { InfiniteSentinel } from "@/components/blocks/InfiniteSentinel";
import type { Phase } from "@/types";

const phases: Phase[] = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"];

const PAGE_SIZE = 24;

export default function MoviesPage() {
  const [search, setSearch] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<Phase | "">("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // One request for the finished word rather than one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    items: movies,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
  } = useInfiniteList(movieService.getAll, {
    pageSize: PAGE_SIZE,
    sort: "releaseYear",
    search: debouncedSearch || undefined,
    filters: { phase: selectedPhase || undefined },
  });

  // Changing the filter restarts the list; the hook watches this value.
  const handleFilter = (value: string) => setSelectedPhase(value as never);

  return (
    <PageWrapper>
      <Container className="py-10">
        {/* Search and Filters */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilter("")}
              className={`rounded-md px-4 py-2 text-sm transition-colors ${
                selectedPhase === ""
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-border hover:bg-accent border"
              }`}
            >
              All
            </button>
            {phases.map((phase) => (
              <button
                key={phase}
                onClick={() => handleFilter(phase)}
                className={`rounded-md px-4 py-2 text-sm transition-colors ${
                  selectedPhase === phase
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border-border hover:bg-accent border"
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {error ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[2/3]" />
                <div className="p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {movies.map((movie, index) => (
                <motion.div
                  key={movie._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % PAGE_SIZE) * 0.04 }}
                >
                  <Link href={`/movies/${movie._id}`}>
                    <Card interactive className="group overflow-hidden">
                      <div className="relative aspect-[2/3] overflow-hidden">
                        {movie.poster ? (
                          <Image
                            src={movie.poster}
                            alt={movie.title}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            priority={index < 4}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="bg-muted flex h-full w-full items-center justify-center">
                            <span className="text-muted-foreground px-2 text-center text-lg font-bold">
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
                        <h3 className="group-hover:text-primary line-clamp-2 font-semibold transition-colors">
                          {movie.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">{movie.releaseYear}</p>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            <InfiniteSentinel
              onVisible={loadMore}
              enabled={hasMore}
              isLoading={isLoadingMore}
              endMessage={`All ${total} movies`}
            />
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No movies found.</p>
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
