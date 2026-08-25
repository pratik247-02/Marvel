/**
 * Fetch team, battle and artifact images from the MCU Fandom wiki.
 *
 *   node scripts/etl/fetch-entity-images.js            # refresh the fixture
 *   node scripts/etl/fetch-entity-images.js --dry-run  # report, write nothing
 *   node scripts/etl/fetch-entity-images.js --only=teams
 *
 * The companion to fetch-portraits.js, which covers characters. Same source,
 * same MediaWiki `pageimages` property, same fixture pattern - this is the
 * only script that talks to the wiki, the seed reads what it writes, so
 * seeding needs no network.
 *
 * Battles are the awkward case. Their wiki images are film screenshots, and
 * plenty of battles have no page image at all. Rather than leave those cards
 * blank, a battle with no art of its own falls back to the poster of the film
 * it happened in - which every battle already has through its `movie` link.
 * The fixture records which of the two it used so the UI can treat a borrowed
 * poster differently if it ever wants to.
 *
 * Licence: MCU wiki images are CC-BY-SA. The fixture records the source page
 * per entity so the attribution the licence requires can be rendered.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { teams, battles, artifacts, movies } from "../seed-data.js";
import { ENTITY_PAGE_TITLES } from "./wiki.titles.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(DIR, "fixtures", "entity-images.json");
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

const API = "https://marvelcinematicuniverse.fandom.com/api.php";
const USER_AGENT = "MarvelMCUHub/1.0 (personal learning project)";

/** Courtesy delay between requests - the wiki is free and unauthenticated. */
const THROTTLE_MS = 200;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strip the revision suffix from a wikia URL.
 *
 * Raw URLs end in `/revision/latest?cb=20240802142023`, which pins a specific
 * upload. The path before it is stable and serves the current image.
 */
const cleanUrl = (url) => url?.split("/revision/")[0];

/**
 * Ask for up to 50 pages at once.
 *
 * `pageimages` supports batching, so 93 entities cost three requests rather
 * than 93. Returns a map of requested title -> image url, accounting for
 * redirects (the wiki resolves "Mjolnir" to "Mjølnir" on its own).
 */
async function fetchImages(titles) {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "original");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    return new Map();
  }

  const data = await response.json();
  const query = data.query ?? {};

  // A redirect means the title we asked for is not the title that came back,
  // so map the resolved name back to what the caller requested.
  const backToRequested = new Map();
  for (const { from, to } of query.redirects ?? []) {
    backToRequested.set(to, from);
  }
  for (const { from, to } of query.normalized ?? []) {
    backToRequested.set(to, from);
  }

  const found = new Map();
  for (const page of Object.values(query.pages ?? {})) {
    const image = cleanUrl(page.original?.source);
    if (!image) {
      continue;
    }
    // Record under both names so either lookup hits.
    found.set(page.title, { image, resolvedTitle: page.title });
    const requested = backToRequested.get(page.title);
    if (requested) {
      found.set(requested, { image, resolvedTitle: page.title });
    }
  }
  return found;
}

/** Titles to try for one entity, in order. */
const candidates = (kind, entity) =>
  ENTITY_PAGE_TITLES[kind]?.[entity.key] ?? [entity.name];

/**
 * Resolve one collection.
 *
 * Two passes: the first tries every entity's preferred title in batches, the
 * second retries whatever missed using its remaining candidates. Most entities
 * resolve in pass one, so this keeps the request count near the minimum.
 */
async function resolveAll(kind, entities) {
  const results = {};
  const missing = [];

  // Pass 1 - first candidate for everything, batched.
  const first = entities.map((e) => candidates(kind, e)[0]);
  const batches = [];
  for (let i = 0; i < first.length; i += 50) {
    batches.push(first.slice(i, i + 50));
  }

  const found = new Map();
  for (const batch of batches) {
    const batchResult = await fetchImages(batch);
    for (const [k, v] of batchResult) {
      found.set(k, v);
    }
    await sleep(THROTTLE_MS);
  }

  for (const entity of entities) {
    const tried = candidates(kind, entity);
    const hit = found.get(tried[0]);
    if (hit) {
      results[entity.key] = {
        image: hit.image,
        source: `https://marvelcinematicuniverse.fandom.com/wiki/${encodeURIComponent(hit.resolvedTitle.replace(/ /g, "_"))}`,
        sourceTitle: hit.resolvedTitle,
        origin: "wiki",
      };
    } else {
      missing.push(entity);
    }
  }

  // Pass 2 - remaining candidates for whatever missed, one at a time.
  const stillMissing = [];
  for (const entity of missing) {
    const rest = candidates(kind, entity).slice(1);
    let hit = null;
    for (const title of rest) {
      const result = await fetchImages([title]);
      hit = result.get(title);
      await sleep(THROTTLE_MS);
      if (hit) {
        break;
      }
    }
    if (hit) {
      results[entity.key] = {
        image: hit.image,
        source: `https://marvelcinematicuniverse.fandom.com/wiki/${encodeURIComponent(hit.resolvedTitle.replace(/ /g, "_"))}`,
        sourceTitle: hit.resolvedTitle,
        origin: "wiki",
      };
    } else {
      stillMissing.push(entity);
    }
  }

  return { results, missing: stillMissing };
}

async function main() {
  const started = Date.now();
  const wanted = (kind) => !ONLY || ONLY === kind;

  console.log("\nFetching entity images from the MCU wiki");
  if (DRY_RUN) {
    console.log("*** DRY RUN - the fixture will not be written ***");
  }

  const fixture = { teams: {}, battles: {}, artifacts: {} };
  const report = {};

  for (const [kind, entities] of [
    ["teams", teams],
    ["artifacts", artifacts],
    ["battles", battles],
  ]) {
    if (!wanted(kind)) {
      continue;
    }

    console.log(`\n${kind} (${entities.length})`);
    const { results, missing } = await resolveAll(kind, entities);
    fixture[kind] = results;
    report[kind] = { total: entities.length, found: Object.keys(results).length, missing };

    for (const key of Object.keys(results)) {
      console.log(`  ok    ${key.padEnd(38)} ${results[key].sourceTitle}`);
    }
    for (const entity of missing) {
      console.log(`  MISS  ${entity.key.padEnd(38)} tried: ${candidates(kind, entity).join(", ")}`);
    }
  }

  // Battles with no art of their own borrow their film's poster, so no battle
  // card is left blank. Read from the TMDB fixture the seed already uses.
  if (wanted("battles") && report.battles?.missing.length) {
    let tmdb = { movies: {} };
    try {
      tmdb = JSON.parse(
        await fs.readFile(path.join(DIR, "fixtures", "tmdb.json"), "utf8")
      );
    } catch {
      // No fixture, no fallback - the misses simply stay missing.
    }

    const movieByKey = new Map(movies.map((m) => [m.key, m]));
    let borrowed = 0;
    const stillMissing = [];

    for (const battle of report.battles.missing) {
      const poster = tmdb.movies?.[battle.movie]?.poster;
      if (poster) {
        fixture.battles[battle.key] = {
          image: poster,
          origin: "movie-poster",
          sourceTitle: movieByKey.get(battle.movie)?.title ?? battle.movie,
        };
        borrowed++;
      } else {
        stillMissing.push(battle);
      }
    }

    report.battles.missing = stillMissing;
    console.log(`\n  ${borrowed} battles fell back to their film's poster`);
  }

  console.log(`\nSummary (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  for (const [kind, r] of Object.entries(report)) {
    const covered = Object.keys(fixture[kind]).length;
    console.log(`  ${kind.padEnd(10)} ${covered}/${r.total}`);
    if (r.missing.length) {
      console.log(`    no image: ${r.missing.map((e) => e.key).join(", ")}`);
    }
  }

  const anyMissing = Object.values(report).some((r) => r.missing.length);
  if (anyMissing) {
    console.log(
      "\nFor anything above, search the wiki for the real page title and add it\nto ENTITY_PAGE_TITLES in scripts/etl/wiki.titles.js, then re-run."
    );
  }

  if (DRY_RUN) {
    console.log("\nDry run - fixture not written.\n");
    return;
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: "Marvel Cinematic Universe Wiki (Fandom)",
    licence: "CC-BY-SA 3.0 - attribute the MCU Wiki when displaying these images",
    ...fixture,
  };

  await fs.mkdir(path.dirname(FIXTURE), { recursive: true });
  await fs.writeFile(FIXTURE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${path.relative(process.cwd(), FIXTURE)}\n`);
}

main().catch((err) => {
  console.error(`\nEntity image fetch failed: ${err.message}\n`);
  process.exit(1);
});
