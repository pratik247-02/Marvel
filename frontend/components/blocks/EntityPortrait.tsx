import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * An entity's image, or a themed placeholder when there is none.
 *
 * Most characters have no artwork yet. TMDB, which supplies the movie posters,
 * has no character images at all - its cast records carry actor headshots, and
 * using those puts the wrong face on the card. Real character art has to be
 * curated by hand.
 *
 * Until then the fallback is built from what the data already has: the
 * entity's own colour pair, its initials, and a monogram. That reads as a
 * deliberate design rather than a hole where a picture should be, and it means
 * adding a real image later is purely a data change.
 */

interface EntityPortraitProps {
  name: string;
  image?: string;
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  } | null;
  /** Rendered inside a `relative` parent that sets the box. */
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Up to two initials - "Tony Stark" gives TS, "Groot" gives G. */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function EntityPortrait({
  name,
  image,
  theme,
  className,
  sizes = "(max-width: 768px) 50vw, 20vw",
  priority = false,
}: EntityPortraitProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover transition-transform duration-500 group-hover:scale-105",
          className
        )}
      />
    );
  }

  const primary = theme?.colorPrimary ?? "hsl(var(--primary))";
  const secondary = theme?.colorSecondary ?? "hsl(var(--muted))";

  return (
    <div
      className={cn("absolute inset-0 flex items-center justify-center", className)}
      style={{
        background: `linear-gradient(150deg, ${primary}33 0%, ${secondary}22 55%, transparent 100%)`,
      }}
      aria-hidden="true"
    >
      {/* Concentric rings echoing the entity colour, so the placeholder is
          recognisably *this* character rather than a generic grey box. */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full opacity-30"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="50" cy="46" r="30" fill="none" stroke={primary} strokeWidth="0.6" />
        <circle cx="50" cy="46" r="38" fill="none" stroke={primary} strokeWidth="0.4" />
        <circle cx="50" cy="46" r="46" fill="none" stroke={secondary} strokeWidth="0.3" />
      </svg>

      <span
        className="relative select-none text-5xl font-black tracking-tight"
        style={{ color: primary }}
      >
        {initials(name)}
      </span>
    </div>
  );
}
