"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Users, MapPin } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { teamService } from "@/modules/teams";
import { useInfiniteList } from "@/modules/shared/useInfiniteList";
import { InfiniteSentinel } from "@/components/blocks/InfiniteSentinel";

const PAGE_SIZE = 12;

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // One request for the finished word rather than one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    items: teams,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
  } = useInfiniteList(teamService.getAll, {
    pageSize: PAGE_SIZE,
    sort: "name",
    search: debouncedSearch || undefined,
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "disbanded":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "reformed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <PageWrapper>
      <Container className="py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Teams</h1>
            {total > 0 && <span className="text-muted-foreground text-sm">{total}</span>}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search teams"
            />
          </div>
        </div>

        {/* Teams Grid */}
        {error ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-4">
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="mb-4 h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : teams.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team, index) => (
                <motion.div
                  key={team._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % PAGE_SIZE) * 0.04 }}
                >
                  <Link href={`/teams/${team._id}`}>
                    <Card interactive className="group h-full overflow-hidden">
                      <div className="relative aspect-video overflow-hidden">
                        {team.image ? (
                          <Image
                            src={team.image}
                            alt={team.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority={index < 3}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-green-600/20 to-emerald-900/40">
                            <Users className="h-16 w-16 text-green-500/50" />
                          </div>
                        )}
                        {team.logo && (
                          <div className="absolute top-3 left-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 p-2 backdrop-blur-sm">
                            <Image
                              src={team.logo}
                              alt={`${team.name} logo`}
                              fill
                              sizes="48px"
                              className="object-contain p-1"
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute right-3 bottom-3 left-3">
                          <h3 className="text-xl font-bold text-white transition-colors group-hover:text-green-400">
                            {team.name}
                          </h3>
                        </div>
                      </div>
                      <div className="p-4">
                        {team.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                            {team.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {team.status && (
                            <Badge className={getStatusColor(team.status)}>{team.status}</Badge>
                          )}
                          {team.headquarters && (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              {team.headquarters}
                            </span>
                          )}
                          {team.memberCount !== undefined && (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                              <Users className="h-3 w-3" />
                              {team.memberCount} members
                            </span>
                          )}
                        </div>
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
              endMessage={`All ${total} teams`}
            />
          </>
        ) : (
          <div className="py-12 text-center">
            <Users className="text-muted-foreground/50 mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground">
              {debouncedSearch ? `No teams match "${debouncedSearch}".` : "No teams found."}
            </p>
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
