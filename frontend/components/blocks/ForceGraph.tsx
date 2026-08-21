"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useForceSimulation } from "@/modules/graph";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphEdge, EdgeType } from "@/types";

/**
 * Force-directed graph rendered as SVG.
 *
 * SVG rather than canvas because the graph is small (tens of nodes) and real
 * DOM elements buy hover, focus, CSS transitions and screen-reader labels for
 * free. Canvas would only start to win in the thousands.
 */

/** Edge colours by relation type - matches the weights in the engine. */
const EDGE_COLORS: Record<EdgeType, string> = {
  affiliation: "#e23636",
  team: "#f0a500",
  battle: "#518cca",
  artifact: "#9b59b6",
  appearance: "#4b5563",
};

const EDGE_LABELS: Record<EdgeType, string> = {
  affiliation: "Allied",
  team: "Same team",
  battle: "Fought together",
  artifact: "Shared artifact",
  appearance: "Same film",
};

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Ids forming a path to emphasise; everything else dims. */
  highlightPath?: string[];
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
}

export function ForceGraph({
  nodes,
  edges,
  highlightPath = [],
  height = 560,
  onNodeClick,
  className,
}: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height });
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // Measure the container so the simulation knows its bounds.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  const { positions, startDrag, dragTo, endDrag } = useForceSimulation(nodes, edges, {
    width: size.width,
    height: size.height,
  });

  const pathSet = useMemo(() => new Set(highlightPath), [highlightPath]);
  const hasHighlight = pathSet.size > 0;

  /** Consecutive pairs along the path, so path edges can be drawn boldly. */
  const pathEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < highlightPath.length - 1; i++) {
      const a = highlightPath[i];
      const b = highlightPath[i + 1];
      keys.add(a < b ? `${a}|${b}` : `${b}|${a}`);
    }
    return keys;
  }, [highlightPath]);

  const nodeById = useMemo(
    () => new Map(positions.map((n) => [n.id, n])),
    [positions]
  );

  /** Neighbours of the hovered node, used to dim everything else. */
  const neighbours = useMemo(() => {
    if (!hovered) {
      return null;
    }
    const set = new Set<string>([hovered]);
    for (const e of edges) {
      if (e.from === hovered) {
        set.add(e.to);
      }
      if (e.to === hovered) {
        set.add(e.from);
      }
    }
    return set;
  }, [hovered, edges]);

  /** Convert a pointer event into SVG coordinates. */
  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) {
      return { x: 0, y: 0 };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * size.width,
      y: ((clientY - rect.top) / rect.height) * size.height,
    };
  }, [size.width, size.height]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent, id: string) => {
      event.preventDefault();
      (event.target as Element).setPointerCapture?.(event.pointerId);
      setDragging(id);
      startDrag(id);
    },
    [startDrag]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragging) {
        return;
      }
      const { x, y } = toSvgPoint(event.clientX, event.clientY);
      dragTo(dragging, x, y);
    },
    [dragging, dragTo, toSvgPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      endDrag(dragging);
      setDragging(null);
    }
  }, [dragging, endDrag]);

  const isDimmed = useCallback(
    (id: string) => {
      if (hasHighlight) {
        return !pathSet.has(id);
      }
      if (neighbours) {
        return !neighbours.has(id);
      }
      return false;
    },
    [hasHighlight, pathSet, neighbours]
  );

  const legendTypes = useMemo(() => {
    const present = new Set(edges.map((e) => e.type));
    return (Object.keys(EDGE_COLORS) as EdgeType[]).filter((t) => present.has(t));
  }, [edges]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <svg
        ref={svgRef}
        width="100%"
        height={size.height}
        viewBox={`0 0 ${size.width || 1} ${size.height}`}
        className="touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="img"
        aria-label={`Relationship graph with ${nodes.length} characters and ${edges.length} connections`}
      >
        <defs>
          {/* Glow used on path nodes so the route reads at a glance. */}
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {positions.map((node) =>
            node.image ? (
              <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                <circle cx={0} cy={0} r={22} />
              </clipPath>
            ) : null
          )}
        </defs>

        {/* Edges first so nodes paint on top. */}
        <g>
          {edges.map((edge, i) => {
            const a = nodeById.get(edge.from);
            const b = nodeById.get(edge.to);
            if (!a || !b) {
              return null;
            }

            const key = edge.from < edge.to
              ? `${edge.from}|${edge.to}`
              : `${edge.to}|${edge.from}`;
            const onPath = pathEdgeKeys.has(key);
            const dim = isDimmed(edge.from) || isDimmed(edge.to);

            return (
              <line
                key={`${edge.from}-${edge.to}-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={EDGE_COLORS[edge.type]}
                strokeWidth={onPath ? 3.5 : Math.max(2.5 / edge.weight, 0.8)}
                strokeOpacity={onPath ? 0.95 : dim ? 0.06 : 0.35}
                strokeLinecap="round"
                className="transition-[stroke-opacity,stroke-width] duration-300"
              >
                <title>{edge.label}</title>
              </line>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {positions.map((node) => {
            const onPath = pathSet.has(node.id);
            const dim = isDimmed(node.id);
            const accent = node.theme?.colorPrimary || "#e23636";
            const radius = onPath ? 26 : 22;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                className={cn(
                  "cursor-pointer transition-opacity duration-300",
                  dim ? "opacity-20" : "opacity-100"
                )}
                onPointerDown={(e) => handlePointerDown(e, node.id)}
                onPointerEnter={() => !dragging && setHovered(node.id)}
                onPointerLeave={() => !dragging && setHovered(null)}
                onClick={() => onNodeClick?.(node)}
                tabIndex={0}
                role="button"
                aria-label={node.name}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNodeClick?.(node);
                  }
                }}
              >
                <circle
                  r={radius + 3}
                  fill={accent}
                  fillOpacity={onPath ? 0.9 : 0.25}
                  filter={onPath ? "url(#node-glow)" : undefined}
                />
                {node.image ? (
                  <image
                    href={node.image}
                    x={-radius}
                    y={-radius}
                    width={radius * 2}
                    height={radius * 2}
                    clipPath={`url(#clip-${node.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <>
                    <circle r={radius} fill="#111214" />
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fill={accent}
                      fontSize={16}
                      fontWeight={700}
                      className="pointer-events-none"
                    >
                      {node.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </text>
                  </>
                )}
                <circle
                  r={radius}
                  fill="none"
                  stroke={accent}
                  strokeWidth={onPath ? 3 : 1.5}
                />
                <text
                  y={radius + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  className="pointer-events-none fill-foreground/80 font-medium"
                >
                  {node.alias || node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {legendTypes.length > 0 && (
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-border bg-background/80 px-3 py-2 text-xs backdrop-blur">
          {legendTypes.map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded"
                style={{ backgroundColor: EDGE_COLORS[type] }}
              />
              <span className="text-muted-foreground">{EDGE_LABELS[type]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
