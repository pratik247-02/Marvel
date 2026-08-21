import { config } from "../../src/config/index.js";

/**
 * Minimal TMDB client.
 *
 * Only the endpoints the ETL needs: search a movie, fetch its details, and
 * fetch its credits. Everything else TMDB offers is out of scope.
 *
 * TMDB rate limits for real, so 429 handling is not hypothetical. Retries use
 * exponential backoff with jitter - without jitter, a burst of requests that
 * all get limited would retry in lockstep and get limited again together.
 */

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Exponential backoff with full jitter, capped so a stall stays bounded. */
const backoffDelay = (attempt) => {
  const ceiling = Math.min(BASE_DELAY_MS * 2 ** attempt, 8000);
  return Math.random() * ceiling;
};

export class TmdbClient {
  constructor(accessToken = config.tmdb.accessToken) {
    if (!accessToken) {
      throw new Error(
        "TMDB_ACCESS_TOKEN is not set. Add it to backend/.env to refresh fixtures."
      );
    }
    this.accessToken = accessToken;
    this.requestCount = 0;
  }

  async request(path, params = {}) {
    const url = new URL(`${config.tmdb.apiUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      });
      this.requestCount++;

      if (response.ok) {
        return response.json();
      }

      // 429 carries a Retry-After; honour it rather than guessing.
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : backoffDelay(attempt);
        await sleep(delay);
        continue;
      }

      // 5xx is worth retrying; 4xx other than 429 is a request problem that
      // retrying will not fix.
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt));
        continue;
      }

      const body = await response.text().catch(() => "");
      throw new Error(
        `TMDB ${response.status} on ${path}: ${body.slice(0, 200) || response.statusText}`
      );
    }

    throw new Error(`TMDB request to ${path} failed after ${MAX_RETRIES} retries`);
  }

  /** Find a movie by title, optionally narrowed by release year. */
  async searchMovie(title, year) {
    const data = await this.request("/search/movie", {
      query: title,
      year,
      include_adult: false,
    });
    return data.results?.[0] ?? null;
  }

  async movieDetails(tmdbId) {
    return this.request(`/movie/${tmdbId}`);
  }

  async movieCredits(tmdbId) {
    return this.request(`/movie/${tmdbId}/credits`);
  }
}

/** Build an absolute image URL from a TMDB path. */
export const imageUrl = (path, size = "w500") =>
  path ? `${config.tmdb.imageUrl}/${size}${path}` : undefined;
