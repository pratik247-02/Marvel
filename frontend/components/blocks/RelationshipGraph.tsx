"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CharacterListItem } from "@/types";

interface RelationshipGraphProps {
  characters: CharacterListItem[];
  title?: string;
  centerCharacter?: {
    name: string;
    image?: string;
  };
  className?: string;
}

export function RelationshipGraph({
  characters,
  title = "Relationships",
  centerCharacter,
  className,
}: RelationshipGraphProps) {
  if (!characters.length) return null;

  return (
    <section className={cn("py-12", className)}>
      <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>

      <div className="relative max-w-4xl mx-auto">
        {/* Center character */}
        {centerCharacter && (
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary">
                {centerCharacter.image ? (
                  <Image
                    src={centerCharacter.image}
                    alt={centerCharacter.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {centerCharacter.name[0]}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-center mt-2 font-medium">{centerCharacter.name}</p>
            </div>
          </div>
        )}

        {/* Related characters */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
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
                className="group flex flex-col items-center"
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                  {character.image ? (
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      sizes="48px"
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
