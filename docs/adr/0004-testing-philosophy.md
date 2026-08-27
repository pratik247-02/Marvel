# 0004 — Testing philosophy, and why there is no coverage target

**Status:** accepted · 2026-08-23

## Context

The obvious thing to write in a portfolio README is "90% test coverage". It is
also close to meaningless, and an interviewer who asks one follow-up question
will find that out.

## Decision

No coverage percentage is set as a goal. Tests are concentrated where code
would **fail silently if it were wrong**, and that list is deliberately short.

Currently: 41 tests. 21 against the graph algorithms on a hand-verified 9-node
fixture, and 20 at the route layer against an in-memory `mongod`.

## Why no target

A number invites writing tests to move the number. That is how suites fill up
with assertions on presentational components, which cannot meaningfully fail
and cost real time to maintain when the markup changes.

The useful question is not "what percentage is covered" but "what would break
without anyone noticing". For this project:

| Would fail silently | Tested |
|---|---|
| Graph traversal returning a wrong-but-plausible path | ✅ 21 tests |
| Edge weighting producing a subtly wrong ordering | ✅ |
| ETL losing idempotency and duplicating on rerun | ⬜ planned |
| Route layer returning 500 where it should return 400 | ✅ 20 tests |
| A card rendering with the wrong padding | ❌ deliberately not |

## Why the graph tests are the ones that exist

A shortest-path bug does not throw. It returns *a* path, plausibly shaped,
quietly wrong. Nothing downstream notices, and it is the one feature the whole
project is built around.

The fixture is 9 nodes with answers worked out by hand, including the case that
matters most: a direct `a→d` edge costing 8 versus a detour `a-b-e-d` costing 4.
An implementation that confuses "fewest hops" with "lowest weight" passes a
naive test and fails this one.

**The tests were verified by mutation.** Three deliberate bugs were injected —
an off-by-one in the hop count, a reversed comparison in the weight relaxation,
and a skipped visited-set check — to confirm the suite actually fails when the
code is wrong. A test that cannot fail is decoration. See
[GRAPH.md](../GRAPH.md) for the mutation table.

## What is deliberately not tested

- **Presentational components.** They fail visibly, in the browser, immediately.
- **Mongoose's own behaviour.** Testing that `findById` finds by id tests the
  library, not this code.
- **Happy-path route responses**, in isolation. The valuable route tests are
  the non-happy ones, and those now exist: expired token → 401, a *refresh*
  token used as an access token → 401, non-admin write → 403 (not 401 — the
  caller is authenticated, just not permitted), malformed ObjectId → 400 not
  500, `page=99999` → empty array not a crash.

  **They earned their place immediately.** Writing them found two bugs that
  were live in production: `page=-5` produced a negative `skip` and returned
  **500**, and a malformed JSON body also returned **500**. Neither is
  reachable from the UI, which is exactly why neither had been noticed.

  Both are fixed — pagination is now normalised once in middleware rather than
  parsed independently by six services, and `express.json()`'s SyntaxError is
  recognised as the client error it is.

## What would change the answer

- **More than one contributor.** Coverage floors are a coordination tool; with
  one developer they mostly measure discipline against yourself.
- **A regression that reaches production.** That is direct evidence about where
  the gap is, and it should produce a test before it produces a fix.
- **Refactoring the service layer.** Tests that pin behaviour are worth most
  immediately before a rewrite, not after.

## The honest number

Whatever coverage falls out of testing the things above is the number worth
reporting. Stating "70%, concentrated on the graph engine, and here is what I
deliberately did not test" reads as more senior than claiming 100% — because
the person claiming 100% is either lying or has wasted a great deal of time.
