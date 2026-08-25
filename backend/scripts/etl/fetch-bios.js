/**
 * Fetch character biographies from the MCU Fandom wiki into a committed
 * fixture.
 *
 *   node scripts/etl/fetch-bios.js            # refresh the fixture
 *   node scripts/etl/fetch-bios.js --dry-run  # report, write nothing
 *
 * Why this source. The curated descriptions in seed-data.js are single
 * sentences - a median of 112 characters - which is too little to carry a
 * detail page. TMDB has no character-level text at all (its records describe
 * films and people, not roles), and Marvel's own API is shut down. The MCU
 * wiki's lead section is the one source that is both MCU-specific and written
 * per character, and the page-title mapping it needs is already verified by
 * fetch-portraits.js.
 *
 * Fandom disables the `extracts` extension, so `prop=extracts` returns empty
 * strings for every page - the reason this parses `action=parse` HTML instead
 * of asking for plain text.
 *
 * Same fixture pattern as the portraits: this is the only script that talks to
 * the wiki, the seed reads what it writes, so seeding needs no network.
 *
 * Licence: MCU wiki text is CC-BY-SA. The fixture records the source page per
 * character so the attribution the licence requires can be rendered.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { characters as seedCharacters } from "../seed-data.js";
import { candidateTitles } from "./wiki.titles.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(DIR, "fixtures", "bios.json");
const DRY_RUN = process.argv.includes("--dry-run");

const API = "https://marvelcinematicuniverse.fandom.com/api.php";
const USER_AGENT = "MarvelMCUHub/1.0 (personal learning project)";
const WIKI_BASE = "https://marvelcinematicuniverse.fandom.com/wiki/";

/** Courtesy delay between requests - the wiki is free and unauthenticated. */
const THROTTLE_MS = 250;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Paragraphs beyond this are history, not identity. */
const MAX_PARAGRAPHS = 8;

/**
 * Turn one `<p>` of wiki HTML into plain text.
 *
 * Tags are removed rather than replaced with a space: the wiki wraps inline
 * links, so replacing them inserts a space before the following comma and
 * yields "Stark Industries , and".
 */
const toText = (html) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // Citation markers - "[1]", "[note 2]" - are artefacts of the wiki.
    .replace(/\[\s*(?:\d+|note \d+|citation needed)\s*\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Whether a paragraph is prose rather than infobox debris.
 *
 * Some pages leak their infobox into the parsed HTML as a `<p>`: Natasha's
 * first paragraph is "Hammer Industries (formerly; undercover) Stark
 * Industries (formerly; undercover) Avengers", and Coulson's is "Advanced
 * Threat Containment Unit (formerly) Alexander Pierce High School (formerly)
 * S.H.I.E.L.D. (formerly)" - affiliation tables with the markup stripped off.
 *
 * The discriminator is sentence structure, not vocabulary. An earlier attempt
 * rejected paragraphs containing "former", which threw away Thor's opening
 * line ("the former king of both Asgard and New Asgard") while the debris it
 * was aimed at got through on other pages.
 *
 * Two details matter, and both came out of auditing the fetched fixture rather
 * than the match count:
 *
 *   - Abbreviation periods are not sentence ends. Counting the dots in
 *     "S.H.I.E.L.D." as terminators made Coulson's infobox row look like
 *     prose, so they are removed before counting.
 *   - Repeated "(formerly)" markers are the actual signature of an
 *     affiliation table. One is normal in a sentence; three in a fragment is
 *     not prose.
 *
 * The length floor is deliberately low. Minor characters have genuinely short
 * pages - Namora's entire lead section is 63 characters - and an earlier
 * 80-character floor discarded them as if they had failed.
 */
const looksLikeProse = (text) => {
  if (text.length < 40) {
    return false;
  }

  // An affiliation table reads as a list of parenthesised states, not a
  // sentence about anybody.
  const formerlyMarkers = (text.match(/\((?:formerly|currently)[^)]*\)/gi) ?? [])
    .length;
  if (formerlyMarkers >= 2) {
    return false;
  }

  // Drop abbreviation dots before counting sentence ends, so "S.H.I.E.L.D."
  // and "Dr." do not read as terminators.
  const normalised = text
    .replace(/\b(?:[A-Z]\.){2,}/g, "X")
    .replace(/\b(?:Mr|Mrs|Ms|Dr|Sr|Jr|St|vs|etc)\./gi, "X");

  // A paragraph that ends in an abbreviation - "...founding members of
  // S.H.I.E.L.D." - loses its only sentence end to the normalisation above,
  // so the end of the text counts as one.
  // Only for something already sentence-length: "Strategic Scientific Reserve
  // S.H.I.E.L.D." is an infobox row that also ends in an abbreviation, and it
  // is five words long.
  const endsMidAbbreviation =
    /X$/.test(normalised) && normalised.split(' ').length >= 12;
  const terminators =
    (normalised.match(/[.!?](\s|$)/g) ?? []).length || (endsMidAbbreviation ? 1 : 0);
  if (terminators === 0) {
    return false;
  }

  const words = normalised.split(" ").length;
  return terminators >= 2 || words / terminators < 45;
};

/**
 * The lead section of one page, as an array of paragraphs.
 *
 * `section=0` is everything above the first heading - the summary the wiki
 * writes before it gets into film-by-film history.
 */
async function fetchBio(title) {
  const url = new URL(API);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "text");
  url.searchParams.set("section", "0");
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
  // A missing page returns `{ error: { code: "missingtitle" } }`.
  if (data.error || !data.parse?.text?.["*"]) {
    return null;
  }

  const paragraphs = [...data.parse.text["*"].matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((match) => toText(match[1]))
    .filter(looksLikeProse)
    .slice(0, MAX_PARAGRAPHS);

  if (paragraphs.length === 0) {
    return null;
  }

  return {
    // The wiki's resolved title, which is not always the one requested -
    // "Ava Starr" redirects to "Ghost". Recorded so the attribution link
    // points at the page the text actually came from.
    title: data.parse.title,
    paragraphs,
  };
}

async function main() {
  const started = Date.now();
  console.log(`\nFetching biographies for ${seedCharacters.length} characters`);
  if (DRY_RUN) {
    console.log("*** DRY RUN - the fixture will not be written ***");
  }

  const bios = {};
  const missing = [];

  for (const character of seedCharacters) {
    let found = null;

    for (const title of candidateTitles(character)) {
      try {
        found = await fetchBio(title);
      } catch {
        found = null;
      }
      if (found) {
        break;
      }
      await sleep(THROTTLE_MS);
    }

    if (found) {
      bios[character.key] = {
        lede: found.paragraphs[0],
        paragraphs: found.paragraphs,
        source: WIKI_BASE + encodeURIComponent(found.title.replace(/ /g, "_")),
        sourceTitle: found.title,
      };
      const chars = found.paragraphs.join(" ").length;
      console.log(
        `  ok    ${character.key.padEnd(24)} ${String(found.paragraphs.length).padStart(2)} para  ${String(chars).padStart(5)} chars  (${found.title})`
      );
    } else {
      missing.push(character.key);
      console.log(`  MISS  ${character.key}`);
    }

    await sleep(THROTTLE_MS);
  }

  const fixture = {
    generatedAt: new Date().toISOString(),
    source: "Marvel Cinematic Universe Wiki (Fandom)",
    licence: "CC-BY-SA 3.0",
    bios,
  };

  console.log(
    `\n${Object.keys(bios).length}/${seedCharacters.length} matched in ${((Date.now() - started) / 1000).toFixed(1)}s`
  );
  if (missing.length > 0) {
    console.log(`\nNo biography for ${missing.length}:`);
    console.log("  " + missing.join(", "));
    console.log(
      "\nAdd a page title to scripts/etl/wiki.titles.js for any of these that\nhas a wiki page under a different name."
    );
  }

  if (DRY_RUN) {
    console.log("\nDry run - fixture not written.\n");
    return;
  }

  await fs.writeFile(FIXTURE, JSON.stringify(fixture, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${path.relative(process.cwd(), FIXTURE)}\n`);
}

main().catch((err) => {
  console.error("\nBiography fetch failed:", err.message);
  process.exit(1);
});
