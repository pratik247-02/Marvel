import type { CharacterListItem } from "./character";
import type { MovieListItem } from "./movie";

export type BattleSignificance = "minor" | "major" | "universe-altering";

export interface Battle {
  _id: string;
  id: string;
  name: string;
  description?: string;
  participants?: CharacterListItem[];
  outcome?: string;
  movie?: MovieListItem;
  images?: string[];
  location?: string;
  winner?: CharacterListItem;
  casualties?: number;
  significance: BattleSignificance;
  createdAt: string;
  updatedAt: string;
}

export interface BattleListItem {
  _id: string;
  id: string;
  name: string;
  significance: BattleSignificance;
  movie?: MovieListItem;
  /** Populated by the API; used to mark which fights a character won. */
  winner?: { _id: string; name: string; alias?: string; image?: string };
}
