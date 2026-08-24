// Traceability anchor verifier — CI gate (.github/workflows/ci.yml).
//
// Resolves every `path#symbol` anchor in the three traceability documents
// through the shared resolver (src/lib/evidence/anchor-resolution.ts), at the
// historical "first-token" strictness tier: the existing 233-anchor corpus
// keeps its exact meaning across the consolidation. Fails the run (exit 1)
// when anything is unresolved; a green print with exit 0 was itself a defect
// until commit 4ca371d.
//
// Run under vite-node so the TypeScript resolver is importable:
//   npx vite-node scripts/verify-symbol-anchors.mjs
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
    "first-token",
  );
  if (outcome.resolved) {
    ok += 1;
  } else {
    console.log(`UNRESOLVED: ${anchor}`);
    bad += 1;
  }
}
console.log(`${ok} resolved, ${bad} unresolved`);
// Fail the run when any cited anchor no longer resolves. This script gates
// CI (see .github/workflows/ci.yml), so unresolved anchors must turn the
// job red instead of printing a count nobody reads.
if (bad > 0) process.exitCode = 1;
