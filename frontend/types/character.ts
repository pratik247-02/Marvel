export interface CharacterTheme {
  colorPrimary: string;
  colorSecondary: string;
}

export interface CharacterSection {
  type: "biography" | "timeline" | "gallery" | "quotes" | "trivia" | "relationships";
  data: Record<string, unknown>;
}

/** The performer, from TMDB cast credits. Never the character's own image. */
export interface CharacterActor {
  name?: string;
  photo?: string;
  creditedAs?: string;
}

/**
 * Long-form biography from the MCU wiki.
 *
 * Separate from `description`, which stays the curated one-liner that cards
 * and list rows render. `source` is the page the text came from - the wiki is
 * CC-BY-SA, so attribution is required, not optional.
 */
export interface CharacterBio {
  lede?: string;
  paragraphs?: string[];
  source?: string;
  sourceTitle?: string;
}

export interface Character {
  _id: string;
  id: string;
  /** Stable URL key, assigned once on insert. Served by the API already. */
  slug?: string;
  name: string;
  alias?: string;
  description?: string;
  image?: string;
  affiliations?: Character[];
  appearances?: Movie[];
  artifactsUsed?: Artifact[];
  powers?: string[];
  actor?: CharacterActor;
  bio?: CharacterBio;
  sections: CharacterSection[];
  theme: CharacterTheme;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterListItem {
  _id: string;
  id: string;
  name: string;
  alias?: string;
  image?: string;
  description?: string;
  /** Present on list responses; drives per-entity theming in cards. */
  theme?: CharacterTheme;
  /** Mongoose document version, used for optimistic concurrency on edits. */
  __v?: number;
}

// Import types that are referenced
import type { Movie } from "./movie";
import type { Artifact } from "./artifact";
