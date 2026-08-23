import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Duplicate-key guard for every tracked JSON file under data/ and src/data/.
 *
 * JSON.parse silently keeps the LAST occurrence of a duplicated key
 * (ECMA-262 "last wins"), so a structural duplicate can ship behind green
 * parse checks while the intended correction is shadowed at runtime. This
 * exact defect shipped in the P02 CI-and-traversal-cost slice: a corrected
 * 'A3_anchor_mechanism' entry (233 anchors) was added beside its stale
 * original (228 anchors); every consumer observed the stale text because it
 * parsed last. Caught only by review; this guard makes the class mechanical.
 *
 * The scan is a small state machine, not JSON.parse: string literals are
 * consumed atomically, keys are identified by a following colon, and each
 * nesting level records its own key list.
 */

const ROOT = process.cwd();
const SCAN_DIRS = ["data", "src/data"];

interface Duplicate {
  file: string;
  key: string;
  line: number;
}

function scanText(text: string): Array<{ key: string; line: number }> {
  const dupes: Array<{ key: string; line: number }> = [];
  const keyStack: string[][] = [[]];
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
        let key: string;
        try {
          key = JSON.parse(literal) as string;
        } catch {
          key = literal;
        }
        const level = keyStack[keyStack.length - 1];
        if (level.includes(key)) {
          dupes.push({ key, line: text.slice(0, i).split("\n").length });
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

describe("tracked JSON files contain no duplicate object keys", () => {
  it("scans data/ and src/data/ structurally instead of trusting JSON.parse", () => {
    const duplicates: Duplicate[] = [];
    let filesScanned = 0;
    for (const dir of SCAN_DIRS) {
      const full = path.join(ROOT, dir);
      for (const name of fs.readdirSync(full).filter((f) => f.endsWith(".json"))) {
        filesScanned += 1;
        const rel = `${dir}/${name}`;
        for (const d of scanText(fs.readFileSync(path.join(full, name), "utf8"))) {
          duplicates.push({ file: rel, key: d.key, line: d.line });
        }
      }
    }
    // The two canonical data directories must both stay present so the guard
    // cannot silently degrade to scanning nothing.
    expect(filesScanned).toBeGreaterThanOrEqual(20);
    expect(
      duplicates,
      `Duplicate JSON keys found (JSON.parse would silently keep the last occurrence):\n${duplicates
        .map((d) => `${d.file}: "${d.key}" at line ${d.line}`)
        .join("\n")}`,
    ).toEqual([]);

    // Bind the correction to parser-visible reality: after the duplicate-key
    // fix, JSON.parse consumers must observe the CORRECTED A3 text (233),
    // not a stale 228 claim shadowing it. This is the executable form of the
    // correctionsToP02FollowupStructuralDebt ledger entry.
    const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, "data/forensic-ledger.json"), "utf8")) as {
      p02FollowupStructuralDebt?: { workItems?: { A3_anchor_mechanism?: string } };
    };
    const parsedA3 = ledger.p02FollowupStructuralDebt?.workItems?.A3_anchor_mechanism ?? "";
    expect(parsedA3).toContain("233 anchors machine-verified");
    expect(parsedA3).not.toMatch(/228 anchors machine-verified/);
  });
});
