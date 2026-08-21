"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { GraphNode, GraphEdge, SimulationNode } from "@/types";

/**
 * A small force-directed layout, integrated with velocity Verlet.
 *
 * Three forces act on every tick:
 *
 *   repulsion  - every node pushes every other node away, falling off with the
 *                square of the distance, so nodes do not pile up.
 *   springs    - each edge pulls its two nodes toward a rest length. Stronger
 *                edges (lower weight) pull harder, so tightly connected
 *                characters sit closer together.
 *   centering  - a weak pull toward the middle keeps disconnected components
 *                from drifting off-screen.
 *
 * Velocities are damped each tick and the whole simulation cools over time via
 * `alpha`, which decays toward zero. Without cooling the layout never settles
 * and the graph jitters forever.
 *
 * Repulsion is O(n^2). At a few hundred nodes that is entirely fine; a
 * Barnes-Hut quadtree would be the fix past a few thousand, and is not worth
 * the complexity here.
 */

interface SimulationOptions {
  width: number;
  height: number;
  /** Strength of node-node repulsion. */
  charge?: number;
  /** Preferred edge length in pixels. */
  linkDistance?: number;
  /** How hard edges pull, 0-1. */
  linkStrength?: number;
  /** Per-tick velocity retention, 0-1. Lower settles faster. */
  damping?: number;
  /** Pull toward the centre of the viewport. */
  centerForce?: number;
}

const DEFAULTS = {
  charge: 2200,
  linkDistance: 110,
  linkStrength: 0.06,
  damping: 0.82,
  centerForce: 0.012,
};

/** Below this, the layout is settled and ticking is a waste of frames. */
const ALPHA_MIN = 0.005;
const ALPHA_DECAY = 0.019;

export function useForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: SimulationOptions
) {
  const {
    width,
    height,
    charge = DEFAULTS.charge,
    linkDistance = DEFAULTS.linkDistance,
    linkStrength = DEFAULTS.linkStrength,
    damping = DEFAULTS.damping,
    centerForce = DEFAULTS.centerForce,
  } = options;

  const [positions, setPositions] = useState<SimulationNode[]>([]);
  const simNodes = useRef<SimulationNode[]>([]);
  const alpha = useRef(1);
  const frame = useRef<number | null>(null);
  const draggingId = useRef<string | null>(null);

  /** Seed positions on a circle - a deterministic start beats random jitter. */
  const seed = useCallback(() => {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.32;

    simNodes.current = nodes.map((node, i) => {
      const existing = simNodes.current.find((n) => n.id === node.id);
      if (existing) {
        // Preserve position across data changes so the layout does not jump.
        return { ...node, x: existing.x, y: existing.y, vx: 0, vy: 0 };
      }
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      return {
        ...node,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });
    alpha.current = 1;
  }, [nodes, width, height]);

  const tick = useCallback(() => {
    const list = simNodes.current;
    const a = alpha.current;

    // --- repulsion: every pair pushes apart ---
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const p = list[i];
        const q = list[j];
        let dx = q.x - p.x;
        let dy = q.y - p.y;
        let distSq = dx * dx + dy * dy;

        // Two nodes exactly on top of each other would divide by zero; nudge
        // them apart deterministically instead of randomly.
        if (distSq < 0.01) {
          dx = (i - j) * 0.1 || 0.1;
          dy = 0.1;
          distSq = dx * dx + dy * dy;
        }

        const dist = Math.sqrt(distSq);
        const force = (charge * a) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        p.vx -= fx;
        p.vy -= fy;
        q.vx += fx;
        q.vy += fy;
      }
    }

    // --- springs: edges pull toward the rest length ---
    const index = new Map(list.map((n) => [n.id, n]));
    for (const edge of edges) {
      const source = index.get(edge.from);
      const target = index.get(edge.to);
      if (!source || !target) {
        continue;
      }

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

      // A lower weight means a stronger tie, so it should sit closer and pull
      // harder. Clamped so a very weak edge still has some effect.
      const tie = Math.min(Math.max(1 / edge.weight, 0.25), 2);
      const rest = linkDistance / tie;
      const displacement = (dist - rest) / dist;
      const strength = linkStrength * tie * a;

      const fx = dx * displacement * strength;
      const fy = dy * displacement * strength;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // --- centering, damping, integration ---
    const cx = width / 2;
    const cy = height / 2;
    for (const node of list) {
      if (node.fx != null && node.fy != null) {
        // Pinned (being dragged, or fixed by the caller).
        node.x = node.fx;
        node.y = node.fy;
        node.vx = 0;
        node.vy = 0;
        continue;
      }

      node.vx += (cx - node.x) * centerForce * a;
      node.vy += (cy - node.y) * centerForce * a;

      node.vx *= damping;
      node.vy *= damping;

      node.x += node.vx;
      node.y += node.vy;

      // Keep nodes inside the viewport. The margin covers the node radius
      // plus the name label rendered below it, so neither gets clipped.
      const marginX = 60;
      const marginTop = 40;
      const marginBottom = 56;
      node.x = Math.min(Math.max(node.x, marginX), width - marginX);
      node.y = Math.min(Math.max(node.y, marginTop), height - marginBottom);
    }

    alpha.current = Math.max(a - a * ALPHA_DECAY, 0);
    setPositions([...list]);
  }, [edges, width, height, charge, linkDistance, linkStrength, damping, centerForce]);

  useEffect(() => {
    if (nodes.length === 0 || width === 0 || height === 0) {
      return;
    }
    seed();

    const loop = () => {
      // Keep ticking while cooling, or while a drag is in progress.
      if (alpha.current > ALPHA_MIN || draggingId.current) {
        tick();
        frame.current = requestAnimationFrame(loop);
      } else {
        frame.current = null;
      }
    };
    frame.current = requestAnimationFrame(loop);

    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [nodes, seed, tick, width, height]);

  /** Reheat the simulation, e.g. after a drag or a layout change. */
  const reheat = useCallback(
    (value = 0.6) => {
      alpha.current = Math.max(alpha.current, value);
      if (frame.current === null) {
        const loop = () => {
          if (alpha.current > ALPHA_MIN || draggingId.current) {
            tick();
            frame.current = requestAnimationFrame(loop);
          } else {
            frame.current = null;
          }
        };
        frame.current = requestAnimationFrame(loop);
      }
    },
    [tick]
  );

  const startDrag = useCallback((id: string) => {
    draggingId.current = id;
  }, []);

  const dragTo = useCallback(
    (id: string, x: number, y: number) => {
      const node = simNodes.current.find((n) => n.id === id);
      if (node) {
        node.fx = x;
        node.fy = y;
        reheat(0.3);
      }
    },
    [reheat]
  );

  const endDrag = useCallback(
    (id: string) => {
      draggingId.current = null;
      const node = simNodes.current.find((n) => n.id === id);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      reheat(0.3);
    },
    [reheat]
  );

  return { positions, reheat, startDrag, dragTo, endDrag };
}
