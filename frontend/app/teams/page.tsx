"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Users, MapPin } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useTeams } from "@/modules/teams";

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const { teams, isLoading, pagination, refetch } = useTeams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch({ search, page: 1 });
  };

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
      <HeroBanner
        title="Teams"
        subtitle="Marvel Teams & Organizations"
        description="Discover the legendary teams that protect (and threaten) the universe"
        theme={{ colorPrimary: "#2ecc71" }}
      />

      <Container className="py-16">
        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, index) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/teams/${team._id}`}>
                  <Card interactive className="group h-full overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      {team.image ? (
                        <Image
                          src={team.image}
                          alt={team.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-green-600/20 to-emerald-900/40 flex items-center justify-center">
                          <Users className="w-16 h-16 text-green-500/50" />
                        </div>
                      )}
                      {team.logo && (
                        <div className="absolute top-3 left-3 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center p-2">
                          <Image
                            src={team.logo}
                            alt={`${team.name} logo`}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-xl text-white group-hover:text-green-400 transition-colors">
                          {team.name}
                        </h3>
                      </div>
                    </div>
                    <div className="p-4">
                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {team.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {team.status && (
                          <Badge className={getStatusColor(team.status)}>
                            {team.status}
                          </Badge>
                        )}
                        {team.headquarters && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {team.headquarters}
                          </span>
                        )}
                        {team.memberCount !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
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
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No teams found.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => refetch({ search, page: i + 1 })}
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
