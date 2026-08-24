/**
 * The Connection Engine.
 *
 * Builds a weighted adjacency map of the whole character graph in process
 * memory, then answers traversal queries against it without touching the
 * database.
 *
 * Why in memory: the full graph is a few hundred nodes and a few thousand
 * edges - tens of kilobytes. Measured against Atlas, a single `findById` costs
 * ~10ms of network round trip, and the `$graphLookup` traversal costs ~22ms
 * p95, almost all of it I/O rather than query execution. Holding the graph
 * locally removes the round trip entirely. That is the actual win here; the
 * algorithm was never the bottleneck at this size.
 *
 * The tradeoff, stated plainly: the snapshot is per-process. Multiple instances
 * each hold their own copy and can briefly disagree after a write until the TTL
 * expires or an invalidation runs. At single-instance scale with admin-only
 * writes that is acceptable. Past that, this belongs behind a shared cache or a
 * real graph store - see the ADR.
 */

import Character from "../characters/character.model.js";
import Battle from "../battles/battle.model.js";
import Team from "../teams/team.model.js";
import Artifact from "../artifacts/artifact.model.js";
import {
  EDGE_WEIGHTS,
  MAX_EDGE_WEIGHT,
  scaleByGroupSize,
  combineWeights,
} from "./graph.weights.js";
import { logger } from "../../utils/logger.js";

/** How long a snapshot may serve before it is rebuilt regardless of writes. */
const TTL_MS = 5 * 60 * 1000;

/** @type {{ builtAt: number, nodes: Map, adjacency: Map, stats: object } | null} */
let snapshot = null;
/** Coalesces concurrent rebuilds so a cold cache does not stampede the DB. */
let building = null;

/**
 * Register one undirected edge between two characters.
 *
 * Edges accumulate into a list per pair; `combineWeights` collapses them later,
 * so a pair connected several different ways ends up closer than a pair that
 * shares only one weak link.
 */
const addEdge = (raw, a, b, weight, type, context) => {
  if (!a || !b || a === b) {
    return;
  }
  for (const [from, to] of [
    [a, b],
    [b, a],
  ]) {
    if (!raw.has(from)) {
      raw.set(from, new Map());
    }
    const neighbours = raw.get(from);
    if (!neighbours.has(to)) {
      neighbours.set(to, []);
    }
    neighbours.get(to).push({ weight, type, context });
  }
};

/** Add an edge between every pair in a shared context (team, battle, film). */
const addClique = (raw, ids, type, context) => {
  const unique = [...new Set(ids.map(String))].filter(Boolean);
  const weight = scaleByGroupSize(EDGE_WEIGHTS[type], unique.length);
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      addEdge(raw, unique[i], unique[j], weight, type, context);
    }
  }
};

/**
 * Read every relation from the database and fold it into an adjacency map.
 *
 * Five queries total, run concurrently - not one per node. This is the only
 * point at which the engine touches the database.
 */
async function buildSnapshot() {
  const started = Date.now();

  // Movies are not queried: co-appearance is not an edge type, so the cast
  // lists are not needed to build the graph.
  const [characters, battles, teams, artifacts] = await Promise.all([
    Character.find().select("_id name alias slug image theme affiliations").lean(),
    Battle.find().select("_id name slug participants").lean(),
    Team.find().select("_id name slug members").lean(),
    Artifact.find().select("_id name slug holders").lean(),
  ]);

  const nodes = new Map();
  for (const c of characters) {
    nodes.set(String(c._id), {
      id: String(c._id),
      name: c.name,
      alias: c.alias,
      slug: c.slug,
      image: c.image,
      theme: c.theme,
    });
  }

  const raw = new Map();

  // Explicit affiliations - the strongest link, and directional in the data but
  // treated as mutual here: if A lists B as an ally, they are connected.
  for (const c of characters) {
    const from = String(c._id);
    for (const other of c.affiliations ?? []) {
      addEdge(raw, from, String(other), EDGE_WEIGHTS.affiliation, "affiliation", null);
    }
  }

  for (const t of teams) {
    addClique(raw, t.members ?? [], "team", t.name);
  }
  for (const b of battles) {
    addClique(raw, b.participants ?? [], "battle", b.name);
  }
  for (const a of artifacts) {
    addClique(raw, a.holders ?? [], "artifact", a.name);
  }
  // Co-appearance is deliberately not an edge type.
  //
  // A film cast is a clique, so the 38 films generate ~580 pairs on the current
  // dataset - more than three times every other edge type combined - and they
  // say almost nothing: Endgame alone credits 27 characters, which is 351 pairs
  // asserting that people who shared a crowded frame are "connected".
  //
  // The MAX_EDGE_WEIGHT cutoff was already discarding 568 of those 583, so the
  // type was carrying 15 real edges at the cost of building and pruning the
  // whole clique on every rebuild. Dropping it entirely leaves the graph fully
  // connected - one component, every node reachable - because affiliations,
  // teams and battles already carry the real relationships.
  //
  // Films remain on the character detail page; they are simply not a claim
  // about who knows whom.

  // Collapse parallel edges into a single weighted edge per pair.
  const adjacency = new Map();
  let edgeCount = 0;
  for (const [from, neighbours] of raw) {
    if (!nodes.has(from)) {
      continue;
    }
    const collapsed = new Map();
    for (const [to, entries] of neighbours) {
      if (!nodes.has(to)) {
        continue;
      }
      const weight = combineWeights(entries.map((e) => e.weight));
      // Discard links too weak to mean anything - see MAX_EDGE_WEIGHT.
      if (weight > MAX_EDGE_WEIGHT) {
        continue;
      }
      // Keep the strongest reason for display; it is what the UI shows on the
      // path, and the cheapest edge is the most meaningful one.
      const best = entries.reduce((lo, e) => (e.weight < lo.weight ? e : lo), entries[0]);
      collapsed.set(to, {
        weight,
        type: best.type,
        context: best.context,
        reasons: entries.length,
      });
      edgeCount++;
    }
    adjacency.set(from, collapsed);
  }

  const built = {
    builtAt: Date.now(),
    nodes,
    adjacency,
    stats: {
      nodeCount: nodes.size,
      edgeCount: edgeCount / 2, // counted from both ends
      buildMs: Date.now() - started,
    },
  };

  logger.info(
    `Graph snapshot built: ${built.stats.nodeCount} nodes, ` +
      `${built.stats.edgeCount} edges in ${built.stats.buildMs}ms`
  );
  return built;
}

/** True when there is no snapshot or the existing one has aged out. */
const isStale = () => !snapshot || Date.now() - snapshot.builtAt > TTL_MS;

/**
 * Get the current snapshot, rebuilding if missing or stale.
 *
 * Concurrent callers share a single in-flight build rather than each starting
 * their own.
 */
export async function getGraph() {
  if (!isStale()) {
    return snapshot;
  }
  if (!building) {
    building = buildSnapshot()
      .then((g) => {
        snapshot = g;
        return g;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}

/** Drop the snapshot so the next read rebuilds. Called after writes. */
export function invalidateGraph() {
  snapshot = null;
}

/**
 * Weighted shortest path via Dijkstra.
 *
 * A binary heap would be the textbook choice, but at a few hundred nodes the
 * linear scan for the next-closest node is faster in practice than the heap's
 * allocation and bookkeeping. Revisit past a few thousand nodes.
 *
 * @returns {{path: Array, edges: Array, cost: number, hops: number} | {path: null}}
 */
export async function shortestPath(fromId, toId) {
  const graph = await getGraph();
  const from = String(fromId);
  const to = String(toId);

  if (!graph.nodes.has(from) || !graph.nodes.has(to)) {
    return { path: null, edges: [], cost: 0, hops: 0 };
  }
  if (from === to) {
    return { path: [graph.nodes.get(from)], edges: [], cost: 0, hops: 0 };
  }

  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const visited = new Set();

  for (;;) {
    // Pick the unvisited node with the smallest known distance.
    let current = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < best) {
        best = d;
        current = id;
      }
    }
    if (current === null || current === to) {
      break;
    }
    visited.add(current);

    for (const [neighbour, edge] of graph.adjacency.get(current) ?? []) {
      if (visited.has(neighbour)) {
        continue;
      }
      const candidate = best + edge.weight;
      if (candidate < (dist.get(neighbour) ?? Infinity)) {
        dist.set(neighbour, candidate);
        prev.set(neighbour, { from: current, edge });
      }
    }
  }

  if (!dist.has(to)) {
    return { path: null, edges: [], cost: 0, hops: 0 };
  }

  const path = [];
  const edges = [];
  let cursor = to;
  while (cursor !== from) {
    path.unshift(graph.nodes.get(cursor));
    const step = prev.get(cursor);
    if (!step) {
      return { path: null, edges: [], cost: 0, hops: 0 };
    }
    edges.unshift({
      from: step.from,
      to: cursor,
      type: step.edge.type,
      context: step.edge.context,
      weight: step.edge.weight,
    });
    cursor = step.from;
  }
  path.unshift(graph.nodes.get(from));

  return {
    path,
    edges,
    cost: Number(dist.get(to).toFixed(3)),
    hops: path.length - 1,
  };
}

/**
 * Unweighted BFS - fewest hops, ignoring edge strength.
 *
 * Kept alongside Dijkstra because the two answer different questions: "who is
 * the most direct link" versus "what is the most meaningful route".
 */
export async function fewestHops(fromId, toId) {
  const graph = await getGraph();
  const from = String(fromId);
  const to = String(toId);

  if (!graph.nodes.has(from) || !graph.nodes.has(to)) {
    return { path: null, hops: 0 };
  }
  if (from === to) {
    return { path: [graph.nodes.get(from)], hops: 0 };
  }

  const prev = new Map();
  const seen = new Set([from]);
  let frontier = [from];

  while (frontier.length > 0) {
    const next = [];
    for (const id of frontier) {
      for (const [neighbour] of graph.adjacency.get(id) ?? []) {
        if (seen.has(neighbour)) {
          continue;
        }
        seen.add(neighbour);
        prev.set(neighbour, id);
        if (neighbour === to) {
          const path = [];
          let cursor = to;
          while (cursor !== undefined) {
            path.unshift(graph.nodes.get(cursor));
            cursor = prev.get(cursor);
          }
          return { path, hops: path.length - 1 };
        }
        next.push(neighbour);
      }
    }
    frontier = next;
  }

  return { path: null, hops: 0 };
}

/**
 * The neighbourhood around one character, out to `depth` hops.
 */
export async function egoNetwork(centerId, depth = 1) {
  const graph = await getGraph();
  const center = String(centerId);
  if (!graph.nodes.has(center)) {
    return { center: null, nodes: [], edges: [] };
  }

  const depths = new Map([[center, 0]]);
  let frontier = [center];

  for (let d = 1; d <= depth; d++) {
    const next = [];
    for (const id of frontier) {
      for (const [neighbour] of graph.adjacency.get(id) ?? []) {
        if (!depths.has(neighbour)) {
          depths.set(neighbour, d);
          next.push(neighbour);
        }
      }
    }
    frontier = next;
  }

  const included = new Set(depths.keys());
  const edges = [];
  const emitted = new Set();
  for (const id of included) {
    for (const [neighbour, edge] of graph.adjacency.get(id) ?? []) {
      if (!included.has(neighbour)) {
        continue;
      }
      // Undirected: emit each pair once.
      const key = id < neighbour ? `${id}|${neighbour}` : `${neighbour}|${id}`;
      if (emitted.has(key)) {
        continue;
      }
      emitted.add(key);
      edges.push({
        from: id,
        to: neighbour,
        type: edge.type,
        context: edge.context,
        weight: edge.weight,
      });
    }
  }

  return {
    center: graph.nodes.get(center),
    nodes: [...included].map((id) => ({ ...graph.nodes.get(id), depth: depths.get(id) })),
    edges,
  };
}

/**
 * Graph-wide statistics: who is most connected, and who bridges clusters.
 *
 * Betweenness uses Brandes' algorithm, which is O(V*E) - fine at this size and
 * the standard choice. It answers "who sits on the most shortest paths", which
 * is what identifies a character as a bridge between otherwise separate groups.
 */
export async function graphStats(limit = 10) {
  const graph = await getGraph();
  const ids = [...graph.nodes.keys()];

  const degree = ids.map((id) => {
    const neighbours = graph.adjacency.get(id) ?? new Map();
    let strength = 0;
    for (const [, edge] of neighbours) {
      strength += 1 / edge.weight;
    }
    return {
      ...graph.nodes.get(id),
      degree: neighbours.size,
      strength: Number(strength.toFixed(3)),
    };
  });

  // Brandes' betweenness centrality, unweighted variant.
  const betweenness = new Map(ids.map((id) => [id, 0]));
  for (const source of ids) {
    const stack = [];
    const preds = new Map(ids.map((id) => [id, []]));
    const sigma = new Map(ids.map((id) => [id, 0]));
    const dist = new Map(ids.map((id) => [id, -1]));
    sigma.set(source, 1);
    dist.set(source, 0);

    let queue = [source];
    while (queue.length > 0) {
      const next = [];
      for (const v of queue) {
        stack.push(v);
        for (const [w] of graph.adjacency.get(v) ?? []) {
          if (dist.get(w) < 0) {
            dist.set(w, dist.get(v) + 1);
            next.push(w);
          }
          if (dist.get(w) === dist.get(v) + 1) {
            sigma.set(w, sigma.get(w) + sigma.get(v));
            preds.get(w).push(v);
          }
        }
      }
      queue = next;
    }

    const delta = new Map(ids.map((id) => [id, 0]));
    while (stack.length > 0) {
      const w = stack.pop();
      for (const v of preds.get(w)) {
        delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
      }
      if (w !== source) {
        betweenness.set(w, betweenness.get(w) + delta.get(w));
      }
    }
  }

  const bridges = ids
    .map((id) => ({
      ...graph.nodes.get(id),
      // Undirected graphs count each pair twice.
      betweenness: Number((betweenness.get(id) / 2).toFixed(2)),
    }))
    .sort((a, b) => b.betweenness - a.betweenness)
    .slice(0, limit);

  return {
    ...graph.stats,
    builtAt: new Date(graph.builtAt).toISOString(),
    mostConnected: [...degree].sort((a, b) => b.degree - a.degree).slice(0, limit),
    strongestTies: [...degree].sort((a, b) => b.strength - a.strength).slice(0, limit),
    bridges,
  };
}
