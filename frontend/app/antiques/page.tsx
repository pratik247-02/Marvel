"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Gem } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useArtifacts } from "@/modules/artifacts";
import type { ArtifactStatus } from "@/types";

const statusOptions: { value: ArtifactStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "destroyed", label: "Destroyed" },
  { value: "lost", label: "Lost" },
  { value: "unknown", label: "Unknown" },
];

export default function AntiquesPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ArtifactStatus | "">("");
  const { artifacts, isLoading, pagination, refetch } = useArtifacts();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch({ search, status: selectedStatus || undefined, page: 1 });
  };

  const handleStatusFilter = (status: ArtifactStatus | "") => {
    setSelectedStatus(status);
    refetch({ search, status: status || undefined, page: 1 });
  };

  const getStatusColor = (status: ArtifactStatus) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "destroyed":
        return "bg-red-500/20 text-red-400";
      case "lost":
        return "bg-yellow-500/20 text-yellow-400";
      case "unknown":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "";
    }
  };

  return (
    <PageWrapper>
      <HeroBanner
        title="Antiques"
        subtitle="Powerful Items & Relics"
        description="Discover the most powerful antiques in the Marvel Cinematic Universe"
        theme={{ colorPrimary: "#e74c3c" }}
      />

      <Container className="py-16">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search antiques..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusFilter(option.value)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  selectedStatus === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Antiques Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : artifacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artifacts.map((artifact, index) => (
              <motion.div
                key={artifact._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/antiques/${artifact._id}`}>
                  <Card interactive className="group h-full overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      {artifact.image ? (
                        <Image
                          src={artifact.image}
                          alt={artifact.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                          <Gem className="w-16 h-16 text-red-400/50" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className={getStatusColor(artifact.status)}>
                          {artifact.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {artifact.name}
                      </h3>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gem className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No antiques found.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => refetch({ search, status: selectedStatus || undefined, page: i + 1 })}
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
