/**
 * MCU wiki page titles, for characters whose page is not titled by the name we
 * curate them under.
 *
 * Shared by fetch-portraits.js and fetch-bios.js so the mapping is verified
 * once rather than drifting between two copies of the same list. Every entry
 * here was confirmed by searching the wiki, not guessed.
 *
 * The wiki titles pages by the name in current use, which often is not the
 * curated name:
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
export const PAGE_TITLES = {
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

  // Added with the full character set. Each of these resolved to nothing under
  // the character's own name; the titles below were confirmed by searching the
  // wiki rather than guessed.
  "high-evolutionary": ["High Evolutionary"],
  kurt: ["Kurt Goreshter"],
  "supreme-intelligence": ["Supreme Intelligence"],
  "general-dreykov": ["Dreykov"],
  "laura-kinney": ["X-23"],

  // Spider-Man: Brand New Day (2026).
  "frank-castle": ["The Punisher"],
  "jean-grey": ["Jean Grey"],
  tombstone: ["Tombstone"],
};

/** Titles to try for one character, in order. */
export const candidateTitles = (character) =>
  PAGE_TITLES[character.key] ?? [character.name];
