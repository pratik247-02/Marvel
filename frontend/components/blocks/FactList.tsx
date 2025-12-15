"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Fact {
  label: string;
  value: string | number;
}

interface FactListProps {
  facts: Fact[];
  title?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FactList({ facts, title, columns = 2, className }: FactListProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <section className={cn("py-12", className)}>
      {title && <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>}

      <div className={cn("grid gap-4", gridCols[columns])}>
        {facts.map((fact, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <dt className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              {fact.label}
            </dt>
            <dd className="text-lg font-semibold">{fact.value}</dd>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
