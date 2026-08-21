/**
 * Naive graph traversal, implemented with MongoDB's `$graphLookup`.
 *
 * This is the baseline the optimized engine is measured against. It is kept in
 * the tree on purpose: the benchmark harness runs both, and a performance claim
 * with no "before" number is just an assertion.
 *
 * The structural cost is that `$graphLookup` re-walks the collection for each
 * hop and cannot be told to stop once the target is reached - it expands the
 * whole reachable set to `maxDepth`, then the path is reconstructed in
 * application code. BFS over an in-memory adjacency map does neither.
 */

import mongoose from "mongoose";
import Character from "../characters/character.model.js";

/** Accept either an ObjectId or its string form. */
const toObjectId = (id) =>
  id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id));

/** Relation fields on Character that count as graph edges. */
const EDGE_FIELDS = ["affiliations"];

/**
 * Expand the reachable set around a character using `$graphLookup`.
 *
 * @param {import("mongoose").Types.ObjectId|string} startId
 * @param {number} maxDepth - hops to expand (0 = immediate neighbours)
 * @returns {Promise<Array>} reachable characters, each carrying its depth
 */
export async function expandNaive(startId, maxDepth = 4) {
  const [result] = await Character.aggregate([
    { $match: { _id: toObjectId(startId) } },
    {
      $graphLookup: {
        from: "characters",
        startWith: `$${EDGE_FIELDS[0]}`,
        connectFromField: EDGE_FIELDS[0],
        connectToField: "_id",
        as: "reachable",
        maxDepth,
        depthField: "depth",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        "reachable._id": 1,
        "reachable.name": 1,
        "reachable.slug": 1,
        "reachable.depth": 1,
        "reachable.affiliations": 1,
      },
    },
  ]);

  return result?.reachable ?? [];
}

/**
 * Shortest path between two characters via `$graphLookup`.
 *
 * `$graphLookup` reports how far each node sits from the start but not which
 * route got it there, so the path itself has to be rebuilt here: expand, index
 * the result by depth, then walk backwards from the target choosing any
 * neighbour one level closer to the start.
 *
 * @param {import("mongoose").Types.ObjectId} fromId
 * @param {import("mongoose").Types.ObjectId} toId
 * @param {number} maxDepth
 * @returns {Promise<{path: Array|null, length: number}>}
 */
export async function shortestPathNaive(fromId, toId, maxDepth = 6) {
  if (String(fromId) === String(toId)) {
    const self = await Character.findById(fromId).select("name slug").lean();
    return { path: self ? [self] : null, length: 0 };
  }

  const reachable = await expandNaive(fromId, maxDepth);
  const target = reachable.find((r) => String(r._id) === String(toId));
  if (!target) {
    return { path: null, length: 0 };
  }

  // Bucket nodes by their distance from the start so the walk back can pick a
  // predecessor from the previous level.
  const byDepth = new Map();
  for (const node of reachable) {
    const d = Number(node.depth);
    if (!byDepth.has(d)) {
      byDepth.set(d, []);
    }
    byDepth.get(d).push(node);
  }

  const start = await Character.findById(fromId).select("name slug affiliations").lean();
  const path = [target];
  let current = target;

  for (let d = Number(target.depth) - 1; d >= 0; d--) {
    const candidates = byDepth.get(d) ?? [];
    const prev = candidates.find((c) =>
      (c.affiliations ?? []).some((a) => String(a) === String(current._id))
    );
    if (!prev) {
      break;
    }
    path.unshift(prev);
    current = prev;
  }

  path.unshift(start);
  return { path, length: path.length - 1 };
}
