# MCU Hub

A catalogue of the Marvel Cinematic Universe — every film, character, team,
battle and artifact — with a graph traversal engine underneath that connects
them all.

**Live:** [marvel-six-lake.vercel.app](https://marvel-six-lake.vercel.app) ·
**API:** [marvel-api-mueo.onrender.com](https://marvel-api-mueo.onrender.com/health)

> The API runs on a free tier that sleeps after 15 minutes idle. The first
> request may take ~50 seconds while it wakes. Every request after that is
> fast. This was a deliberate choice over $7/month for a portfolio project.

---

## The interesting part

Ho Yinsen died in a cave in 2008. Galactus eats planets. This site will tell
you they are four steps apart, and show you every one:

```
Ho Yinsen → Tony Stark → Stephen Strange → Reed Richards → Galactus
```

That is `GET /api/graph/path?from=ho-yinsen&to=galactus`, and it returns in
**0.2 ms** at p95 — because the traversal never touches the database.

### What was actually built

The graph is 193 nodes and 755 edges: about 40 KB of adjacency data. The
engine loads it into process memory once and serves BFS, weighted Dijkstra,
ego networks and betweenness centrality from there, rebuilding on write with a
5-minute TTL as a backstop.

| Traversal | p50 | p95 | vs naive |
|---|---|---|---|
| Naive `$graphLookup` | 30.6 ms | 34.7 ms | baseline |
| **Dijkstra (weighted)** | 0.1 ms | **0.2 ms** | ~175× |
| **BFS (fewest hops)** | 0.007 ms | **0.008 ms** | ~4000× |
| Cold rebuild + path | 26.0 ms | 28.9 ms | ~1× |

*Node v22, concurrency 1, Atlas M0, 100 iterations / 30 warmup, measured at the
service layer. Harness: `node scripts/bench/graph-bench.js`.*

**The premise I started with was wrong.** The plan predicted naive
`$graphLookup` would cost 200–350 ms and an in-memory BFS would win by 20–40×.
Reality was ~30 ms and ~175×: wrong in both directions.

The reason is that the algorithm was never the bottleneck — **the network round
trip was**. A single `findById` against Atlas is ~10 ms and the naive traversal
issues two queries, which is essentially the whole 30 ms.

Scaling the dataset 10× confirmed it:

| | growth |
|---|---|
| Edges | 7.2× |
| **Dijkstra p95** | **7.4×** |
| Naive p95 | 1.4× |

Dijkstra tracked edge growth within 3%, which is what an algorithm doing real
work over a graph should do. Naive barely moved, because the number of round
trips did not change when the graph got ten times bigger.

So the headline is a comparison between doing I/O and not doing I/O, not
between two algorithms. Full method in
[docs/ROADMAP.md § Benchmarks](docs/ROADMAP.md#benchmarks); design in
[docs/GRAPH.md](docs/GRAPH.md).

---

## Decisions, and what would change them

Five [architecture decision records](docs/adr/), each naming what was rejected
and the threshold that would reverse it.

| # | Decision | Rejected |
|---|---|---|
| [0001](docs/adr/0001-mongodb-over-postgres-and-neo4j.md) | Stay on MongoDB | Postgres, Neo4j |
| [0002](docs/adr/0002-in-process-graph-cache.md) | In-process snapshot | Redis |
| [0003](docs/adr/0003-jwt-rotation-with-reuse-detection.md) | Rotation + reuse detection | Long-lived JWT in `localStorage` |
| [0004](docs/adr/0004-testing-philosophy.md) | No coverage target | A percentage goal |
| [0005](docs/adr/0005-committed-etl-fixtures.md) | Committed fixtures | Live API calls at seed time |

**Why no Neo4j** is the one worth reading. At 200 nodes, `$graphLookup`, a
Postgres recursive CTE and a Cypher query all return in single-digit
milliseconds. There is no performance argument for any of them, so migrating
costs weeks to earn nothing measurable — and adding Neo4j alongside MongoDB
buys a third datastore and a dual-write consistency problem. I would revisit
at ~10⁵ nodes, when the graph stops fitting in memory.

---

## Stack

**Frontend** — Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
· Framer Motion

**Backend** — Node 22 · Express 4 · Mongoose 8 · Zod · Winston · JWT

**Data** — MongoDB Atlas · TMDB and the MCU Fandom wiki, via committed ETL
fixtures

**Deployed on** — Vercel (frontend) · Render (API) · Atlas M0

---

## Layout

Vertical slices, not layers. Each backend module owns its model, service,
controller, routes and validators, so a feature is one directory rather than
five files in five folders.

```
backend/src/
├── modules/
│   ├── graph/          # the connection engine
│   ├── characters/     ├── movies/      ├── battles/
│   ├── teams/          ├── artifacts/   ├── quiz/
│   └── auth/
├── middlewares/        # auth, validation, error handling
└── utils/              # response helpers, logger, slug

backend/scripts/
├── etl/                # fetchers + committed fixtures
├── bench/              # benchmark harness
├── migrations/
└── seed.js

frontend/
├── app/                # routes
├── components/         # blocks/ (composed) + ui/ (primitives)
└── modules/            # per-domain services, hooks and types
```

---

## Running it

**Requires** Node 22+ and a MongoDB connection string.

```bash
git clone https://github.com/pratik247-02/Marvel.git && cd Marvel

# backend
cd backend
npm install
cp .env.example .env          # set MONGO_URI and JWT_SECRET
npm run seed                  # 193 characters, 38 films, 77 artifacts…
npm run dev                   # :5000

# frontend
cd ../frontend
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL
npm run dev                   # :3000
```

**The seed needs no API key.** The ETL fetchers are separate programs whose
output is committed as fixtures, so a fresh clone produces the full dataset —
artwork included — without ever making a network request. That is
[ADR 0005](docs/adr/0005-committed-etl-fixtures.md).

### Useful commands

```bash
npm run validate              # assert every seed reference resolves
npm test                      # graph algorithm suite
node scripts/bench/graph-bench.js
npm run tmdb:fetch            # refresh a fixture (needs a TMDB key)
```

---

## API

```
GET  /api/graph/path?from=<slug>&to=<slug>    shortest path, with edges
GET  /api/graph/network/:ref?depth=n          ego network
GET  /api/graph/stats                         centrality, components
GET  /api/graph/full                          the whole graph
POST /api/graph/rebuild                       force a snapshot rebuild (admin)

GET  /api/characters  /movies  /teams  /battles  /artifacts  /quiz
POST /api/auth/login  /refresh  /logout
GET  /health                                  status + database state
```

Writes require `admin`. Reads are never gated — requiring an account to view a
character page would cost every first-time visitor and buy nothing.

---

## Testing

21 tests against the graph algorithms, on a hand-verified 9-node fixture.
**Verified by mutation**: three deliberate bugs were injected — an off-by-one
in the hop count, a reversed comparison in weight relaxation, a skipped
visited-set check — to confirm the suite actually fails when the code is wrong.
A test that cannot fail is decoration.

No coverage percentage is targeted, and [ADR 0004](docs/adr/0004-testing-philosophy.md)
explains why: a number invites writing tests to move the number. The tests that
exist cover the code that would fail *silently* — a shortest-path bug does not
throw, it returns a plausible wrong answer.

Route-level tests (401/403/400 paths) are the next thing to write and are
honestly absent today.

---

## Deliberately not built

Each of these was considered and rejected; the threshold that would change the
answer is in the linked ADR or stated here.

| | Why not |
|---|---|
| Neo4j / Postgres migration | Weeks of work, zero measurable gain at 200 nodes ([0001](docs/adr/0001-mongodb-over-postgres-and-neo4j.md)) |
| Redis | Nothing to share until there is a second instance ([0002](docs/adr/0002-in-process-graph-cache.md)) |
| Elasticsearch | Infrastructure with no problem behind it at 200 documents |
| Vector / semantic search | Cosine similarity over 200 short documents is a `for` loop |
| Microservices, queues | Actively negative signal at this scale |
| GraphQL alongside REST | Two API surfaces, one story |

---

## Known limitations

Stated because a project with no known limitations is one nobody has examined.

- **Cold start** — free tier, ~50 s to wake after 15 minutes idle
- **Cache invalidation has holes** — writes through the raw MongoDB driver
  bypass the Mongoose hooks, and invalidation is process-local. The 5-minute
  TTL is the mitigation, and both are documented in
  [ADR 0002](docs/adr/0002-in-process-graph-cache.md)
- **Single instance assumed** — two instances can disagree for up to five
  minutes after a write
- **37 of 48 components are client components.** The App Router is doing less
  than it could; converting pages to server components is planned and honest to
  count today
- **Three teams have no image** — they are groupings this project curates
  rather than articles the source wiki carries

---

## Docs

| | |
|---|---|
| [GRAPH.md](docs/GRAPH.md) | The connection engine: edge weights, algorithms, force layout |
| [DATABASE.md](docs/DATABASE.md) | Schema and indexing |
| [ROADMAP.md](docs/ROADMAP.md) | Phases, benchmarks, everything still open |
| [adr/](docs/adr/) | Architecture decision records |

---

Data from [TMDB](https://www.themoviedb.org/) and the
[MCU Wiki](https://marvelcinematicuniverse.fandom.com/) (CC-BY-SA). Marvel
characters and imagery are the property of Marvel Studios. This is a
non-commercial fan project.
