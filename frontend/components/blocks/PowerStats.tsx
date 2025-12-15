"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CharacterStats } from "@/types";

interface PowerStatsProps {
  stats: CharacterStats;
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  };
  className?: string;
}

const statLabels: Record<keyof CharacterStats, string> = {
  strength: "Strength",
  intelligence: "Intelligence",
  speed: "Speed",
  durability: "Durability",
  energy: "Energy",
  combat: "Combat",
};

export function PowerStats({ stats, theme, className }: PowerStatsProps) {
  const primaryColor = theme?.colorPrimary || "hsl(var(--primary))";

  return (
    <section className={cn("py-12", className)}>
      <h2 className="text-2xl font-bold mb-8 text-center">Power Stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {(Object.keys(statLabels) as Array<keyof CharacterStats>).map((key, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="relative w-24 h-24 mb-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 45 * (1 - stats[key] / 100),
                  }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{stats[key]}</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground uppercase tracking-wide">
              {statLabels[key]}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
