/**
 * Migration 002 - remove actor headshots stored as character images.
 *
 *   node scripts/migrations/002-clear-actor-photos.js --dry-run
 *   node scripts/migrations/002-clear-actor-photos.js
 *
 * An earlier version of the ETL harvested `profile_path` from TMDB cast
 * credits and stored it as the character's image. That field is a photo of the
 * *actor*, not the character, so Groot's card carried a picture of Vin Diesel.
 * TMDB has no character artwork at all, so there was no correct field to use.
 *
 * The ETL no longer writes these, but the seed only sets fields and never
 * clears them, so documents written by the old version keep the wrong image
 * until it is explicitly unset. That is what this does.
 *
 * Only images served from TMDB are touched. A hand-curated URL added to
 * seed-data.js is left alone, so running this after curating is safe.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Character from "../../src/modules/characters/character.model.js";

dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");
const uriFlag = process.argv.indexOf("--uri");
const MONGO_URI =
  (uriFlag !== -1 && process.argv[uriFlag + 1]) ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/marvel";

const safeUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

/** Matches only TMDB-hosted images, which are the ones the ETL wrote. */
const TMDB_IMAGE = /^https:\/\/image\.tmdb\.org\//;

async function main() {
  console.log(`\nConnecting to ${safeUri(MONGO_URI)}`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected. Database: ${mongoose.connection.name}`);

  if (DRY_RUN) {
    console.log("\n*** DRY RUN - no writes will be performed ***");
  }

  const affected = await Character.find({ image: { $regex: TMDB_IMAGE } })
    .select("_id name image")
    .lean();

  if (affected.length === 0) {
    console.log("\nNothing to do - no character holds a TMDB image.\n");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n${affected.length} character(s) holding an actor photo:`);
  for (const c of affected.slice(0, 5)) {
    console.log(`  ${c.name}`);
  }
  if (affected.length > 5) {
    console.log(`  ... and ${affected.length - 5} more`);
  }

  if (!DRY_RUN) {
    const result = await Character.updateMany(
      { image: { $regex: TMDB_IMAGE } },
      { $unset: { image: "" } }
    );
    console.log(`\nCleared ${result.modifiedCount} image(s).`);
  } else {
    console.log(`\nWould clear ${affected.length} image(s).`);
  }

  await mongoose.disconnect();
  console.log("Done.\n");
}

main().catch(async (err) => {
  console.error(`\nMigration failed: ${err.message}\n`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
