import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // The rate limiter skips in this mode. A suite makes dozens of requests
      // from one address in seconds, which is indistinguishable from abuse to
      // a per-IP counter - without this, tests fail in whatever order they
      // happen to cross 100 requests.
      NODE_ENV: "test",
      // Deterministic, and independent of whatever is in a local .env.
      JWT_SECRET: "test-secret-not-used-anywhere-real",
    },
    // Route tests start a real mongod; the first one pays the binary download.
    testTimeout: 30000,
    hookTimeout: 120000,
    // Each file gets its own in-memory database, so two files cannot race on
    // the same collections.
    fileParallelism: false,
  },
});
