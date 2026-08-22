import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A1 foreign-script guard for Sinhala UI copy.
 *
 * Phase 2 shipped a real user-visible defect: the Russian word "временно" sat
 * inside a Sinhala sentence on the /sources empty state. It survived eleven
 * independent zero-finding reviewers and a 38-route browser QA pass and was
 * caught only by a manual repo-wide Cyrillic sweep. Human and model review
 * demonstrably do not catch this class of defect; this mechanical check does.
 *
 * Scope: user-facing UI source under src/app/ and src/components/. Test files
 * are intentionally out of scope: src/test/quiz-runner.test.tsx and
 * src/test/content-contracts.test.ts legitimately contain NFC/NFD
 * accented-Latin fixtures ("q-é").
 *
 * Allowed scripts: Sinhala (U+0D80–U+0DFF), plain ASCII (English technical
 * terms and bilingual labels are legitimate and widespread), and standard
 * punctuation. Everything in the foreign ranges below fails the suite.
 *
 * Allowlist policy: there is deliberately NO blanket suppression. If a future
 * change genuinely needs a foreign-script string in UI source, add a narrow,
 * commented entry to FOREIGN_SCRIPT_ALLOWLIST below naming the exact file and
 * the exact substring and why it is legitimate. Anything not matching an
 * allowlist entry fails.
 */

/** Foreign script ranges that must never appear in Sinhala UI source. */
const FOREIGN_SCRIPT_RANGES: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: "Cyrillic", pattern: /[\u0400-\u04FF]/ },
  { name: "CJK Unified Ideographs", pattern: /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/ },
  { name: "Japanese Kana", pattern: /[\u3040-\u30FF\u31F0-\u31FF]/ },
  { name: "Hangul", pattern: /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF]/ },
  { name: "Devanagari", pattern: /[\u0900-\u097F]/ },
  { name: "Arabic", pattern: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/ },
  { name: "Hebrew", pattern: /[\u0590-\u05FF]/ },
  { name: "Greek", pattern: /[\u0370-\u03FF\u1F00-\u1FFF]/ },
  {
    name: "Accented Latin",
    pattern: /[\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/,
  },
  { name: "Thai", pattern: /[\u0E00-\u0E7F]/ },
  { name: "Myanmar", pattern: /[\u1000-\u109F]/ },
  { name: "Tamil", pattern: /[\u0B80-\u0BFF]/ },
];

/**
 * Narrow, commented allowlist. Each entry names the exact UI file (relative,
 * forward slashes), the exact substring that is allowed, and the reason.
 * Keep this list empty unless a genuinely legitimate foreign-script string
 * ships in UI source with an evidence-backed reason.
 */
const FOREIGN_SCRIPT_ALLOWLIST: ReadonlyArray<{
  file: string;
  substring: string;
  reason: string;
}> = [];

function findUiSourceFiles(root: string, base: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...findUiSourceFiles(full, base));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function findForeignCharacters(
  content: string,
): Array<{ line: number; character: string; codePoint: string; script: string }> {
  const findings: Array<{ line: number; character: string; codePoint: string; script: string }> = [];
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const character of lines[index]) {
      for (const range of FOREIGN_SCRIPT_RANGES) {
        if (range.pattern.test(character)) {
          findings.push({
            line: index + 1,
            character,
            codePoint: `U+${character.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`,
            script: range.name,
          });
          break;
        }
      }
    }
  }
  return findings;
}

describe("foreign-script guard for Sinhala UI copy", () => {
  it("accepts Sinhala, plain ASCII, and standard punctuation while rejecting foreign scripts", () => {
    const allowedSamples = [
      "ස්වර මඟ — පෙරදිග සංගීතය",
      "Grade 6–11 curriculum (English technical terms are legitimate)",
      "නොදනී / සනාථ වී නැත",
      "punctuation: , . : ; ! ? ( ) [ ] { } - – — / | ' \" ` # % & * + = < > @ _ ~ ^ $",
    ];
    for (const sample of allowedSamples) {
      expect(findForeignCharacters(sample), JSON.stringify(sample)).toEqual([]);
    }

    const rejectedSamples: Array<[string, string]> = [
      ["временно", "Cyrillic"],
      ["音楽", "CJK Unified Ideographs"],
      ["ひらがな", "Japanese Kana"],
      ["한국어", "Hangul"],
      ["संगीत", "Devanagari"],
      ["موسيقى", "Arabic"],
      ["מוזיקה", "Hebrew"],
      ["μουσική", "Greek"],
      ["café", "Accented Latin"],
      ["เพลง", "Thai"],
    ];
    for (const [sample, expectedScript] of rejectedSamples) {
      const findings = findForeignCharacters(sample);
      expect(findings.length, JSON.stringify(sample)).toBeGreaterThan(0);
      for (const finding of findings) {
        expect(finding.script, JSON.stringify(sample)).toBe(expectedScript);
      }
    }
  });

  it("keeps every UI source file under src/app and src/components free of foreign scripts", () => {
    const workspace = process.cwd();
    const uiRoots = ["src/app", "src/components"].map((root) => join(workspace, root));
    const files = uiRoots.flatMap((root) => findUiSourceFiles(root, workspace)).sort();
    expect(files.length).toBeGreaterThan(20);

    const violations: string[] = [];
    for (const file of files) {
      const relative = file.slice(workspace.length + 1).replace(/\\/g, "/");
      const findings = findForeignCharacters(readFileSync(file, "utf8"));
      for (const finding of findings) {
        const allowlisted = FOREIGN_SCRIPT_ALLOWLIST.some(
          (entry) => entry.file === relative && entry.substring.includes(finding.character),
        );
        if (!allowlisted) {
          violations.push(
            `${relative}:${finding.line}: ${finding.script} character ${finding.character} (${finding.codePoint})`,
          );
        }
      }
    }

    expect(
      violations,
      `Foreign-script characters leaked into Sinhala UI copy. This is the defect class that shipped "временно" to /sources in Phase 2. Fix the copy, or add a narrow, commented FOREIGN_SCRIPT_ALLOWLIST entry with an evidence-backed reason:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});
