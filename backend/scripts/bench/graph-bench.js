/**
 * Benchmark harness for the graph traversal path.
 *
 *   node scripts/bench/graph-bench.js
 *   node scripts/bench/graph-bench.js --iterations 300 --warmup 50
 *
 * Measures the service layer directly rather than going over HTTP, so the
 * numbers reflect query and algorithm cost without Express, JSON serialization
 * and loopback networking mixed in. That makes the naive/optimized comparison
 * a like-for-like one.
 *
 * Methodology notes, recorded because a benchmark without them is not
 * reproducible:
 *   - Warmup iterations are discarded. The first queries pay for connection
 *     setup, driver buffers and JIT warmup.
 *   - Requests are issued sequentially, concurrency 1. This measures latency,
 *     not throughput.
 *   - Percentiles come from the sorted sample using nearest-rank.
 *   - Against Atlas, every measurement includes real network round-trip time,
 *     which dominates at this data size. Run against a local mongod to isolate
 *     the algorithm itself.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { performance } from "node:perf_hooks";

import Character from "../../src/modules/characters/character.model.js";
import { shortestPathNaive } from "../../src/modules/graph/graph.naive.js";
import {
  shortestPath,
  fewestHops,
  getGraph,
  invalidateGraph,
} from "../../src/modules/graph/graph.engine.js";

dotenv.config();

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? Number(argv[i + 1]) : fallback;
};

const ITERATIONS = flag("iterations", 100);
const WARMUP = flag("warmup", 20);

const uriFlag = argv.indexOf("--uri");
const MONGO_URI =
  (uriFlag !== -1 && argv[uriFlag + 1]) ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/marvel";

const safeUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

/** Nearest-rank percentile over an already-sorted array. */
const pct = (sorted, p) => {
  if (sorted.length === 0) {
    return 0;
  }
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(rank, sorted.length) - 1];
};

const summarize = (samples) => {
  const s = [...samples].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    mean: sum / s.length,
    min: s[0],
    p50: pct(s, 50),
    p95: pct(s, 95),
    p99: pct(s, 99),
    max: s[s.length - 1],
  };
};

const fmt = (r) =>
  `n=${r.n}  mean=${r.mean.toFixed(1)}ms  p50=${r.p50.toFixed(1)}  ` +
  `p95=${r.p95.toFixed(1)}  p99=${r.p99.toFixed(1)}  max=${r.max.toFixed(1)}`;

/**
 * Time a function over `ITERATIONS` runs, discarding `WARMUP` first.
 */
async function measure(label, fn) {
  for (let i = 0; i < WARMUP; i++) {
    await fn(i);
  }
  const samples = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await fn(i);
    samples.push(performance.now() - t0);
  }
  const result = summarize(samples);
  console.log(`  ${label.padEnd(34)} ${fmt(result)}`);
  return result;
}

async function main() {
  console.log(`\nConnecting to ${safeUri(MONGO_URI)}`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const isAtlas = MONGO_URI.startsWith("mongodb+srv://");
  console.log(`Connected. Database: ${mongoose.connection.name}`);
  console.log(`Target: ${isAtlas ? "Atlas (includes network RTT)" : "local mongod"}`);
  console.log(`Node ${process.version} | iterations=${ITERATIONS} warmup=${WARMUP} concurrency=1`);

  const chars = await Character.find().select("_id name slug").lean();
  console.log(`Graph size: ${chars.length} character nodes\n`);

  if (chars.length < 2) {
    throw new Error("Need at least 2 characters to benchmark. Run the seed first.");
  }

  const bySlug = Object.fromEntries(chars.map((c) => [c.slug, c]));
  // A deliberately distant pair - Groot reaches Tony only through Rocket/Thor.
  const from = bySlug["groot"] ?? chars[0];
  const to = bySlug["tony-stark"] ?? chars[chars.length - 1];
  console.log(`Path probe: ${from.name} -> ${to.name}`);

  const results = {};

  console.log("\nNaive $graphLookup");
  for (const depth of [2, 3, 4, 6]) {
    results[`naive_d${depth}`] = await measure(`shortestPath maxDepth=${depth}`, () =>
      shortestPathNaive(from._id, to._id, depth)
    );
  }

  console.log("\nConnection Engine (in-process adjacency snapshot)");
  // Warm the snapshot so the first measured call is not paying to build it.
  await getGraph();
  results.engine_weighted = await measure("shortestPath (Dijkstra)", () =>
    shortestPath(from._id, to._id)
  );
  results.engine_hops = await measure("fewestHops (BFS)", () =>
    fewestHops(from._id, to._id)
  );

  // Cold start: what the first request after a write or restart costs.
  const coldSamples = [];
  for (let i = 0; i < 10; i++) {
    invalidateGraph();
    const t0 = performance.now();
    await shortestPath(from._id, to._id);
    coldSamples.push(performance.now() - t0);
  }
  results.engine_cold = summarize(coldSamples);
  console.log(`  ${"cold rebuild + path".padEnd(34)} ${fmt(results.engine_cold)}`);

  console.log("\nBaseline queries (for context)");
  results.findOne = await measure("findById", () =>
    Character.findById(from._id).select("name").lean()
  );
  results.findAll = await measure("find all + populate", () =>
    Character.find().populate("affiliations", "name").lean()
  );

  console.log("\n--- summary ---");
  console.log(JSON.stringify(results, null, 2));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("\nBenchmark failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
