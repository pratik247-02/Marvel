/** A character as the graph engine returns it - lighter than the full Character. */
export interface GraphNode {
  id: string;
  name: string;
  alias?: string;
  slug: string;
  image?: string;
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  };
  /** Hops from the centre. Only present in ego-network responses. */
  depth?: number;
}

export type EdgeType = "affiliation" | "team" | "battle" | "artifact" | "appearance";

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  /** The film/battle/team that produced this edge, when there is one. */
  context: string | null;
  /** Lower means a stronger connection - Dijkstra minimizes total weight. */
  weight: number;
  /** Human-readable phrasing, e.g. "fought together at Battle of Titan". */
  label: string;
}

export interface GraphPathResult {
  from: { id: string; name: string; slug: string };
  to: { id: string; name: string; slug: string };
  mode: "weighted" | "hops";
  found: boolean;
  hops: number;
  cost: number | null;
  path: GraphNode[] | null;
  edges: GraphEdge[];
}

export interface GraphNetworkResult {
  depth: number;
  center: GraphNode | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  counts: { nodes: number; edges: number };
}

export interface GraphRankedNode extends GraphNode {
  degree: number;
  strength: number;
}

export interface GraphBridgeNode extends GraphNode {
  betweenness: number;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  buildMs: number;
  builtAt: string;
  mostConnected: GraphRankedNode[];
  strongestTies: GraphRankedNode[];
  bridges: GraphBridgeNode[];
}

export interface FullGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: { nodeCount: number; edgeCount: number; buildMs: number };
  builtAt: string;
}

/** A node once the simulation has given it a position and velocity. */
export interface SimulationNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Set while dragging, or for nodes pinned to the path layout. */
  fx?: number | null;
  fy?: number | null;
}
