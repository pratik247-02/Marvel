"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  };
  className?: string;
}

export function HeroBanner({
  title,
  subtitle,
  description,
  image,
  theme,
  className,
}: HeroBannerProps) {
  const gradientStyle = theme?.colorPrimary
    ? {
        background: `linear-gradient(135deg, ${theme.colorPrimary}20 0%, ${theme.colorSecondary || "#000"}40 100%)`,
      }
    : {};

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "relative min-h-[60vh] flex items-center justify-center overflow-hidden",
        className
      )}
      style={gradientStyle}
    >
      {image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {subtitle && (
            <p
              className="text-sm uppercase tracking-widest mb-4"
              style={{ color: theme?.colorPrimary || "hsl(var(--muted-foreground))" }}
            >
              {subtitle}
            </p>
          )}
          <h1
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ color: theme?.colorPrimary }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </motion.div>
      </div>

      {theme?.colorPrimary && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: theme.colorPrimary }}
        />
      )}
    </motion.section>
  );
}
