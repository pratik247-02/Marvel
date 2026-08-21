/**
 * Cache invalidation for the graph snapshot.
 *
 * Any write to a collection the graph is built from must drop the snapshot so
 * the next read rebuilds it. Hooks are registered here rather than inside each
 * model to keep the dependency pointing one way: the graph module knows about
 * the content models, not the reverse.
 *
 * Known hole, stated rather than papered over: these are Mongoose middleware
 * hooks, so they only fire for writes that go through Mongoose. A direct driver
 * call, a bulk `updateMany`, or someone editing documents in the Atlas UI will
 * not trigger them, and the snapshot will serve stale data until the TTL in
 * `graph.engine.js` expires. The TTL is the backstop for exactly that case.
 * Anything needing stronger guarantees wants a change stream or an explicit
 * `POST /api/graph/rebuild`.
 */

import Character from "../characters/character.model.js";
import Movie from "../movies/movie.model.js";
import Battle from "../battles/battle.model.js";
import Team from "../teams/team.model.js";
import Artifact from "../artifacts/artifact.model.js";
import { invalidateGraph } from "./graph.engine.js";
import { logger } from "../../utils/logger.js";

/** Write operations that can change the shape of the graph. */
const WRITE_HOOKS = [
  "save",
  "findOneAndUpdate",
  "findOneAndDelete",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "insertMany",
];

const models = [
  ["Character", Character],
  ["Movie", Movie],
  ["Battle", Battle],
  ["Team", Team],
  ["Artifact", Artifact],
];

/**
 * Register post-write hooks on every model the graph reads from.
 * Call once during application start-up.
 */
export function registerGraphInvalidation() {
  for (const [name, model] of models) {
    for (const hook of WRITE_HOOKS) {
      model.schema.post(hook, function onWrite() {
        logger.debug(`Graph snapshot invalidated by ${name}.${hook}`);
        invalidateGraph();
      });
    }
  }
  logger.info("Graph cache invalidation hooks registered");
}
