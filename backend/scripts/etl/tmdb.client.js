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

/**
 * Recover the v3 key embedded in a v4 bearer token.
 *
 * The v4 token is a JWT whose `aud` claim is the account's v3 API key. That is
 * public information inside a token the user already holds, not a secret being
 * extracted - it just saves asking for the same credential twice when the v4
 * token turns out not to be activated.
 */
const v3KeyFromBearer = (token) => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf8")
    );
    return typeof payload.aud === "string" ? payload.aud : "";
  } catch {
    return "";
  }
};

export class TmdbClient {
  constructor({
    accessToken = config.tmdb.accessToken,
    apiKey = config.tmdb.apiKey,
  } = {}) {
    this.accessToken = accessToken;
    this.apiKey = apiKey || (accessToken ? v3KeyFromBearer(accessToken) : "");

    if (!this.accessToken && !this.apiKey) {
      throw new Error(
        "No TMDB credentials. Set TMDB_ACCESS_TOKEN (v4 bearer) or TMDB_API_KEY " +
          "(v3 key) in backend/.env to refresh fixtures."
      );
    }

    // Set once the first bearer attempt is rejected, so the whole run switches
    // rather than paying a failed request per call.
    this.useApiKey = !this.accessToken;
    this.requestCount = 0;
  }

  async request(path, params = {}) {
    const url = new URL(`${config.tmdb.apiUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
    if (this.useApiKey) {
      url.searchParams.set("api_key", this.apiKey);
    }

    let lastNetworkError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let response;
      try {
        response = await fetch(url, {
          headers: {
            ...(this.useApiKey
              ? {}
              : { Authorization: `Bearer ${this.accessToken}` }),
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(20000),
        });
      } catch (error) {
        // A dropped connection is transient and is exactly what retries are
        // for. ECONNRESET in particular shows up on machines where something
        // inspects TLS traffic - antivirus, a VPN, a corporate proxy - and it
        // fails intermittently rather than consistently.
        lastNetworkError = error;
        if (attempt < MAX_RETRIES) {
          await sleep(backoffDelay(attempt));
          continue;
        }
        const cause = error.cause?.code ?? error.name;
        throw new Error(
          `TMDB request to ${path} failed after ${MAX_RETRIES + 1} attempts (${cause}). ` +
            "The network dropped the connection repeatedly; check for a VPN, proxy or " +
            "antivirus intercepting HTTPS."
        );
      }
      this.requestCount++;

      if (response.ok) {
        return response.json();
      }

      // A rejected bearer token usually means the v4 credential was issued but
      // not activated. Fall back to the v3 key and replay the request once.
      if (response.status === 401 && !this.useApiKey && this.apiKey) {
        this.useApiKey = true;
        return this.request(path, params);
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

    throw new Error(
      `TMDB request to ${path} failed after ${MAX_RETRIES} retries` +
        (lastNetworkError ? `: ${lastNetworkError.message}` : "")
    );
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
