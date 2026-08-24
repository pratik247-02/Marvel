# The Connection Engine

How `/explore` works: what the page does, how the graph is built and weighted,
which algorithms run where, and why the view is split three ways.

This is the flagship feature of the project. Everything else is a catalogue;
this is the part with a real systems argument behind it.

---

## What the page is for

One question: **how are any two MCU characters connected?**

Not "were they in the same film" — that is trivia and, as it turns out, nearly
meaningless (see [Why co-appearance is not an edge](#why-co-appearance-is-not-an-edge)).
The question is whether a chain of real relationships runs between them, and
what that chain is.

Ho Yinsen died in a cave in the first film. Thanos is a warlord from another
planet. They never met, never appeared on screen together, and have no obvious
link. The engine answers:

```
Ho Yinsen → Tony Stark → Thor Odinson → Rocket → Gamora → Thanos
5 hops, cost 3.65
```

That answer comes from a weighted shortest path over a graph assembled from
allies, teams, battles and shared artifacts.

---

## The data model

The graph is **derived**, not stored. No edge table exists in MongoDB. Edges are
computed from relations that already exist on the content models:

| Source | Relation | Becomes |
|---|---|---|
| `Character.affiliations` | A lists B as an ally | a direct edge |
| `Team.members` | roster | a clique across the roster |
| `Battle.participants` | who fought | a clique across participants |
| `Artifact.holders` | who wielded it | a clique across holders |

A **clique** means every member is joined to every other member. That is the
right shape — six people on a team do all know each other — but it is also where
the edge count comes from, and why weighting matters so much.

Affiliations are directional in the data (A lists B) but **treated as mutual**
in the graph. If A calls B an ally, they are connected. This means the seed data
only has to state each relationship once.

### Current size

| | |
|---|---|
| Nodes | 45 characters |
| Edges | 109 |
| Snapshot build | ~28 ms |

Target is roughly 170 characters. See [Scaling](#scaling) for what that does.

---

## Edge weights

Relation types are not equally meaningful, so the graph is weighted.

**Dijkstra minimises total cost, so a lower number means a stronger tie.**

```js
affiliation: 1   // explicitly modelled ally/relative/nemesis - strongest signal
team:        2   // same roster - strong, but broader than a personal tie
battle:      4   // demonstrably in the same fight
artifact:    5   // both wielded the same object - narrative, not social
```

Tuned so one strong link beats a chain of weak ones: an affiliation (1) is
preferred over two battles (2 × 4 = 8).

Three rules then adjust the raw numbers.

### 1. Crowd penalty — `scaleByGroupSize`

Two characters in a two-hander shared something. Two characters in a twelve-way
battle royale barely interacted.

```js
penalty = min(sqrt(groupSize - 1), 3)
```

Square root rather than linear, because dividing by group size over-punishes
ensembles. Capped at 3× so a huge crowd cannot produce an absurd cost.

### 2. Corroboration discount — `combineWeights`

People who are allies *and* teammates *and* fought together are more strongly
connected than people who only do one. Parallel edges collapse into one:

```js
strongest = min(weights)
discount  = max(0.5, 1 - 0.15 * (count - 1))   // 15% off per extra link, floor 50%
```

The strongest single link sets the cost; each corroborating link shaves it
further.

### 3. Hard cutoff — `MAX_EDGE_WEIGHT = 9`

Any edge costing more than 9 is discarded entirely.

This is the rule that keeps the graph meaningful. A twelve-way battle produces a
clique linking almost everyone to almost everyone. Those edges are *technically
true and analytically useless*: with them the graph tends toward a mesh, every
character sits one hop from every other, and both hop-count and betweenness
collapse to the same value across the whole cast.

This was not theoretical — it is exactly what the first unweighted version did.

---

## Why co-appearance is not an edge

Co-appearance used to be a fifth edge type, weighted 6 ("appeared in the same
film"). It was removed, and the reasoning is worth recording because the
measurement was surprising.

Every film cast is a clique. Across 38 films that generates **583 pairs** — more
than three times every other edge type combined — while asserting only that two
people shared a crowded frame. *Avengers: Endgame* alone credits 27 characters,
which is 351 pairs from one film.

Weighting alone did not save it. The `MAX_EDGE_WEIGHT` cutoff was already
discarding **568 of those 583**. The type survived as 15 real edges whose only
distinction was coming from small casts — and it cost a full `Movie` query plus
clique construction and pruning on every single rebuild.

Removing it took the graph from **172 → 109 edges (a 37% cut)** and left it
**fully connected**: one component, all 45 nodes reachable, every path still
resolving. The drop was larger than the 15 direct edges because those edges were
also discounting other pairs through `combineWeights`.

Films still appear on the character detail page. They are simply not a claim
about who knows whom.

---

## Algorithms

All of it runs in-process against a cached adjacency snapshot. Nothing traverses
the database.

| Endpoint | Algorithm | Notes |
|---|---|---|
| `GET /graph/path` (weighted) | Dijkstra | linear scan for the minimum, not a heap |
| `GET /graph/path` (hops) | BFS | ignores weight entirely |
| `GET /graph/network/:ref` | BFS to depth N | depth clamped 1–4 |
| `GET /graph/stats` | degree + Brandes' betweenness | O(V·E) |
| `GET /graph/full` | whole snapshot | |
| `POST /graph/rebuild` | forced rebuild | admin only |

**Dijkstra uses a linear scan rather than a binary heap.** At 45–200 nodes the
scan is faster in practice — a heap's constant factor and allocation cost
dominate at this size. The scan is O(V²); the heap is O(E log V). The crossover
is thousands of nodes, which this dataset will never reach.

**Betweenness uses Brandes' algorithm**, unweighted variant. O(V·E), which is
fine here and is what identifies bridge characters — the ones whose removal
would disconnect parts of the universe.

### The snapshot cache

The adjacency map is built once and held in process memory, rebuilt on write via
Mongoose post-hooks, with a **5-minute TTL** as a backstop.

**Known hole, stated deliberately:** post-hooks only fire for document
middleware. A raw driver call, an `updateMany`, or an edit made directly in the
Atlas UI will not invalidate the cache. The TTL is the mitigation, and
`POST /graph/rebuild` is the manual escape hatch.

A second known limitation: at multi-instance scale each process holds its own
snapshot and they can briefly diverge after a write. At single-instance,
admin-only-writes scale this is fine — and knowing where it breaks is the point.

---

## Two path modes

The UI offers **Strongest ties** and **Fewest hops**. They are genuinely
different questions, not a cosmetic toggle.

**Strongest ties (weighted, Dijkstra)** — the default. Follows real
relationships. May take more steps to avoid a weak link. This is usually the
answer a person actually wants: it prefers "they were allies" over "they were
both at a big battle".

**Fewest hops (BFS)** — the classic six-degrees answer. Minimum number of
intermediaries, treating all connections as equal. Shorter, but a hop may rest
on a crowded battlefield rather than a real relationship.

The distinction is the whole reason the graph is weighted. Without weights both
modes return the same thing and the feature is trivial.

---

## Frontend

### Data layer

```
app/explore/page.tsx
  └── modules/graph/hooks/
        ├── useFullGraph      → GET /graph/full
        ├── useGraphPath      → GET /graph/path
        └── useEgoNetwork     → GET /graph/network/:ref
```

`useEgoNetwork` carries a **request-id guard**: responses can land out of order
when the selection changes quickly, so only the newest request is allowed to
write state. Passing a null ref clears rather than fetches, so it can be driven
straight from a select with an empty option.

### Rendering — no graph library

The visualisation is **hand-rolled SVG** with a **hand-rolled force simulation**.
No d3-force, no cytoscape, no vis.js.

That was a deliberate choice. The physics is about 250 lines and the algorithms
are the point of the project; importing a library would have hidden exactly the
part worth writing. SVG over canvas because at this node count SVG is fast
enough and gives real DOM nodes — accessible, inspectable, styleable by CSS.

### The simulation

`modules/graph/hooks/useForceSimulation.ts` — velocity Verlet integration with
three forces per tick:

- **repulsion** — every node pushes every other away, falling off with the square
  of distance. O(n²), fine at this size; Barnes-Hut would be the fix past a few
  thousand nodes.
- **springs** — each edge pulls toward a rest length. Stronger edges (lower
  weight) pull harder, so tightly connected characters sit closer.
- **centering** — a weak pull inward so disconnected components do not drift off.

Velocities damp each tick and `alpha` decays toward zero, so the layout settles
in ~277 ticks instead of jittering forever.

#### Tuned, not guessed

```js
charge: 5000, linkDistance: 185, linkStrength: 0.06,
damping: 0.82, centerForce: 0.0015
```

These came from sweeping the parameter space against the real graph at 1800×820,
1280×760 and 720×600, scoring each combination on canvas used and on how many
node pairs ended up closer than a label width.

**Rest length mattered far more than the centering force.** The springs, not the
centre pull, were what held the layout in a narrow column — which was the
opposite of the first guess.

Combinations scoring higher on width alone did it by flinging outliers to the
edges while the middle stayed crowded, so spread is deliberately *traded against*
separation rather than maximised.

Results at the shipped values:

| Viewport | Width used | Min gap | Overlaps |
|---|---|---|---|
| 1800×820 | 68% | 40px | 7 |
| 1280×760 | 73% | 34px | 14 |
| 720×600 | 83% | 32px | 33 |

#### Two bugs the sweep caught

**Nodes stacking exactly.** Min gap measured 0.0px at some viewport sizes. The
boundary clamp pinned every overshooting node to the identical edge coordinate.
Nodes now **bounce** off the boundary with halved velocity instead.

**Canvas-blind physics.** Charge and rest length were fixed constants, so extra
space simply went unused. Both now scale with `sqrt(area / nodeCount)`, bounded
to [0.75, 2.4] so a huge canvas does not explode the graph and a phone does not
collapse it.

#### Sizing

Height tracks the viewport (`MIN_HEIGHT 560`, `MAX_HEIGHT 900`, minus 260px of
page chrome) rather than sitting at a fixed value. The evidence: same width,
more height — 1800×560 gives 35 overlaps, 1800×820 gives 7.

#### Labels

Labels render **names, not aliases**. Aliases are descriptive rather than
identifying — "The Man Who Saved Tony Stark" is both unrecognisable at a glance
and four times the width of "Ho Yinsen". That single change did more for
readability than any physics tuning.

Names are capped at 16 characters and painted with a background-coloured stroke
underneath, so overlaps stay legible.

---

## Three views

The full graph stops being readable well before the dataset stops growing. This
is a density problem, not a physics problem — no amount of tuning fixes it.

Measured against synthetic graphs matched to this dataset's density:

| Nodes | Overlaps | Label clashes |
|---|---|---|
| 45 (today) | 5 | 6 |
| 100 | 31 | 15 |
| **170 (target)** | **109** | **60** |

Overlaps grow ~22× while nodes grow 3.8×. At 170 the single canvas is a
hairball. Hence three views:

### Focus — default

One character plus everyone within 1–3 hops. Click any node to re-centre.

This is the default because it is the view that **stays readable at any dataset
size** — it is bounded by how connected one character is, not by how many
characters exist.

Measured: 1 hop gives 2–25 nodes; 2 hops gives 9–43.

### Path

The six-degrees answer, rendering **only the route plus what touches it** — not
the whole universe with a line drawn through it.

Measured: 28–41 nodes.

### Everything

The full graph. Still there, but understood as a *poster* — something to glance
at, not read.

### Honest limits, surfaced in the UI

Two hops from a hub reaches most of the graph — from Tony, 43 of 45 nodes. At
170 characters that could be 100+. Rather than let Focus quietly become the
hairball it exists to prevent, the page **says so** and suggests one hop. The
Everything view carries a similar note past `READABLE_NODE_LIMIT` (60).

Telling the user the view is degrading is better than rendering a mess and
hoping they do not notice.

---

## Scaling

What changes at ~170 characters:

- **Edges**: ~109 → roughly 400–500. Cliques scale quadratically with cast and
  roster sizes, and `MAX_EDGE_WEIGHT` prunes harder as groups grow.
- **Simulation cost**: repulsion is O(n²) per tick. 45 nodes ≈ 25 ms per settle;
  170 ≈ 75 ms. Still fine. Barnes-Hut only becomes worth it in the thousands.
- **Snapshot build**: currently ~28 ms. Linear in edges, so still trivial.
- **The Everything view**: degrades, by design, with the UI saying so.
- **Focus and Path**: unaffected. That is the point of them.

---

## Files

**Backend** — `backend/src/modules/graph/`

| File | Role |
|---|---|
| `graph.engine.js` | snapshot build, BFS, Dijkstra, ego networks, Brandes |
| `graph.weights.js` | edge weights, scaling, combination, cutoff |
| `graph.invalidation.js` | Mongoose post-hooks |
| `graph.service.js` | orchestration, slug resolution |
| `graph.controller.js` / `.routes.js` / `.validators.js` | HTTP layer |

**Frontend**

| File | Role |
|---|---|
| `app/explore/page.tsx` | the three views and their controls |
| `components/blocks/ForceGraph.tsx` | SVG rendering, sizing, labels, drag |
| `modules/graph/hooks/useForceSimulation.ts` | the physics |
| `modules/graph/hooks/useEgoNetwork.ts` | ego network fetch with race guard |
| `modules/graph/hooks/useGraphPath.ts` | path fetch |
| `modules/graph/hooks/useFullGraph.ts` | full graph fetch |

---

## Design decisions worth defending

**Why not Neo4j?** ~200 nodes and ~500 edges is about 40KB of JSON. At that size
`$graphLookup`, a Postgres recursive CTE and a Cypher query all return in
single-digit milliseconds. Adding a graph database means a third datastore, a
dual-write consistency problem, and no free tier that survives idle periods — to
earn zero measurable benefit. Sizing the problem before picking the tool is the
decision; the threshold that would change it is roughly 10⁵ nodes or traversals
deep enough that the working set stops fitting in memory.

**Why in-process rather than Redis?** The whole graph fits comfortably in memory
and rebuilds in ~28 ms. Redis would add a network hop and an operational
dependency to cache something cheaper to recompute than to fetch. Documented
holes above; the honest limit is multi-instance deployment.

**Why hand-roll the force layout?** The algorithms are the point of the project.
d3-force would have been faster to ship and would have hidden the one part worth
writing.

**Why weighted at all?** Without weights every path is 1–2 hops, betweenness is
identical for the whole cast, and "shortest path" answers nothing. The weighting
is what makes the question interesting.
