/**
 * Seed the MCU sample dataset.
 *
 *   node scripts/seed.js                  # seed using MONGO_URI from .env
 *   node scripts/seed.js --dry-run        # report what would change, write nothing
 *   node scripts/seed.js --uri "mongodb+srv://..."
 *   node scripts/seed.js --purge          # delete seeded collections first
 *
 * Idempotent: entities are upserted on a natural key (`name` / `title`), so
 * running this repeatedly converges to the same state instead of duplicating.
 *
 * Relations are resolved in two passes because the data is circular - Tony
 * references Steve while Steve references Tony, so no single-pass ordering
 * exists. Pass 1 upserts every entity without relations to mint ids; pass 2
 * resolves the slug keys to those ids and patches them in.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { characters, movies, artifacts, teams, battles } from "./seed-data.js";

import Character from "../src/modules/characters/character.model.js";
import Movie from "../src/modules/movies/movie.model.js";
import Artifact from "../src/modules/artifacts/artifact.model.js";
import Team from "../src/modules/teams/team.model.js";
import Battle from "../src/modules/battles/battle.model.js";

dotenv.config();

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const PURGE = args.includes("--purge");
const uriFlag = args.indexOf("--uri");
const MONGO_URI =
  (uriFlag !== -1 && args[uriFlag + 1]) ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/marvel";

/** Redact credentials before logging a connection string. */
const safeUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

const log = (...m) => console.log(...m);

/**
 * Pass 1 - upsert bare entities (no relation fields) and return key -> _id.
 *
 * The upsert filter is the `slug`, not the display name. That is what makes a
 * rerun safe: correcting a title in the source data updates the existing
 * document instead of inserting a second one beside it.
 */
async function upsertBase(Model, items, pick) {
  const idsByKey = new Map();
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const slug = item.key;
    const filter = { slug };
    const doc = { ...pick(item), slug };

    if (DRY_RUN) {
      const existing = await Model.findOne(filter).select("_id").lean();
      if (existing) {
        updated++;
      } else {
        created++;
      }
      // Use the real id when present so pass 1 dry-run counts stay meaningful.
      idsByKey.set(item.key, existing?._id ?? null);
      continue;
    }

    const saved = await Model.findOneAndUpdate(
      filter,
      { $set: doc },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .select("_id createdAt updatedAt")
      .lean();

    // A fresh insert has createdAt === updatedAt.
    const isNew =
      saved.createdAt && saved.updatedAt
        ? new Date(saved.createdAt).getTime() === new Date(saved.updatedAt).getTime()
        : false;
    if (isNew) {
      created++;
    } else {
      updated++;
    }
    idsByKey.set(item.key, saved._id);
  }

  return { idsByKey, created, updated };
}

/** Map an array of slug keys to ObjectIds, dropping anything unresolved. */
const toIds = (keys, map) => (keys ?? []).map((k) => map.get(k)).filter(Boolean);

async function main() {
  log(`\nConnecting to ${safeUri(MONGO_URI)}`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  log(`Connected. Database: ${mongoose.connection.name}`);

  if (DRY_RUN) {log("\n*** DRY RUN - no writes will be performed ***");}

  if (PURGE && !DRY_RUN) {
    log("\nPurging existing seeded collections...");
    await Promise.all([
      Character.deleteMany({}),
      Movie.deleteMany({}),
      Artifact.deleteMany({}),
      Team.deleteMany({}),
      Battle.deleteMany({}),
    ]);
    log("Purged.");
  }

  // ---- Pass 1: bare entities -------------------------------------------
  log("\nPass 1 - upserting entities");

  const movieRes = await upsertBase(Movie, movies, (m) => ({
    title: m.title,
    releaseYear: m.releaseYear,
    phase: m.phase,
    synopsis: m.synopsis,
    director: m.director,
    runtime: m.runtime,
    rating: m.rating,
    boxOffice: m.boxOffice,
  }));
  log(`  movies      ${movieRes.created} created, ${movieRes.updated} updated`);

  const charRes = await upsertBase(Character, characters, (c) => ({
    name: c.name,
    alias: c.alias,
    description: c.description,
    powers: c.powers,
    stats: c.stats,
    theme: c.theme,
  }));
  log(`  characters  ${charRes.created} created, ${charRes.updated} updated`);

  const artRes = await upsertBase(Artifact, artifacts, (a) => ({
    name: a.name,
    description: a.description,
    origin: a.origin,
    powers: a.powers,
    status: a.status,
  }));
  log(`  artifacts   ${artRes.created} created, ${artRes.updated} updated`);

  const teamRes = await upsertBase(Team, teams, (t) => ({
    name: t.name,
    description: t.description,
    headquarters: t.headquarters,
    founded: t.founded,
    status: t.status,
    theme: t.theme,
  }));
  log(`  teams       ${teamRes.created} created, ${teamRes.updated} updated`);

  const battleRes = await upsertBase(Battle, battles, (b) => ({
    name: b.name,
    description: b.description,
    location: b.location,
    significance: b.significance,
    outcome: b.outcome,
    casualties: b.casualties,
  }));
  log(`  battles     ${battleRes.created} created, ${battleRes.updated} updated`);

  if (DRY_RUN) {
    log("\nDry run complete - pass 2 (relations) skipped since no ids were minted.");
    await mongoose.disconnect();
    return;
  }

  // ---- Pass 2: relations -----------------------------------------------
  log("\nPass 2 - resolving relations");

  const M = movieRes.idsByKey;
  const C = charRes.idsByKey;
  const A = artRes.idsByKey;

  const charOps = characters.map((c) => ({
    updateOne: {
      filter: { _id: C.get(c.key) },
      update: {
        $set: {
          appearances: toIds(c.appearances, M),
          affiliations: toIds(c.affiliations, C),
          artifactsUsed: toIds(c.artifactsUsed, A),
        },
      },
    },
  }));

  const movieOps = movies.map((m) => ({
    updateOne: {
      filter: { _id: M.get(m.key) },
      update: {
        $set: {
          // Derived from each character's declared appearances.
          characters: characters
            .filter((c) => c.appearances?.includes(m.key))
            .map((c) => C.get(c.key))
            .filter(Boolean),
        },
      },
    },
  }));

  const artOps = artifacts.map((a) => ({
    updateOne: {
      filter: { _id: A.get(a.key) },
      update: {
        $set: {
          holders: toIds(a.holders, C),
          appearances: toIds(a.appearances, M),
        },
      },
    },
  }));

  const teamOps = teams.map((t) => ({
    updateOne: {
      filter: { _id: teamRes.idsByKey.get(t.key) },
      update: {
        $set: {
          members: toIds(t.members, C),
          leaders: toIds(t.leaders, C),
          appearances: toIds(t.appearances, M),
        },
      },
    },
  }));

  const battleOps = battles.map((b) => ({
    updateOne: {
      filter: { _id: battleRes.idsByKey.get(b.key) },
      update: {
        $set: {
          participants: toIds(b.participants, C),
          movie: M.get(b.movie) ?? null,
          winner: b.winner ? (C.get(b.winner) ?? null) : null,
        },
      },
    },
  }));

  // bulkWrite batches these into one round trip per collection rather than
  // one per document.
  const [cw, mw, aw, tw, bw] = await Promise.all([
    Character.bulkWrite(charOps),
    Movie.bulkWrite(movieOps),
    Artifact.bulkWrite(artOps),
    Team.bulkWrite(teamOps),
    Battle.bulkWrite(battleOps),
  ]);
  log(`  characters  ${cw.modifiedCount} linked`);
  log(`  movies      ${mw.modifiedCount} linked`);
  log(`  artifacts   ${aw.modifiedCount} linked`);
  log(`  teams       ${tw.modifiedCount} linked`);
  log(`  battles     ${bw.modifiedCount} linked`);

  // ---- Summary ----------------------------------------------------------
  const counts = {
    characters: await Character.countDocuments(),
    movies: await Movie.countDocuments(),
    artifacts: await Artifact.countDocuments(),
    teams: await Team.countDocuments(),
    battles: await Battle.countDocuments(),
  };
  log("\nFinal document counts:");
  for (const [k, v] of Object.entries(counts)) {log(`  ${k.padEnd(12)} ${v}`);}

  await mongoose.disconnect();
  log("\nDone.\n");
}

main().catch(async (err) => {
  console.error("\nSeed failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
