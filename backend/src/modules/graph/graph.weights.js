/**
 * Edge weights for the Connection Engine.
 *
 * The graph is a weighted one because the relation types are not equally
 * meaningful. Measured on the 45-character dataset:
 *
 *   affiliations        88 edges  (51%)
 *   co-battle           59 edges  (34%)
 *   co-team              8 edges   (4%)
 *   shared artifact      2 edges   (1%)
 *
 * Co-appearance used to be a fifth type and was removed. Every film cast forms
 * a clique, so 38 films produced ~583 pairs - more than three times every other
 * type combined - while asserting only that two people shared a crowded frame.
 * Weighting alone did not save it: the MAX_EDGE_WEIGHT cutoff was already
 * discarding 568 of the 583, so the type survived as 15 edges whose only
 * distinction was coming from small casts. The graph stays fully connected
 * without it.
 *
 * Dijkstra minimizes total weight, so a *lower* number means a *stronger*
 * connection. A direct affiliation costs 1; sharing a crowded battlefield costs
 * far more.
 */

/**
 * Base cost per edge type. Tuned so that one strong link beats a chain of weak
 * ones: an affiliation (1) is preferred over a chain of two battles (2 x 4 = 8).
 */
export const EDGE_WEIGHTS = {
  /** Explicitly modelled ally/relative/nemesis link - the strongest signal. */
  affiliation: 1,
  /** Same team roster. Strong, but broader than a personal affiliation. */
  team: 2,
  /** Fought in the same battle - they were demonstrably in the same fight. */
  battle: 4,
  /** Both wielded the same artifact at some point. Narrative, not social. */
  artifact: 5,
};

/**
 * Scale an edge's cost by how crowded the shared context was.
 *
 * Two characters in a two-hander share something meaningful. Two characters in
 * a twelve-way battle royale barely interacted. Dividing by group size would
 * over-punish ensembles, so the penalty grows with the square root of the
 * participant count and is capped.
 *
 * @param {number} base - the edge type's base weight
 * @param {number} groupSize - how many characters shared this context
 * @returns {number}
 */
export const scaleByGroupSize = (base, groupSize) => {
  if (groupSize <= 2) {
    return base;
  }
  const penalty = Math.min(Math.sqrt(groupSize - 1), 3);
  return Number((base * penalty).toFixed(3));
};

/**
 * Combine parallel edges between the same pair of characters.
 *
 * Two people who are affiliated *and* fought together *and* share a team are
 * more strongly connected than people who only do one of those. Rather than
 * keeping multiple edges, collapse them: the strongest single link sets the
 * cost, and each additional link discounts it further, down to a floor.
 *
 * @param {number[]} weights - costs of every parallel edge for the pair
 * @returns {number}
 */
export const combineWeights = (weights) => {
  if (weights.length === 0) {
    return Infinity;
  }
  const sorted = [...weights].sort((a, b) => a - b);
  const strongest = sorted[0];
  // Each extra corroborating link shaves 15% off, bottoming out at half cost.
  const discount = Math.max(0.5, 1 - 0.15 * (sorted.length - 1));
  return Number((strongest * discount).toFixed(3));
};

/**
 * Cost above which an edge is not worth keeping.
 *
 * A twelve-way battle produces a clique linking almost everyone to almost
 * everyone. Those edges are technically true and analytically useless: with
 * them the graph tends toward a mesh, every character sits one hop from every
 * other, and both hop-count and betweenness collapse to the same value across
 * the whole cast.
 *
 * Dropping edges above this threshold keeps affiliations, teams, small battles
 * and shared artifacts, while discarding the crowd scenes.
 */
export const MAX_EDGE_WEIGHT = 9;

/** Human-readable label for why two characters are connected. */
export const describeEdge = (type, context) => {
  switch (type) {
    case "affiliation":
      return "allied with";
    case "team":
      return `both in ${context ?? "the same team"}`;
    case "battle":
      return `fought together at ${context ?? "the same battle"}`;
    case "artifact":
      return `both wielded ${context ?? "the same artifact"}`;
    default:
      return "connected to";
  }
};
