/**
 * Fetch character portraits from the MCU Fandom wiki into a committed fixture.
 *
 *   node scripts/etl/fetch-portraits.js            # refresh the fixture
 *   node scripts/etl/fetch-portraits.js --dry-run  # report, write nothing
 *
 * Why this source. TMDB has no character artwork at all - its cast records
 * carry actor headshots, so using them puts Vin Diesel's face on Groot.
 * Marvel's own developer API was the obvious answer but has been shut down:
 * developer.marvel.com now redirects to marvel.com and the gateway returns
 * 500. Wikipedia works but its images are film stills of variable quality and
 * several are red-carpet photos of the actor.
 *
 * The MCU Fandom wiki runs MediaWiki, so it has a real API, needs no key, and
 * its `pageimages` property returns the infobox portrait - which is exactly
 * the in-costume character image wanted here.
 *
 * Same fixture pattern as the TMDB fetch: this is the only script that talks
 * to the wiki, the seed reads what it writes, so seeding needs no network.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { characters as seedCharacters } from "../seed-data.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(DIR, "fixtures", "portraits.json");
const DRY_RUN = process.argv.includes("--dry-run");

const API = "https://marvelcinematicuniverse.fandom.com/api.php";
const USER_AGENT = "MarvelMCUHub/1.0 (personal learning project)";

/** Courtesy delay between requests - the wiki is free and unauthenticated. */
const THROTTLE_MS = 250;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Page titles to try per character, in order.
 *
 * The wiki titles pages by the name in current use, which often is not the
 * curated name. Several need explicit handling:
 *
 *   Bruce Banner  -> "Hulk"
 *   Bucky Barnes  -> "Winter Soldier"
 *   Sam Wilson    -> "Falcon"
 *   Shuri         -> "Princess Shuri"
 *
 * "Black Widow" is the important one. It resolves to Yelena Belova, who took
 * the mantle, so searching the alias returns the wrong character entirely.
 * Natasha has to be requested by her real name.
 */
const PAGE_TITLES = {
  "tony-stark": ["Iron Man"],
  "steve-rogers": ["Captain America"],
  "thor-odinson": ["Thor"],
  "bruce-banner": ["Hulk"],
  "natasha-romanoff": ["Natasha Romanoff"],
  "clint-barton": ["Hawkeye"],
  "bucky-barnes": ["Winter Soldier"],
  "sam-wilson": ["Falcon"],
  "peter-parker": ["Spider-Man"],
  "stephen-strange": ["Doctor Strange"],
  tchalla: ["Black Panther"],
  shuri: ["Princess Shuri", "Shuri"],
  "peter-quill": ["Star-Lord"],
  gamora: ["Gamora"],
  "rocket-raccoon": ["Rocket Raccoon"],
  groot: ["Groot"],
  "loki-laufeyson": ["Loki"],
  thanos: ["Thanos"],
};

/**
 * Strip the revision suffix from a wikia URL.
 *
 * Raw URLs end in `/revision/latest?cb=20240802142023`, which pins a specific
 * upload. The path before it is stable and serves the current image.
 */
const cleanUrl = (url) => url?.split("/revision/")[0];

async function fetchPortrait(title) {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "original");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  // A missing page comes back with a negative id and no `original`.
  return cleanUrl(page?.original?.source) ?? null;
}

async function main() {
  const started = Date.now();
  console.log(`\nFetching portraits for ${seedCharacters.length} characters`);
  if (DRY_RUN) {
    console.log("*** DRY RUN - the fixture will not be written ***");
  }

  const characterImages = {};
  const missing = [];

  for (const character of seedCharacters) {
    const candidates = PAGE_TITLES[character.key] ?? [character.name];
    let found = null;

    for (const title of candidates) {
      try {
        found = await fetchPortrait(title);
      } catch {
        found = null;
      }
      if (found) {
        break;
      }
      await sleep(THROTTLE_MS);
    }

    if (found) {
      characterImages[character.key] = found;
      const file = found.split("/images/")[1] ?? found;
      console.log(`  ok    ${character.name.padEnd(20)} ${file}`);
    } else {
      missing.push(character.name);
      console.log(`  MISS  ${character.name.padEnd(20)} tried: ${candidates.join(", ")}`);
    }

    await sleep(THROTTLE_MS);
  }

  const fixture = {
    generatedAt: new Date().toISOString(),
    source: "https://marvelcinematicuniverse.fandom.com",
    licence: "CC BY-SA - attribute the MCU Wiki when displaying these images",
    characterImages,
  };

  const found = Object.keys(characterImages).length;
  console.log(`\n${found}/${seedCharacters.length} portraits`);
  if (missing.length) {
    console.log(`missing: ${missing.join(", ")}`);
  }
  console.log(`completed in ${Date.now() - started}ms`);

  if (DRY_RUN) {
    console.log("\nDry run - nothing written.\n");
    return;
  }

  await fs.mkdir(path.dirname(FIXTURE), { recursive: true });
  await fs.writeFile(FIXTURE, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${path.relative(process.cwd(), FIXTURE)}\n`);
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}\n`);
  process.exit(1);
});
