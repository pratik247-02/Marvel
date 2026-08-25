import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { EntityTheme } from "@/components/layout/EntityTheme";

/**
 * The top of a detail page: the artwork, who or what this is, and the facts
 * worth knowing before scrolling.
 *
 * Replaces HeroBanner, which reserved `min-h-[58vh]` - more than half the
 * viewport - and rendered its image behind the text at `opacity-40` with a
 * blur. That was a band of gradient wash pushing the real content below the
 * fold, and on battles and artifacts, which carry no image at all, it was a
 * band of gradient wash and nothing else.
 *
 * The same shape serves movies, teams, battles and artifacts because they
 * share one: an optional piece of art, a title, a line of context, some prose,
 * and a set of label/value facts. Generalising here rather than writing four
 * near-identical headers is what keeps them consistent as they change.
 *
 * `aspect` differs by entity - posters are 2:3, everything else reads better
 * square - and `art` is optional throughout, so a page with no image renders
 * as a text header rather than a placeholder box.
 */

export interface DetailFact {
  label: string;
  value: ReactNode;
}

interface DetailHeaderProps {
  title: string;
  /** Small line above the title - phase, film, category. */
  eyebrow?: ReactNode;
  /** Coloured line under the title - an alias, a subtitle, an outcome. */
  lede?: ReactNode;
  description?: string;
  image?: string;
  imageAlt?: string;
  /** Shape of the artwork. Posters are 2:3; team and artifact art is square. */
  aspect?: "poster" | "square";
  theme?: { colorPrimary?: string; colorSecondary?: string } | null;
  facts?: DetailFact[];
  /** Badges or actions, rendered under the facts. */
  children?: ReactNode;
  className?: string;
}

export function DetailHeader({
  title,
  eyebrow,
  lede,
  description,
  image,
  imageAlt,
  aspect = "poster",
  theme,
  facts = [],
  children,
  className,
}: DetailHeaderProps) {
  return (
    <EntityTheme
      as="section"
      theme={theme}
      className={cn("border-border border-b", className)}
    >
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
          {image && (
            <div
              className={cn(
                "relative w-full shrink-0 overflow-hidden rounded-xl sm:w-56 lg:w-64",
                aspect === "poster" ? "aspect-2/3" : "aspect-square"
              )}
            >
              <Image
                src={image}
                alt={imageAlt ?? title}
                fill
                sizes="(min-width: 640px) 256px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {eyebrow}
              </p>
            )}

            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              {title}
            </h1>

            {lede && (
              <p className="text-entity mt-1 text-lg font-semibold">{lede}</p>
            )}

            {description && (
              <p className="mt-4 max-w-3xl leading-relaxed">{description}</p>
            )}

            {facts.length > 0 && (
              <dl className="border-border/60 mt-5 grid gap-x-8 gap-y-3 border-t pt-5 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {children && <div className="mt-5">{children}</div>}
          </div>
        </div>
      </div>
    </EntityTheme>
  );
}
