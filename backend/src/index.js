/**
 * Process entry point: connect, listen, handle signals.
 *
 * The Express application itself lives in `app.js` and has no side effects,
 * so tests can import it without binding a port or reaching a database.
 */

import mongoose from "mongoose";
import app from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

/**
 * Connect to MongoDB with an explicit pool.
 *
 * Mongoose defaults to `maxPoolSize: 100`, against Atlas M0's hard limit of
 * 500 concurrent connections. One instance is fine; two instances, an
 * overlapping deploy, or a restart that does not drain will exhaust it - and
 * that can happen at five users, so it is not a scale-later problem.
 *
 * Ten is generous for this workload. Reads are served from an in-process
 * graph snapshot and writes are admin-only, so the pool is mostly idle.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info("MongoDB connected successfully");
  } catch (error) {
    // Deliberately not `process.exit` here.
    //
    // Exiting on a failed first connect turns a recoverable condition into a
    // crash loop: the platform restarts the process, it cannot reach Mongo
    // again, and it dies before the health check ever answers - so the
    // service reads as "deploying forever" with no error anywhere.
    //
    // Staying up means `/health` can report `degraded`, which is a diagnosis
    // rather than a silence, and Mongoose keeps retrying in the background.
    logger.error(`MongoDB connection error: ${error.message}`);
  }
};

// Not awaited: the HTTP server should bind its port whether or not the
// database is reachable, so the platform sees a live service and the health
// check can explain what is wrong.
connectDB();

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated.");
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

export default app;
