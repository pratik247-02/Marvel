"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Route, Shuffle, X } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { ForceGraph } from "@/components/blocks/ForceGraph";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFullGraph, useGraphPath } from "@/modules/graph";
import type { GraphNode } from "@/types";

type Mode = "weighted" | "hops";

export default function ExplorePage() {
  const { graph, isLoading: graphLoading, error: graphError } = useFullGraph();
  const { result, isLoading: pathLoading, error: pathError, findPath, reset } =
    useGraphPath();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<Mode>("weighted");

  const characters = useMemo(
    () => [...(graph?.nodes ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [graph]
  );

  const highlightPath = useMemo(
    () => result?.path?.map((n) => n.id) ?? [],
    [result]
  );

  const handleFind = () => {
    if (from && to) {
      findPath(from, to, mode);
    }
  };

  /** Pick two random, distinct characters - a one-click way to see it work. */
  const handleSurprise = () => {
    if (characters.length < 2) {
      return;
    }
    const a = Math.floor(Math.random() * characters.length);
    let b = Math.floor(Math.random() * characters.length);
    while (b === a) {
      b = Math.floor(Math.random() * characters.length);
    }
    setFrom(characters[a].slug);
    setTo(characters[b].slug);
    findPath(characters[a].slug, characters[b].slug, mode);
  };

  const handleClear = () => {
    setFrom("");
    setTo("");
    reset();
  };

  /** Clicking a node fills the first empty slot. */
  const handleNodeClick = (node: GraphNode) => {
    if (!from) {
      setFrom(node.slug);
    } else if (!to && node.slug !== from) {
      setTo(node.slug);
      findPath(from, node.slug, mode);
    }
  };

  return (
    <PageWrapper>
      <HeroBanner
        title="Explore"
        subtitle="Six degrees of the MCU"
        description="Pick any two characters and trace how the universe connects them."
        theme={{ colorPrimary: "#e23636", colorSecondary: "#f0a500" }}
      />

      <Container className="py-12">
        {/* Controls */}
        <Card className="mb-8 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                From
              </span>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choose a character…</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                    {c.alias ? ` — ${c.alias}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="hidden items-end pb-2.5 md:flex">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                To
              </span>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choose a character…</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                    {c.alias ? ` — ${c.alias}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button onClick={handleFind} disabled={!from || !to || pathLoading}>
                <Route className="mr-1.5 h-4 w-4" />
                {pathLoading ? "Finding…" : "Find path"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <div className="flex rounded-md border border-border p-0.5">
              {(["weighted", "hops"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "weighted" ? "Strongest ties" : "Fewest hops"}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={handleSurprise}>
              <Shuffle className="mr-1.5 h-4 w-4" />
              Surprise me
            </Button>

            {(from || to) && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="mr-1.5 h-4 w-4" />
                Clear
              </Button>
            )}

            <p className="ml-auto text-xs text-muted-foreground">
              {mode === "weighted"
                ? "Prefers real relationships over shared screen time"
                : "Fewest connections, ignoring how strong they are"}
            </p>
          </div>
        </Card>

        {/* Result */}
        <AnimatePresence mode="wait">
          {pathError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
            >
              {pathError}
            </motion.div>
          )}

          {result && !pathError && (
            <motion.div
              key={`${result.from.id}-${result.to.id}-${result.mode}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              {result.found && result.path ? (
                <Card className="p-5">
                  <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-lg font-semibold">
                      {result.from.name} → {result.to.name}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {result.hops} {result.hops === 1 ? "step" : "steps"}
                      {result.cost !== null && ` · cost ${result.cost}`}
                    </span>
                  </div>

                  {/* The chain, one link at a time. */}
                  <ol className="flex flex-wrap items-center gap-2">
                    {result.path.map((node, i) => (
                      <motion.li
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.12 }}
                        className="flex items-center gap-2"
                      >
                        <Link
                          href={`/characters/${node.id}`}
                          className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                          style={{
                            borderColor: node.theme?.colorPrimary ?? undefined,
                            color: node.theme?.colorPrimary ?? undefined,
                          }}
                        >
                          {node.name}
                        </Link>
                        {i < result.edges.length && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.12 + 0.06 }}
                            className="text-xs text-muted-foreground"
                          >
                            {result.edges[i].label}
                            <ArrowRight className="ml-1 inline h-3 w-3" />
                          </motion.span>
                        )}
                      </motion.li>
                    ))}
                  </ol>
                </Card>
              ) : (
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground">
                    No connection found between {result.from.name} and{" "}
                    {result.to.name}. They may be in separate corners of the
                    universe.
                  </p>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Graph */}
        {graphLoading ? (
          <Skeleton className="h-[560px] w-full rounded-xl" />
        ) : graphError ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{graphError}</p>
          </Card>
        ) : graph ? (
          <Card className="overflow-hidden">
            <ForceGraph
              nodes={graph.nodes}
              edges={graph.edges}
              highlightPath={highlightPath}
              onNodeClick={handleNodeClick}
            />
          </Card>
        ) : null}

        {graph && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {graph.stats.nodeCount} characters · {graph.stats.edgeCount} connections ·
            drag a node to reposition it, click one to pick it
          </p>
        )}
      </Container>
    </PageWrapper>
  );
}
