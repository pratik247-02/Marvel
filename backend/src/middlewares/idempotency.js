import crypto from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { AppError } from "./errorHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Idempotency keys for POST.
 *
 * A client that sends a create request and then loses the connection has no
 * way to know whether the write landed. Retrying risks a duplicate; not
 * retrying risks losing the write. The standard fix is for the client to
 * generate a key, send it on the original request and on every retry, and for
 * the server to return the first response rather than performing the work
 * twice.
 *
 * Flow:
 *   - no key           -> pass through, no guarantees
 *   - new key          -> reserve it, run the handler, cache the response
 *   - key in flight    -> 409, the original request has not finished yet
 *   - key completed    -> replay the stored response, do not re-run
 *   - key + different  -> 422, the same key was reused for a different body,
 *     payload             which is a client bug worth surfacing loudly
 *
 * Storage is a plain Map with a TTL sweep. That is honest about its limits:
 * the guarantee is per-process, so two instances behind a load balancer each
 * keep their own view and a retry routed to the other instance would not be
 * deduplicated. Redis is the fix at that point, and this module is deliberately
 * shaped so only the store swaps. At single-instance scale the Map is the whole
 * feature with none of the operational cost.
 */

/** How long a completed response stays replayable. */
const TTL_MS = 24 * 60 * 60 * 1000;

/** Upper bound so a flood of keys cannot grow the map without limit. */
const MAX_ENTRIES = 5000;

/** key -> { status, body, fingerprint, state, expiresAt } */
const store = new Map();

/** Hash the body so the same key with different content can be detected. */
const fingerprint = (body) =>
  crypto.createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");

const sweep = () => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
  // If still over the cap after expiring, drop oldest-first. Map preserves
  // insertion order, so the first keys are the oldest.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
};

export const idempotency = (req, res, next) => {
  const key = req.get("Idempotency-Key");
  if (!key) {
    return next();
  }

  if (key.length > 255) {
    return next(
      new AppError("Idempotency-Key is too long", StatusCodes.BAD_REQUEST)
    );
  }

  sweep();

  const print = fingerprint(req.body);
  const existing = store.get(key);

  if (existing) {
    if (existing.fingerprint !== print) {
      return next(
        new AppError(
          "This Idempotency-Key was already used with a different request body",
          StatusCodes.UNPROCESSABLE_ENTITY
        )
      );
    }

    if (existing.state === "in-flight") {
      return next(
        new AppError(
          "A request with this Idempotency-Key is still being processed",
          StatusCodes.CONFLICT
        )
      );
    }

    logger.info(`Replaying cached response for Idempotency-Key ${key}`);
    res.set("Idempotent-Replay", "true");
    return res.status(existing.status).json(existing.body);
  }

  // Reserve the key before the handler runs, so a fast retry cannot slip in
  // alongside the original.
  store.set(key, {
    state: "in-flight",
    fingerprint: print,
    expiresAt: Date.now() + TTL_MS,
  });

  // Capture the response so it can be replayed. Wrapping res.json is the
  // least invasive hook - controllers stay unaware this middleware exists.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const entry = store.get(key);
    if (entry) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(key, {
          state: "complete",
          status: res.statusCode,
          body,
          fingerprint: print,
          expiresAt: Date.now() + TTL_MS,
        });
      } else {
        // A failed attempt should not be cached - the client is entitled to
        // retry a request that errored.
        store.delete(key);
      }
    }
    return originalJson(body);
  };

  // If the handler throws, the reservation must not outlive the request or the
  // client could never retry.
  res.on("close", () => {
    const entry = store.get(key);
    if (entry?.state === "in-flight") {
      store.delete(key);
    }
  });

  next();
};

/** Exposed for tests and for a future admin diagnostics endpoint. */
export const _idempotencyStore = store;
