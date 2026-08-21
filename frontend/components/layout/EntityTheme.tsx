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

export function EntityTheme({
  theme,
  children,
  className,
  as: Tag = "div",
}: EntityThemeProps) {
  const style: CSSProperties = {};

  if (theme?.colorPrimary) {
    (style as Record<string, string>)["--entity-primary"] = theme.colorPrimary;
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
