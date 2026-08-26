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


describe("source-document freshness across every consumer", () => {
  const RAGA_SOURCE_ID = "SRC-G11-RAGA-ID";
  const RAGA_DOCUMENT_SLUG = "grade_11_raga_identification";
  const PUBLIC_RAGA_ID = "raga-bilawal";

  function ragaSourceReference(): RawRecord {
    const raga = recordById(ragas, PUBLIC_RAGA_ID);
    return clone(recordChild(raga, "sourceReference"));
  }

  function sourceDocument(): RawRecord {
    const document = sourceDocuments.find((candidate) => candidate.slug === RAGA_DOCUMENT_SLUG);
    if (!document) throw new Error(`Missing source-document fixture: ${RAGA_DOCUMENT_SLUG}`);
    return document;
  }

  /**
   * Read all six consumers through one operation each, so a stale memoized
   * result in any of them would show up as a disagreement.
   */
  function readEveryConsumer() {
    return {
      referenceDecision: evaluateSourceReference(ragaSourceReference() as never),
      projection: repository.getSources().find((source) => source.id === RAGA_SOURCE_ID),
      documentSummary: repository.getSourceDocumentSummary(RAGA_SOURCE_ID),
      inventory: getSourceCorpusInventory(),
      contentList: repository.getRagas().map((raga) => raga.id),
      directLookup: repository.getRagaById(PUBLIC_RAGA_ID)?.id,
      publicationSummary: repository.getPublicationSummary().ragas,
    };
  }

  function withDocumentMutation(mutate: (document: RawRecord) => void, assert: () => void): void {
    const documentSnapshot = clone(sourceDocuments);
    const pageSnapshot = clone(sourcePageQuality);
    try {
      mutate(sourceDocument());
      assert();
    } finally {
      restoreCatalog(sourceDocuments, documentSnapshot);
      restoreCatalog(sourcePageQuality, pageSnapshot);
    }
  }

  it("serves the baseline document state through all six consumers", () => {
    const before = readEveryConsumer();
    expect(before.referenceDecision.supportable).toBe(true);
    expect(before.projection?.id).toBe(RAGA_SOURCE_ID);
    expect(before.documentSummary).toMatchObject({
      documentSlug: RAGA_DOCUMENT_SLUG,
      reviewStatus: "Source Triaged",
      pageCount: 2,
    });
    expect(before.inventory.available).toBe(true);
    expect(before.contentList).toContain(PUBLIC_RAGA_ID);
    expect(before.directLookup).toBe(PUBLIC_RAGA_ID);
    expect(before.publicationSummary.public).toBeGreaterThan(0);

    // Nothing is memoized: a second read is a fresh object with equal content.
    const again = readEveryConsumer();
    expect(again.publicationSummary).not.toBe(before.publicationSummary);
    expect(again.publicationSummary).toStrictEqual(before.publicationSummary);
    expect(again.documentSummary).toStrictEqual(before.documentSummary);
  });

  it("refreshes every consumer when only the source-document reviewStatus changes", () => {
    const before = readEveryConsumer();
    expect(before.directLookup).toBe(PUBLIC_RAGA_ID);

    withDocumentMutation(
      (document) => { document.reviewStatus = "Review Required"; },
      () => {
        const after = readEveryConsumer();

        // 1. source reference decisions
        expect(after.referenceDecision.supportable).toBe(false);
        expect(after.referenceDecision.reasonCode).toBe("source-document-needs-review");
        // 2. source projection stays available but reports the new state
        expect(after.projection?.id).toBe(RAGA_SOURCE_ID);
        expect(after.projection?.evidenceState).not.toBe(before.projection?.evidenceState);
        // 3. document/source summary
        expect(after.documentSummary.reviewStatus).toBe("Review Required");
        // 4. source-corpus inventory stays certifiable; only evidence changed
        expect(after.inventory.available).toBe(true);
        // 5. content list and 6. direct lookup withhold the dependent record
        expect(after.contentList).not.toContain(PUBLIC_RAGA_ID);
        expect(after.directLookup).toBeUndefined();
        // 7. publication summary agrees with the list in the same operation
        expect(after.publicationSummary.public).toBeLessThan(before.publicationSummary.public);
        expect(after.publicationSummary.public).toBe(after.contentList.length);
        expect(after.publicationSummary.raw).toBe(before.publicationSummary.raw);
      },
    );

    // Reverting the single field restores every consumer with no stale result.
    expect(readEveryConsumer()).toStrictEqual(before);
  });

  it("refreshes every consumer when only the source-document pageCount shrinks", () => {
    const before = readEveryConsumer();

    withDocumentMutation(
      (document) => {
        // Shrink the document to one page and drop the now out-of-range page row,
        // so the page registry stays internally consistent and the cited page 2
        // becomes genuinely out of range rather than merely unregistered.
        document.pageCount = 1;
        const kept = sourcePageQuality.filter((page) =>
          page.documentSlug !== RAGA_DOCUMENT_SLUG || Number(page.pageNumber) <= 1);
        restoreCatalog(sourcePageQuality, kept);
      },
      () => {
        const after = readEveryConsumer();

        expect(after.referenceDecision.supportable).toBe(false);
        expect(after.referenceDecision.reasonCode).toBe("page-out-of-range");
        expect(after.documentSummary.pageCount).toBe(1);
        expect(after.inventory.available).toBe(true);
        if (!after.inventory.available) throw new Error("Expected an available inventory");
        if (!before.inventory.available) throw new Error("Expected an available baseline inventory");
        expect(after.inventory.sourcePages).toBe(before.inventory.sourcePages - 1);
        expect(after.contentList).not.toContain(PUBLIC_RAGA_ID);
        expect(after.directLookup).toBeUndefined();
        expect(after.publicationSummary.public).toBe(after.contentList.length);
        expect(after.publicationSummary.public).toBeLessThan(before.publicationSummary.public);
      },
    );

    expect(readEveryConsumer()).toStrictEqual(before);
  });

  it("fails the whole corpus closed when a shrunken pageCount contradicts its page registry", () => {
    const before = readEveryConsumer();

    withDocumentMutation(
      (document) => { document.pageCount = 1; },
      () => {
        // The page-quality registry still lists page 2, so the corpus can no
        // longer be certified at all.
        expect(createPublicationEvaluationContext().safe).toBe(false);
        const after = readEveryConsumer();
        expect(after.referenceDecision.supportable).toBe(false);
        expect(after.referenceDecision.reasonCode).toBe("unsafe-evaluation-context");
        expect(after.projection).toBeUndefined();
        expect(after.documentSummary).toEqual({
          reviewStatus: "Unverified / unsafe evaluation context",
          pageCount: 0,
          evidenceQuality: "missing",
        });
        expect(after.inventory).toEqual({
          available: false,
          reason: "unsafe-evaluation-context",
        });
        expect(after.contentList).toEqual([]);
        expect(after.directLookup).toBeUndefined();
        expect(after.publicationSummary.public).toBe(0);
      },
    );

    expect(readEveryConsumer()).toStrictEqual(before);
  });

  it("refreshes every consumer for a page-quality downgrade independent of the document row", () => {
    const before = readEveryConsumer();
    const pageSnapshot = clone(sourcePageQuality);
    try {
      const page = sourcePageQuality.find((candidate) =>
        candidate.documentSlug === RAGA_DOCUMENT_SLUG && Number(candidate.pageNumber) === 1);
      if (!page) throw new Error("Missing page-quality fixture");
      page.confidence = "D";

      const after = readEveryConsumer();
      // The document row is untouched, so its own state is unchanged...
      expect(after.documentSummary.reviewStatus).toBe("Source Triaged");
      expect(after.documentSummary.pageCount).toBe(2);
      // ...while the evidence decision and every dependent surface refresh.
      expect(after.referenceDecision.supportable).toBe(false);
      expect(after.contentList).not.toContain(PUBLIC_RAGA_ID);
      expect(after.directLookup).toBeUndefined();
      expect(after.publicationSummary.public).toBe(after.contentList.length);
    } finally {
      restoreCatalog(sourcePageQuality, pageSnapshot);
    }

    expect(readEveryConsumer()).toStrictEqual(before);
  });
});

