# 0002 — In-process adjacency snapshot over Redis

**Status:** accepted · 2026-08-21, benchmarks updated 2026-08-27

## Context

Every graph endpoint — shortest path, ego network, centrality — needs the full
adjacency structure. Rebuilding it from MongoDB on each request costs five
queries and ~30 ms against Atlas, which is essentially all of the response
time.

The whole structure is ~200 nodes and ~750 edges: roughly 40 KB.

## Decision

Build the adjacency snapshot once, hold it in a module-level variable, and
serve every traversal from memory. Invalidate on write via Mongoose `post`
hooks, with a 5-minute TTL as a backstop.

No Redis.

## Why not Redis

The only honest case for Redis here is sharing the cache across instances, and
that requires more than one instance to exist. Adding it today means running
another service, serializing and deserializing on every access, and paying a
network hop — to cache something that is 40 KB and already local.

Redis becomes the right answer the moment this runs on more than one instance,
and not before.

## Measured effect

| | p95 |
|---|---|
| Naive `$graphLookup` | 34.7 ms |
| Dijkstra from snapshot | 0.2 ms |
| BFS from snapshot | 0.008 ms |
| Cold rebuild + path | 28.9 ms |

The speedup is a comparison between doing I/O and not doing I/O, not between
two algorithms. Full method and scaling analysis in
[ROADMAP.md § Benchmarks](../ROADMAP.md#benchmarks).

## Known holes

Stated deliberately, because a cache design with no known holes is one that has
not been examined hard enough.

**1. Writes through the raw driver do not invalidate.** The hooks cover the
Mongoose write methods — `save`, `findOneAndUpdate`, `updateOne`, `updateMany`,
`deleteOne`, `deleteMany`, `insertMany`. Anything reaching the collection
underneath Mongoose (`mongoose.connection.collection(...)`, or a change made
directly in Atlas) is invisible to them. The migration scripts in
`scripts/migrations/` do exactly this. **Mitigation:** the 5-minute TTL, and
those scripts run against a service that is restarted afterwards.

**2. Invalidation is process-local.** The hooks fire in the process that
performed the write. A second instance keeps serving its own snapshot until its
TTL expires, so two instances can disagree for up to five minutes after a
write. **Mitigation:** one instance, and writes are admin-only. This is the
constraint that Redis would lift.

**3. The first request after a write or restart pays the rebuild.** ~25–33 ms,
about the cost of one naive traversal. On the deployed free tier this stacks on
top of the platform's own ~50 s cold start.

## What would change the answer

- **More than one instance.** Then Redis, or a pub/sub invalidation channel.
- **User-generated writes.** Admin-only writes are what make a 5-minute window
  of staleness acceptable; content people edit themselves is not.
- **A graph that stops fitting comfortably in memory** — see
  [0001](0001-mongodb-over-postgres-and-neo4j.md).
