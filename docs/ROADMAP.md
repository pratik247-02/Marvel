# Marvel MCU Hub — Roadmap

## Motive

An interconnected encyclopedia of the Marvel Cinematic Universe, where characters,
movies, battles, teams and artifacts are all linked to one another rather than
sitting in isolated tables.

The MCU is genuinely graph-shaped: a character appears in movies, fights in
battles, belongs to teams, and wields artifacts — and every one of those is a
many-to-many relationship. That makes the interesting questions the ones a plain
`SELECT *` cannot answer:

- How is Groot connected to Daredevil, and through whom?
- Who has Thor fought alongside, and in which battles?
- Which artifacts changed hands most often, and when?
- Who is the bridge between the Guardians and the Avengers?

The flagship feature is the **Connection Engine** — shortest-path traversal
across that graph — and the rest of the project exists to make it fast,
correct, observable and deployable.

---

## Architecture decisions

**MongoDB stays.** The full graph is ~200 nodes and ~1,500 edges — about 40KB of
JSON. At that size `$graphLookup`, a Postgres recursive CTE, and a Neo4j Cypher
query all return in single-digit milliseconds, so there is no performance
argument for migrating. The graph is small enough to load into process memory
and traverse with plain BFS, which is both faster and simpler than adding a
second datastore.

**No Redis for now.** In-process caching is the honest answer at single-instance
scale. Redis earns its place only for the rate limiter under horizontal scaling.

**Considered and rejected**, each with the threshold that would change the answer:

| Option | Why not | Would revisit at |
|---|---|---|
| Postgres / Neo4j migration | No measurable gain at 200 nodes | ~50k+ nodes |
| Elasticsearch / Meilisearch | No problem to solve at 200 docs | ~50k+ documents |
| Vector / semantic search | Cosine similarity over 200 docs is a `for` loop | Large corpus, fuzzy intent |
| Realtime multiplayer quiz | An entire second system | Once the core is done |
| Virtualized lists | 100 rows render fine | ~1,000+ rows |
| GraphQL alongside REST | Two API surfaces to maintain | Diverse client needs |

---

## Phases

### Phase 0 — Stabilize ✅

- [x] Fix response-helper mismatch (`success`/`created`/`noContent`/`paginated` aliases)
- [x] Fix `validate.js` to parse the `{ body, params, query }` envelope
- [x] Wire all six frontend services to the axios layer
- [x] Add `apiGetPaginated`, normalizing `totalPages` → `pages`
- [x] Fix unstable `initialParams` dep in all four list hooks
- [x] Populate `next.config.ts` `images.remotePatterns`
- [x] Delete dead stub directories and the `marvel` self-dependency
- [x] CI skeleton: lint + typecheck + build on Node 20 and 22

### Phase 1 — Data foundation

- [x] Curated seed dataset (18 characters, 9 movies, 9 artifacts, 3 teams, 9 battles)
- [x] Idempotent loader with two-pass FK resolution and batched `bulkWrite`
- [x] `--dry-run`, `--purge` and `--uri` flags
- [x] Seeded to MongoDB Atlas and verified end to end
- [ ] Add `slug` (unique, indexed) to all five content models
- [ ] TMDB integration for posters, runtime, box office and cast
- [ ] Expand to ~100 characters / ~35 movies / ~50 battles
- [ ] Commit TMDB responses as fixtures so seeding needs no API key
- [ ] Compound indexes for real query patterns

### Phase 2 — Connection Engine (flagship)

- [ ] Implement naive `$graphLookup` traversal and **benchmark it first**
- [ ] `modules/graph/`: adjacency snapshot, BFS shortest path, weighted Dijkstra
- [ ] Ego network at depth N; degree and betweenness centrality
- [ ] In-process cache, invalidated on write with a TTL backstop
- [ ] Re-benchmark and record the before/after
- [ ] Unit tests: unreachable pairs, self-to-self, cycles, disconnected components
- [ ] Upgrade `RelationshipGraph.tsx` to a real force-directed visualization
- [ ] `/explore` page — pick two characters, animate the path

### Phase 3 — Auth and hardening

- [ ] `User` model and auth module
- [ ] Access token in memory, refresh token in an httpOnly cookie
- [ ] Refresh rotation with reuse detection
- [ ] `authorize("admin")` on all writes (currently wide open)
- [ ] Per-route rate limits
- [ ] Idempotency keys on POST
- [ ] Optimistic concurrency → `409 Conflict`
- [ ] Minimal `/admin` UI

### Phase 4 — Search, caching, observability

- [ ] Single-round-trip `$facet` faceted search
- [ ] `lru-cache` on list endpoints with tag-based invalidation
- [ ] `ETag` + `Cache-Control` on detail endpoints
- [ ] `AsyncLocalStorage` request IDs through every log line
- [ ] `prom-client` `/metrics` with cache hit/miss counters
- [ ] Benchmark harness with documented methodology

### Phase 5 — Frontend architecture

- [ ] Convert pages to server components, push `"use client"` to leaves (29/34 today)
- [ ] `loading.tsx` / `error.tsx` per segment; `<Suspense>` streaming
- [ ] ISR with `generateStaticParams` + on-demand `revalidateTag`
- [ ] TanStack Query for client islands; optimistic updates with rollback
- [ ] URL-as-state for filters
- [ ] Slug routing (`/characters/tony-stark`)
- [ ] Measure the client-JS bundle delta

### Phase 6 — Testing and CI/CD

- [ ] Vitest + Supertest + mongodb-memory-server
- [ ] ~95% on graph algorithms, ~70% overall
- [ ] Non-happy paths: 401, 403, malformed ids, out-of-range pages
- [ ] 5 Playwright end-to-end specs
- [ ] Full CI pipeline with coverage upload and branch protection
- [ ] Multi-stage Dockerfile + `docker-compose.yml`
- [ ] Deploy: Vercel + Render/Fly + Atlas

### Phase 7 — Polish and documentation

- [ ] README rewrite with architecture diagram and live demo link
- [ ] `docs/adr/` — five architecture decision records
- [ ] OpenAPI spec + Swagger UI at `/api/docs`
- [ ] Lighthouse and accessibility pass
- [ ] Optional: deterministic battle simulator with seeded RNG

---

## Benchmarks

Numbers go in once measured — not before.

| Endpoint | Naive `$graphLookup` | + indexes | + adjacency cache |
|---|---|---|---|
| `/api/graph/path` p95 | | | |
| `/api/characters` p95 | | | |

Record alongside each run: hardware, concurrency, duration and warmup.
