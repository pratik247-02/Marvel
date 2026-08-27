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
- [x] Delete dead stub directories and the `marvel` self-dependency (it
      survived in both lockfiles until the CI fix in `49eda12`)
- [x] CI skeleton: lint + typecheck + build on Node 20 and 22

### Phase 1 — Data foundation ✅

- [x] Curated seed dataset (193 characters, 38 movies, 9 artifacts, 20 teams, 64 battles)
- [x] Idempotent loader with two-pass FK resolution and batched `bulkWrite`
- [x] `--dry-run`, `--purge` and `--uri` flags
- [x] Seeded to MongoDB Atlas and verified end to end
- [x] Add `slug` (unique, indexed) to all five content models
- [x] Migration `001-backfill-slugs` for documents seeded before the field existed
- [x] Compound indexes for real query patterns
- [x] TMDB integration for movie metadata and character portraits
- [x] Actor credits from TMDB — 188/193 matched. Credits read "Rhodey",
      "Yinsen", "Agent Coulson", so exact matching missed a third of the cast;
      the script scores candidates and reports every weak match by name, which
      caught Ava Starr resolving to her *father* on a shared surname. Stored on
      a separate `actor` field, never as the character image
- [x] Commit TMDB responses as fixtures so seeding needs no API key
- [x] Expand the curated relationship data to 190 characters across every
      MCU cluster; graph is one connected component, 463 edges
- [x] Expand battles and teams to match — 21 teams and 63 battles, taking the
      graph from 463 to 709 edges (62% affiliation, 20% team, 16% battle)
- [x] TMDB attribution in the footer (required by their terms)

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
| Character portraits | MCU Fandom wiki | TMDB has no character art at all; Marvel's own API is shut down |
| Affiliations, stats, battles, artifacts, teams | Hand-curated | The graph. Does not exist in any public API |

**Portraits are not fully automatic — new characters must be checked by hand.**

`scripts/etl/fetch-portraits.js` reads a `PAGE_TITLES` map because the wiki
titles pages by the name currently in use, which frequently is not the curated
name. Four of the first eighteen already needed an explicit entry: Bruce Banner
lives at "Hulk", Bucky Barnes at "Winter Soldier", Sam Wilson at "Falcon",
Shuri at "Princess Shuri".

One case is worse than a miss and is the reason this needs eyes rather than a
green tick. Searching "Black Widow" returns **Yelena Belova**, because she took
the mantle — a wrong portrait that looks perfectly fine until somebody notices.
A miss is loud; a wrong match is silent.

So whenever characters are added or renamed:

- [x] Re-run `npm run portraits:dry` and read the output rather than the count
- [x] Add a `PAGE_TITLES` entry for anything reported as MISS — five needed one
      (High Evolutionary, Kurt Goreshter, Supreme Intelligence, Dreykov, X-23)
- [ ] Open the resulting images and confirm each is the right character,
      paying attention to any name another character has since inherited.
      190/190 matched with zero duplicate files, and the known mantle traps were
      checked by filename, but no one has eyeballed all 190 yet
- [x] Re-run `npm run tmdb:fetch` if the movie list changed

TMDB is deliberately never consulted for character images. Its cast records
carry `profile_path`, which is a photo of the actor — using it put Vin Diesel's
headshot on Groot. That is recorded in the ETL so it is not reintroduced.

Using TMDB for the factual layer is not what would make the project generic —
having *only* that layer would be. The curated relationship data is the product.

The integration is also worth building on its own merits: an ETL that handles
429s with backoff and jitter, batches upserts, resolves foreign keys across two
passes and commits its responses as fixtures so CI never depends on a live third
party is a real artifact, and a more interesting one than a hardcoded file.

**Storage is not a constraint.** The current 48 documents occupy ~336 KB. At the
target size the whole dataset is 1-2 MB against Atlas M0's 512 MB, because text
is small and images are stored as URLs rather than bytes.

### Phase 2 — Connection Engine (flagship) ✅

- [x] Implement naive `$graphLookup` traversal and **benchmark it first**
- [x] `modules/graph/`: adjacency snapshot, BFS shortest path, weighted Dijkstra
- [x] Ego network at depth N; degree and betweenness centrality
- [x] In-process cache, invalidated on write with a TTL backstop
- [x] Re-benchmark and record the before/after
- [x] Force-directed visualization (`ForceGraph.tsx`) — hand-rolled physics, SVG
- [x] `/explore` page — pick two characters, animate the path
- [x] Focused unit tests on the graph algorithms — 21 tests against a
      hand-verified nine-node fixture, wired into CI, and checked by injecting
      three deliberate bugs to confirm they actually fail

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

### Phase 3 — Auth and hardening (admin only) ✅

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
- [ ] `prom-client` `/metrics` with cache hit/miss counters. Note that Atlas M0
      blocks `serverStatus`, so database-level gauges are not available — the
      metrics have to come from the application layer
- [ ] Benchmark harness with documented methodology
- [ ] **Explicit Mongoose connection options.** `src/index.js` currently calls
      `mongoose.connect(config.mongoUri)` with no options at all, which takes
      Mongoose's default pool of 100 against M0's hard limit of 500 concurrent
      connections. One instance is fine; two instances, an overlapping deploy,
      or a restart that does not drain will exhaust it. This is not a
      user-count problem — it can bite at five users — so it is worth fixing
      before user accounts land:

      ```js
      await mongoose.connect(config.mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      ```

      **Measured 2026-08-25, so the sizing argument is not guesswork:** the
      whole content dataset is 1.86 MB of the 512 MB free tier. Projecting 500
      users with profiles, ~25 favourites, ~40 quiz results and ~15 saved graph
      queries each — including index overhead — comes to roughly 23 MB, about
      4.5%. Around 9,500 users would reach 80%. Storage is not what breaks on
      M0; connections and shared CPU are, which is why the fix is pool
      configuration rather than a migration.

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

**Per-page work** — tracked here as each page is reworked, on `feat/ui-revamp`

- [x] `/home` — hero removed (it restated the header and cost most of a
      viewport), `AboutCta` added in its place. The section is two halves
      separated by a rule: what the site is, with a route into `/explore`; then
      who built it, with a contact action. Written as a server component with
      CSS hover states rather than framer-motion, which is the pattern new
      components should follow
- [x] Footer reduced from a four-column link block to a single attribution
      line. The TMDB "not endorsed or certified" wording and the MCU Wiki
      CC BY-SA notice are both required, so they are carried on link `title`
      attributes rather than dropped
- [x] Removed forced heights from the layout chain. `PageWrapper` set
      `min-h-screen` and `/home` set it again, so every page was at least two
      viewports tall regardless of content, leaving an empty band above the
      footer. Normal flow already places the footer after the content; nothing
      needs to pin it
- [x] `/characters`, `/movies`, `/teams`, `/battles`, `/antiques` — banner
      removed, numbered pagination replaced with infinite scroll, search
      debounced instead of submit-only, grids widened to four columns. Sorting
      is server-side: alphabetical for characters, teams and artifacts, release
      year for movies, and film order for battles, since a saga read
      alphabetically starts at Ant-Man
- [x] One `useInfiniteList` hook for all five, rather than five copies of the
      same race conditions. Guards a stale response with a request id and a
      concurrent load with an in-flight ref
- [x] `/movies/[id]`, `/teams/[id]`, `/battles/[id]`, `/antiques/[id]` — all four
      still used HeroBanner, which reserved `min-h-[58vh]` and rendered its
      image at `opacity-40` behind a blur. Replaced by one shared
      `DetailHeader`: art, title, prose and facts, generalised across the four
      because they share a shape. The banners were also duplicating content —
      movies printed the title three times and the poster twice (blurred, then
      real), artifacts showed origin and status in both prose and FactList —
      so the FactList blocks went with them. Battles have no art of their own
      and now use the poster of the film they happened in
- [x] `/explore` — the flagship opened with 58vh of banner above a canvas
      already sized `viewport - chrome`, so the graph was competing with
      decoration for height. Replaced with a compact header. ForceGraph now
      *measures* the chrome above it rather than hardcoding 260px, which was
      calibrated against the banner and silently wrong once it went
- [x] `/contact` — banner replaced with a compact header. Its copy was also
      first-person-plural ("we'd love to hear from you", "Send us a message")
      on a personal portfolio whose /home about section is first person, and
      its About card duplicated /home's description in the generic marketing
      tone that copy had already been rewritten away from
- [x] Contact form validation — name and email required, subject optional
      (it was marked `required` in the markup), message required at 30+
      characters with a live counter. Errors show on blur rather than while
      typing, submit focuses the first invalid field, and each message is
      wired to its input with `aria-describedby` + `role="alert"`
- [x] Contact form actually sends. `handleSubmit` was a 1500ms `setTimeout`
      reporting success, so every message was silently discarded while
      thanking the sender. Now POSTs to Web3Forms (250/mo free, unlimited
      forms — Getform's free tier is one form and was already spent), with a
      honeypot read from the form rather than hardcoded, a 15s timeout, and
      failure treated as failure: Web3Forms signals errors in the body, so a
      200 carrying `success: false` is an error too. Falls back to a mailto
      link in both the error and unconfigured states
- [ ] `NEXT_PUBLIC_WEB3FORMS_KEY` must be set in the deploy host's environment
      — `.env.local` is not deployed. Also needs adding to `frontend/.env.example`
- [ ] `/quiz` — not yet reworked. The last HeroBanner consumer, using it four
      times across the quiz's states, so it cannot be deleted until this is done
- [x] Character detail page — the banner stretched the portrait across the full
      width at an opacity where it read as an empty band. Replaced by a real
      header: the character portrait and the actor's at equal weight either side
      of the written detail. The middle column cannot be `description` alone —
      those run ~110 characters, so it also carries debut, active span and the
      credited name, all derived from relations already on the page. Films and
      allies were dropped as stats since the appearances grid and connections
      section already show both; graph rank stayed, having no counterpart
      elsewhere on the page. Powers render as the strings they are
      rather than as invented scores, battles become a "notable moments" record
      derived from existing data, and the connections block hands off to
      `/explore?focus=<slug>` so the flagship is reachable from the page. The
      connections block no longer repeats the character's own portrait above
      their allies — it was redundant beside the header
- [x] Character biographies — the curated descriptions are one sentence (median
      112 chars), too little to carry a detail page. `fetch-bios.js` pulls the
      MCU wiki lead section for 192/193, reusing the page-title mapping
      fetch-portraits.js already verified (both now import `wiki.titles.js`
      rather than keeping two copies). Stored in a new `bio` field, never in
      `description`: the one-liner stays the summary cards and list rows show.
      The lede renders in the header, the rest as a collapsible Biography
      section with the CC-BY-SA attribution the licence requires
- [x] Detail page layout pass — powers moved out of a full-width section (a
      heading over one line of chips) into the empty space beside the character
      name; biography and notable moments now share a two-column row rather
      than each using half the width; the connections grid lost its
      `max-w-4xl` cap and centres its content instead, sized for the 3.8
      allies the average character actually has
- [x] Artifacts on the character page use the antiques listing card, extracted
      from app/antiques/page.tsx into `ArtifactCard` so the two cannot drift.
      The character populate gained `status`, which the card badge needs and
      the detail projection was not returning. Notable moments scrolls the full
      list rather than showing six and a dead "and N more" line
- [x] Explore-network handoff is a filled action in the character's own theme
      colour. Needed a `text-on-entity` utility: theme colours are per
      character and 13 are light, 3 near-white, where fixed white label text
      vanishes. EntityTheme now computes the foreground from WCAG luminance and
      publishes `--entity-foreground`; done in JS because `contrast-color()`
      is not broadly supported yet
- [x] Team, battle and artifact images — all 93 had none. `fetch-entity-images.js`
      pulls them from the MCU wiki (90/93), batching `pageimages` 50 titles at
      a time so 93 entities cost 3 requests rather than 93. Battles are the
      awkward case: only 18 have art of their own, so the other 46 borrow the
      poster of the film they happened in, with `imageOrigin` recording which —
      the detail header picks its aspect ratio from it, since a wide film still
      cropped to 2:3 is what makes these look broken
- [x] Artifact catalogue expanded from 9 to 77. The six Infinity Stones are
      separate entries from the containers that held them — a stone and its
      housing change hands independently, so Loki carrying the Sceptre and the
      Mind Stone ending up in Vision are different facts. All 77 have images
      (25 needed title overrides), holders and appearances, which added 26
      edges to the graph: 729 -> 755
- [ ] Three teams have no image and no wiki page: `team-spider-man`,
      `sinister-six`, `pym-van-dyne-family`. They are groupings this project
      curates rather than articles Fandom carries — searched and confirmed
      absent, not missed. Would need hand-picked art
- [ ] ~~No artifact has an `image`~~ — resolved above, 9/9
- [ ] `chester-phillips` has no biography — his wiki lead section is one
      sentence ending in "S.H.I.E.L.D.", which the prose filter rejects. 192/193
      is fine to ship; fix the filter or hand-write the entry later
- [ ] Per-character `sections` — the schema has a typed enum
      (biography/timeline/gallery/quotes/trivia/relationships) and nothing
      populates it. Needed for the extra blocks Strange, Bucky and others want
- [ ] Battles sort on the movie ObjectId, which is chronological only because
      the films were seeded in release order. A `--purge` reseed or a film added
      out of order would silently break it. A denormalised `movieYear` on the
      battle, or an aggregation with `$lookup`, would make it real
- [ ] `npm run seed` upserts but never deletes, so an entry removed from
      seed-data.js survives in Atlas until removed by hand — as the duplicate
      Wakandan team was

**Components**

- [x] Card redesign — better image treatment, hover states, consistent aspect ratios
- [x] ~~`PowerStats` as a radar chart~~ — removed entirely instead. The six
      stat values had no source and fed nothing; the graph runs on edges
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
- [ ] The `/home` about copy hardcodes "four steps apart" for Ho Yinsen to
      Galactus. That is live graph data and it has already gone stale once —
      the pair was five steps, then three once Nebula was added. Either read it
      from `/api/graph/path` or re-verify before deploying

### Phase 6 — Testing and CI/CD

- [x] Vitest, starting with the graph algorithm tests from Phase 2 — 21 tests
      against a hand-verified fixture, verified by injecting three deliberate
      bugs to confirm they fail. See `docs/GRAPH.md`
- [x] Supertest on the route layer — 20 tests, non-happy paths first. Found
      two bugs that were live in production and unreachable from the UI:
      `page=-5` computed a negative `skip` and returned 500, and a malformed
      JSON body returned 500. Pagination is now normalised once in middleware
      instead of being parsed independently by six services
- [x] `mongodb-memory-server` for the route tests, so they run against a real
      `mongod` rather than a mock of Mongoose's query API — the bugs worth
      catching (a wrong projection, a missing populate) are the ones a mock
      cannot see
- [x] `src/app.js` split from `src/index.js`. Importing the old entry point ran
      `listen()` and `mongoose.connect()` at module load, so any test that
      touched it bound a port and reached for Atlas
- [ ] `mongodb-memory-server` for service-layer tests, so they run against a
      real mongod rather than a mock of Mongoose's query API
- [x] CI runs lint, tests, typecheck and build on Node 20 and 22
- [ ] Branch protection on `prod`, so the green tick is required rather than
      advisory
- [ ] Multi-stage Dockerfile + `docker-compose.yml`
- [x] **Deployed.** Frontend <https://marvel-six-lake.vercel.app>, API
      <https://marvel-api-mueo.onrender.com>, Atlas M0. Render rather than a
      serverless function because the graph engine serves BFS and Dijkstra from
      an in-process snapshot — every cold invocation would rebuild it, which is
      exactly the measurement the benchmark rests on. `render.yaml` is committed
      so the service config is reviewable rather than living only in a dashboard
- [x] Startup defects found by deploying, none of which reproduce locally:
      - Winston declared `File` transports writing to `logs/`. That directory
        does not exist on the host and the transport throws during *module
        load*, before any application code runs — so the failure presents as a
        process that dies with no output at all. Files are now development-only;
        the platform collects stdout itself
      - Log level was `warn` in production, which suppressed both "MongoDB
        connected" and "Server running on port". A healthy boot and a hanging
        one looked identical from outside. Now `info`
      - `connectDB()` called `process.exit(1)` on a failed first connect,
        turning a bad connection string into a restart loop that reports
        nothing. It now logs and stays up, so `/health` can answer `degraded` —
        a diagnosis rather than a silence
      - `/health` returned 503 when degraded, which makes the platform restart a
        service that restarting cannot fix. Always 200; the body carries state
      - `engines` said `>=20.0.0`, so Render installed Node **26.7.0** — a major
        version the CI matrix (20, 22) has never run. Pinned to `22.x`
- [ ] The empty-database failure deserves a note: `/health` reported `ok` and
      every endpoint returned a valid 200 with `total: 0`, because the Atlas
      connection string omitted the database name and silently used `test`.
      Nothing anywhere reported an error. A health check that asserts a
      collection is non-empty would have caught it
- [x] Production readiness — three things that would have failed live while
      passing locally:
      - Auth cookies were `sameSite: "strict"`, which a browser never sends
        cross-site. Vercel and Render are different sites, so every refresh
        would have failed in production only. Now `none` + `secure` there
      - `mongoose.connect()` took the default pool of 100 against M0's limit
        of 500 concurrent connections. Now `maxPoolSize: 10`
      - `CORS_ORIGIN` was a single string; Vercel issues a preview URL per
        deploy and credentialed requests cannot use a wildcard. Now a list
- [x] `/health` reports database state, not just process liveness — a server
      answering HTTP with Mongo unreachable is not healthy, and reporting "ok"
      there turns a visible outage into a silent one
- [x] API client timeout 30s → 70s. Render's free tier sleeps after 15 minutes
      and takes ~50s to wake, so the first request would have aborted *after*
      successfully starting the server — failing while having worked, which
      then looks random because the retry succeeds
- [ ] Cold start is documented in the README rather than worked around. Worth
      revisiting if the link is ever handed to someone live

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

- [x] `docs/GRAPH.md` — the Connection Engine: data model, edge weights, the
      algorithms, the force layout and its tuning, and why the explore page is
      split into three views
- [ ] README rewrite with architecture diagram and live demo link
- [x] [`docs/adr/`](adr/) — five architecture decision records, each stating
      what was rejected and **what would change the answer**. A decision
      recorded without its threshold is an opinion with a date on it
- [x] Benchmarks re-measured at the current graph size (193 nodes / 755 edges;
      the earlier figures were taken at 18 / 105 and were stale). The scaling
      comparison is the interesting part: Dijkstra grew **7.4×** against 7.2×
      edge growth, while naive `$graphLookup` grew only 1.4× — because it is
      dominated by two network round trips, and the round-trip count did not
      change when the graph got 10× bigger
- [ ] OpenAPI spec + Swagger UI at `/api/docs`
- [ ] Lighthouse and accessibility pass
- [ ] Optional: deterministic battle simulator with seeded RNG

---

## Benchmarks

### Method

Shortest path Groot → Tony Stark (a genuinely distant pair — Groot reaches Tony
only through Rocket and Thor), measured at the **service layer** rather than
over HTTP, so the numbers reflect query and algorithm cost without Express and
JSON serialization mixed in.

Node v22.22.2, concurrency 1, against the same Atlas M0 cluster the deployed
API uses. 100 iterations, 30 warmup, except the cold-rebuild row (10
iterations — each one pays a full snapshot build).

Re-measured **2026-08-27** at the current graph size. The earlier run was taken
at 18 nodes / 105 edges; the dataset is now **193 nodes / 755 edges**, so those
figures were stale and have been replaced rather than kept alongside.

### Naive `$graphLookup` — the baseline

| Traversal | p50 | p95 | p99 |
|---|---|---|---|
| `shortestPath` maxDepth=2 | 29.5 ms | 34.7 ms | 44.7 ms |
| `shortestPath` maxDepth=3 | 30.6 ms | 36.9 ms | 38.7 ms |
| `shortestPath` maxDepth=4 | 30.7 ms | 38.9 ms | 46.9 ms |
| `shortestPath` maxDepth=6 | 30.6 ms | 33.2 ms | 37.1 ms |

Cost is flat across depth. That is the first clue about what is actually slow:
if the traversal were the bottleneck, depth 6 would cost visibly more than
depth 2.

### In-process adjacency snapshot — the result

| Traversal | p50 | p95 | vs naive p95 |
|---|---|---|---|
| **Dijkstra (weighted)** | **0.1 ms** | **0.2 ms** | **~175×** |
| **BFS (fewest hops)** | **0.007 ms** | **0.008 ms** | **~4000×** |
| Cold rebuild + path | 26.0 ms | 28.9 ms | ~1× |

Snapshot build: 193 nodes, 755 edges in **24–33 ms** against Atlas.

### What the numbers actually say

**The original premise did not hold.** The plan predicted naive `$graphLookup`
would cost 200–350 ms and an in-memory BFS would be a 20–40× win. At this data
size `$graphLookup` is ~30 ms, and the speedup is far larger than 40×. Both
halves of the guess were wrong, in opposite directions.

The reason is that **the algorithm was never the bottleneck — the network round
trip was.** A single `findById` against Atlas is ~10 ms and the naive traversal
issues two queries, which is essentially the whole ~30 ms. The optimization
that mattered was not beating `$graphLookup`; it was not crossing the network
at all for a graph that fits in memory.

**Scaling confirms it**, almost too neatly. Between the 18-node and 193-node
runs the graph grew **10.7× in nodes and 7.2× in edges**:

| | growth |
|---|---|
| Edges | 7.2× |
| Dijkstra p95 | **7.4×** (0.027 → 0.2 ms) |
| Naive p95 | 1.4× (24.2 → 34.7 ms) |

Dijkstra tracked edge growth within 3%, which is what an algorithm doing real
work over a graph should do. Naive `$graphLookup` barely moved, because it is
not dominated by the traversal — it is dominated by two network round trips,
and the number of round trips did not change when the graph got 10× bigger.

The in-memory path scales with the graph. The naive path scales with the
network, which is why it looked deceptively fine at 18 nodes and would keep
looking fine right up until the graph stopped fitting in memory.

**The honest caveat** is the cold-rebuild row: the first request after a write
or a restart pays the full snapshot build, about the same as one naive
traversal. Every subsequent request inside the TTL is essentially free. On the
deployed free tier this compounds with the platform's own cold start.

So the headline is a comparison between doing I/O and not doing I/O, not
between two algorithms. Stating it that way is more useful than the 4000×.

Harness: `node scripts/bench/graph-bench.js [--uri ...] [--iterations N] [--warmup N]`
