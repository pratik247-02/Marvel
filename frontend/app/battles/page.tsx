"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Swords } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBattles } from "@/modules/battles";
import type { BattleSignificance } from "@/types";

const significanceLevels: { value: BattleSignificance | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "universe-altering", label: "Universe-Altering" },
];

export default function BattlesPage() {
  const [search, setSearch] = useState("");
  const [selectedSignificance, setSelectedSignificance] = useState<BattleSignificance | "">("");
  const { battles, isLoading, pagination, refetch } = useBattles();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch({ search, significance: selectedSignificance || undefined, page: 1 });
  };

  const handleSignificanceFilter = (significance: BattleSignificance | "") => {
    setSelectedSignificance(significance);
    refetch({ search, significance: significance || undefined, page: 1 });
  };

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
      <HeroBanner
        title="Battles"
        subtitle="Epic MCU Confrontations"
        description="Relive the most iconic battles in the Marvel Cinematic Universe"
        theme={{ colorPrimary: "#f0a500" }}
      />

      <Container className="py-16">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <form onSubmit={handleSearch} className="flex-1">
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
          </form>

          <div className="flex flex-wrap gap-2">
            {significanceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => handleSignificanceFilter(level.value)}
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
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {battles.map((battle, index) => (
              <motion.div
                key={battle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/battles/${battle._id}`}>
                  <Card className="group overflow-hidden hover:border-primary/50 transition-colors h-full">
                    <div className="relative h-48 bg-linear-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                      <Swords className="w-16 h-16 text-orange-400/50" />
                      <div className="absolute top-2 right-2">
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
        ) : (
          <div className="text-center py-12">
            <Swords className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No battles found.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => refetch({ search, significance: selectedSignificance || undefined, page: i + 1 })}
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
