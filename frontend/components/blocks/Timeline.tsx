"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MovieTimeline } from "@/types";

interface TimelineProps {
  movies: MovieTimeline[];
  className?: string;
}

export function Timeline({ movies, className }: TimelineProps) {
  return (
    <section className={cn("py-12", className)}>
      <h2 className="text-2xl font-bold mb-8 text-center">MCU Timeline</h2>
      <div className="relative max-w-4xl mx-auto">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

        <div className="space-y-12">
          {movies.map((movie, index) => (
            <motion.div
              key={movie._id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative flex items-center gap-8",
                index % 2 === 0 ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* Content */}
              <div className={cn("flex-1", index % 2 === 0 ? "text-right" : "text-left")}>
                <Link
                  href={`/movies/${movie._id}`}
                  className="group inline-block"
                >
                  <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    {movie.poster && (
                      <div className="relative w-full aspect-[2/3] mb-3 overflow-hidden rounded-md">
                        <Image
                          src={movie.poster}
                          alt={movie.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{movie.releaseYear}</p>
                    <span className="text-xs text-primary">{movie.phase}</span>
                  </div>
                </Link>
              </div>

              {/* Center dot */}
              <div className="relative z-10 w-4 h-4 rounded-full bg-primary border-4 border-background" />

              {/* Year */}
              <div className={cn("flex-1", index % 2 === 0 ? "text-left" : "text-right")}>
                <span className="text-3xl font-bold text-muted-foreground/30">
                  {movie.releaseYear}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
