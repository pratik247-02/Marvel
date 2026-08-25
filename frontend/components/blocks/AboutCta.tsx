import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The about section at the foot of the home page.
 *
 * Two parts, separated by a rule, because they are two different invitations
 * and running them together reads as a non-sequitur: a pitch for the project,
 * then a row of faces, then a contact button that belonged to neither.
 *
 *   1. What the site is, and a way into it.
 *   2. Who built it, and a way to reach them.
 *
 * This is a server component on purpose. Everything here is static, and the
 * hover states are CSS rather than a motion library, so nothing about it needs
 * to ship JavaScript to the client.
 */

export interface AboutImage {
  /** Local path under /public, or a remote URL whose host is in next.config. */
  src: string;
  /** The label shown on hover. Decorative - it need not describe the photo. */
  title: string;
  /**
   * Alt text. Separate from `title` because the label can be a joke while the
   * alt text still has to say what is actually in the picture: a row of five
   * near-identical faces is a visual gag that a screen reader would otherwise
   * report as five unrelated job titles.
   */
  alt?: string;
}

interface Action {
  label: string;
  href: string;
}

interface AboutCtaProps {
  heading: string;
  /** Rendered as its own paragraph, so keep it to a couple of sentences. */
  body: string;
  /** The way into the site itself, shown directly under the description. */
  primaryAction?: Action;
  /** Introduces the second half — the people rather than the project. */
  peopleHeading?: string;
  images: AboutImage[];
  /** A line under the images, immediately above the contact action. */
  prompt?: string;
  /** The way to reach whoever built it. */
  contactAction?: Action;
  className?: string;
}

/** Shared so both buttons are identical apart from their emphasis. */
const buttonBase =
  "inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

export function AboutCta({
  heading,
  body,
  primaryAction,
  peopleHeading,
  images,
  prompt,
  contactAction,
  className,
}: AboutCtaProps) {
  return (
    <section
      className={cn(
        "border-border bg-card relative overflow-hidden rounded-2xl border px-6 py-8 sm:px-10 sm:py-10",
        className
      )}
    >
      {/* A faint wash so the block separates from the page without a hard edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background: "radial-gradient(70% 70% at 50% 0%, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      {/* Part one: the project. */}
      <div className="relative flex flex-col items-center text-center">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{heading}</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          {body}
        </p>

        {primaryAction && (
          <Link
            href={primaryAction.href}
            className={cn(
              buttonBase,
              "bg-primary text-primary-foreground hover:bg-primary/90 mt-6"
            )}
          >
            {primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Part two: the people. The rule is what stops the faces reading as part
          of the pitch above them. */}
      {images.length > 0 && (
        <div className="border-border relative mt-10 flex flex-col items-center border-t pt-8">
          {peopleHeading && (
            <p className="text-muted-foreground mb-5 text-xs font-semibold tracking-widest uppercase">
              {peopleHeading}
            </p>
          )}

          {/* Negative margin on every item but the first creates the overlap.
              Each lifts on hover, and raising z-index keeps the hovered one
              above its neighbours instead of half-hidden under the next. */}
          <ul className="flex items-center">
            {images.map((image, index) => (
              <li
                key={image.src}
                className={cn(
                  "group relative transition-transform duration-300 hover:z-20 hover:-translate-y-1.5",
                  index > 0 && "-ml-4 sm:-ml-5"
                )}
                style={{ zIndex: images.length - index }}
              >
                <div className="border-card ring-border relative h-16 w-16 overflow-hidden rounded-full border-2 ring-1 sm:h-20 sm:w-20">
                  <Image
                    src={image.src}
                    alt={image.alt ?? image.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                {/* Label on hover. Hidden from the accessibility tree because
                    the image already carries its own alt text. */}
                <span
                  aria-hidden="true"
                  className="border-border bg-background pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                >
                  {image.title}
                </span>
              </li>
            ))}
          </ul>

          {prompt && <p className="text-muted-foreground mt-5 text-center text-sm">{prompt}</p>}

          {contactAction && (
            <Link
              href={contactAction.href}
              className={cn(
                buttonBase,
                "border-border hover:bg-accent hover:text-accent-foreground mt-4 border bg-transparent"
              )}
            >
              {contactAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
