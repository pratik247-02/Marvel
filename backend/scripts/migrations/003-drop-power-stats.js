/**
 * Migration 003 - drop the fabricated power-stat block from characters.
 *
 *   node scripts/migrations/003-drop-power-stats.js --dry-run
 *   node scripts/migrations/003-drop-power-stats.js
 *
 * Characters used to carry a six-axis `stats` object - strength, intelligence,
 * speed, durability, energy, combat - each a 0-100 number. Those numbers had no
 * source. Nothing in the films or in any dataset says Iron Man's intelligence
 * is 95 rather than 100, so every value was invented, and an invented number
 * that looks like data is worse than no number at all.
 *
 * They also fed nothing. The graph runs on edges - affiliations, appearances,
 * teams, battles - and the stats block was decoration on the detail page.
 *
 * The field is gone from the schema, but Mongoose only strips unknown fields on
 * write, never on read: documents written by the old schema keep `stats` and
 * keep serving it through the API. Removing it from the code is therefore not
 * enough, which is what this migration is for.
 *
 * This goes through the raw collection rather than the Character model on
 * purpose. `stats` is no longer in the schema, so a model-level query cannot
 * express a filter on it - Mongoose would strip the condition and the update
 * would match everything or nothing.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");
const uriFlag = process.argv.indexOf("--uri");
const MONGO_URI =
  (uriFlag !== -1 && process.argv[uriFlag + 1]) ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/marvel";

const safeUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

async function main() {
  console.log(`\nConnecting to ${safeUri(MONGO_URI)}`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected. Database: ${mongoose.connection.name}`);

  if (DRY_RUN) {
    console.log("\n*** DRY RUN - no writes will be performed ***");
  }

  const collection = mongoose.connection.collection("characters");
  const filter = { stats: { $exists: true } };

  const affected = await collection
    .find(filter, { projection: { name: 1 } })
    .toArray();

  if (affected.length === 0) {
    console.log("\nNothing to do - no character carries a stats block.\n");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n${affected.length} character(s) still carrying stats:`);
  for (const c of affected.slice(0, 5)) {
    console.log(`  ${c.name}`);
  }
  if (affected.length > 5) {
    console.log(`  ... and ${affected.length - 5} more`);
  }

  if (!DRY_RUN) {
    const result = await collection.updateMany(filter, { $unset: { stats: "" } });
    console.log(`\nDropped stats from ${result.modifiedCount} character(s).`);
  } else {
    console.log(`\nWould drop stats from ${affected.length} character(s).`);
  }

  await mongoose.disconnect();
  console.log("Done.\n");
}

main().catch(async (err) => {
  console.error(`\nMigration failed: ${err.message}\n`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
