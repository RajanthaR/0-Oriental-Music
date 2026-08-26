import { describe, expect, it } from "vitest";
import {
  clone,
  recordById,
  recordChild,
  restoreRecord,
  restoreCatalog,
  RawRecord,
  RawCatalog,
  dependencyFixtures,
  lessons,
  ragas,
  talas,
  instruments,
  culturalTraditions,
  theatreTraditions,
  glossary,
  learningPaths,
  quizzes,
  examPapers,
  sources,
  sourceDocuments,
  sourcePageQuality,
  musicalCoreFieldDispositions,
  repository,
  DEPENDENCY_FIELD_RULES,
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  evaluateSourceReference,
  getRecordPublicationDecision,
  getSourceCorpusInventory,
  getTalaFieldDisposition,
  sanitizePublicRecord,
  inspectGraph,
  validateContentRecord,
  inspectDispositionRegistry,
  validateMusicalCoreFieldDispositions,
} from "./support/publication-parity-fixtures";


describe("central Tala disposition-registry contract", () => {
  const ALL_TALA_IDS = ["tala-dadra", "tala-keherwa", "tala-teental", "tala-jhaptal", "tala-deepchandi", "tala-roopak", "tala-lawani", "tala-khemta"];

  function withRegistry(mutate: (registry: RawRecord) => void, assert: () => void): void {
    const snapshot = clone(musicalCoreFieldDispositions);
    try {
      mutate(musicalCoreFieldDispositions);
      assert();
    } finally {
      restoreRecord(musicalCoreFieldDispositions, snapshot);
    }
    // The corpus is certifiable again once the mutation is reverted.
    expect(createPublicationEvaluationContext().safe).toBe(true);
  }

  it("accepts the shipped registry through one shared contract", () => {
    const inspection = inspectDispositionRegistry(musicalCoreFieldDispositions);
    expect(inspection.issues).toEqual([]);
    expect(inspection.ok).toBe(true);
    expect(inspection.entryById.size).toBe(ALL_TALA_IDS.length);
    // Both consumers reach the same verdict on the same registry.
    expect(createPublicationEvaluationContext().safe).toBe(true);
    expect(validateMusicalCoreFieldDispositions()).toEqual({ isValid: true, issues: [] });
  });

  it.each([
    ["a drifted policy string", (registry: RawRecord) => { registry.policy = "partial-field-quarantine"; }, "policy"],
    ["a missing policy declaration", (registry: RawRecord) => { delete registry.policy; }, "policy"],
    ["a reordered requiredFields list", (registry: RawRecord) => { registry.requiredFields = ["structure", "context", "theka", "bols"]; }, "requiredFields"],
    ["a truncated requiredFields list", (registry: RawRecord) => { registry.requiredFields = ["context", "theka", "bols"]; }, "requiredFields"],
    ["an unclosed field outside requiredFields", (registry: RawRecord) => { registry.unclosedRequiredFields = ["structure", "tempo"]; }, "unclosedRequiredFields"],
    ["a duplicated unclosed field", (registry: RawRecord) => { registry.unclosedRequiredFields = ["structure", "structure"]; }, "unclosedRequiredFields"],
    ["a missing unclosedRequiredFields list", (registry: RawRecord) => { delete registry.unclosedRequiredFields; }, "unclosedRequiredFields"],
    ["a non-integer version", (registry: RawRecord) => { registry.version = "1"; }, "version"],
    ["an emptied issue catalog", (registry: RawRecord) => { registry.issueCatalog = []; }, "issueCatalog"],
    ["an unresolvable ledger anchor", (registry: RawRecord) => {
      ((registry.issueCatalog as RawCatalog)[0]).ledgerIssueId = "P02-NOT-IN-LEDGER";
    }, "issueCatalog"],
    ["a duplicated issue-catalog ID", (registry: RawRecord) => {
      const catalog = registry.issueCatalog as RawCatalog;
      catalog.push(clone(catalog[0]));
    }, "issueCatalog"],
    ["a dangling row issue anchor", (registry: RawRecord) => {
      recordChild((registry.talas as RawCatalog)[0], "context").issueId = "P02-DANGLING-ISSUE";
    }, "context.issueId"],
    ["an out-of-domain row status", (registry: RawRecord) => {
      recordChild((registry.talas as RawCatalog)[0], "theka").status = "approved";
    }, "theka"],
    ["a blank row quality", (registry: RawRecord) => {
      recordChild((registry.talas as RawCatalog)[0], "theka").quality = "   ";
    }, "theka"],
    ["a denormalized row talaId", (registry: RawRecord) => {
      ((registry.talas as RawCatalog)[0]).talaId = " tala-dadra ";
    }, "talaId"],
    ["a duplicated row talaId", (registry: RawRecord) => {
      const rows = registry.talas as RawCatalog;
      rows.push(clone(rows[0]));
    }, "talaId"],
    ["an emptied bol list", (registry: RawRecord) => {
      ((registry.talas as RawCatalog)[0]).bols = [];
    }, "fields"],
    ["a non-sequential bol matra", (registry: RawRecord) => {
      (((registry.talas as RawCatalog)[0]).bols as RawCatalog)[1].matra = 7;
    }, "bols[1]"],
    ["a null bol row", (registry: RawRecord) => {
      (((registry.talas as RawCatalog)[0]).bols as unknown[])[0] = null;
    }, "bols[0]"],
    ["an emptied talas array", (registry: RawRecord) => { registry.talas = []; }, "talas"],
  ])(
    "makes the evaluation context unsafe for a verified-looking registry with %s",
    (_label, mutate, expectedField) => {
      withRegistry(mutate, () => {
        const inspection = inspectDispositionRegistry(musicalCoreFieldDispositions);
        expect(inspection.ok).toBe(false);
        expect(inspection.issues.some((issue) => issue.field === expectedField)).toBe(true);

        // Publication gating consumes the same verdict: the whole evaluation
        // context is unsafe, not merely one row.
        const context = createPublicationEvaluationContext();
        expect(context.safe).toBe(false);
        expect(getTalaFieldDisposition("tala-khemta", context)).toBeUndefined();
        expect(evaluatePublicationBatch(talas, context)).toMatchObject({
          isValid: false,
          failureReason: "unsafe-container",
        });
        expect(repository.getTalas()).toEqual([]);

        // Forensic validation reports the same structural defect.
        const validated = validateMusicalCoreFieldDispositions(talas, musicalCoreFieldDispositions);
        expect(validated.isValid).toBe(false);
        expect(validated.issues.some((issue) => issue.field === expectedField)).toBe(true);

        // Whole-entity quarantine is preserved for every Tala throughout.
        ALL_TALA_IDS.forEach((id) => {
          expect(repository.getTalaById(id)).toBeUndefined();
        });
        expect(repository.getPublicationSummary().talas.public).toBe(0);
      });
    },
  );

  it("never throws for hostile registry containers and stays deterministic", () => {
    const hostile: unknown[] = [
      null,
      undefined,
      42,
      "registry",
      [],
      { talas: null },
      { talas: [null] },
      Object.defineProperty({}, "talas", { get() { throw new Error("hostile talas"); }, enumerable: true }),
      new Proxy({}, { ownKeys() { throw new Error("hostile ownKeys"); } }),
    ];
    hostile.forEach((candidate) => {
      expect(() => inspectDispositionRegistry(candidate)).not.toThrow();
      const first = inspectDispositionRegistry(candidate);
      const second = inspectDispositionRegistry(candidate);
      expect(first.ok).toBe(false);
      expect(first.issues.length).toBeGreaterThan(0);
      expect(second.issues).toEqual(first.issues);
    });
  });

  it("keeps all eight Talas quarantined even when the registry closes the structure field", () => {
    // Dropping structure from unclosedRequiredFields is structurally legal, so the
    // shared contract stays satisfied. The forensic validator must still refuse it,
    // and per-Tala evidence must still decide publication.
    withRegistry((registry) => { registry.unclosedRequiredFields = []; }, () => {
      expect(inspectDispositionRegistry(musicalCoreFieldDispositions).ok).toBe(true);
      expect(createPublicationEvaluationContext().safe).toBe(true);

      const validated = validateMusicalCoreFieldDispositions(talas, musicalCoreFieldDispositions);
      expect(validated.isValid).toBe(false);
      expect(validated.issues.some((issue) => issue.field === "policy")).toBe(true);

      ALL_TALA_IDS.forEach((id) => {
        expect(repository.getTalaById(id)).toBeUndefined();
      });
      expect(repository.getPublicationSummary().talas.public).toBe(0);
    });
  });
});
