"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MovieListItem } from "@/types";

interface AppearancesProps {
  movies: MovieListItem[];
  title?: string;
  className?: string;
}

export function Appearances({ movies, title = "Appearances", className }: AppearancesProps) {
  if (!movies.length) return null;

  return (
    <section className={cn("py-12", className)}>
      <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map((movie, index) => (
          <motion.div
            key={movie._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/movies/${movie._id}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg mb-2">
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-xs text-center px-2">
                      {movie.title}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                {movie.title}
              </h3>
              <p className="text-xs text-muted-foreground">{movie.releaseYear}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
