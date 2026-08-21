/**
 * Validate the curated seed data before it reaches the database.
 *
 *   node scripts/validate-seed.js
 *
 * Every relation in seed-data.js is a slug reference to another entity. A typo
 * produces a reference that silently resolves to nothing: the two-pass loader
 * filters unresolved keys out, so the seed succeeds, the counts look right, and
 * an edge is simply missing from the graph. Nothing fails loudly.
 *
 * This catches that before seeding rather than after, and it matters more as
 * the dataset grows - a hundred characters is a few hundred slug references
 * written by hand.
 *
 * Exits non-zero on any problem so it can gate CI.
 */

import {
  characters,
  movies,
  artifacts,
  teams,
  battles,
} from "./seed-data.js";

const problems = [];
const warnings = [];

const keysOf = (list) => new Set(list.map((item) => item.key));
const movieKeys = keysOf(movies);
const characterKeys = keysOf(characters);
const artifactKeys = keysOf(artifacts);

/** Report any reference in `values` that is not present in `valid`. */
const checkRefs = (values, valid, label, field) => {
  for (const value of values ?? []) {
    if (!valid.has(value)) {
      problems.push(`${label}: ${field} -> "${value}" does not exist`);
    }
  }
};

/** Duplicate keys within a collection would make upserts collide. */
const checkDuplicates = (list, label) => {
  const seen = new Set();
  for (const item of list) {
    if (seen.has(item.key)) {
      problems.push(`${label}: duplicate key "${item.key}"`);
    }
    seen.add(item.key);
    if (!item.key || !/^[a-z0-9-]+$/.test(item.key)) {
      problems.push(`${label}: invalid key "${item.key}" (lowercase, digits and hyphens only)`);
    }
  }
};

checkDuplicates(movies, "movies");
checkDuplicates(characters, "characters");
checkDuplicates(artifacts, "artifacts");
checkDuplicates(teams, "teams");
checkDuplicates(battles, "battles");

const PHASES = new Set(["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"]);

for (const movie of movies) {
  const label = `movie "${movie.key}"`;
  if (!movie.title) {
    problems.push(`${label}: missing title`);
  }
  if (!PHASES.has(movie.phase)) {
    problems.push(`${label}: invalid phase "${movie.phase}"`);
  }
  if (!(movie.releaseYear >= 2008 && movie.releaseYear <= 2030)) {
    problems.push(`${label}: releaseYear ${movie.releaseYear} outside the model's 2008-2030 range`);
  }
}

for (const character of characters) {
  const label = `character "${character.key}"`;
  if (!character.name) {
    problems.push(`${label}: missing name`);
  }
  checkRefs(character.appearances, movieKeys, label, "appearances");
  checkRefs(character.affiliations, characterKeys, label, "affiliations");
  checkRefs(character.artifactsUsed, artifactKeys, label, "artifactsUsed");

  if (character.affiliations?.includes(character.key)) {
    problems.push(`${label}: lists itself as an affiliation`);
  }

  // Not fatal, but a character with no ties is invisible to the graph, which
  // is the whole point of the dataset.
  const edges =
    (character.affiliations?.length ?? 0) +
    (character.appearances?.length ?? 0) +
    (character.artifactsUsed?.length ?? 0);
  if (edges === 0) {
    warnings.push(`${label}: no relations at all - it will be an isolated node`);
  }
}

for (const artifact of artifacts) {
  const label = `artifact "${artifact.key}"`;
  checkRefs(artifact.holders, characterKeys, label, "holders");
  checkRefs(artifact.appearances, movieKeys, label, "appearances");
}

for (const team of teams) {
  const label = `team "${team.key}"`;
  checkRefs(team.members, characterKeys, label, "members");
  checkRefs(team.leaders, characterKeys, label, "leaders");
  checkRefs(team.appearances, movieKeys, label, "appearances");

  for (const leader of team.leaders ?? []) {
    if (!team.members?.includes(leader)) {
      warnings.push(`${label}: leader "${leader}" is not listed among the members`);
    }
  }
}

for (const battle of battles) {
  const label = `battle "${battle.key}"`;
  if (battle.movie && !movieKeys.has(battle.movie)) {
    problems.push(`${label}: movie -> "${battle.movie}" does not exist`);
  }
  checkRefs(battle.participants, characterKeys, label, "participants");

  if (battle.winner) {
    if (!characterKeys.has(battle.winner)) {
      problems.push(`${label}: winner -> "${battle.winner}" does not exist`);
    } else if (!battle.participants?.includes(battle.winner)) {
      warnings.push(`${label}: winner "${battle.winner}" is not among the participants`);
    }
  }
}

console.log(
  `\nChecked ${movies.length} movies, ${characters.length} characters, ` +
    `${artifacts.length} artifacts, ${teams.length} teams, ${battles.length} battles`
);

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const warning of warnings) {
    console.log(`  ! ${warning}`);
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) {
    console.error(`  x ${problem}`);
  }
  console.error("");
  process.exit(1);
}

console.log("\nAll references resolve.\n");
