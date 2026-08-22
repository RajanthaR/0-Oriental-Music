import { readFileSync } from "node:fs";

const docs = [
  "docs/FORENSIC_CORRECTION_LOG.md",
  "docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md",
  "docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md",
];

const anchors = new Set();
for (const doc of docs) {
  const text = readFileSync(doc, "utf8");
  for (const m of text.matchAll(/`?((?:src|data)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|json))#([^`;,|)]+)/g)) {
    anchors.add(`${m[1]}#${m[2].trim()}`);
  }
}

const cache = new Map();
let ok = 0;
let bad = 0;
for (const anchor of anchors) {
  const sep = anchor.indexOf("#");
  const path = anchor.slice(0, sep);
  let symbol = anchor.slice(sep + 1).replace(/\s+\(.*\)$/, "").trim();
  // Strip markdown emphasis and trailing punctuation that ride along in tables.
  symbol = symbol.replace(/\*\*/g, "").replace(/[.;]$/, "");
  let content = cache.get(path);
  if (content === undefined) {
    try {
      content = readFileSync(path, "utf8");
    } catch {
      content = null;
    }
    cache.set(path, content);
  }
  if (content === null || !content.includes(symbol.split(" ")[0])) {
    console.log(`UNRESOLVED: ${anchor}`);
    bad += 1;
  } else {
    ok += 1;
  }
}
console.log(`${ok} resolved, ${bad} unresolved`);
