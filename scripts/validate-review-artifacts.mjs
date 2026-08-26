#!/usr/bin/env node
// validate-review-artifacts.mjs — parseability + duplicate-key gate for
// multi-agent review run artifacts.
//
// WHY THIS EXISTS (hooks-adoption slice, item A3): the independent
// verification of the Next 16 slice found that a cycle-1 review artifact
// (orchestrator-verification.json, ~6 KB of real content) was not valid
// JSON — one missing comma, plus an illegal trailing comma. Nothing in the
// review workflow parsed artifacts back before counting them as evidence,
// so an unparseable file read as complete coverage. Repository JSON is
// gated (vitest json-duplicate-keys + parsers), but review artifacts live
// OUTSIDE the repository under a temp path, so no repo test can reach them.
//
// The review orchestration itself is NOT repo-resident (it is driven by the
// coding agent's harness and the ce-code-review skill runtime), so this
// script is the enforceable half: whatever drives a review run MUST execute
//
//     node scripts/validate-review-artifacts.mjs <run-artifact-dir>
//
// after every reviewer/validator wave and again before citing the run in a
// ledger or PR. Exit 1 lists every unparseable or duplicate-keyed file;
// exit 0 means every .json artifact machine-reads. A run whose driver never
// executed this check must be reported as UNVERIFIED ARTIFACTS, not clean.
//
// Duplicate keys are detected structurally (JSON.parse silently last-wins),
// using the same string-literal-aware scanner as the repository's
// json-duplicate-keys guard.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function scanDuplicateKeys(text) {
  const dupes = [];
  const keyStack = [[]];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      let escaped = false;
      while (j < n) {
        const ch = text[j];
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') break;
        j++;
      }
      const literal = text.slice(i, j + 1);
      let k = j + 1;
      while (k < n && /\s/.test(text[k])) k++;
      if (text[k] === ":") {
        let key;
        try { key = JSON.parse(literal); } catch { key = literal; }
        const level = keyStack[keyStack.length - 1];
        if (level.includes(key)) {
          const line = text.slice(0, i).split("\n").length;
          dupes.push({ key, line });
        }
        level.push(key);
      }
      i = j + 1;
      continue;
    }
    if (c === "{") keyStack.push([]);
    else if (c === "}") keyStack.pop();
    i++;
  }
  return dupes;
}

const dir = process.argv[2];
if (!dir) {
  console.log("usage: node scripts/validate-review-artifacts.mjs <run-artifact-dir>");
  process.exit(1);
}

let stat;
try {
  stat = statSync(dir);
} catch {
  console.log(`ARTIFACT DIR MISSING: ${dir}`);
  process.exit(1);
}
if (!stat.isDirectory()) {
  console.log(`NOT A DIRECTORY: ${dir}`);
  process.exit(1);
}

let checked = 0;
const failures = [];

function walk(current) {
  for (const name of readdirSync(current)) {
    const full = join(current, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.endsWith(".json")) continue;
    checked += 1;
    const text = readFileSync(full, "utf8");
    try {
      JSON.parse(text);
    } catch (e) {
      failures.push(`${full}: NOT PARSEABLE (${String(e).split("\n")[0]})`);
      continue; // duplicate scan on unparseable text is noise
    }
    for (const d of scanDuplicateKeys(text)) {
      failures.push(`${full}: DUPLICATE KEY "${d.key}" at line ${d.line}`);
    }
  }
}
walk(dir);

console.log(`review artifacts checked: ${checked} JSON files in ${dir}`);
if (failures.length > 0) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("all review artifacts parse cleanly with no duplicate keys");
