import { describe, expect, it } from "vitest";
import {
  extractMarkdownAnchors,
  hasDefinitionShapedMatch,
  normalizeAnchorSymbol,
  parseAnchor,
  resolveAgainstText,
} from "../lib/evidence/anchor-resolution";

/**
 * Permanent negative fixtures for the shared anchor-resolution engine.
 *
 * During the P02 CI-and-traversal-cost slice, every guard failure proof
 * (reintroduced defects, poisoned anchors) was performed transiently in the
 * working tree and exists only as narrative. This suite pins the engine's
 * detection semantics permanently so a refactor cannot silently disable the
 * properties the traceability guards depend on.
 */

describe("anchor resolution engine (permanent fixtures)", () => {
  describe("parseAnchor", () => {
    it("parses path#symbol and strips trailing parenthetical annotations", () => {
      expect(parseAnchor("src/lib/x.ts#mySymbol")).toEqual({ path: "src/lib/x.ts", symbol: "mySymbol" });
      expect(parseAnchor("src/lib/x.ts#mySymbol (applied to synth)")).toEqual({
        path: "src/lib/x.ts",
        symbol: "mySymbol",
      });
    });

    it("returns undefined for anchors without a usable separator", () => {
      expect(parseAnchor("no-separator")).toBeUndefined();
      expect(parseAnchor("#leading-hash")).toBeUndefined();
    });
  });

  describe("normalizeAnchorSymbol", () => {
    it("strips markdown emphasis and trailing punctuation", () => {
      expect(normalizeAnchorSymbol("**symbol**.")).toBe("symbol");
      expect(normalizeAnchorSymbol("symbol;")).toBe("symbol");
    });
  });

  describe("first-token tier (CI verifier contract)", () => {
    const fileText = "export function isKnownQuarantinedEntityId() {}\n// prose mentioning isKnownQuarantinedEntityIdX in comments only";
    it("resolves on first token even when only comments contain variants", () => {
      expect(resolveAgainstText(fileText, "isKnownQuarantinedEntityId canonical", "first-token").resolved).toBe(true);
    });
    it("fails closed on an absent symbol", () => {
      expect(resolveAgainstText(fileText, "totallyMissingThing", "first-token")).toEqual({
        resolved: false,
        reason: "symbol-absent",
      });
    });
  });

  describe("definition tier (stricter)", () => {
    const source = [
      "import x from 'y';",
      "// const decoyNotReal in a comment must not count",
      "export function getTalaFieldDisposition() {}",
      "const MAX_ITEMS = 3;",
      `it("keeps featured results for raw empty input", () => {});`,
    ].join("\n");

    it("accepts function declarations", () => {
      expect(hasDefinitionShapedMatch(source, "getTalaFieldDisposition")).toBe(true);
      expect(resolveAgainstText(source, "getTalaFieldDisposition", "definition").resolved).toBe(true);
    });

    it("accepts const declarations and quoted test titles", () => {
      expect(hasDefinitionShapedMatch(source, "MAX_ITEMS")).toBe(true);
      expect(hasDefinitionShapedMatch(source, "keeps featured results for raw empty input")).toBe(true);
    });

    it("rejects prose-only mentions that the substring check would pass", () => {
      // The historical false-match hole: the token appears in running prose,
      // never in a declaration position or as a quoted title. (The engine
      // works at text level, not AST level: a declaration keyword inside a
      // comment WOULD match by design — that boundary is documented here.)
      const prose = [
        "export function getTalaFieldDisposition() {}",
        "The getDispositionDecoy helper is used by several call sites.",
        "const MAX_ITEMS = 3;",
      ].join("\n");
      expect(prose.includes("getDispositionDecoy")).toBe(true);
      expect(hasDefinitionShapedMatch(prose, "getDispositionDecoy")).toBe(false);
      const outcome = resolveAgainstText(prose, "getDispositionDecoy", "definition");
      expect(outcome.resolved).toBe(false);
      expect(outcome.reason).toBe("not-definition-shaped");
    });

    it("accepts Sinhala-named declarations (non-ASCII-safe boundaries)", () => {
      // JS \b is ASCII-only; the engine must not silently reject
      // Sinhala-named symbols in this Sinhala-first repository.
      expect(hasDefinitionShapedMatch("const ස්වරය = 1;", "ස්වරය")).toBe(true);
    });

    it("accepts class members with an intervening modifier (public async x)", () => {
      const cls = ["class PitchDetector {", "  public async startListening() {}", "}"].join("\n");
      expect(hasDefinitionShapedMatch(cls, "startListening")).toBe(true);
    });

    it("pins multi-token branch order: full-text fallback vs definition pair", () => {
      // Both tokens declared on separate lines -> definition pair resolves.
      const bothDeclared = [
        "export function inspectGraph() {}",
        "export function projectPublicRecord() {}",
      ].join("\n");
      expect(resolveAgainstText(bothDeclared, "inspectGraph and projectPublicRecord", "definition").resolved).toBe(true);
      // Only the first token declared, full compound text absent -> rejected.
      const onlyFirst = "export function inspectGraph() {}";
      const outcome = resolveAgainstText(onlyFirst, "inspectGraph and projectPublicRecord", "definition");
      expect(outcome.resolved).toBe(false);
      expect(outcome.reason).toBe("not-definition-shaped");
    });
  });

  describe("extraction", () => {
    it("extracts src/data/docs anchors including .md cross-references", () => {
      const md = "- `src/lib/a.ts#symA` and data/ledger.json#keyOne\n- docs/GUIDE.md#sectionName";
      expect(extractMarkdownAnchors(md).sort()).toEqual([
        "data/ledger.json#keyOne",
        "docs/GUIDE.md#sectionName",
        "src/lib/a.ts#symA",
      ]);
    });

    it("stops a missing closing backtick at end of line instead of swallowing following lines", () => {
      // The pre-fix regex had no newline bound, so one unterminated anchor
      // swallowed all following lines into its symbol tail. The tail is now
      // bounded to a single line; same-line text after the path still rides
      // along (first-token tier tolerates that), but the NEXT line's content
      // can no longer be absorbed.
      const md = "- `src/lib/a.ts#symA and data/ledger.json#keyOne\n- next line content";
      expect(extractMarkdownAnchors(md)).toEqual([
        "src/lib/a.ts#symA and data/ledger.json#keyOne",
      ]);
    });

    it("does not treat numeric path:line references as path#symbol anchors", () => {
      expect(extractMarkdownAnchors("see src/lib/a.ts:42 for details")).toEqual([]);
    });
  });
});
