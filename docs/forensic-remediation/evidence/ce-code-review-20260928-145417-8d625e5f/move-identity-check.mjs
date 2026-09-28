// Move-identity check (review artifact for run 20260928-145417-8d625e5f).
// Extracts the four declarations relocated from publication-policy.ts (base
// a7fc94a) into evaluation-context.ts and compares them whitespace/comment
// normalized. Any DIFFERS output is potential behavioral drift in the move.
import { execSync } from "node:child_process";
import fs from "node:fs";

function extractFunction(text, name) {
  const re = new RegExp("^(export )?function " + name + "\\b", "m");
  const m = re.exec(text);
  if (!m) return "MISSING:" + name;
  const start = text.indexOf("{", m.index);
  let depth = 0;
  for (let j = start; j < text.length; j++) {
    if (text[j] === "{") depth++;
    else if (text[j] === "}") {
      depth--;
      if (depth === 0) return text.slice(m.index, j + 1);
    }
  }
  return "UNTERMINATED:" + name;
}

function extractConstArray(text, name) {
  const re = new RegExp("^const " + name + "(:[^=]*)?= \\[", "m");
  const m = re.exec(text);
  if (!m) return "MISSING:" + name;
  const end = text.indexOf("\n];", m.index);
  return text.slice(m.index, end + 3);
}

const norm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();

const oldText = execSync("git show a7fc94a:src/lib/data/publication-policy.ts", {
  maxBuffer: 1e8,
}).toString();
const newText = fs.readFileSync("src/lib/data/evaluation-context.ts", "utf8");

const pairs = [
  ["RAW_PUBLICATION_CATALOGS", extractConstArray],
  ["readCatalogInput", extractFunction],
  ["createPublicationEvaluationContext", extractFunction],
  ["readDeclaredArrayLength", extractFunction],
];

let allIdentical = true;
for (const [name, extract] of pairs) {
  const a = norm(extract(oldText, name));
  const b = norm(extract(newText, name));
  const same = a === b;
  if (!same) allIdentical = false;
  console.log(name + ": " + (same ? "IDENTICAL" : "DIFFERS"));
  if (!same) {
    console.log("  OLD: " + a);
    console.log("  NEW: " + b);
  }
}
console.log(allIdentical ? "RESULT: move is behavior-identical" : "RESULT: DRIFT DETECTED");
