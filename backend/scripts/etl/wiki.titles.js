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

/**
 * Page titles for teams, battles and artifacts whose wiki page is not titled
 * by the name we curate them under.
 *
 * Same purpose as PAGE_TITLES above, for the non-character entities. The wiki
 * resolves near-misses itself through redirects - "Mjolnir" finds "Mjølnir"
 * without help - so only genuine differences belong here. Every entry was
 * confirmed by searching the wiki, not guessed.
 *
 * Keyed by entity kind, then by the seed key.
 */
export const ENTITY_PAGE_TITLES = {
  teams: {
    'asgardian-court': ['Asgardian Royal Family'],
    'wakandan-court': ['Golden Tribe'],
    'ten-rings': ['Ten Rings (Organization)'],
    // The Civil War factions resolve to the event page rather than an
    // organisation page, which is the closest the wiki has.
    'team-iron-man': ['Avengers Civil War'],
    'team-captain-america': ['Avengers Civil War'],
    //
    // Searched and genuinely absent from the wiki: `team-spider-man`,
    // `sinister-six` and `pym-van-dyne-family` are groupings this project
    // curates, not articles Fandom carries. Their members have pages; the
    // groupings do not. Left without images deliberately - listed here so a
    // future reader knows they were checked rather than missed.
  },
  battles: {},
  artifacts: {
    'vibranium-shield': ["Captain America's Shield"],
    'vibranium-suit': ['Panther Habit'],
    'lokis-sceptre': ['Scepter'],
    'orb-of-morag': ['Orb'],
    'helas-headpiece': ["Hela's Crown"],
    'valkyrie-armour': ['Valkyrie'],
    'winter-soldier-arm': ["Winter Soldier's Prosthetic Arm"],
    'hawkeye-bow': ["Hawkeye's Bow and Quiver"],
    'widows-bite': ["Black Widow's Bite"],
    'ten-rings-artifact': ['Ten Rings (Weapons)'],
    'taskmaster-gear': ['Taskmaster Suit'],
    'falcon-harness': ['EXO-7 Falcon'],
    'scarlet-witch-tiara': ['Scarlet Witch'],
    'war-machine-armor': ['War Machine Armor: Mark I'],
    'vulture-wingsuit': ["Vulture's Exo-Suit"],
    'vibranium-arc-reactor': ['Arc Reactor'],
    'kimoyo-beads': ['Kimoyo Bead'],
    'dora-milaje-spear': ['Vibranium Spear'],
    'quantum-realm-suits': ['Quantum Realm Exploration Suit'],
    'walkman': ["Star-Lord's Walkman"],
    'milano': ['Milano'],
    'captain-marvel-suit': ['Starforce Uniform'],
    'flerken-pocket-dimension': ['Flerken'],
    'silver-surfer-board': ["Silver Surfer's Surfboard"],
    'gamma-experiment': ['Gamma Radiation'],
    'chitauri-salvage': ['Chitauri'],
    'red-room-mind-control': ['Red Room'],
  },
};
