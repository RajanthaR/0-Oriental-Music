import { describe, expect, it } from "vitest";
import coverageData from "../../data/content-coverage.json";
import ragasData from "@/data/ragas.json";
import { repository } from "@/lib/data/repository";
import {
  evaluateSourceReference,
  getRecordPublicationDecision,
  getSourceCorpusInventory,
  KNOWN_QUARANTINED_ENTITY_IDS,
  UNKNOWN_PROVENANCE,
} from "@/lib/data/publication-policy";
import quizzesData from "@/data/quizzes.json";
import {
  validateCoverageSnapshot,
  validateForensicInventory,
  validateForensicLedger,
  validatePublicBoundary,
  validatePublicCollection,
} from "@/lib/validation/content-validator";
import forensicLedgerData from "../../data/forensic-ledger.json";

describe("Prompt 1 publication containment", () => {
  it("keeps unsupported grades and named quarantined entities out of public data", () => {
    const publicCollections = [
      ...repository.getLessons(),
      ...repository.getRagas(),
      ...repository.getTalas(),
      ...repository.getInstruments(),
      ...repository.getCulturalTraditions(),
      ...repository.getTheatreTraditions(),
      ...repository.getLearningPaths(),
      ...repository.getExamPapers(),
      ...repository.getGlossary(),
      ...repository.getQuizzes(),
    ];

    publicCollections.forEach((record) => {
      expect(getRecordPublicationDecision(record).isPublic).toBe(true);
      expect(getRecordPublicationDecision(record).gradeBands).not.toContain("12-13");
      expect(KNOWN_QUARANTINED_ENTITY_IDS.has(record.id)).toBe(false);
    });
  });

  it("contains quarantined records on direct lookup while exposing remediated records", () => {
    // Quarantined records remain contained
    expect(repository.getLessonById("les-exam-skills")).toBeUndefined();
    expect(repository.getLessonById("les-raga-bhairav")).toBeUndefined();
    expect(repository.getRagaById("raga-bhairav")).toBeUndefined();
    expect(repository.getTalaById("tala-roopak")).toBeUndefined();
    expect(repository.getExamPaperById("exam-al-model-01")).toBeUndefined();
    expect(repository.getLearningPathById("path-exam-prep")).toBeUndefined();

    // Remediated Phase 2 records are public and verified
    expect(repository.getLessonById("les-intro-01")).toBeDefined();
    expect(repository.getLessonById("les-tala-dadra")).toBeDefined();
    expect(repository.getRagaById("raga-bilawal")).toBeDefined();
    expect(repository.getTalaById("tala-dadra")).toBeDefined();
    expect(repository.getTalaById("tala-lawani")).toBeDefined();
  });

  it("prevents CMS review status updates from leaking quarantined records into public getters", () => {
    const success = repository.updateLessonReviewStatus("les-raga-bhairav", "Published", true);
    expect(success).toBe(true);
    expect(repository.getLessons().some((l) => l.id === "les-raga-bhairav")).toBe(false);
    expect(repository.getLessonById("les-raga-bhairav")).toBeUndefined();

    // Reset in-memory test mutation so baseline remains pure
    repository.updateLessonReviewStatus("les-raga-bhairav", "Needs Revision", false);
  });

  it("does not expose the old A/L selector scope through repository data", () => {
    expect(repository.getPublicGradeBands()).toEqual(["6-7", "8-9", "10-11"]);
    expect(repository.getExamPapers().every((paper) => paper.gradeBand !== "12-13")).toBe(true);
    expect(repository.getExamPapers().every((paper) =>
      [...paper.partA_MCQ, ...paper.partB_Structured].every((question) => !question.gradeBands.includes("12-13"))
    )).toBe(true);
  });

  it("sanitizes public review metadata and source metadata", () => {
    repository.getRagas().forEach((raga) => {
      expect(raga.reviewMetadata.status).not.toBe("Published");
      expect(raga.reviewMetadata.reviewer).toBe(UNKNOWN_PROVENANCE);
      expect(raga.reviewMetadata.reviewDate).toBe(UNKNOWN_PROVENANCE);
    });
    repository.getSources().forEach((source) => {
      expect(source.status).not.toBe("Verified");
      expect(source.publisher).toBe(UNKNOWN_PROVENANCE);
      expect(source.license).toBe(UNKNOWN_PROVENANCE);
    });
  });

  it("keeps generated counts synchronized with the canonical baseline", () => {
    const summary = repository.getPublicationSummary();
    const expected = (coverageData as typeof coverageData).publicScope.publicCounts;
    Object.entries(expected).forEach(([entityType, count]) => {
      expect(summary[entityType].public).toBe(count);
    });
    expect(validateForensicInventory()).toMatchObject({ isValid: true, issues: [] });
    expect(validateForensicLedger()).toMatchObject({ isValid: true, issues: [] });
    expect(getSourceCorpusInventory()).toMatchObject({ sourceDocuments: 30, sourcePages: 1023 });
  });

  it("enforces the forensic ledger schema contract and rejects invalid issues or evidence", () => {
    const invalidLedger = structuredClone(forensicLedgerData) as typeof forensicLedgerData;
    const firstIssue = invalidLedger.issues[0] as Record<string, unknown>;

    // Corrupt an issue
    delete firstIssue.evidenceBasis;
    firstIssue.unknownProperty = "unexpected";
    firstIssue.severity = "P99";
    (firstIssue.evidence as Array<Record<string, unknown>>)[0].unknownEvidenceField = "unexpected";

    const result = validateForensicLedger(invalidLedger);
    expect(result.isValid).toBe(false);
    expect(result.issues.map((i) => i.field)).toEqual(expect.arrayContaining([
      "evidenceBasis",
      "unknownProperty",
      "severity",
      "unknownEvidenceField",
    ]));
  });

  it("detects drift in every mirrored forensic coverage section", () => {
    const driftedCoverage = structuredClone(coverageData) as unknown as {
      rawContentCounts: Record<string, number>;
      sourcePageQuality: Record<string, number>;
      sourceDocumentReviewStatus: Record<string, number>;
      legacyReconciliationSnapshot: {
        actionCounts: Record<string, number>;
      };
      publicScope: { publicCounts: Record<string, number> };
    };
    driftedCoverage.rawContentCounts.ragas += 1;
    driftedCoverage.sourcePageQuality.B += 1;
    driftedCoverage.sourceDocumentReviewStatus["Review Required"] += 1;
    driftedCoverage.legacyReconciliationSnapshot.actionCounts.REMAP_GRADE += 1;
    driftedCoverage.publicScope.publicCounts.ragas += 1;

    const result = validateCoverageSnapshot(driftedCoverage);
    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      "rawContentCounts.ragas",
      "sourcePageQuality.B",
      "sourceDocumentReviewStatus.Review Required",
      "legacyReconciliationSnapshot.actionCounts.REMAP_GRADE",
      "publicScope.publicCounts.ragas",
    ]));
  });

  it("validates the actual public collections and rejects a raw quarantined record", () => {
    const boundary = validatePublicBoundary({
      lessons: repository.getLessons(),
      ragas: repository.getRagas(),
      talas: repository.getTalas(),
      instruments: repository.getInstruments(),
      culturalTraditions: repository.getCulturalTraditions(),
      theatreTraditions: repository.getTheatreTraditions(),
      learningPaths: repository.getLearningPaths(),
      exams: repository.getExamPapers(),
    });
    expect(boundary).toMatchObject({ isValid: true, issues: [] });

    const rawBhairav = ragasData.find((raga) => raga.id === "raga-bhairav");
    expect(validatePublicCollection("Raga", [rawBhairav])).toMatchObject({ isValid: false });
  });

  it("rejects filename digits, out-of-range pages, and mismatched PDF locators", () => {
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf",
    }).reasonCode).toBe("missing-page-evidence");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 2-999",
    }).reasonCode).toBe("page-out-of-range");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටුව 2; s11tim173.pdf පිටුව 1",
    }).reasonCode).toBe("mismatched-source-document");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "evil-sg10_emus_chap8_nadaya.pdf පිටුව 2",
    }).reasonCode).toBe("mismatched-source-document");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "SG10_EMUS_CHAP8_NADAYA.PDF පිටුව 2",
    }).supportable).toBe(true);
  });

  it("requires every cited page to contain readable A/B Sinhala evidence", () => {
    expect(evaluateSourceReference({
      sourceId: "SRC-G07-VIOLIN",
      pageOrSection: "sg7_emus_chap2.1.2_violin.pdf පිටු 1, 2",
    })).toMatchObject({
      supportable: false,
      reasonCode: "low-quality-page-evidence",
      quality: "mixed",
    });
  });

  it("requires each public grade band to contain a grade established by its source", () => {
    const rawDadra = structuredClone(repository.getTalaById("tala-dadra"));
    expect(rawDadra).toBeDefined();
    if (!rawDadra) return;
    rawDadra.gradeBands = ["6-7", "10-11"];
    const decision = getRecordPublicationDecision(rawDadra);
    expect(decision.isPublic).toBe(false);
    expect(decision.reasonCodes).toContain("source-grade-mismatch");
  });

  it("fails closed when a public quiz contains an unsupported question", () => {
    const quiz = quizzesData.find((item) => item.id === "quiz-les-intro-01");
    expect(quiz).toBeDefined();
    if (!quiz) return;
    const originalQuestion = structuredClone(quiz.questions[0]);
    try {
      quiz.questions[0].gradeBands = ["12-13"];
      const decision = getRecordPublicationDecision(quiz);
      expect(decision.isPublic).toBe(false);
      expect(decision.reasonCodes).toContain("nested-question-unpublishable");
      expect(repository.getQuizById(quiz.id)).toBeUndefined();

      quiz.questions[0].gradeBands = [];
      expect(getRecordPublicationDecision(quiz).reasonCodes).toContain("nested-question-unpublishable");
      expect(repository.getQuizById(quiz.id)).toBeUndefined();
    } finally {
      quiz.questions[0] = originalQuestion;
    }
    expect(repository.getQuizById(quiz.id)).toBeDefined();
    expect(repository.getPublicationSummary().quizzes.public).toBe(repository.getQuizzes().length);
  });
});
