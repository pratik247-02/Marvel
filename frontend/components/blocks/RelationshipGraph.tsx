"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CharacterListItem } from "@/types";

interface RelationshipGraphProps {
  characters: CharacterListItem[];
  title?: string;
  className?: string;
}

export function RelationshipGraph({
  characters,
  title = "Relationships",
  className,
}: RelationshipGraphProps) {
  if (!characters.length) return null;

  // Vertical rhythm is the caller's - the page already spaces its sections,
  // and baking in py-12 doubled the gap above the explore action.
  return (
    <section className={cn(className)}>
      <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>

      {/* Full width, content centred - the grid was capped at max-w-4xl,
          which left the section indented inside a page that is not. */}
      <div className="relative">
        {/* Related characters */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
          {characters.map((character, index) => (
            <motion.div
              key={character._id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/characters/${character._id}`}
                className="group flex w-20 flex-col items-center md:w-24"
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                  {character.image ? (
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">
                        {character.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs md:text-sm text-center mt-2 group-hover:text-primary transition-colors line-clamp-2">
                  {character.alias || character.name}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
