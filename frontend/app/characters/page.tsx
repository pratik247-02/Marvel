"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EntityPortrait } from "@/components/blocks/EntityPortrait";
import { InfiniteSentinel } from "@/components/blocks/InfiniteSentinel";
import { Skeleton } from "@/components/ui/Skeleton";
import { useInfiniteCharacters } from "@/modules/characters";

/** Enough to fill a tall screen at four columns, so the first scroll has somewhere to go. */
const PAGE_SIZE = 24;

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Typing filters as you go, but a request per keystroke would be wasteful and
  // would race. Waiting for a pause sends one request for the finished word.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { characters, total, hasMore, isLoading, isLoadingMore, error, loadMore } =
    useInfiniteCharacters(PAGE_SIZE, debouncedSearch || undefined);

  return (
    <PageWrapper>
      {/* No banner. It restated the nav item that was just clicked and cost
          most of a viewport doing it, pushing the characters themselves below
          the fold. The heading below carries the same information in a line. */}

      <Container className="py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Characters</h1>
            {total > 0 && <span className="text-muted-foreground text-sm">{total}</span>}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search characters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search characters"
            />
          </div>
        </div>

        {error ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-3/4" />
                <div className="p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : characters.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {characters.map((character, index) => (
                <motion.div
                  key={character._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  // Stagger only within the page just loaded. Multiplying by the
                  // index across the whole list would leave later pages waiting
                  // seconds before appearing.
                  transition={{ delay: (index % PAGE_SIZE) * 0.03 }}
                >
                  <Link href={`/characters/${character._id}`}>
                    <Card interactive className="group overflow-hidden">
                      <div className="relative aspect-3/4 overflow-hidden">
                        <EntityPortrait
                          name={character.name}
                          image={character.image}
                          theme={character.theme}
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          // The first row is above the fold and is the LCP
                          // candidate; lazy-loading it costs a round trip.
                          priority={index < 4}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="group-hover:text-primary line-clamp-1 font-semibold transition-colors">
                          {character.name}
                        </h3>
                        {character.alias && (
                          <p className="text-muted-foreground line-clamp-1 text-sm">
                            {character.alias}
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
              endMessage={`All ${total} characters`}
            />
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {debouncedSearch
                ? `No characters match "${debouncedSearch}".`
                : "No characters found."}
            </p>
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
