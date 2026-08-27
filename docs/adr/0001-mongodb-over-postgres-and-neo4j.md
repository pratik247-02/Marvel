# 0001 — MongoDB over Postgres and Neo4j

**Status:** accepted · 2026-08-21, revisited 2026-08-27 after re-benchmarking

## Context

The project's flagship is a relationship graph over the MCU: shortest path
between characters, ego networks, centrality. The obvious instinct on seeing
"graph" is to reach for a graph database.

The data is ~200 character nodes and ~750 edges. Serialized, the whole
adjacency structure is roughly 40 KB.

## Decision

Stay on MongoDB. Do not migrate to Postgres. Do not add Neo4j.

## Why

**At this size the datastore is not the variable.** `$graphLookup`, a Postgres
recursive CTE and a Cypher query all return in single-digit milliseconds
against 200 nodes. There is no performance argument for any of them, so a
migration costs weeks of rewriting working code to earn nothing measurable.

The benchmark makes this concrete. Naive `$graphLookup` p95 is ~35 ms, and
**~30 ms of that is two network round trips, not traversal** — a single
`findById` against the same cluster is ~10 ms. Swapping the query engine
underneath would leave the dominant cost untouched.

**Adding Neo4j is strictly worse than either.** It means a third datastore, a
dual-write consistency problem between it and MongoDB, and no free tier that
survives idle periods. The operational cost is real and immediate; the benefit
is hypothetical.

**The actual optimization was orthogonal to all of this**: load the adjacency
list into process memory and traverse it there, which removes the round trip
rather than making it faster. See [0002](0002-in-process-graph-cache.md).

## What was rejected

| Option | Why not |
|---|---|
| Postgres + recursive CTE | 2–3 weeks rewriting working code; the relational model buys nothing here, and the traversal was never the bottleneck |
| Neo4j alongside MongoDB | Third datastore, dual-write consistency, no viable free tier |
| Neo4j as the only store | Would force every non-graph query — lists, search, pagination — through a database chosen for one feature |

## What would change the answer

- **A graph that stops fitting in memory.** Around 10⁵–10⁶ nodes the snapshot
  approach breaks down and a real graph database earns its operational cost.
- **Traversals that are actually complex.** Variable-length pattern matching,
  or queries the in-process engine would have to reimplement badly, are what
  Cypher exists for.
- **Multi-instance writes.** The current design assumes one instance and
  admin-only writes. Horizontal scaling changes the cache story first, and
  possibly the datastore story after that.
- **A need for real joins across many entities.** That is the honest argument
  for Postgres, and it is about the rest of the schema, not the graph.

## Consequence worth stating

Sizing the problem before picking the tool is the whole decision here. The
uncomfortable part is that it produces a less impressive-sounding answer than
"I deployed Neo4j" — and it is still the right one.
