/**
 * The Express application, with no side effects.
 *
 * Separated from `index.js` so tests can import the app without starting a
 * server or opening a database connection - importing a module that calls
 * `app.listen()` and `mongoose.connect()` at load time means every test run
 * binds a port and talks to a real cluster.
 *
 * `index.js` is the process: it connects, listens, and handles signals.
 */
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
import routes from "./routes/index.js";
import { registerGraphInvalidation } from "./modules/graph/index.js";

const app = express();

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
  // A test suite makes dozens of requests from one address in a few seconds,
  // which is indistinguishable from abuse to a limiter counting per IP. The
  // rate limiter's own behaviour is worth testing, but by exercising the
  // middleware directly rather than by making every other test flaky.
  skip: () => config.nodeEnv === "test",
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

export default app;
