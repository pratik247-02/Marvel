"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Gem } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { artifactService } from "@/modules/artifacts";
import { useInfiniteList } from "@/modules/shared/useInfiniteList";
import { InfiniteSentinel } from "@/components/blocks/InfiniteSentinel";
import { ArtifactCard } from "@/components/blocks/ArtifactCard";
import type { ArtifactStatus } from "@/types";

const statusOptions: { value: ArtifactStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "destroyed", label: "Destroyed" },
  { value: "lost", label: "Lost" },
  { value: "unknown", label: "Unknown" },
];

const PAGE_SIZE = 12;

export default function AntiquesPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ArtifactStatus | "">("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // One request for the finished word rather than one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    items: artifacts,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
  } = useInfiniteList(artifactService.getAll, {
    pageSize: PAGE_SIZE,
    sort: "name",
    search: debouncedSearch || undefined,
    filters: { status: selectedStatus || undefined },
  });

  // Changing the filter restarts the list; the hook watches this value.
  const handleFilter = (value: string) => setSelectedStatus(value as never);


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
                placeholder="Search antiques..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilter(option.value)}
                className={`rounded-md px-4 py-2 text-sm transition-colors ${
                  selectedStatus === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border-border hover:bg-accent border"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Antiques Grid */}
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
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : artifacts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {artifacts.map((artifact, index) => (
                <motion.div
                  key={artifact._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % PAGE_SIZE) * 0.04 }}
                >
                  <ArtifactCard artifact={artifact} priority={index < 3} />
                </motion.div>
              ))}
            </div>

            <InfiniteSentinel
              onVisible={loadMore}
              enabled={hasMore}
              isLoading={isLoadingMore}
              endMessage={`All ${total} antiques`}
            />
          </>
        ) : (
          <div className="py-12 text-center">
            <Gem className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground">No antiques found.</p>
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
