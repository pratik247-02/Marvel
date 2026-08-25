import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Applies an entity's colour pair to everything inside it.
 *
 * Characters, teams and artifacts each carry `theme.colorPrimary` and
 * `colorSecondary` in the database. Rather than threading those values down as
 * props to every element that wants them, this sets them once as CSS custom
 * properties on a wrapper. Children opt in with `text-entity`, `border-entity`,
 * `bg-entity-wash` and friends, or read `var(--entity-primary)` directly.
 *
 * If no theme is supplied the variables are left unset, so the utilities fall
 * back to the house palette.
 */

interface EntityThemeProps {
  theme?: {
    colorPrimary?: string;
    colorSecondary?: string;
  } | null;
  children: ReactNode;
  className?: string;
  /** Render as a different element when a `div` would be wrong for the slot. */
  as?: "div" | "section" | "article" | "main";
}

/**
 * Relative luminance of a `#rrggbb` colour, per WCAG.
 *
 * Returns null for anything that is not six hex digits - named colours and
 * `var(...)` references reach this field in principle, and guessing at them
 * would be worse than declining to.
 */
function luminance(hex?: string): number | null {
  const value = hex?.trim().replace("#", "");
  if (!value || !/^[0-9a-f]{6}$/i.test(value)) {
    return null;
  }
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function EntityTheme({
  theme,
  children,
  className,
  as: Tag = "div",
}: EntityThemeProps) {
  const style: CSSProperties = {};

  if (theme?.colorPrimary) {
    (style as Record<string, string>)["--entity-primary"] = theme.colorPrimary;

    // Readable text for anything sitting on `bg-entity`. Thirteen characters
    // carry a light theme colour and three are near-white (#e2e8f0), where
    // white label text disappears entirely.
    const l = luminance(theme.colorPrimary);
    if (l !== null) {
      (style as Record<string, string>)["--entity-foreground"] =
        l > 0.45 ? "#0b0b0c" : "#ffffff";
    }
  }
  if (theme?.colorSecondary) {
    (style as Record<string, string>)["--entity-secondary"] = theme.colorSecondary;
  }

  return (
    <Tag style={style} className={cn(className)}>
      {children}
    </Tag>
  );
}
