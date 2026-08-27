# 0005 — Committed ETL fixtures over live API calls

**Status:** accepted · 2026-08-22

## Context

The dataset draws on two external sources: TMDB for film metadata, posters,
runtimes and cast credits, and the MCU Fandom wiki for character portraits,
biographies and entity images.

The straightforward implementation calls those APIs from the seed script.

## Decision

Fetch scripts and the seed are **separate programs**. The fetchers
(`scripts/etl/fetch-*.js`) are the only code that talks to a network, and they
write JSON fixtures into `scripts/etl/fixtures/`. Those fixtures are committed.
The seed reads them and never makes a request.

## Why

**A clone with no API key still works.** `npm run seed` produces the full
dataset — 193 characters, 38 films, 77 artifacts, 64 battles, with artwork —
on a machine that has never seen a TMDB token. For a portfolio project someone
might clone and run, that is the difference between working and not.

**CI does not depend on a third party.** A seed that calls TMDB fails when TMDB
rate-limits, changes a response shape, or is briefly down — and the failure
looks like a broken build.

**Seeding is reproducible.** The same fixture produces the same database. When
the upstream data changes, that change appears as a **diff in a commit**, which
is reviewable, rather than as a silent difference between two runs.

**Refreshing is a deliberate act.** `npm run tmdb:fetch` is something a person
runs and inspects, not something that happens invisibly during a deploy.

## What this cost

The data is a snapshot and goes stale. Refreshing is a manual step someone has
to remember. That is an acceptable trade for content about films that have
already been released.

## What it caught

The fixture pattern turned data quality into something reviewable, and the
review found real errors that a live fetch would have written silently:

- **Ava Starr's actor resolved to Michael Cerveris** — her *father's* actor,
  matched on the shared surname "Starr". Caught because the fetcher reports
  low-confidence matches by name.
- **Natasha Romanoff's biography was an infobox table**, not prose —
  "Hammer Industries (formerly; undercover) Stark Industries…" — passing a
  naive filter because the periods in "S.H.I.E.L.D." looked like sentence ends.
- **"Black Widow" resolves to Yelena Belova** on the wiki, because she took the
  mantle. Searching by alias would have put the wrong person on Natasha's page.

None of these throw. All of them would have shipped.

## What would change the answer

- **Data that changes faster than releases.** Live box office, or anything with
  a genuine freshness requirement, would need fetching at runtime with a cache.
- **A dataset too large to commit.** At ~590 KB across all fixtures this is a
  non-issue; at hundreds of megabytes it would need object storage.
- **User-contributed content.** Fixtures describe upstream data, not data this
  application owns.
