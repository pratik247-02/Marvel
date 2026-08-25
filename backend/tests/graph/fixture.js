/**
 * A hand-verified graph for testing the traversal algorithms.
 *
 * Deliberately tiny. The point is that every expected answer below can be
 * checked with a pen, so a failing test means the algorithm is wrong rather
 * than that the fixture drifted. A test whose expected value was copied from
 * the code's own output proves nothing.
 *
 *        1        1
 *   a ------- b ------ c
 *   |         |        |
 *   | 8       | 2      | 1
 *   |         |        |
 *   d ------- e ------ f
 *        1        3
 *
 *   g --- h        (a separate component: nothing reaches a-f)
 *      2
 *
 *   i              (isolated: no edges at all)
 *
 * Hand-worked answers used by the tests:
 *
 *   a -> c   weighted: a-b-c        = 1 + 1 = 2      (2 hops)
 *   a -> f   weighted: a-b-c-f      = 1 + 1 + 1 = 3  (3 hops)
 *            NOT a-d-e-f (8+1+3 = 12), and not a-b-e-f (1+2+3 = 6)
 *   a -> e   weighted: a-b-e        = 1 + 2 = 3      (2 hops)
 *            ties with a-d-e? no: 8 + 1 = 9. b route wins.
 *   a -> d   weighted: a-b-e-d      = 1 + 2 + 1 = 4  (3 hops)
 *            beats the direct edge a-d, which costs 8. This is the case that
 *            separates a correct Dijkstra from a greedy first-edge walk, and
 *            the case where "fewest hops" and "strongest ties" disagree.
 *   a -> d   hops:     a-d          = 1 hop, ignoring the cost of 8
 *   a -> g   unreachable in both modes
 *   a -> i   unreachable in both modes
 */

/** Build the adjacency map the engine expects, from an undirected edge list. */
export function buildFixture(edges, nodeIds) {
  const nodes = new Map();
  for (const id of nodeIds) {
    nodes.set(id, {
      id,
      name: id.toUpperCase(),
      alias: `Alias ${id.toUpperCase()}`,
      slug: id,
      image: null,
      theme: null,
    });
  }

  const adjacency = new Map();
  for (const id of nodeIds) {
    adjacency.set(id, new Map());
  }

  for (const [from, to, weight, type] of edges) {
    const entry = { weight, type: type ?? "affiliation", context: null, reasons: 1 };
    adjacency.get(from).set(to, { ...entry });
    adjacency.get(to).set(from, { ...entry });
  }

  return {
    nodes,
    adjacency,
    stats: {
      nodeCount: nodes.size,
      edgeCount: edges.length,
      buildMs: 0,
    },
  };
}

/** The diagram above. */
export const SIMPLE_NODES = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

export const SIMPLE_EDGES = [
  ["a", "b", 1],
  ["b", "c", 1],
  ["c", "f", 1],
  ["a", "d", 8],
  ["d", "e", 1],
  ["e", "f", 3],
  ["b", "e", 2],
  ["g", "h", 2],
  // i has no edges at all
];

export const simpleGraph = () => buildFixture(SIMPLE_EDGES, SIMPLE_NODES);

/**
 * A graph containing a cycle, to prove the traversal terminates and does not
 * revisit nodes.
 *
 *   x --- y --- z
 *    \         /
 *     \_______/
 *
 * All edges weight 1, so x -> z is one hop via the closing edge, not two.
 */
export const cycleGraph = () =>
  buildFixture(
    [
      ["x", "y", 1],
      ["y", "z", 1],
      ["z", "x", 1],
    ],
    ["x", "y", "z"]
  );
