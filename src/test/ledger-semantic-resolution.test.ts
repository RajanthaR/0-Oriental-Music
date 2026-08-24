import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { readRepoFile, resolveAgainstText } from "../lib/evidence/anchor-resolution";

/**
 * A4 semantic resolution guard (P02 CI-and-traversal-cost slice), migrated to
 * the shared resolver (src/lib/evidence/anchor-resolution.ts) by the
 * validation-consolidation slice.
 *
 * The A3 anchor mechanism verifies that `path#symbol` anchors resolve, but it
 * deliberately skips the compound prose-style anchors in the historical
 * `issues[].evidence[].semanticReferences` entries ("symbol": "a, b, and c").
 * Nothing verified those tokens, so a renamed test or symbol leaves the
 * ledger pointing at text that no longer exists — structurally valid JSON,
 * semantically dead evidence.
 *
 * Token semantics (unchanged from the original guard, now backed by the
 * shared engine where applicable):
 * - `tests:`-prefixed fields split on ";" must match a double-quoted test
 *   title in the cited test file;
 * - plain `symbol` tokens resolve through the shared definition tier: a
 *   declaration-shaped match (function/const/class/type/interface/enum) or,
 *   for multi-token compound anchors, the full symbol text.
 *
 * Historical wording is preserved verbatim in the ledger; this test only
 * proves the tokens still point at real text.
 */

const ROOT = process.cwd();
const LEDGER_PATH = path.join(ROOT, "data", "forensic-ledger.json");

interface SemanticToken {
  file: string;
  token: string;
  kind: "symbol" | "test-name";
}

function readLedger(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8")) as Record<string, unknown>;
}

function collectSemanticReferenceObjects(node: unknown, out: Array<Record<string, unknown>>): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectSemanticReferenceObjects(child, out));
    return;
  }
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (Array.isArray(record.semanticReferences)) out.push(record);
    for (const value of Object.values(record)) collectSemanticReferenceObjects(value, out);
  }
}

function splitSymbolTail(tail: string): string[] {
  return tail
    .split(/,\s*|\s+and\s+|\s*\band\b\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.toLowerCase() !== "and");
}

function buildTokens(ref: Record<string, unknown>): SemanticToken[] {
  const pathValue = String(ref.path ?? "");
  const symbolValue = String(ref.symbol ?? "");
  // Comma tolerance: current semanticReferences cite single files, but an
  // Oxford-comma list ("a.json, b.json, and c.json") must resolve against
  // every named file rather than dead-tokenize on trailing commas.
  const files = pathValue
    .split(/,\s*|\s+and\s+/)
    .map((part) => part.trim().replace(/[.,]+$/, ""))
    .filter(Boolean);
  const tokens: SemanticToken[] = [];
  const isTestList = symbolValue.startsWith("tests:");
  const parts = isTestList
    ? symbolValue.slice("tests:".length).split(";").map((p) => p.trim()).filter(Boolean)
    : splitSymbolTail(symbolValue);
  for (const part of parts) {
    for (const file of files) {
      tokens.push({ file, token: part, kind: isTestList ? "test-name" : "symbol" });
    }
  }
  return tokens;
}

describe("forensic-ledger semanticReferences resolve semantically (A4)", () => {
  it("resolves every compound evidence anchor token against its cited file", () => {
    const ledger = readLedger();
    const holders: Array<Record<string, unknown>> = [];
    collectSemanticReferenceObjects(ledger, holders);
    // 12 historical compound anchors are known at the time of writing; the
    // guard must cover all of them and stay covering them.
    expect(holders.length).toBeGreaterThanOrEqual(12);

    const failures: string[] = [];
    let checked = 0;
    for (const holder of holders) {
      const refs = holder.semanticReferences as Array<Record<string, unknown>>;
      for (const ref of refs) {
        for (const token of buildTokens(ref)) {
          checked += 1;
          const text = readRepoFile(ROOT, token.file);
          if (text === null) {
            failures.push(`${token.file}: file missing (cited by ledger)`);
            continue;
          }
          if (token.kind === "test-name") {
            // Test titles are double-quoted strings in the source; require the
            // exact title text between quotes to avoid prose false hits.
            const quoted = new RegExp(`["']${token.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`);
            if (!quoted.test(text)) {
              failures.push(`${token.file}: test title not found: "${token.token}"`);
            }
          } else {
            // Definition tier through the shared engine: declaration-shaped
            // match, or full compound-symbol text for multi-token anchors.
            const outcome = resolveAgainstText(text, token.token, "definition");
            if (!outcome.resolved) {
              failures.push(`${token.file}: symbol not resolved (${outcome.reason}): ${token.token}`);
            }
          }
        }
      }
    }
    // Measured 30 tokens across 12 anchor groups after the synth.test.ts
    // citation restoration. Consolidating or splitting a citation may legally
    // move this count, but a collapse toward zero means the walker above
    // silently stopped matching ledger entries (that exact bug shipped while
    // writing this guard), so a generous floor stays.
    expect(checked, "tokens checked").toBeGreaterThanOrEqual(20);
    expect(failures, `Unresolved semantic anchor tokens (A4):\n${failures.join("\n")}`).toEqual([]);
  });
});
