/**
 * Input handling: bad input should produce a 4xx, never a 500.
 *
 * A 500 means the input reached code that did not expect it and something
 * threw. That is a different failure from "you sent something invalid", and
 * conflating them hides real bugs behind what looks like a client error.
 *
 * The cases here are the ones that actually arrive in production: a truncated
 * id pasted from a URL, a page number past the end of the data, a filter with
 * a value nobody thought to reject.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { startTestDb, clearTestDb, stopTestDb } from "../helpers/testServer.js";
import { createAdmin, accessTokenFor } from "../helpers/auth.js";

beforeAll(async () => {
  await startTestDb();
}, 120000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe("malformed identifiers", () => {
  /**
   * The classic. `Character.findById("not-an-id")` throws a Mongoose
   * CastError, and an unguarded route turns that into a 500 - reporting a
   * server fault for what is entirely a client mistake.
   */
  it("returns 400, not 500, for a malformed ObjectId", async () => {
    const res = await request(app).get("/api/characters/not-a-valid-objectid");
    expect(res.status).toBe(400);
    expect(res.status).not.toBe(500);
  });

  it("returns 400 for an id of the right length but wrong alphabet", async () => {
    // 24 characters, so a length check alone would pass it; 'z' is not hex.
    const res = await request(app).get(`/api/characters/${"z".repeat(24)}`);
    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed id that does not exist", async () => {
    // Valid ObjectId, nothing behind it - a genuinely different case from the
    // one above, and it must not be conflated with it.
    const res = await request(app).get("/api/characters/0123456789abcdef01234567");
    expect(res.status).toBe(404);
  });
});

describe("pagination edges", () => {
  it("returns an empty array, not an error, past the last page", async () => {
    const res = await request(app).get("/api/characters?page=99999&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("rejects a negative page rather than computing a negative skip", async () => {
    // A negative skip is a driver-level error, so this must be caught before
    // it reaches the query.
    const res = await request(app).get("/api/characters?page=-5");
    expect(res.status).toBeLessThan(500);
  });

  it("rejects a non-numeric page", async () => {
    const res = await request(app).get("/api/characters?page=abc");
    expect(res.status).toBeLessThan(500);
  });
});

describe("request bodies", () => {
  it("rejects a write with a missing required field", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${accessTokenFor(admin)}`)
      .send({ description: "No name given." });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects malformed JSON with a 400", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${accessTokenFor(admin)}`)
      .set("Content-Type", "application/json")
      .send('{"name": "unclosed');

    expect(res.status).toBe(400);
  });
});

describe("unknown routes", () => {
  it("returns 404 for an unmatched path", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns 404 for an unmatched method on a real path", async () => {
    const res = await request(app).patch("/api/graph/stats");
    expect(res.status).toBe(404);
  });
});
