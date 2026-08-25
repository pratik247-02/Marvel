/**
 * Match MCU characters to the actors who played them, using TMDB cast credits.
 *
 *   npm run actors:dry     - report matches and misses, write nothing
 *   npm run actors:fetch   - write scripts/etl/fixtures/actors.json
 *
 * TMDB has no character artwork - that is why portraits come from the MCU wiki
 * - but it does know who played whom, and it has a photo of the performer. Used
 * as the *actor's* photo beside the character's own portrait, that is correct.
 * Used as the character's image it is the bug this project already shipped once,
 * where Groot's card carried a picture of Vin Diesel.
 *
 * The matching is the hard part. A credit reads "Tony Stark", but also "Rhodey"
 * for James Rhodes, "Yinsen" for Ho Yinsen and "Agent Coulson" for Phil
 * Coulson, so an exact-name comparison silently misses a third of the cast.
 * This normalises both sides, tries the character's name and alias, then falls
 * back to a containment check in either direction. Every unmatched character is
 * reported by name rather than folded into a count, because a miss you cannot
 * see is a miss you will not fix.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as io } from "node:fs";
import dotenv from "dotenv";
import { TmdbClient, imageUrl } from "./tmdb.client.js";
import { characters, movies } from "../seed-data.js";

dotenv.config();

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(DIR, "fixtures", "actors.json");
const TMDB_FIXTURE = path.join(DIR, "fixtures", "tmdb.json");

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Fold a credit or character name to something comparable: lowercase, no
 * punctuation, no diacritics, single spaces. "T'Challa" and "TChalla" both
 * become "tchalla".
 */
const normalise = (value) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Words that appear in credits but carry no identity, so they should not be
 * what a match hinges on. "Agent Coulson" and "Coulson" must both match.
 */
const NOISE = new Set([
  "agent", "general", "colonel", "captain", "dr", "doctor", "mr", "mrs", "ms",
  "president", "secretary", "king", "queen", "prince", "princess", "lord",
  "the", "young", "older", "voice",
]);

const significantWords = (value) =>
  normalise(value)
    .split(" ")
    .filter((word) => word.length > 2 && !NOISE.has(word));

/**
 * Score how well a credit matches a character. Higher is better; 0 is no match.
 *
 * Ordered so that a stronger signal always outranks a weaker one - an exact
 * name beats an alias, which beats a shared surname - and so a single shared
 * common word cannot outweigh a real match.
 */
function score(credit, character) {
  const creditNorm = normalise(credit);
  const nameNorm = normalise(character.name);
  const aliasNorm = normalise(character.alias);

  if (!creditNorm) {
    return 0;
  }
  if (creditNorm === nameNorm) {
    return 100;
  }
  if (aliasNorm && creditNorm === aliasNorm) {
    return 90;
  }

  // "Tony Stark / Iron Man" - TMDB sometimes joins the two with a slash.
  const parts = creditNorm.split(/\s*\/\s*/);
  if (parts.length > 1) {
    for (const part of parts) {
      if (part === nameNorm) {
        return 95;
      }
      if (aliasNorm && part === aliasNorm) {
        return 85;
      }
    }
  }

  // "Yinsen" inside "Ho Yinsen", or "Agent Coulson" containing "Coulson".
  const creditWords = significantWords(credit);
  const nameWords = significantWords(character.name);
  if (creditWords.length === 0 || nameWords.length === 0) {
    return 0;
  }

  const shared = nameWords.filter((word) => creditWords.includes(word));
  if (shared.length === nameWords.length) {
    return 70; // every part of the character's name appears in the credit
  }
  // A surname alone is a reasonable match, but only if it is distinctive - a
  // single short shared word is how "Ross" would match the wrong Ross.
  if (shared.length > 0 && shared.some((word) => word.length >= 5)) {
    return 40;
  }
  return 0;
}

/**
 * Credits that fuzzy matching gets wrong or misses entirely.
 *
 * Keyed by character, valued by the exact `character` string TMDB credits use.
 * Each was found by reading the film's cast list, not guessed. Ava Starr is the
 * important one: the surname alone matched her *father*, Elihas Starr, which is
 * precisely the silent mismatch a confidence score is supposed to surface.
 */
const CREDIT_OVERRIDES = {
  "ava-starr": "Ava / Ghost",
  "loki-laufeyson": "Loki",
  grandmaster: "Grandmaster",
  "rhomann-dey": "Corpsman Dey",
  killmonger: "Erik Killmonger",
  "riri-williams": "Riri",
  "katy-chen": "Katy",
  "mar-vell": "Supreme Intelligence / Dr. Wendy Lawson",
  valkyrie: "Valkyrie",
};

/** The best-scoring cast entry for a character, or null below the threshold. */
function bestMatch(cast, character) {
  const override = CREDIT_OVERRIDES[character.key];
  if (override) {
    const exact = cast.find((entry) => entry.character === override);
    if (exact) {
      return { entry: exact, score: 100 };
    }
  }

  let best = null;
  let bestScore = 0;
  for (const entry of cast) {
    const value = score(entry.character, character);
    if (value > bestScore) {
      bestScore = value;
      best = entry;
    }
  }
  return bestScore >= 40 ? { entry: best, score: bestScore } : null;
}

async function main() {
  const client = new TmdbClient();

  // Reuse the ids already resolved by fetch-tmdb rather than searching again.
  const tmdbFixture = JSON.parse(await io.readFile(TMDB_FIXTURE, "utf8"));
  const movieIds = new Map(
    Object.entries(tmdbFixture.movies ?? {})
      .filter(([, m]) => m.tmdbId)
      .map(([key, m]) => [key, m.tmdbId])
  );

  console.log(`\nFetching credits for ${movieIds.size} films`);
  if (DRY_RUN) {
    console.log("*** DRY RUN - nothing will be written ***");
  }

  /** movieKey -> cast array */
  const castByMovie = new Map();
  for (const [key, tmdbId] of movieIds) {
    try {
      const credits = await client.movieCredits(tmdbId);
      castByMovie.set(key, credits.cast ?? []);
    } catch (error) {
      console.log(`  ! ${key}: ${error.message}`);
      castByMovie.set(key, []);
    }
  }

  const movieTitles = new Map(movies.map((m) => [m.key, m.title]));
  const actors = {};
  const misses = [];
  const weak = [];

  for (const character of characters) {
    // Only look in films the character actually appears in. Searching every
    // film would let a same-named minor credit in an unrelated picture win.
    let found = null;
    for (const movieKey of character.appearances ?? []) {
      const cast = castByMovie.get(movieKey);
      if (!cast?.length) {
        continue;
      }
      const match = bestMatch(cast, character);
      if (match && (!found || match.score > found.score)) {
        found = { ...match, movieKey };
      }
      if (found?.score >= 90) {
        break; // an exact hit will not be improved on
      }
    }

    if (!found) {
      misses.push(character);
      continue;
    }

    actors[character.key] = {
      name: found.entry.name,
      photo: imageUrl(found.entry.profile_path, "w300"),
      creditedAs: found.entry.character,
      matchedIn: movieTitles.get(found.movieKey) ?? found.movieKey,
      confidence: found.score,
    };

    if (found.score < 70) {
      weak.push({ character, match: found });
    }
  }

  const matched = Object.keys(actors).length;
  const withPhoto = Object.values(actors).filter((a) => a.photo).length;

  console.log(`\n${matched}/${characters.length} characters matched to an actor`);
  console.log(`${withPhoto} of those have a photo`);

  if (weak.length > 0) {
    console.log(`\n${weak.length} low-confidence match(es) - check these by eye:`);
    for (const { character, match } of weak) {
      console.log(
        `  ? ${character.name} -> ${match.entry.name} ` +
          `(credited as "${match.entry.character}", score ${match.score})`
      );
    }
  }

  if (misses.length > 0) {
    console.log(`\n${misses.length} unmatched:`);
    for (const character of misses) {
      const where = character.appearances?.length
        ? `appears in ${character.appearances.length} film(s)`
        : "no film appearances";
      console.log(`  x ${character.name} (${where})`);
    }
  }

  if (DRY_RUN) {
    console.log("\nDry run - nothing written.\n");
    return;
  }

  await io.writeFile(
    FIXTURE,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), source: "TMDB", actors }, null, 2)}\n`,
    "utf8"
  );
  console.log(`\nWrote ${path.relative(process.cwd(), FIXTURE)}\n`);
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}\n`);
  process.exit(1);
});
