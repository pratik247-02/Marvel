import mongoose from "mongoose";
import Character from "../characters/character.model.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { describeEdge } from "./graph.weights.js";
import {
  shortestPath,
  fewestHops,
  egoNetwork,
  graphStats,
  getGraph,
  invalidateGraph,
} from "./graph.engine.js";

/**
 * Resolve a character reference that may be either an ObjectId or a slug.
 *
 * The API accepts both so URLs can stay readable (`?from=groot&to=thanos`)
 * without breaking callers that already hold ids.
 */
async function resolveCharacter(ref) {
  if (!ref) {
    throw new AppError("Character reference is required", 400);
  }
  const query = mongoose.isValidObjectId(ref)
    ? { _id: ref }
    : { slug: String(ref).toLowerCase() };

  const character = await Character.findOne(query).select("_id name slug").lean();
  if (!character) {
    throw new AppError(`Character not found: ${ref}`, 404);
  }
  return character;
}

/** Attach a human-readable explanation to each edge on a path. */
const annotate = (edges) =>
  edges.map((e) => ({ ...e, label: describeEdge(e.type, e.context) }));

export const graphService = {
  /**
   * Shortest path between two characters.
   *
   * @param {string} from - id or slug
   * @param {string} to - id or slug
   * @param {"weighted"|"hops"} mode
   */
  async findPath(from, to, mode = "weighted") {
    const [a, b] = await Promise.all([resolveCharacter(from), resolveCharacter(to)]);

    const result =
      mode === "hops"
        ? { ...(await fewestHops(a._id, b._id)), edges: [], cost: null }
        : await shortestPath(a._id, b._id);

    return {
      from: { id: String(a._id), name: a.name, slug: a.slug },
      to: { id: String(b._id), name: b.name, slug: b.slug },
      mode,
      found: Boolean(result.path),
      hops: result.hops ?? 0,
      cost: result.cost ?? null,
      path: result.path ?? null,
      edges: annotate(result.edges ?? []),
    };
  },

  /** The neighbourhood around one character. */
  async findNetwork(ref, depth = 1) {
    const character = await resolveCharacter(ref);
    const bounded = Math.min(Math.max(Number(depth) || 1, 1), 4);
    const network = await egoNetwork(character._id, bounded);

    return {
      depth: bounded,
      center: network.center,
      nodes: network.nodes,
      edges: annotate(network.edges),
      counts: { nodes: network.nodes.length, edges: network.edges.length },
    };
  },

  /** Graph-wide statistics. */
  async stats(limit = 10) {
    const bounded = Math.min(Math.max(Number(limit) || 10, 1), 50);
    return graphStats(bounded);
  },

  /** The full graph, for client-side visualization. */
  async fullGraph() {
    const graph = await getGraph();
    const edges = [];
    const emitted = new Set();

    for (const [from, neighbours] of graph.adjacency) {
      for (const [to, edge] of neighbours) {
        const key = from < to ? `${from}|${to}` : `${to}|${from}`;
        if (emitted.has(key)) {
          continue;
        }
        emitted.add(key);
        edges.push({
          from,
          to,
          type: edge.type,
          context: edge.context,
          weight: edge.weight,
          label: describeEdge(edge.type, edge.context),
        });
      }
    }

    return {
      nodes: [...graph.nodes.values()],
      edges,
      stats: graph.stats,
      builtAt: new Date(graph.builtAt).toISOString(),
    };
  },

  /** Force a rebuild. Exposed for admin use and called after content writes. */
  async rebuild() {
    invalidateGraph();
    const graph = await getGraph();
    return { ...graph.stats, builtAt: new Date(graph.builtAt).toISOString() };
  },
};
