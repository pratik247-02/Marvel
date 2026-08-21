"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EntityPortrait } from "@/components/blocks/EntityPortrait";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCharacters } from "@/modules/characters";

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const { characters, isLoading, pagination, refetch } = useCharacters();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch({ search, page: 1 });
  };

  return (
    <PageWrapper>
      <HeroBanner
        title="Characters"
        subtitle="MCU Heroes & Villains"
        description="Explore the iconic characters of the Marvel Cinematic Universe"
        theme={{ colorPrimary: "#e23636" }}
      />

      <Container className="py-16">
        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search characters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Characters Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-3/4" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : characters.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {characters.map((character, index) => (
              <motion.div
                key={character._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/characters/${character._id}`}>
                  <Card interactive className="group overflow-hidden">
                    <div className="relative aspect-3/4 overflow-hidden">
                      <EntityPortrait
                        name={character.name}
                        image={character.image}
                        theme={character.theme}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {character.name}
                      </h3>
                      {character.alias && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {character.alias}
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
            <p className="text-muted-foreground">No characters found.</p>
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
