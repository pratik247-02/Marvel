"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, Swords } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { battleService } from "@/modules/battles";
import { useInfiniteList } from "@/modules/shared/useInfiniteList";
import { InfiniteSentinel } from "@/components/blocks/InfiniteSentinel";
import type { BattleSignificance } from "@/types";

const significanceLevels: { value: BattleSignificance | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "universe-altering", label: "Universe-Altering" },
];

const PAGE_SIZE = 12;

export default function BattlesPage() {
  const [search, setSearch] = useState("");
  const [selectedSignificance, setSelectedSignificance] = useState<BattleSignificance | "">("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // One request for the finished word rather than one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    items: battles,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
  } = useInfiniteList(battleService.getAll, {
    pageSize: PAGE_SIZE,
    sort: "movie",
    search: debouncedSearch || undefined,
    filters: { significance: selectedSignificance || undefined },
  });

  // Changing the filter restarts the list; the hook watches this value.
  const handleFilter = (value: string) => setSelectedSignificance(value as never);

  const getSignificanceColor = (significance: BattleSignificance) => {
    switch (significance) {
      case "minor":
        return "bg-blue-500/20 text-blue-400";
      case "major":
        return "bg-yellow-500/20 text-yellow-400";
      case "universe-altering":
        return "bg-red-500/20 text-red-400";
      default:
        return "";
    }
  };

  return (
    <PageWrapper>

      <Container className="py-10">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search battles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {significanceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => handleFilter(level.value)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  selectedSignificance === level.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Battles Grid */}
        {error ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : battles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {battles.map((battle, index) => (
              <motion.div
                key={battle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % PAGE_SIZE) * 0.04 }}
              >
                <Link href={`/battles/${battle._id}`}>
                  <Card interactive className="group h-full overflow-hidden">
                    <div className="relative flex h-48 items-center justify-center overflow-hidden bg-linear-to-br from-orange-500/20 to-red-500/20">
                      {battle.image ? (
                        <Image
                          src={battle.image}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          priority={index < 4}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <Swords className="h-16 w-16 text-orange-400/50" />
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className={getSignificanceColor(battle.significance)}>
                          {battle.significance}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {battle.name}
                      </h3>
                      {battle.movie && (
                        <p className="text-sm text-muted-foreground">
                          {battle.movie.title}
                        </p>
                      )}
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
              endMessage={`All ${total} battles`}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <Swords className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No battles found.</p>
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
