/**
 * Route-level authentication and authorization.
 *
 * These are the tests worth writing first. A 200 on the happy path is visible
 * the moment anyone opens the site; a write endpoint that quietly accepts an
 * expired token is not visible until it matters.
 *
 * Every case here is a way in that should be closed.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { startTestDb, clearTestDb, stopTestDb } from "../helpers/testServer.js";
import {
  createUser,
  createAdmin,
  accessTokenFor,
  expiredTokenFor,
  refreshTokenFor,
  forgedTokenFor,
} from "../helpers/auth.js";

beforeAll(async () => {
  await startTestDb();
}, 120000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

/** A write endpoint, used as the representative protected route. */
const WRITE = "/api/characters";
const validBody = { name: "Test Character", description: "A character for tests." };

describe("writes require authentication", () => {
  it("rejects a request with no token as 401", async () => {
    const res = await request(app).post(WRITE).send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects a malformed Authorization header as 401", async () => {
    const res = await request(app)
      .post(WRITE)
      .set("Authorization", "Bearer")
      .send(validBody);
    expect(res.status).toBe(401);
  });

  it("rejects an expired token as 401", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(WRITE)
      .set("Authorization", `Bearer ${expiredTokenFor(admin)}`)
      .send(validBody);
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret as 401", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(WRITE)
      .set("Authorization", `Bearer ${forgedTokenFor(admin)}`)
      .send(validBody);
    expect(res.status).toBe(401);
  });

  /**
   * The subtle one. A refresh token is correctly signed and unexpired, so a
   * naive `jwt.verify` accepts it - and it lives for seven days, which would
   * silently turn the 15-minute access window into a week.
   */
  it("rejects a refresh token used as an access token", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(WRITE)
      .set("Authorization", `Bearer ${refreshTokenFor(admin)}`)
      .send(validBody);
    expect(res.status).toBe(401);
  });
});

describe("writes require the admin role", () => {
  it("rejects an authenticated non-admin as 403, not 401", async () => {
    const user = await createUser({ role: "user" });
    const res = await request(app)
      .post(WRITE)
      .set("Authorization", `Bearer ${accessTokenFor(user)}`)
      .send(validBody);

    // 403 rather than 401 is the point: the caller is authenticated, they are
    // simply not allowed. Returning 401 here would tell them to log in again,
    // which will never help.
    expect(res.status).toBe(403);
  });

  it("accepts an admin", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(WRITE)
      .set("Authorization", `Bearer ${accessTokenFor(admin)}`)
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(validBody.name);
  });

  it("applies the same rule to DELETE", async () => {
    const admin = await createAdmin();
    const created = await request(app)
      .post(WRITE)
      .set("Authorization", `Bearer ${accessTokenFor(admin)}`)
      .send(validBody);

    const user = await createUser({ role: "user" });
    const res = await request(app)
      .delete(`${WRITE}/${created.body.data._id}`)
      .set("Authorization", `Bearer ${accessTokenFor(user)}`);
    expect(res.status).toBe(403);
  });
});

describe("reads are never gated", () => {
  it("serves a list to an anonymous caller", async () => {
    const res = await request(app).get("/api/characters");
    expect(res.status).toBe(200);
  });

  it("serves the graph to an anonymous caller", async () => {
    const res = await request(app).get("/api/graph/stats");
    expect(res.status).toBe(200);
  });
});
