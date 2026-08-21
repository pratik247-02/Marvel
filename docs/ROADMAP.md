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

It should also *look* like a Marvel product. Each entity carries its own colour
theme in the database, and the interface is meant to take on that identity as
you move through it — Iron Man's page in red and gold, Hulk's in green and
purple. A reference site that feels generic undersells the data behind it.

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
- [x] Add `slug` (unique, indexed) to all five content models
- [x] Migration `001-backfill-slugs` for documents seeded before the field existed
- [x] Compound indexes for real query patterns
- [ ] TMDB integration for movie metadata and character portraits
- [ ] Commit TMDB responses as fixtures so seeding needs no API key
- [ ] Expand the curated relationship data to ~60 characters / ~50 battles
- [ ] TMDB attribution in the footer (required by their terms)

**Where the data comes from, and why it is split.**

A public API cannot supply what this project is actually about. TMDB has movie
titles, posters, runtimes, box office and cast lists — the factual scaffolding.
It has no concept of character affiliations, power stats, battles, artifacts or
team rosters, and those are precisely the edges the Connection Engine traverses.
There is no public API that models them, which is the reason this project is not
another thin wrapper over TMDB.

So the split is deliberate:

| Layer | Source | Why |
|---|---|---|
| Movie titles, posters, runtime, box office, cast | TMDB | Nobody differentiates on knowing Endgame runs 181 minutes |
| Character portraits | TMDB cast profiles | Cards currently render initials; real art changes the whole site |
| Affiliations, stats, battles, artifacts, teams | Hand-curated | The graph. Does not exist in any public API |

Using TMDB for the factual layer is not what would make the project generic —
having *only* that layer would be. The curated relationship data is the product.

The integration is also worth building on its own merits: an ETL that handles
429s with backoff and jitter, batches upserts, resolves foreign keys across two
passes and commits its responses as fixtures so CI never depends on a live third
party is a real artifact, and a more interesting one than a hardcoded file.

**Storage is not a constraint.** The current 48 documents occupy ~336 KB. At the
target size the whole dataset is 1-2 MB against Atlas M0's 512 MB, because text
is small and images are stored as URLs rather than bytes.

### Phase 2 — Connection Engine (flagship)

- [x] Implement naive `$graphLookup` traversal and **benchmark it first**
- [x] `modules/graph/`: adjacency snapshot, BFS shortest path, weighted Dijkstra
- [x] Ego network at depth N; degree and betweenness centrality
- [x] In-process cache, invalidated on write with a TTL backstop
- [x] Re-benchmark and record the before/after
- [x] Force-directed visualization (`ForceGraph.tsx`) — hand-rolled physics, SVG
- [x] `/explore` page — pick two characters, animate the path
- [ ] Focused unit tests on the graph algorithms (see note below)

**Sequencing note — visualization before tests.**

The original order put unit tests first, on the reasoning that a Dijkstra bug is
silent: a wrong path still looks like a path, so it will not announce itself the
way a crash does. That reasoning still holds and the tests are still planned.

They were moved after the visualization for two reasons. The engine is already
verified end to end against real data — every endpoint, every non-happy path,
and hand-checked routes such as Groot → Rocket → Thor → Tony — so it is not
running unverified. And the visualization is the demo: it is what makes the
project legible to anyone looking at it, and it exercises the API in ways that
surface problems a fixture graph would not.

**Scope of the tests, when they land.** Roughly a dozen focused tests on the
graph algorithms only, each with its reasoning written next to it. Not a broad
coverage target. The value is in testing the one part of the system with real
logic risk — the pure algorithms — and being able to explain every assertion.
Tests nobody can explain are worse than no tests, because they suggest the code
was not understood by the person shipping it.

Testing the algorithms first requires separating them from the data fetching:
they currently call `getGraph()` internally, so a test needs either a database
or a mock of Mongoose's chained query API. Extracting `dijkstra(graph, from, to)`
as a pure function over an adjacency map removes both. That refactor is part of
the test task.

### Phase 3 — Auth and hardening (admin only)

**Scope decision: admin-only for now.** No public registration and no
user-facing account features in this phase. Admin is deliberately a single
account rather than a role hierarchy — see Phase 8 for the full access model. The security hole worth closing is
that every write endpoint is currently open — anyone can `POST /api/characters`
or delete a movie — and locking those behind a role does that completely.
Public signup, favourites and saved queries are real features but they are
product scope rather than security scope, so they are deferred to Phase 8 to
keep this phase small enough to finish and defend.

- [x] `User` model — email, bcrypt hash (cost 12), `role`, `refreshTokenVersion`
- [x] `auth` module: login, refresh, logout, `GET /auth/me`
- [x] Access token (15 min) in memory; refresh token (7 d) in an httpOnly,
      secure, sameSite cookie. Replaces the current `localStorage` token read
      in `services/main/config.ts`, which is the standard XSS exposure.
- [x] Refresh rotation with reuse detection — replaying an old refresh token
      invalidates the whole family, on the assumption it was stolen
- [x] `authorize("admin")` on every POST/PATCH/DELETE. The middleware in
      `middlewares/auth.js` already exists and is unused, so this is wiring
- [x] Per-route rate limits — tighter on `/auth/login` than on reads; the
      current blanket 100/15min across `/api` is too coarse to reason about
- [x] Idempotency keys on POST, so a retried request cannot double-create
- [x] Optimistic concurrency via a `version` field → `409 Conflict` rather
      than silently clobbering a concurrent edit
- [x] `scripts/create-admin.js` to seed the first admin, since there is no
      signup path to bootstrap from
- [x] Minimal `/admin` UI — login plus character CRUD. Small on its own, but
      it is what Phase 5's optimistic-update work hangs off later

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

### Phase 5.5 — UI revamp and design system

The pages are structurally complete but visually generic — the palette is the
default shadcn greyscale, so `--primary` is white and the MARVEL logo renders
white rather than red. Meanwhile every character already carries its own
`theme.colorPrimary` / `colorSecondary` in the database, and nothing uses it
beyond a faint banner gradient. Closing that gap is the single biggest visual
win available.

**Design tokens**

- [x] Replace the greyscale palette with a Marvel-derived one; `--primary` becomes the red
- [x] Wire per-entity `theme` colors into CSS custom properties at the page level
- [x] Verify contrast ratios hit WCAG AA against the dark background
- [ ] Type scale and font pairing — a display face for headings, not Inter everywhere
- [ ] Consistent spacing, radius and elevation scales

**Character-themed pages**

- [x] Detail pages adopt the entity's own colors (Iron Man red/gold, Hulk green/purple)
- [x] Accent gradients, borders and stat bars derive from that theme
- [x] Fallback palette for entities with no theme set

**Components**

- [x] Card redesign — better image treatment, hover states, consistent aspect ratios
- [x] `PowerStats` as a radar/hexagon chart rather than plain bars
- [ ] `Timeline` as a real phase-by-phase visual, not a list
- [ ] Empty states, error states and 404 that match the design language
- [ ] Skeletons that mirror the shape of the content they replace

**Motion**

- [ ] Consistent easing and duration tokens instead of ad-hoc values per component
- [ ] Page transitions and shared-element movement into detail views
- [ ] Scroll-driven reveals on long pages
- [ ] Respect `prefers-reduced-motion` throughout

**Responsive and polish**

- [ ] Audit every page at 375 / 768 / 1440
- [ ] Mobile navigation pass
- [ ] Real favicon, OG images and social preview cards
- [ ] Focus-visible states and keyboard navigation
- [ ] Landing page rework — the video-mask effect is a placeholder

### Phase 6 — Testing and CI/CD

- [ ] Vitest, starting with the graph algorithm tests from Phase 2
- [ ] Supertest on the route layer: non-happy paths first (400/401/403/404),
      since those are the ones that actually regress
- [ ] `mongodb-memory-server` for service-layer tests, so they run against a
      real mongod rather than a mock of Mongoose's query API
- [ ] Full CI pipeline with branch protection
- [ ] Multi-stage Dockerfile + `docker-compose.yml`
- [ ] Deploy: Vercel + Render/Fly + Atlas

**On coverage targets.** No percentage goal is set here deliberately. A number
invites writing tests to move the number, which is how suites fill up with
assertions on presentational components that cannot meaningfully fail. The
useful question is which code would fail silently if it were wrong — the graph
algorithms, the weighting model, the ETL's idempotency — and that list is short
and worth testing properly. Whatever percentage falls out of that is the
honest number to report.

Playwright is deliberately not listed. End-to-end browser tests are the most
expensive kind to write and maintain, and with a single-developer project that
has no regression history yet, they would be machinery without a problem to
solve. Worth revisiting once the UI has stabilized.

### Phase 8 — User accounts (deferred from Phase 3)

Public-facing account features, split out of Phase 3 so that phase stayed
scoped to closing the open-writes hole. Everything here is product surface
rather than security, and none of it blocks a deploy.

**The access model, in three tiers.** This is the shape the whole product
follows — browse freely, sign in to participate, one owner edits.

| Tier | Who | Can do |
|---|---|---|
| Visitor | Anyone, no account | Browse everything: characters, movies, battles, teams, artifacts, the Connection Engine and `/explore`. Nothing is paywalled or hidden behind a login. |
| User | Signed in | Everything a visitor can, plus taking quizzes with saved results, favourites, and saved graph queries |
| Admin | The owner, one account | Everything a user can, plus creating, editing and deleting content |

Two things follow from that and are worth stating so they are not
re-litigated later:

**Reads are never gated.** The point of a reference site is that people can
read it. Requiring an account to view a character page would cost every
first-time visitor and buy nothing. Sign-in unlocks *participation* — the
features that need somewhere to store your state — not access.

**Admin is a single account, not a hierarchy.** The `role` field already
supports `admin` and `user` and that is where it stops. There are no
moderators, no per-resource permissions, no invite flow, no admin-managing-
admins screen. Those solve a problem this project does not have: one person
maintains the content. A permissions system with one admin in it is
scaffolding pretending to be architecture.

- [ ] Public registration, with the same password policy the CLI enforces
- [ ] Sign-in and sign-up UI, distinct from `/admin/login`
- [ ] Quiz results saved per user, with history
- [ ] Favourite characters, teams and artifacts
- [ ] Saved graph queries — a user's own "six degrees" lookups
- [ ] Rate limits and abuse protection on the public signup path
- [ ] Prompt-to-sign-in when an anonymous visitor hits a gated action,
      rather than a hard redirect that loses what they were doing

### Phase 7 — Polish and documentation

- [ ] README rewrite with architecture diagram and live demo link
- [ ] `docs/adr/` — five architecture decision records
- [ ] OpenAPI spec + Swagger UI at `/api/docs`
- [ ] Lighthouse and accessibility pass
- [ ] Optional: deterministic battle simulator with seeded RNG

---

## Benchmarks

### Baseline — naive `$graphLookup`, measured 2026-08-21

Shortest path Groot → Tony Stark (a genuine 3-hop route), measured at the
service layer rather than over HTTP so the numbers reflect query and algorithm
cost without Express and JSON serialization mixed in.

Node v22.22.2, concurrency 1, 18 character nodes / 105 edges.
Local: 200 iterations, 50 warmup. Atlas: 100 iterations, 30 warmup.

| Traversal | Local p95 | Atlas p95 |
|---|---|---|
| `shortestPath` maxDepth=2 | 2.6 ms | 22.7 ms |
| `shortestPath` maxDepth=3 | 2.6 ms | 32.8 ms |
| `shortestPath` maxDepth=4 | 2.8 ms | 31.6 ms |
| `shortestPath` maxDepth=6 | 2.7 ms | 21.6 ms |
| *context:* `findById` | 0.6 ms | 10.3 ms |
| *context:* find all + populate | 2.7 ms | 29.8 ms |

### Result — in-process adjacency snapshot

The original premise, that naive `$graphLookup` would cost 200-350 ms and an
in-memory BFS would be a 20-40x win, **did not hold at this data size**. At 18
nodes `$graphLookup` against a local mongod is ~2 ms; the algorithm was never
the bottleneck.

The real cost is the **network round trip**. A single `findById` against Atlas
is ~10 ms and the naive traversal issues two queries, which is essentially the
whole ~22 ms. So the optimization that mattered was not beating `$graphLookup`
but not crossing the network at all for a graph that fits in memory.

Measured 2026-08-21, Atlas, Node v22.22.2, concurrency 1, path Groot -> Tony
Stark. Naive: 100 iterations / 30 warmup. Engine: 2000 iterations / 200 warmup
(the coarser harness could not resolve sub-millisecond timings).

| Traversal | p95 | vs naive |
|---|---|---|
| Naive `$graphLookup` maxDepth=2 | 24.2 ms | baseline |
| Naive `$graphLookup` maxDepth=4 | 28.6 ms | baseline |
| **Engine — Dijkstra (weighted)** | **0.027 ms** | **~900x** |
| **Engine — BFS (fewest hops)** | **0.006 ms** | **~4000x** |
| Engine — cold rebuild + path | 27.1 ms | ~1x |

Snapshot build: 18 nodes, 84 edges, 12-27 ms against Atlas (5 concurrent
queries). The cold-rebuild row is the honest caveat: the first request after a
write or a restart pays the full rebuild, which costs about the same as one
naive traversal. Every subsequent request inside the TTL is essentially free.

The speedup is large because it is a comparison between doing I/O and not doing
I/O, not between two algorithms. That distinction is the point.

Harness: `node scripts/bench/graph-bench.js [--uri ...] [--iterations N] [--warmup N]`
