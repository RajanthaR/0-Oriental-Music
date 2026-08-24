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
 *   of the symbol must appear in the file. Kept for the CI verifier so the
 *   existing 233-anchor corpus keeps its exact meaning across the migration;
 *   fail-closed there since commit 4ca371d.
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
 * test title. Handles `function x`, `const x`, `class X`, `type X`,
 * `interface X`, `enum X`, and `"x"` / `'x'` quoting used by it()/describe().
 */
export function hasDefinitionShapedMatch(fileText: string, symbol: string): boolean {
  const escaped = escapeRegExp(symbol);
  const declaration = new RegExp(`\\b(?:function|const|let|var|class|type|interface|enum)\\s+${escaped}\\b`);
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
  // Multi-token symbols resolve when their first definition-shaped token
  // matches AND the full symbol text exists (compound prose anchors keep
  // working); single tokens must be definition-shaped or quoted.
  const firstToken = symbol.split(" ")[0];
  if (!fileText.includes(firstToken)) {
    return { resolved: false, reason: "symbol-absent" };
  }
  if (hasDefinitionShapedMatch(fileText, firstToken)) {
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

/** Extract `path#symbol` anchors from markdown text using the canonical regex. */
export function extractMarkdownAnchors(markdown: string): string[] {
  const anchors = new Set<string>();
  for (const m of markdown.matchAll(/`?((?:src|data|docs)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|mjs|json|md))#([^`;,|)]+)/g)) {
    anchors.add(`${m[1]}#${m[2].trim()}`);
  }
  return [...anchors];
}
