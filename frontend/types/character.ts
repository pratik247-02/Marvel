export interface CharacterStats {
  strength: number;
  intelligence: number;
  speed: number;
  durability: number;
  energy: number;
  combat: number;
}

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
  stats: CharacterStats;
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
}

// Import types that are referenced
import type { Movie } from "./movie";
import type { Artifact } from "./artifact";
