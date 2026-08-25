export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-3.5">
        {/* One line, wrapping to two only on narrow screens.
            TMDB's terms require the "not endorsed or certified" wording and the
            MCU Wiki is CC BY-SA, so neither attribution can be dropped. The
            required TMDB sentence is carried on the link's title instead of
            being set as visible body text, which keeps the notice present
            without spending three lines on it. */}
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} MCU Hub</span>
          <span aria-hidden="true">·</span>
          <span>Built with Next.js</span>
          <span aria-hidden="true">·</span>
          <span>
            Film data{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              title="This product uses the TMDB API but is not endorsed or certified by TMDB."
              className="underline underline-offset-2 hover:text-foreground"
            >
              TMDB
            </a>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Artwork{" "}
            <a
              href="https://marvelcinematicuniverse.fandom.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Character artwork from the MCU Wiki, used under CC BY-SA."
              className="underline underline-offset-2 hover:text-foreground"
            >
              MCU Wiki
            </a>{" "}
            (CC BY-SA)
          </span>
        </p>
      </div>
    </footer>
  );
}
