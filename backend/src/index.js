import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { config } from "./config/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";
import { registerGraphInvalidation } from "./modules/graph/index.js";

const app = express();

// Connect to MongoDB
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

// Drop the graph snapshot whenever content changes.
registerGraphInvalidation();

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// Body parsing middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// Health check endpoint
/**
 * Health check, used by the platform to decide whether this instance is
 * serving.
 *
 * Reports the database state rather than only that the process is alive: a
 * server that answers HTTP while Mongo is unreachable is not healthy, and
 * saying "ok" there turns a visible outage into a silent one. Deliberately
 * outside `/api` so the rate limiter does not throttle the platform's own
 * probes.
 */
app.get("/health", (req, res) => {
  // 1 is "connected"; 2 is "connecting", which is not ready to serve.
  const dbReady = mongoose.connection.readyState === 1;

  // Always 200. The platform restarts anything whose health check fails, and
  // restarting does not fix an unreachable database - it just replaces a
  // diagnosable "degraded" response with a boot loop that reports nothing.
  // The body carries the real state for anyone actually looking.
  res.status(200).json({
    status: dbReady ? "ok" : "degraded",
    database: dbReady ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
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
