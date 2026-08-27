/**
 * Test harness: an in-memory MongoDB and the Express app, with no network.
 *
 * `mongodb-memory-server` runs a real `mongod` binary against a temporary
 * directory. That matters more than it sounds: mocking Mongoose means testing
 * a mock of the query API rather than the queries, and the bugs worth catching
 * here - a wrong projection, a missing populate, an index that does not exist -
 * are exactly the ones a mock cannot see.
 *
 * The app is imported from `app.js` rather than `index.js`, because the latter
 * calls `listen()` and `mongoose.connect()` at module load. Importing it would
 * bind a port and reach for Atlas on every test run.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let memoryServer;

/** Start a throwaway mongod and point Mongoose at it. */
export async function startTestDb() {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri(), {
    serverSelectionTimeoutMS: 10000,
  });
  return mongoose.connection;
}

/** Drop everything between tests, so ordering cannot leak state. */
export async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

export async function stopTestDb() {
  await mongoose.disconnect();
  await memoryServer?.stop();
}
