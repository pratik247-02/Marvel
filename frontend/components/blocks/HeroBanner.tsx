"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { EntityTheme } from "@/components/layout/EntityTheme";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  };
  /** Rendered under the description - stats, badges, actions. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Page header.
 *
 * Colour comes from the entity's own theme via CSS variables rather than
 * inline styles on each element, so the whole banner - eyebrow, title,
 * gradient wash and base rule - shifts together to that character's identity.
 */
export function HeroBanner({
  title,
  subtitle,
  description,
  image,
  theme,
  children,
  className,
}: HeroBannerProps) {
  return (
    <EntityTheme
      as="section"
      theme={theme}
      className={cn(
        "relative flex min-h-[58vh] items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* Colour wash, always present so untinted pages still have depth. */}
      <div className="bg-entity-wash absolute inset-0" />

      {image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt=""
            fill
            className="scale-105 object-cover opacity-40 blur-[1px]"
            priority
            sizes="100vw"
          />
          {/* Two-stop scrim: darkens the base for text, fades the top edge. */}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/30" />
        </div>
      )}

      {/* Vignette, so the eye lands centre regardless of the artwork. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,transparent,hsl(var(--background)/0.85))]" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {subtitle && (
            <p className="text-entity mb-4 text-xs font-semibold uppercase tracking-[0.2em] md:text-sm">
              {subtitle}
            </p>
          )}

          <h1 className="text-balance text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">
            {title}
          </h1>

          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
          )}

          {children && <div className="mt-8">{children}</div>}
        </motion.div>
      </div>

      {/* Base rule in the entity colour, fading at both ends. */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, var(--entity-primary, hsl(var(--primary))), transparent)",
        }}
      />
    </EntityTheme>
  );
}
