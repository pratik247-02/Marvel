import type { CharacterListItem } from "./character";
import type { MovieListItem } from "./movie";

export interface TeamTheme {
  colorPrimary?: string;
  colorSecondary?: string;
}

export interface TeamListItem {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  logo?: string;
  headquarters?: string;
  founded?: string;
  status?: "active" | "disbanded" | "reformed" | "unknown";
  memberCount?: number;
}

export interface Team extends TeamListItem {
  members?: CharacterListItem[];
  leaders?: CharacterListItem[];
  appearances?: MovieListItem[];
  theme?: TeamTheme;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  image?: string;
  logo?: string;
  members?: string[];
  leaders?: string[];
  appearances?: string[];
  headquarters?: string;
  founded?: string;
  status?: "active" | "disbanded" | "reformed" | "unknown";
  theme?: TeamTheme;
}

export interface UpdateTeamInput extends Partial<CreateTeamInput> {}
