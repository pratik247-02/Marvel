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
  /**
   * Card image. Distinct from `images`, which is a gallery.
   *
   * `imageOrigin` says where it came from: most battles have no art of their
   * own on the wiki and borrow the poster of the film they happened in, which
   * every battle in that film then shares.
   */
  image?: string;
  imageOrigin?: "wiki" | "movie-poster";
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
  image?: string;
  imageOrigin?: "wiki" | "movie-poster";
  /** Populated by the API; used to mark which fights a character won. */
  winner?: { _id: string; name: string; alias?: string; image?: string };
}
