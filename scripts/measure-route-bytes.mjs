#!/usr/bin/env node
// measure-route-bytes.mjs — Turbopack-era bundle-size baseline (A4).
//
// Next 16's Turbopack build prints no per-route size table, so the webpack
// "First Load JS" accounting has no successor. This script measures the real
// thing instead: transferred (compressed) bytes over the wire for a full
// production `next start` server, one fresh browser context per route so
// caches never hide bytes. It records, per route:
//   - transferBytes: navigation + all same-origin subresource compressed
//     response bodies (what a first-time visitor downloads)
//   - requestCount and decodedBytes for context
// Usage: node scripts/measure-route-bytes.mjs [baseUrl] [outFile]
// Requires a running production server and playwright with chromium.

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

// playwright is a measurement-only tool and is intentionally NOT a repo
// dependency; when it is not installed inside this repository, set PW_BASE
// to a directory whose node_modules contains it (createRequire walks up
// from there).
const require =
  process.env.PW_BASE ? createRequire(process.env.PW_BASE) : createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const OUT = process.argv[3] ?? null;

const ROUTES = [
  "/", "/_not-found", "/admin", "/attributions", "/curriculum-map",
  "/exams", "/exams/exam-ol-model-01", "/glossary", "/instruments",
  "/instruments/inst-gatabera", "/learning-paths", "/learning-paths/path-sound-nada",
  "/lessons", "/lessons/les-intro-01", "/practice", "/privacy", "/progress",
  "/ragas", "/ragas/raga-bilawal", "/search", "/sources", "/talas",
  "/talas/tala-dadra", "/teachers", "/theatre", "/traditions",
];

async function measure(page, route) {
  const resp = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
  const entries = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const res = performance.getEntriesByType("resource");
    const sum = (list, key) => list.reduce((acc, e) => acc + (e[key] || 0), 0);
    return {
      navTransfer: nav?.transferSize ?? 0,
      navDecoded: nav?.decodedBodySize ?? 0,
      resTransfer: sum(res, "transferSize"),
      resDecoded: sum(res, "decodedBodySize"),
      requests: res.length,
    };
  });
  return {
    route,
    status: resp ? resp.status() : null,
    transferBytes: entries.navTransfer + entries.resTransfer,
    decodedBytes: entries.navDecoded + entries.resDecoded,
    requestCount: entries.requests + 1,
  };
}

const browser = await chromium.launch();
const rows = [];
for (const route of ROUTES) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    rows.push(await measure(page, route));
  } catch (e) {
    rows.push({ route, error: String(e).slice(0, 160) });
  }
  await context.close();
}
await browser.close();

const ok = rows.filter((r) => !r.error && r.status === 200);
const total = ok.reduce((acc, r) => acc + r.transferBytes, 0);
const summary = {
  measuredWith: "playwright chromium against production next start; fresh context per route; transferSize = compressed bytes over the wire",
  bundler: "Turbopack (Next 16.3.2)",
  routesOk: ok.length,
  routesFailed: rows.filter((r) => r.error || r.status !== 200).length,
  totalTransferBytesAllMeasuredRoutes: total,
  averageTransferBytesPerRoute: ok.length ? Math.round(total / ok.length) : 0,
  rows: rows.sort((a, b) => (b.transferBytes || 0) - (a.transferBytes || 0)),
};
console.log(JSON.stringify(summary, null, 1));
if (OUT) writeFileSync(OUT, JSON.stringify(summary, null, 1) + "\n");
