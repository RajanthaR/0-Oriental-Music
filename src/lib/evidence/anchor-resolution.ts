/**
 * Shared path#symbol anchor resolution for every traceability checker.
 *
 * Before this module, three mechanisms resolved anchors with divergent
 * semantics (scripts/verify-symbol-anchors.mjs, ledger-semantic-resolution,
 * review-closeout), and review findings repeatedly flagged the divergence.
 * This is now the single implementation; consumers differ only in which
 * anchor sources they scan and which strictness tier they require.
 *
 * Strictness tiers:
 * - "first-token": the historical floor. The first whitespace-delimited token
 *   of the symbol must appear in the file. Kept for the CI verifier: the
 *   pre-migration corpus was 233 unique anchors and zero were dropped; the
 *   canonical extractor additionally sees 3 cross-document .md references
 *   (236 total). Fail-closed in CI since commit 4ca371d.
 * - "definition": stronger. The symbol must appear in a declaration-shaped
 *   position (function/const/class/type/interface/enum) OR as a quoted
 *   test title, closing the comment/prose false-match hole the testing lens
 *   documented. Used by new checks and available to any consumer.
 *
 * Dependency-free: node builtins and types only, so it can be imported by
 * scripts, tests, and lib code without creating layering edges.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type AnchorStrictness = "first-token" | "definition";

export interface ParsedAnchor {
  path: string;
  symbol: string;
}

/** Parse one `path#symbol` string; undefined when it has no `#` separator. */
export function parseAnchor(anchor: string): ParsedAnchor | undefined {
  const separator = anchor.indexOf("#");
  if (separator <= 0) return undefined;
  return {
    path: anchor.slice(0, separator),
    symbol: anchor.slice(separator + 1).replace(/\s+\(.*\)$/, "").trim(),
  };
}

/**
 * Normalize a symbol for matching: strip markdown emphasis and trailing
 * punctuation that ride along inside tables, then trim.
 */
export function normalizeAnchorSymbol(symbol: string): string {
  return symbol.replace(/\*\*/g, "").replace(/[.;]$/, "").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Definition-shaped match: symbol appears as a declared name or as a quoted
 * test title. Handles standalone declarations (`function x`, `const x`,
 * `class X`, `type X`, `interface X`, `enum X`), class members with leading
 * modifiers including an intervening modifier (`public async x(...)`), and
 * `"x"` / `'x'` quoting used by it()/describe(). Boundaries are
 * non-ASCII-safe so Sinhala-named symbols resolve in this Sinhala-first
 * repository.
 */
export function hasDefinitionShapedMatch(fileText: string, symbol: string): boolean {
  const escaped = escapeRegExp(symbol);
  // Non-ASCII-safe boundaries: JS \b is ASCII-only, which would silently
  // reject Sinhala-named symbols in this Sinhala-first repository.
  const boundaryStart = "(?<![A-Za-z0-9_$])";
  const boundaryEnd = "(?![A-Za-z0-9_$])";
  const declaration = new RegExp(
    `${boundaryStart}(?:(?:function|const|let|var|class|type|interface|enum)|(?:public|private|protected|readonly|static))(?:\\s+(?:async|readonly))*\\s+${escaped}${boundaryEnd}`,
  );
  if (declaration.test(fileText)) return true;
  // Test titles are double-quoted strings in this codebase.
  const quoted = new RegExp(`["']${escaped}["']`);
  return quoted.test(fileText);
}

export interface ResolutionOutcome {
  resolved: boolean;
  reason?: "file-missing" | "symbol-absent" | "not-definition-shaped";
}

/** Resolve one already-parsed anchor against file text at a given tier. */
export function resolveAgainstText(
  fileText: string | null,
  rawSymbol: string,
  strictness: AnchorStrictness,
): ResolutionOutcome {
  if (fileText === null) return { resolved: false, reason: "file-missing" };
  const symbol = normalizeAnchorSymbol(rawSymbol);
  if (!symbol) return { resolved: false, reason: "symbol-absent" };
  if (strictness === "first-token") {
    return fileText.includes(symbol.split(" ")[0])
      ? { resolved: true }
      : { resolved: false, reason: "symbol-absent" };
  }
  // Definition tier: a single-token symbol must be definition-shaped or
  // appear as a quoted test title — never a bare prose/substring mention.
  const tokens = symbol.split(" ");
  if (tokens.length === 1) {
    return hasDefinitionShapedMatch(fileText, symbol)
      ? { resolved: true }
      : { resolved: false, reason: "not-definition-shaped" };
  }
  // Multi-token compound anchors: first AND last tokens must be
  // definition-shaped in-file (the middle may be prose connectors), OR the
  // full symbol text must appear verbatim.
  const firstToken = tokens[0];
  if (!fileText.includes(firstToken)) {
    return { resolved: false, reason: "symbol-absent" };
  }
  if (
    hasDefinitionShapedMatch(fileText, firstToken) &&
    hasDefinitionShapedMatch(fileText, tokens[tokens.length - 1])
  ) {
    return { resolved: true };
  }
  return fileText.includes(symbol)
    ? { resolved: true }
    : { resolved: false, reason: "not-definition-shaped" };
}

/** Read a repo-relative file for resolution; null when missing. */
export function readRepoFile(repoRoot: string, relativePath: string): string | null {
  try {
    return readFileSync(join(repoRoot, relativePath), "utf8");
  } catch {
    return null;
  }
}

/** Extract `path#symbol` anchors from markdown text using the canonical regex.
 * The symbol tail excludes backticks/separators AND newlines: a missing
 * closing backtick must not let one anchor swallow following lines (the
 * swallowed text used to pass silently at first-token tier because its first
 * word happened to exist in the target file). */
export function extractMarkdownAnchors(markdown: string): string[] {
  const anchors = new Set<string>();
  for (const m of markdown.matchAll(/`?((?:src|data|docs)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|mjs|json|md))#([^\n`;,|)]+)/g)) {
    anchors.add(`${m[1]}#${m[2].trim()}`);
  }
  return [...anchors];
}
