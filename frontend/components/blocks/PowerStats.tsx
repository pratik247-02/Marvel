"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EntityTheme } from "@/components/layout/EntityTheme";
import type { CharacterStats } from "@/types";

/**
 * Six-axis power profile as a radar chart.
 *
 * Six independent rings show the same numbers but not the same information:
 * what distinguishes Thor from Black Widow is the *shape* of the profile -
 * one spikes on strength and energy, the other on combat - and a radar makes
 * that shape readable in one glance. The numbers are still listed beside it
 * for anyone who wants the exact values, and for screen readers.
 */

interface PowerStatsProps {
  stats: CharacterStats;
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  };
  className?: string;
}

const AXES: Array<{ key: keyof CharacterStats; label: string; short: string }> = [
  { key: "strength", label: "Strength", short: "STR" },
  { key: "intelligence", label: "Intelligence", short: "INT" },
  { key: "speed", label: "Speed", short: "SPD" },
  { key: "durability", label: "Durability", short: "DUR" },
  { key: "energy", label: "Energy", short: "ENE" },
  { key: "combat", label: "Combat", short: "CMB" },
];

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 92;
const RINGS = [0.25, 0.5, 0.75, 1];

/** Polar to cartesian, with 0 at twelve o'clock rather than three. */
const point = (angleIndex: number, distance: number) => {
  const angle = (angleIndex / AXES.length) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * distance,
    y: CENTER + Math.sin(angle) * distance,
  };
};

const polygon = (values: number[], scale = 1) =>
  values
    .map((v, i) => {
      const p = point(i, (v / 100) * RADIUS * scale);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(" ");

export function PowerStats({ stats, theme, className }: PowerStatsProps) {
  const gradientId = useId();
  const values = AXES.map((a) => stats[a.key] ?? 0);
  const total = values.reduce((sum, v) => sum + v, 0);
  const average = Math.round(total / AXES.length);

  return (
    <EntityTheme
      as="section"
      theme={theme}
      className={cn("py-12", className)}
    >
      <h2 className="mb-2 text-center text-2xl font-bold">Power Profile</h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Overall rating {average}
      </p>

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 md:flex-row md:justify-center">
        {/* Radar */}
        <motion.svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0"
          role="img"
          aria-label={AXES.map((a) => `${a.label} ${stats[a.key]}`).join(", ")}
        >
          <defs>
            <radialGradient id={gradientId}>
              <stop
                offset="0%"
                stopColor="var(--entity-primary, hsl(var(--primary)))"
                stopOpacity="0.55"
              />
              <stop
                offset="100%"
                stopColor="var(--entity-secondary, hsl(var(--secondary)))"
                stopOpacity="0.22"
              />
            </radialGradient>
          </defs>

          {/* Grid rings */}
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={polygon(Array(AXES.length).fill(100), ring)}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
          ))}

          {/* Spokes and axis labels */}
          {AXES.map((axis, i) => {
            const edge = point(i, RADIUS);
            const label = point(i, RADIUS + 22);
            return (
              <g key={axis.key}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[10px] font-semibold tracking-wider"
                >
                  {axis.short}
                </text>
              </g>
            );
          })}

          {/* The profile itself, drawn expanding from the centre. */}
          <motion.polygon
            points={polygon(values)}
            fill={`url(#${gradientId})`}
            stroke="var(--entity-primary, hsl(var(--primary)))"
            strokeWidth={2}
            strokeLinejoin="round"
            initial={{ scale: 0, originX: "50%", originY: "50%" }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />

          {/* Vertex dots */}
          {values.map((v, i) => {
            const p = point(i, (v / 100) * RADIUS);
            return (
              <motion.circle
                key={AXES[i].key}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="var(--entity-primary, hsl(var(--primary)))"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.05 }}
              />
            );
          })}
        </motion.svg>

        {/* Numeric breakdown */}
        <ul className="w-full max-w-xs space-y-3">
          {AXES.map((axis, i) => {
            const value = stats[axis.key] ?? 0;
            return (
              <li key={axis.key}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">{axis.label}</span>
                  <span className="font-semibold tabular-nums">{value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="bg-entity h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.2 + i * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </EntityTheme>
  );
}
