/**
 * Tests for the Connection Engine's traversal algorithms.
 *
 * These run against the hand-verified fixture in `fixture.js` rather than the
 * real dataset. That is deliberate: a Dijkstra bug is silent, because a wrong
 * path still looks like a path. Asserting against 193 real characters would
 * mean checking the code against itself. Asserting against a nine-node graph
 * whose answers were worked out on paper means a failure points at the
 * algorithm.
 *
 * The cases chosen are the ones that actually distinguish a correct
 * implementation from a plausible-looking one:
 *
 *   - a cheap detour beating a direct edge (greedy walks fail this)
 *   - the two modes disagreeing on the same pair
 *   - unreachable pairs across components
 *   - a node with no edges at all
 *   - self-to-self
 *   - cycles terminating
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  shortestPath,
  fewestHops,
  egoNetwork,
  __setSnapshotForTests,
} from "../../src/modules/graph/graph.engine.js";
import { simpleGraph, cycleGraph } from "./fixture.js";

/** Names along a path, which is what the assertions read most clearly. */
const ids = (result) => result.path?.map((n) => n.id) ?? null;

afterEach(() => {
  // Restore database-backed behaviour so a fixture cannot leak between tests.
  __setSnapshotForTests(null);
});

describe("shortestPath (weighted, Dijkstra)", () => {
  it("takes the cheapest route, not the fewest edges", async () => {
    __setSnapshotForTests(simpleGraph());
    // a-d exists directly but costs 8. a-b-e-d costs 1 + 2 + 1 = 4.
    // A greedy walk that follows the first edge it sees fails here.
    const result = await shortestPath("a", "d");
    expect(ids(result)).toEqual(["a", "b", "e", "d"]);
    expect(result.cost).toBe(4);
    expect(result.hops).toBe(3);
  });

  it("finds the cheapest of several multi-hop routes", async () => {
    __setSnapshotForTests(simpleGraph());
    // a-b-c-f = 3. The alternatives are a-b-e-f = 6 and a-d-e-f = 12.
    const result = await shortestPath("a", "f");
    expect(ids(result)).toEqual(["a", "b", "c", "f"]);
    expect(result.cost).toBe(3);
  });

  it("returns the accumulated cost, not the edge count", async () => {
    __setSnapshotForTests(simpleGraph());
    const result = await shortestPath("a", "c");
    expect(result.cost).toBe(2); // 1 + 1
    expect(result.hops).toBe(2);
  });

  it("reports one edge per hop, carrying the weight used", async () => {
    __setSnapshotForTests(simpleGraph());
    const result = await shortestPath("a", "d");
    expect(result.edges).toHaveLength(3);
    expect(result.edges.map((e) => e.weight)).toEqual([1, 2, 1]);
    // Each edge should join the two nodes either side of it in the path.
    expect(result.edges[0]).toMatchObject({ from: "a", to: "b" });
    expect(result.edges[2]).toMatchObject({ from: "e", to: "d" });
  });

  it("returns a null path across disconnected components", async () => {
    __setSnapshotForTests(simpleGraph());
    // g and h form their own component; nothing reaches a-f.
    const result = await shortestPath("a", "g");
    expect(result.path).toBeNull();
    expect(result.cost).toBe(0);
  });

  it("returns a null path to a node with no edges", async () => {
    __setSnapshotForTests(simpleGraph());
    const result = await shortestPath("a", "i");
    expect(result.path).toBeNull();
  });

  it("returns the node itself, at zero cost, for self-to-self", async () => {
    __setSnapshotForTests(simpleGraph());
    const result = await shortestPath("a", "a");
    expect(ids(result)).toEqual(["a"]);
    expect(result.cost).toBe(0);
    expect(result.hops).toBe(0);
  });

  it("returns a null path when a node does not exist", async () => {
    __setSnapshotForTests(simpleGraph());
    const result = await shortestPath("a", "nobody");
    expect(result.path).toBeNull();
  });

  it("terminates on a cycle without revisiting nodes", async () => {
    __setSnapshotForTests(cycleGraph());
    // x-z is a direct edge, so the answer is one hop rather than x-y-z.
    const result = await shortestPath("x", "z");
    expect(ids(result)).toEqual(["x", "z"]);
    expect(result.hops).toBe(1);
  });

  it("is symmetric: reversing the endpoints reverses the path", async () => {
    __setSnapshotForTests(simpleGraph());
    const forward = await shortestPath("a", "f");
    const backward = await shortestPath("f", "a");
    expect(ids(backward)).toEqual([...ids(forward)].reverse());
    expect(backward.cost).toBe(forward.cost);
  });
});

describe("fewestHops (unweighted, BFS)", () => {
  it("takes the direct edge even when it is expensive", async () => {
    __setSnapshotForTests(simpleGraph());
    // The same pair Dijkstra routes around: a-d costs 8, but it is one hop.
    // This divergence is the entire reason both modes exist.
    const result = await fewestHops("a", "d");
    expect(ids(result)).toEqual(["a", "d"]);
    expect(result.hops).toBe(1);
  });

  it("disagrees with the weighted path on the same pair", async () => {
    __setSnapshotForTests(simpleGraph());
    const weighted = await shortestPath("a", "d");
    const hops = await fewestHops("a", "d");
    expect(hops.hops).toBeLessThan(weighted.hops);
    expect(ids(hops)).not.toEqual(ids(weighted));
  });

  it("finds the minimum hop count on a longer route", async () => {
    __setSnapshotForTests(simpleGraph());
    // a-b-c-f and a-d-e-f are both three hops; a-b-e-f is too. Whichever BFS
    // reaches first, the count is what matters here.
    const result = await fewestHops("a", "f");
    expect(result.hops).toBe(3);
    expect(ids(result)[0]).toBe("a");
    expect(ids(result).at(-1)).toBe("f");
  });

  it("returns a null path across disconnected components", async () => {
    __setSnapshotForTests(simpleGraph());
    const result = await fewestHops("a", "h");
    expect(result.path).toBeNull();
    expect(result.hops).toBe(0);
  });

  it("returns the node itself for self-to-self", async () => {
    __setSnapshotForTests(simpleGraph());
    const result = await fewestHops("b", "b");
    expect(ids(result)).toEqual(["b"]);
    expect(result.hops).toBe(0);
  });

  it("terminates on a cycle", async () => {
    __setSnapshotForTests(cycleGraph());
    const result = await fewestHops("x", "z");
    expect(result.hops).toBe(1);
  });
});

describe("egoNetwork", () => {
  it("returns only immediate neighbours at depth 1", async () => {
    __setSnapshotForTests(simpleGraph());
    const net = await egoNetwork("b", 1);
    const names = net.nodes.map((n) => n.id).sort();
    // b touches a, c and e.
    expect(names).toEqual(["a", "b", "c", "e"]);
  });

  it("widens to two hops at depth 2", async () => {
    __setSnapshotForTests(simpleGraph());
    const net = await egoNetwork("b", 2);
    const names = net.nodes.map((n) => n.id).sort();
    // Adds d (via e) and f (via c or e).
    expect(names).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("never crosses into another component", async () => {
    __setSnapshotForTests(simpleGraph());
    const net = await egoNetwork("a", 4);
    const names = net.nodes.map((n) => n.id);
    expect(names).not.toContain("g");
    expect(names).not.toContain("h");
    expect(names).not.toContain("i");
  });

  it("returns just the node itself when it has no edges", async () => {
    __setSnapshotForTests(simpleGraph());
    const net = await egoNetwork("i", 2);
    expect(net.nodes.map((n) => n.id)).toEqual(["i"]);
    expect(net.edges).toHaveLength(0);
  });

  it("includes every edge between the nodes it returns", async () => {
    __setSnapshotForTests(simpleGraph());
    const net = await egoNetwork("b", 1);
    const returned = new Set(net.nodes.map((n) => n.id));
    for (const edge of net.edges) {
      expect(returned.has(edge.from)).toBe(true);
      expect(returned.has(edge.to)).toBe(true);
    }
  });
});
