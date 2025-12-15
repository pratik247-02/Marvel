import type { CharacterListItem } from "./character";
import type { MovieListItem } from "./movie";

export type ArtifactStatus = "active" | "destroyed" | "unknown" | "lost";

export interface Artifact {
  _id: string;
  id: string;
  name: string;
  description?: string;
  image?: string;
  holders?: CharacterListItem[];
  appearances?: MovieListItem[];
  origin?: string;
  powers?: string[];
  status: ArtifactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactListItem {
  _id: string;
  id: string;
  name: string;
  image?: string;
  status: ArtifactStatus;
}
