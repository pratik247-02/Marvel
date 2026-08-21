/**
 * Fetch TMDB data and write it to a committed fixture.
 *
 *   node scripts/etl/fetch-tmdb.js            # refresh the fixture
 *   node scripts/etl/fetch-tmdb.js --dry-run  # report, write nothing
 *
 * This is the only script that talks to TMDB. The seed reads the fixture it
 * produces, which means seeding needs no API key, CI never depends on a third
 * party being up, and the data is reproducible - anyone cloning the repo gets
 * exactly what was used to build it.
 *
 * Run this only when the movie list changes or the fixture goes stale.
 */

import io from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { TmdbClient, imageUrl } from "./tmdb.client.js";
import { movies as seedMovies } from "../seed-data.js";

dotenv.config();

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(DIR, "fixtures", "tmdb.json");
const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Deliberately no character portraits here.
 *
 * TMDB's cast objects carry `profile_path`, which is a photo of the *actor*,
 * not the character - using it puts Vin Diesel's headshot on Groot. TMDB has
 * no character artwork at all, so there is no other field to reach for.
 *
 * Character images are hand-curated in seed-data.js instead. The seed already
 * prefers curated values over anything in this fixture, so that is purely a
 * data question and needs no code here.
 */

async function main() {
  const client = new TmdbClient();
  const started = Date.now();

  console.log(`\nFetching ${seedMovies.length} movies from TMDB`);
  if (DRY_RUN) {
    console.log("*** DRY RUN - the fixture will not be written ***");
  }

  const movies = {};
  let missed = 0;

  for (const movie of seedMovies) {
    const hit = await client.searchMovie(movie.title, movie.releaseYear);
    if (!hit) {
      console.log(`  MISS  ${movie.title}`);
      missed++;
      continue;
    }

    const [details, credits] = await Promise.all([
      client.movieDetails(hit.id),
      client.movieCredits(hit.id),
    ]);

    movies[movie.key] = {
      tmdbId: hit.id,
      title: details.title,
      poster: imageUrl(details.poster_path, "w500"),
      backdrop: imageUrl(details.backdrop_path, "w1280"),
      runtime: details.runtime,
      boxOffice: details.revenue || undefined,
      rating: details.vote_average ? Number(details.vote_average.toFixed(1)) : undefined,
      releaseDate: details.release_date,
      synopsis: details.overview,
      director:
        credits.crew?.find((c) => c.job === "Director")?.name ?? undefined,
    };

    console.log(`  ok    ${movie.title} (tmdb ${hit.id})`);
  }

  const fixture = {
    generatedAt: new Date().toISOString(),
    source: "https://www.themoviedb.org",
    movies,
  };

  console.log(
    `\n${Object.keys(movies).length} movies` + (missed ? `, ${missed} not found` : "")
  );
  console.log(`${client.requestCount} API requests in ${Date.now() - started}ms`);

  if (DRY_RUN) {
    console.log("\nDry run - nothing written.\n");
    return;
  }

  await io.mkdir(path.dirname(FIXTURE), { recursive: true });
  await io.writeFile(FIXTURE, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${path.relative(process.cwd(), FIXTURE)}\n`);
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}\n`);
  process.exit(1);
});
