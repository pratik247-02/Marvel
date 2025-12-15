import type { CharacterListItem } from "./character";

export type Phase = "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4" | "Phase 5" | "Phase 6";

export interface Movie {
  _id: string;
  id: string;
  title: string;
  releaseYear: number;
  phase: Phase;
  characters?: CharacterListItem[];
  poster?: string;
  synopsis?: string;
  director?: string;
  boxOffice?: number;
  runtime?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MovieListItem {
  _id: string;
  id: string;
  title: string;
  releaseYear: number;
  phase: Phase;
  poster?: string;
}

export interface MovieTimeline {
  _id: string;
  title: string;
  releaseYear: number;
  phase: Phase;
  poster?: string;
}
