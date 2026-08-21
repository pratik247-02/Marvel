export interface CharacterTheme {
  colorPrimary: string;
  colorSecondary: string;
}

export interface CharacterSection {
  type: "biography" | "timeline" | "gallery" | "quotes" | "trivia" | "relationships";
  data: Record<string, unknown>;
}

export interface Character {
  _id: string;
  id: string;
  name: string;
  alias?: string;
  description?: string;
  image?: string;
  affiliations?: Character[];
  appearances?: Movie[];
  artifactsUsed?: Artifact[];
  powers?: string[];
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
