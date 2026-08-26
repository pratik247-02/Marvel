import winston from "winston";
import { config } from "../config/index.js";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const isProduction = config.nodeEnv === "production";

/**
 * Colourised lines locally; structured JSON in production.
 *
 * Colour codes are escape sequences, which are noise the moment anything
 * other than a terminal reads the output - a hosting platform's log viewer or
 * an aggregator shows them raw.
 */
const format = isProduction
  ? winston.format.combine(winston.format.timestamp(), winston.format.json())
  : winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
      winston.format.colorize({ all: true }),
      winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    );

/**
 * Console always; files only outside production.
 *
 * A hosting platform gives you an ephemeral, often read-only filesystem and
 * collects stdout itself, so file transports there are at best useless and at
 * worst fatal: Winston throws when it cannot create `logs/`, and it throws
 * during module load - before any application code runs, which is why the
 * failure shows up as a process that dies with no output at all.
 */
const transports = [new winston.transports.Console()];

if (!isProduction) {
  transports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/all.log" })
  );
}

export const logger = winston.createLogger({
  // "warn" in production hid both "MongoDB connected" and "Server running on
  // port", so a healthy boot and a hanging one looked identical from outside.
  level: isProduction ? "info" : "debug",
  levels,
  format,
  transports,
});
