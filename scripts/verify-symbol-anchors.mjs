// Traceability anchor verifier — CI gate (.github/workflows/ci.yml).
//
// Resolves every `path#symbol` anchor in the three traceability documents
// through the shared resolver (src/lib/evidence/anchor-resolution.ts).
// Strictness tier: "definition" by default since the hooks-adoption slice
// repointed every re-export/prose citation to its defining site (the
// historical floor was "first-token"; pass --tier first-token to compare).
// Symbols wrapped in double quotes inside backticks (`path#"title, with
// commas"`) are captured verbatim so comma-bearing test titles resolve.
// Fails the run (exit 1) when anything is unresolved OR when extraction
// collapses below a floor — a green print over an empty corpus would be
// vacuous.
//
// Run under vite-node so the TypeScript resolver is importable:
//   npx --no-install vite-node scripts/verify-symbol-anchors.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractMarkdownAnchors,
  normalizeAnchorSymbol,
  parseAnchor,
  readRepoFile,
  resolveAgainstText,
} from "../src/lib/evidence/anchor-resolution";

const tierArgIndex = process.argv.indexOf("--tier");
const tier =
  tierArgIndex > -1 ? process.argv[tierArgIndex + 1] : "definition";
if (tier !== "first-token" && tier !== "definition") {
  console.log(`UNKNOWN TIER: ${tier} (expected first-token | definition)`);
  process.exitCode = 1;
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const docs = [
  "docs/FORENSIC_CORRECTION_LOG.md",
  "docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md",
  "docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md",
];

const anchors = new Set();
for (const doc of docs) {
  const text = readFileSync(join(repoRoot, doc), "utf8");
  for (const anchor of extractMarkdownAnchors(text)) anchors.add(anchor);
}

// Extraction floor: a collapsed extraction (regex regression, renamed docs)
// would otherwise print "0 resolved, 0 unresolved" and exit 0 — a vacuous
// pass. Ratchet evidence: the corpus measured 230 before the anchor-engine
// hardening slice consolidated paraphrase citations into canonical full
// titles (-39 loose forms, +27 complete titles), landing at 218 unique
// anchors — and stayed at exactly 218 through the subsequent test-suite
// splits and their citation repoints, at both definition and first-token
// tiers. The floor therefore rises from 180 (~78% of live then) to 210
// (~96% of live now): the post-consolidation corpus has no loose-form
// redundancy left, so even small-scale pruning must turn the gate red
// instead of passing under "legitimate consolidation".
if (anchors.size < 210) {
  console.log(`EXTRACTION COLLAPSE: only ${anchors.size} anchors extracted (expected >= 210)`);
  process.exitCode = 1;
}

let ok = 0;
let bad = 0;
const fileCache = new Map();
for (const anchor of anchors) {
  const parsed = parseAnchor(anchor);
  if (!parsed) {
    console.log(`UNRESOLVED: ${anchor} (no # separator)`);
    bad += 1;
    continue;
  }
  if (!fileCache.has(parsed.path)) {
    fileCache.set(parsed.path, readRepoFile(repoRoot, parsed.path));
  }
  const outcome = resolveAgainstText(
    fileCache.get(parsed.path) ?? null,
    normalizeAnchorSymbol(parsed.symbol),
    tier,
    { markdownTarget: parsed.path.endsWith(".md") },
  );
  if (outcome.resolved) {
    ok += 1;
  } else {
    console.log(`UNRESOLVED: ${anchor}${outcome.reason ? ` (${outcome.reason})` : ""}`);
    bad += 1;
  }
}
console.log(`${ok} resolved, ${bad} unresolved (tier=${tier})`);
// Fail the run when any cited anchor no longer resolves. This script gates
// CI (see .github/workflows/ci.yml), so unresolved anchors must turn the
// job red instead of printing a count nobody reads.
if (bad > 0) process.exitCode = 1;
