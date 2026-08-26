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
  const rawSymbol = anchor.slice(separator + 1);
  // Legacy trailing-annotation form: `#mySymbol (applied to synth)` strips to
  // `mySymbol`. The strip applies ONLY when the text before the parenthetical
  // is a single token — a multi-word title that itself ENDS with a
  // parenthetical (e.g. `...entities (Bhairav & Roopak)`) is real title text
  // and must survive verbatim (anchor-engine-hardening slice: this strip was
  // silently truncating four full titles).
  const annotationStripped = rawSymbol.replace(/\s+\(.*\)$/, "");
  const symbol =
    /\s/.test(annotationStripped) || !/\(/.test(rawSymbol) ? rawSymbol : annotationStripped;
  return {
    path: anchor.slice(0, separator),
    symbol: symbol.trim(),
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

export interface ResolveOptions {
  /** Target is a Markdown evidence document: section headings count as
   * declaration sites (the md analogue of a code declaration). Off by
   * default so code files never gain heading matches. */
  markdownTarget?: boolean;
}

function hasMarkdownHeadingMatch(fileText: string, symbol: string): boolean {
  const escaped = escapeRegExp(symbol);
  // A heading line (#..######) whose text after the hashes contains the
  // symbol. Line-anchored and hash-prefixed, so incidental prose never
  // qualifies; suffixes on real headings ("; pending rereview") are why this
  // is contains-not-equals.
  return new RegExp(`^#{1,6} .*${escaped}`, "m").test(fileText);
}

/** Resolve one already-parsed anchor against file text at a given tier. */
export function resolveAgainstText(
  fileText: string | null,
  rawSymbol: string,
  strictness: AnchorStrictness,
  options?: ResolveOptions,
): ResolutionOutcome {
  if (fileText === null) return { resolved: false, reason: "file-missing" };
  const symbol = normalizeAnchorSymbol(rawSymbol);
  if (!symbol) return { resolved: false, reason: "symbol-absent" };
  const mdHeadings = options?.markdownTarget === true;
  if (strictness === "first-token") {
    return fileText.includes(symbol.split(" ")[0])
      ? { resolved: true }
      : { resolved: false, reason: "symbol-absent" };
  }
  // Definition tier: a single-token symbol must be definition-shaped, appear
  // as a quoted test title, or -- for markdown targets -- sit in a heading.
  const tokens = symbol.split(" ");
  if (tokens.length === 1) {
    if (hasDefinitionShapedMatch(fileText, symbol)) return { resolved: true };
    if (mdHeadings && hasMarkdownHeadingMatch(fileText, symbol)) return { resolved: true };
    return { resolved: false, reason: "not-definition-shaped" };
  }
  // Multi-token compound anchors (definition tier, tightened by the
  // anchor-engine-hardening slice): first AND last tokens must be
  // definition-shaped in-file, the full symbol must appear as a QUOTED test
  // title, or -- markdown targets only -- inside a section heading. The
  // former bare fileText.includes(symbol) fallback was REMOVED here: it let
  // truncated/comma-cut titles satisfy longer quoted titles and let
  // incidental prose satisfy compound symbols. The fixtures above pin all
  // three holes; the 39 corpus anchors that depended on the fallback were
  // repointed to their real titles in this same slice.
  const firstToken = tokens[0];
  if (!fileText.includes(firstToken)) {
    return { resolved: false, reason: "symbol-absent" };
  }
  const lastToken = tokens[tokens.length - 1];
  if (
    hasDefinitionShapedMatch(fileText, firstToken) &&
    hasDefinitionShapedMatch(fileText, lastToken)
  ) {
    return { resolved: true };
  }
  if (new RegExp(`["']${escapeRegExp(symbol)}["']`).test(fileText)) {
    return { resolved: true };
  }
  if (mdHeadings && hasMarkdownHeadingMatch(fileText, symbol)) {
    return { resolved: true };
  }
  return { resolved: false, reason: "not-definition-shaped" };
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
 * word happened to exist in the target file).
 *
 * Quoted-symbol form (`path#"symbol, with commas"`): test titles frequently
 * contain commas, semicolons, and pipes that the bare capture must treat as
 * terminators, so a symbol wrapped in double quotes is captured in full --
 * commas included -- and stored without the surrounding quotes. Introduced by
 * the hooks-adoption slice during the definition-tier repointing; the bare
 * form is unchanged and remains the default. */
export function extractMarkdownAnchors(markdown: string): string[] {
  const anchors = new Set<string>();
  let sequence = 0;
  const working = markdown.replace(
    /`?((?:src|data|docs)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|mjs|json|md))#"([^"\n]+)"`?/g,
    (_match, path: string, symbol: string) => {
      anchors.add(`${path}#${symbol.trim()}`);
      return `\u0000A${(sequence += 1)}\u0000`;
    },
  );
  for (const m of working.matchAll(/`?((?:src|data|docs)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|mjs|json|md))#([^\n`;,|)]+)/g)) {
    anchors.add(`${m[1]}#${m[2].trim()}`);
  }
  return [...anchors];
}
