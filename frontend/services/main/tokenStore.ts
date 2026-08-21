/**
 * In-memory access token store.
 *
 * The access token is deliberately not persisted. Anything in localStorage or
 * sessionStorage is readable by any script on the page, so a single XSS gets
 * the token. Holding it in a module variable means it dies with the tab, which
 * is exactly what a 15-minute token should do.
 *
 * Persistence across reloads comes from the refresh cookie instead: it is
 * httpOnly, so JavaScript cannot read it at all, and on boot the app exchanges
 * it for a fresh access token. The cost of that design is one extra request on
 * page load, which is the right trade.
 */

let accessToken: string | null = null;

/** Notified whenever the token changes, so React state can follow along. */
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },

  set(token: string | null) {
    accessToken = token;
    for (const listener of listeners) {
      listener(token);
    }
  },

  clear() {
    tokenStore.set(null);
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
