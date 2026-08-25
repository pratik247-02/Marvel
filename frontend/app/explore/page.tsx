"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Route, Shuffle, X, Crosshair, Network } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { ForceGraph } from "@/components/blocks/ForceGraph";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFullGraph, useGraphPath, useEgoNetwork } from "@/modules/graph";
import type { GraphNode } from "@/types";

type Mode = "weighted" | "hops";
type View = "focus" | "path" | "all";

/**
 * How many nodes a force layout can show before labels start colliding faster
 * than nodes are added. Measured against this dataset's density: 45 nodes give
 * ~6 label collisions, 100 give ~15, 170 give ~60. Past this the full view is a
 * picture rather than something you can read, which is what the focus and path
 * views exist to avoid.
 */
const READABLE_NODE_LIMIT = 60;

function ExploreView() {
  const { graph, isLoading: graphLoading, error: graphError } = useFullGraph();
  const { result, isLoading: pathLoading, error: pathError, findPath, reset } =
    useGraphPath();

  const [view, setView] = useState<View>("focus");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<Mode>("weighted");
  const [focus, setFocus] = useState("");
  const [depth, setDepth] = useState(1);

  // A character page can hand off here pre-centred - /explore?focus=tony-stark.
  // Read once on mount rather than kept in sync, so clicking a node to
  // re-centre is not immediately undone by the stale URL.
  const searchParams = useSearchParams();
  useEffect(() => {
    const requested = searchParams.get("focus");
    if (requested) {
      setFocus(requested);
      setView("focus");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    network,
    isLoading: networkLoading,
    error: networkError,
  } = useEgoNetwork(view === "focus" && focus ? focus : null, depth);

  const characters = useMemo(
    () => [...(graph?.nodes ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [graph]
  );

  const highlightPath = useMemo(
    () => result?.path?.map((n) => n.id) ?? [],
    [result]
  );

  /**
   * The path view shows only the route and whatever touches it, rather than the
   * whole universe with a line drawn through it. That keeps the answer readable
   * however large the dataset gets.
   */
  const pathSubgraph = useMemo(() => {
    if (!graph || !result?.path) {
      return null;
    }
    const onPath = new Set(result.path.map((n) => n.id));
    const keep = new Set(onPath);
    for (const edge of graph.edges) {
      if (onPath.has(edge.from)) {
        keep.add(edge.to);
      }
      if (onPath.has(edge.to)) {
        keep.add(edge.from);
      }
    }
    return {
      nodes: graph.nodes.filter((n) => keep.has(n.id)),
      edges: graph.edges.filter((e) => keep.has(e.from) && keep.has(e.to)),
    };
  }, [graph, result]);

  /** Whichever subgraph the current view calls for. */
  const visible = useMemo(() => {
    if (view === "focus") {
      return network ? { nodes: network.nodes, edges: network.edges } : null;
    }
    if (view === "path") {
      return pathSubgraph ?? (graph ? { nodes: graph.nodes, edges: graph.edges } : null);
    }
    return graph ? { nodes: graph.nodes, edges: graph.edges } : null;
  }, [view, network, pathSubgraph, graph]);

  const busy =
    graphLoading || (view === "focus" && networkLoading) || (view === "path" && pathLoading);
  const problem = graphError || (view === "focus" ? networkError : null);

  const handleFind = () => {
    if (from && to) {
      setView("path");
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
    setView("path");
    findPath(characters[a].slug, characters[b].slug, mode);
  };

  const handleClear = () => {
    setFrom("");
    setTo("");
    reset();
  };

  /**
   * A click means different things per view: in focus it re-centres, in the
   * others it fills the next empty path slot.
   */
  const handleNodeClick = (node: GraphNode) => {
    if (view === "focus") {
      setFocus(node.slug);
      return;
    }
    if (!from) {
      setFrom(node.slug);
    } else if (!to && node.slug !== from) {
      setTo(node.slug);
      setView("path");
      findPath(from, node.slug, mode);
    }
  };

  const VIEWS: { id: View; label: string; icon: typeof Crosshair }[] = [
    { id: "focus", label: "Focus", icon: Crosshair },
    { id: "path", label: "Path", icon: Route },
    { id: "all", label: "Everything", icon: Network },
  ];

  return (
    <PageWrapper>
      <HeroBanner
        title="Explore"
        subtitle="Six degrees of the MCU"
        description="Pick any two characters and trace how the universe connects them."
        theme={{ colorPrimary: "#e23636", colorSecondary: "#f0a500" }}
      />

      <Container className="py-12">
        {/* View switcher */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-border p-0.5">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {view === "focus"
              ? "One character and everyone around them"
              : view === "path"
                ? "The route between two characters, and what touches it"
                : "Every character at once"}
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-8 p-5">
          {view === "focus" ? (
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Centre on
                </span>
                <select
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
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

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Distance
                </span>
                <div className="flex h-10 rounded-md border border-border p-0.5">
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      className={`rounded px-4 text-xs font-medium transition-colors ${
                        depth === d
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d} {d === 1 ? "hop" : "hops"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
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
                    ? "Prefers real relationships over incidental ones"
                    : "Fewest connections, ignoring how strong they are"}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Result */}
        <AnimatePresence mode="wait">
          {pathError && view !== "focus" && (
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

          {result && !pathError && view !== "focus" && (
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
        {busy ? (
          <Skeleton className="h-[min(900px,max(560px,calc(100vh-260px)))] w-full rounded-xl" />
        ) : problem ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{problem}</p>
          </Card>
        ) : view === "focus" && !focus ? (
          <Card className="flex h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
            <Crosshair className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Choose a character to see who surrounds them.
            </p>
          </Card>
        ) : visible ? (
          <Card className="overflow-hidden">
            <ForceGraph
              nodes={visible.nodes}
              edges={visible.edges}
              highlightPath={view === "focus" ? [] : highlightPath}
              onNodeClick={handleNodeClick}
            />
          </Card>
        ) : null}

        {/* Focus can still overshoot: two hops from a hub reaches most of the
            graph. Say so rather than letting the view quietly degrade. */}
        {view === "focus" && visible && !busy && visible.nodes.length > READABLE_NODE_LIMIT && depth > 1 && (
          <p className="mt-3 text-center text-xs text-muted-foreground/80">
            {network?.center?.name ?? "This character"} is well connected — {depth} hops reaches{" "}
            {visible.nodes.length} characters. Try one hop for a clearer picture.
          </p>
        )}

        {visible && !busy && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {visible.nodes.length} characters · {visible.edges.length} connections
            {view === "focus" && network?.center ? ` around ${network.center.name}` : ""} ·{" "}
            {view === "focus"
              ? "click a node to re-centre on it"
              : "drag a node to reposition it, click one to pick it"}
          </p>
        )}

        {/* Honest about the limit rather than quietly rendering a hairball. */}
        {view === "all" && visible && visible.nodes.length > READABLE_NODE_LIMIT && (
          <p className="mt-2 text-center text-xs text-muted-foreground/80">
            That is a lot of nodes for one canvas — Focus and Path stay readable at any size.
          </p>
        )}
      </Container>
    </PageWrapper>
  );
}

/**
 * `useSearchParams` forces client-side rendering for whatever reads it, so the
 * page cannot be prerendered unless that component is inside a Suspense
 * boundary. Without this the build fails on /explore rather than at runtime.
 */
export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreView />
    </Suspense>
  );
}
