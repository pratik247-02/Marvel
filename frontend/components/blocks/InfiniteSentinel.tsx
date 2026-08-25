"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Calls `onVisible` when it scrolls into view.
 *
 * An IntersectionObserver rather than a scroll listener: a scroll handler fires
 * on every frame of a scroll and has to measure the document each time, while
 * the observer only fires when this element actually crosses the threshold.
 *
 * `rootMargin` starts the next page a screenful early, so the content is
 * usually there before the reader reaches the bottom.
 */

interface InfiniteSentinelProps {
  onVisible: () => void;
  /** When false the observer is not attached at all. */
  enabled?: boolean;
  isLoading?: boolean;
  /** Shown once everything has been loaded. */
  endMessage?: string;
}

export function InfiniteSentinel({
  onVisible,
  enabled = true,
  isLoading = false,
  endMessage,
}: InfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Kept in a ref so changing the callback does not tear down the observer.
  const callback = useRef(onVisible);
  callback.current = onVisible;

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback.current();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <div ref={ref} className="flex justify-center py-10" aria-live="polite">
      {isLoading && (
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more…
        </span>
      )}
      {!enabled && !isLoading && endMessage && (
        <span className="text-muted-foreground text-sm">{endMessage}</span>
      )}
    </div>
  );
}
