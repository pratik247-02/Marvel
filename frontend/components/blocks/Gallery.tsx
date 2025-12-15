"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryProps {
  images: string[];
  title?: string;
  className?: string;
}

export function Gallery({ images, title, className }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  if (!images.length) return null;

  return (
    <section className={cn("py-12", className)}>
      {title && <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
          >
            <Image
              src={image}
              alt={`Gallery image ${index + 1}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(null);
              }}
              className="absolute top-4 right-4 p-2 text-white hover:text-primary transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 p-2 text-white hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 p-2 text-white hover:text-primary transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl aspect-video mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedIndex]}
                alt={`Gallery image ${selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            </motion.div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60">
              {selectedIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
