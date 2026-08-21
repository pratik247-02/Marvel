import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-primary">MARVEL</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your ultimate guide to the Marvel Cinematic Universe.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/characters" className="text-muted-foreground hover:text-foreground transition-colors">
                  Characters
                </Link>
              </li>
              <li>
                <Link href="/movies" className="text-muted-foreground hover:text-foreground transition-colors">
                  Movies
                </Link>
              </li>
              <li>
                <Link href="/battles" className="text-muted-foreground hover:text-foreground transition-colors">
                  Battles
                </Link>
              </li>
              <li>
                <Link href="/artifacts" className="text-muted-foreground hover:text-foreground transition-colors">
                  Artifacts
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/quiz" className="text-muted-foreground hover:text-foreground transition-colors">
                  Hero Quiz
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
                  MCU Timeline
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span>This is a fan project.</span>
              </li>
              <li>
                <span>Marvel and MCU are trademarks of Marvel Entertainment.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-2 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MCU Hub. Built with Next.js.</p>
          {/* Required by the TMDB terms of use when their API supplies data. */}
          <p className="text-xs">
            Movie metadata and imagery from{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
