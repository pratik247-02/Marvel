/**
 * Migration 001 - backfill `slug` on existing content documents.
 *
 *   node scripts/migrations/001-backfill-slugs.js --dry-run
 *   node scripts/migrations/001-backfill-slugs.js
 *
 * Documents seeded before `slug` existed have no value for it. The seed loader
 * upserts on `slug`, so without this backfill a rerun would not match those
 * documents and would insert a duplicate set beside them.
 *
 * Idempotent: only documents missing a slug are touched, so running this twice
 * is a no-op the second time.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { slugify } from "../../src/utils/slug.js";
import {
  characters as seedCharacters,
  movies as seedMovies,
  artifacts as seedArtifacts,
  teams as seedTeams,
  battles as seedBattles,
} from "../seed-data.js";

import Character from "../../src/modules/characters/character.model.js";
import Movie from "../../src/modules/movies/movie.model.js";
import Artifact from "../../src/modules/artifacts/artifact.model.js";
import Team from "../../src/modules/teams/team.model.js";
import Battle from "../../src/modules/battles/battle.model.js";

dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");
const uriFlag = process.argv.indexOf("--uri");
const MONGO_URI =
  (uriFlag !== -1 && process.argv[uriFlag + 1]) ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/marvel";

const safeUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

/**
 * Build a display-name -> seed-key lookup.
 *
 * The seed file's `key` is the authoritative slug: relations reference it, and
 * the loader upserts on it. For a few entities it deliberately differs from
 * what the name alone would produce - the team "The Avengers" is keyed
 * `avengers` to distinguish it from the movie of the same name. Deriving the
 * slug from the name in those cases would not match the loader's filter, and
 * the next seed run would insert a duplicate.
 */
const keyByName = (items, field) =>
  new Map(items.map((i) => [i[field], i.key]));

/** Collections to backfill, paired with the field the slug derives from. */
const targets = [
  {
    model: Character,
    label: "characters",
    from: "name",
    seedKeys: keyByName(seedCharacters, "name"),
  },
  { model: Movie, label: "movies", from: "title", seedKeys: keyByName(seedMovies, "title") },
  {
    model: Artifact,
    label: "artifacts",
    from: "name",
    seedKeys: keyByName(seedArtifacts, "name"),
  },
  { model: Team, label: "teams", from: "name", seedKeys: keyByName(seedTeams, "name") },
  { model: Battle, label: "battles", from: "name", seedKeys: keyByName(seedBattles, "name") },
];

async function backfill({ model, label, from, seedKeys }) {
  // Missing OR null OR empty - a document written before the field existed can
  // present as any of the three.
  const pending = await model
    .find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] })
    .select(`_id ${from}`)
    .lean();

  if (pending.length === 0) {
    console.log(`  ${label.padEnd(12)} nothing to do`);
    return { touched: 0, collisions: [] };
  }

  const seen = new Map();
  const collisions = [];
  const ops = [];

  for (const doc of pending) {
    // Prefer the seed key when this document came from the seed set; fall back
    // to deriving from the display name for anything created another way.
    const base = seedKeys.get(doc[from]) ?? slugify(doc[from]);
    if (!base) {
      collisions.push({ id: doc._id, reason: `empty slug from "${doc[from]}"` });
      continue;
    }
    if (seen.has(base)) {
      // Two documents slugify to the same value. Surface it rather than
      // silently suffixing - the source data is what needs fixing.
      collisions.push({ id: doc._id, reason: `duplicate slug "${base}"` });
      continue;
    }
    seen.set(base, doc._id);
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { slug: base } } } });
  }

  // Guard against colliding with a slug already stored on another document.
  const existing = await model
    .find({ slug: { $in: [...seen.keys()] } })
    .select("_id slug")
    .lean();
  for (const e of existing) {
    if (String(seen.get(e.slug)) !== String(e._id)) {
      collisions.push({ id: seen.get(e.slug), reason: `slug "${e.slug}" already taken` });
    }
  }

  if (DRY_RUN) {
    console.log(`  ${label.padEnd(12)} would set ${ops.length} slug(s)`);
    for (const o of ops.slice(0, 3)) {
      console.log(`      ${o.updateOne.update.$set.slug}`);
    }
    if (ops.length > 3) {
      console.log(`      ... and ${ops.length - 3} more`);
    }
    return { touched: ops.length, collisions };
  }

  if (ops.length > 0) {
    await model.bulkWrite(ops);
  }
  console.log(`  ${label.padEnd(12)} set ${ops.length} slug(s)`);
  return { touched: ops.length, collisions };
}

async function main() {
  console.log(`\nConnecting to ${safeUri(MONGO_URI)}`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected. Database: ${mongoose.connection.name}`);

  if (DRY_RUN) {
    console.log("\n*** DRY RUN - no writes will be performed ***");
  }

  console.log("\nBackfilling slugs");
  let total = 0;
  const allCollisions = [];
  for (const t of targets) {
    const { touched, collisions } = await backfill(t);
    total += touched;
    allCollisions.push(...collisions.map((c) => ({ ...c, collection: t.label })));
  }

  if (allCollisions.length > 0) {
    console.log("\nUnresolved documents (left without a slug):");
    for (const c of allCollisions) {
      console.log(`  [${c.collection}] ${c.id} - ${c.reason}`);
    }
  }

  console.log(`\n${DRY_RUN ? "Would update" : "Updated"} ${total} document(s).`);
  await mongoose.disconnect();
  console.log("Done.\n");
}

main().catch(async (err) => {
  console.error("\nMigration failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
