import { describe, expect, it } from "vitest";
import coverageData from "../../data/content-coverage.json";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import musicalCoreFieldDispositions from "../../data/musical-core-field-dispositions.json";
import { repository } from "@/lib/data/repository";
import {
  evaluateSourceReference,
  formatPublicSourceReference,
  getContextClaimPublicationDecision,
  getRecordPublicationDecision,
  getSourceCorpusInventory,
  getTalaFieldDisposition,
  KNOWN_QUARANTINED_ENTITY_IDS,
  UNKNOWN_PROVENANCE,
} from "@/lib/data/publication-policy";
import quizzesData from "@/data/quizzes.json";
import examPapersData from "@/data/exam-papers.json";
import lessonsData from "@/data/lessons.json";
import glossaryData from "@/data/glossary.json";
import {
  validateCoverageSnapshot,
  validateForensicInventory,
  validateForensicLedger,
  validateMusicalCoreFieldDispositions,
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
    expect(repository.getLessonById("les-tala-dadra")).toBeUndefined();
    expect(repository.getRagaById("raga-bilawal")).toBeDefined();
    expect(repository.getTalaById("tala-dadra")).toBeUndefined();
    expect(repository.getTalaById("tala-lawani")).toBeUndefined();
    expect(repository.getTalaById("tala-khemta")).toBeUndefined();
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

    [
      "sg10_emus_chap8_nadaya.pdf wrong.pdf පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf,wrong.pdf, පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf/wrong.pdf/ පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf(wrong.pdf) පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf/(wrong.pdf) පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf\nwrong.pdf පිටුව 2",
    ].forEach((pageOrSection) => {
      expect(evaluateSourceReference({
        sourceId: "SRC-G10-NADA",
        pageOrSection,
      })).toMatchObject({ supportable: false, reasonCode: "mismatched-source-document" });
    });
  });

  it("quarantines Lawani as a whole entity while its required context is unresolved", () => {
    const rawLawani = talasData.find((tala) => tala.id === "tala-lawani");
    expect(rawLawani).toBeDefined();
    expect(getContextClaimPublicationDecision(rawLawani)).toMatchObject({
      present: true,
      isPublic: false,
      reasonCode: "source-document-needs-review",
    });

    expect(repository.getTalaById("tala-lawani")).toBeUndefined();
    expect(getRecordPublicationDecision(rawLawani)).toMatchObject({
      isPublic: false,
      state: "quarantined",
    });

    expect(repository.getTalaById("tala-khemta")).toBeUndefined();
  });

  it("preserves the historical baseline without claiming a stored SHA is the current checkout", () => {
    expect(validateForensicLedger()).toEqual({ isValid: true, issues: [] });
    const staleHeader = structuredClone(forensicLedgerData) as unknown as Record<string, unknown>;
    staleHeader.phase = "Prompt 1 / publication containment and source baseline";
    staleHeader.authority = "Current checkout at base 6e62a3ad2d9621b8790d35af3358b08fafceaa57";
    staleHeader.auditedThrough = { phase: "Phase 2" };
    const result = validateForensicLedger(staleHeader);
    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      "phase",
      "authority",
      "auditedThrough",
    ]));
  });

  it("keeps unsupported musical and acoustics claims out of every public projection", () => {
    const publicProjection = JSON.stringify({
      lessons: repository.getLessons(),
      ragas: repository.getRagas(),
      talas: repository.getTalas(),
      glossary: repository.getGlossary(),
      learningPaths: repository.getLearningPaths(),
      quizzes: repository.getQuizzes(),
      exams: repository.getExamPapers(),
    });
    expect(publicProjection).not.toMatch(/භෛරව්(?:\s|["'])|රූපක්|"tala-roopak"|"raga-bhairav"/);
    expect(publicProjection).not.toMatch(/Frequency\s*-\s*Hz|හර්ට්ස්|\bHz\b|වයලීන හා බටනලා|මූලික ථාට රාගය/);
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
    const rawDadra = structuredClone(talasData.find((tala) => tala.id === "tala-dadra"));
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

  it("fails closed when canonical grade scope is missing instead of inferring it", () => {
    const bilawal = structuredClone(ragasData.find((raga) => raga.id === "raga-bilawal"));
    expect(bilawal).toBeDefined();
    if (!bilawal) return;
    delete (bilawal as { gradeBands?: unknown }).gradeBands;
    const decision = getRecordPublicationDecision(bilawal);
    expect(decision.isPublic).toBe(false);
    expect(decision.gradeBands).toEqual([]);
    expect(decision.reasonCodes).toContain("missing-grade-scope");
    expect(decision.reasonCodes).not.toContain("source-grade-mismatch");
  });

  it("composes malformed, wrong-grade, and review-required context into parent publication", () => {
    const khemta = talasData.find((tala) => tala.id === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;

    const malformed = structuredClone(khemta) as Record<string, unknown>;
    malformed.context_si = { text: "not learner text" };
    expect(getRecordPublicationDecision(malformed).isPublic).toBe(false);
    expect(getRecordPublicationDecision(malformed).reasonCodes).toContain("unpaired-context-claim");

    const wrongGrade = structuredClone(khemta) as Record<string, unknown>;
    wrongGrade.context_si = "සන්දර්භය";
    wrongGrade.contextSourceReference = {
      sourceId: "SRC-G07-VIOLIN",
      pageOrSection: "sg7_emus_chap2.1.2_violin.pdf පිටුව 1",
    };
    expect(getRecordPublicationDecision(wrongGrade).isPublic).toBe(false);
    expect(getRecordPublicationDecision(wrongGrade).reasonCodes).toContain("source-grade-mismatch");

    const referenceOnly = structuredClone(khemta) as Record<string, unknown>;
    delete referenceOnly.context_si;
    expect(getRecordPublicationDecision(referenceOnly).reasonCodes).toContain("unpaired-context-claim");
  });

  it("requires every tala disposition row and quarantines any incomplete playable evidence", () => {
    const registry = musicalCoreFieldDispositions.talas;
    expect(registry).toHaveLength(talasData.length);
    talasData.forEach((tala) => {
      const disposition = getTalaFieldDisposition(tala.id);
      expect(disposition).toBeDefined();
      expect(disposition?.context).toBeDefined();
      expect(disposition?.theka).toBeDefined();
      expect(disposition?.bols).toHaveLength(tala.bols.length);
    });
    expect(getTalaFieldDisposition("tala-khemta")?.allRequiredFieldsVerified).toBe(false);
    ["tala-dadra", "tala-keherwa", "tala-teental", "tala-jhaptal", "tala-deepchandi", "tala-lawani", "tala-roopak", "tala-khemta"]
      .forEach((id) => {
        expect(getTalaFieldDisposition(id)?.allRequiredFieldsVerified).toBe(false);
        expect(repository.getTalaById(id)).toBeUndefined();
      });
    expect(repository.getPublicationSummary().talas.public).toBe(0);
    expect(validateMusicalCoreFieldDispositions()).toEqual({ isValid: true, issues: [] });
  });

  it("rejects missing field evidence and registry values that drift from raw audit data", () => {
    const mutated = structuredClone(musicalCoreFieldDispositions) as typeof musicalCoreFieldDispositions;
    const khemta = mutated.talas.find((entry) => entry.talaId === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    delete (khemta.bols[0] as { sourceReference?: unknown }).sourceReference;
    (khemta.bols[1] as { value?: string }).value = "invented";
    const result = validateMusicalCoreFieldDispositions(talasData, mutated);
    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      "bols[0].sourceReference",
      "bols[1].value",
    ]));
  });

  it("fails the runtime Tala projection closed when a verified registry value drifts", () => {
    const khemta = musicalCoreFieldDispositions.talas.find((entry) => entry.talaId === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    const firstBol = khemta.bols[0] as { value?: string };
    const originalValue = firstBol.value;
    try {
      firstBol.value = "invented";
      expect(getTalaFieldDisposition("tala-khemta")?.allRequiredFieldsVerified).toBe(false);
      expect(getRecordPublicationDecision(talasData.find((tala) => tala.id === "tala-khemta"))).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["field-disposition-needs-review"]),
      });
    } finally {
      firstBol.value = originalValue;
    }
  });

  it("rejects strict locator confusables, malformed numbers, and unconsumed clauses", () => {
    const locators = [
      "පිටුව 2",
      "අසත්‍ය sg10_emus_chap8_nadaya.pdf පිටුව 2",
      "sg10_emus_chap8_nadaya.pdfx පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2 අසත්‍ය",
      "sg10_emus_chap8_nadaya.wrong\u200Bpdf පිටුව 2",
      "sg10_emus_chap8_nadaya\uFF0Epdf පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2.5",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2abc",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2; පිටුව -999",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2; page II",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2 trailing page 3",
    ];
    locators.forEach((pageOrSection) => {
      expect(evaluateSourceReference({ sourceId: "SRC-G10-NADA", pageOrSection })).toMatchObject({
        supportable: false,
      });
    });
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 2-4",
    }).supportable).toBe(true);
    expect(evaluateSourceReference({
      sourceId: "SRC-EPD-TB-G11",
      pageOrSection: "s11tim173.pdf පිටුව 24 trailing page 99",
    }).reasonCode).toBe("missing-page-evidence");
  });

  it("quarantines records that reverse-depend on an unavailable raga", () => {
    const dependent = {
      id: "synthetic-raga-dependent",
      gradeBands: ["10-11"],
      sourceReference: {
        sourceId: "SRC-G11-RAGA-ID",
        pageOrSection: "sg11_emus_ chap3_raga_handunaganimu.pdf පිටුව 1",
      },
      selectedRagaId: "raga-bhairav",
    };
    expect(getRecordPublicationDecision(dependent)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["dependent-entity-unavailable"]),
    });
  });

  it("quarantines recognized dependencies that do not resolve", () => {
    const dependent = {
      id: "synthetic-missing-dependent",
      gradeBands: ["10-11"],
      sourceReference: {
        sourceId: "SRC-G11-RAGA-ID",
        pageOrSection: "sg11_emus_ chap3_raga_handunaganimu.pdf පිටුව 1",
      },
      selectedRagaId: "raga-does-not-exist",
      audioTalaId: "tala-does-not-exist",
    };
    expect(getRecordPublicationDecision(dependent)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["dependent-entity-unavailable"]),
    });
  });

  it("treats every defined malformed context value as a blocking claim", () => {
    const khemta = talasData.find((tala) => tala.id === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    for (const context_si of [{}, null, ""]) {
      const candidate = structuredClone(khemta) as unknown as Record<string, unknown>;
      candidate.context_si = context_si;
      delete candidate.contextSourceReference;
      expect(getRecordPublicationDecision(candidate)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["unpaired-context-claim"]),
      });
    }
  });

  it("binds verified tala dispositions to the supplied candidate values", () => {
    const khemta = talasData.find((tala) => tala.id === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    const changedContext = { ...structuredClone(khemta), context_si: "invented context" };
    const changedTheka = { ...structuredClone(khemta), theka_si: "invented theka" };
    [changedContext, changedTheka].forEach((candidate) => {
      expect(getRecordPublicationDecision(candidate)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["field-disposition-needs-review"]),
      });
    });
  });

  it("requires canonical quiz grades instead of inheriting question grades", () => {
    const quiz = structuredClone(quizzesData.find((item) => item.id === "quiz-les-intro-01"));
    expect(quiz).toBeDefined();
    if (!quiz) return;
    delete (quiz as { gradeBands?: unknown }).gradeBands;
    expect(getRecordPublicationDecision(quiz)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["missing-grade-scope"]),
    });
  });

  it("rejects individual and mixed grade tokens at the public boundary", () => {
    const bilawal = structuredClone(ragasData.find((raga) => raga.id === "raga-bilawal"));
    expect(bilawal).toBeDefined();
    if (!bilawal) return;
    for (const gradeBands of [["11"], ["10-11", "11"], ["10-11", 11]]) {
      (bilawal as unknown as { gradeBands: unknown }).gradeBands = gradeBands;
      expect(getRecordPublicationDecision(bilawal)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["malformed-record", "unsupported-grade"]),
      });
    }
  });

  it("requires direct provenance instead of borrowing a parent lesson source", () => {
    const synthetic = {
      id: "synthetic-parent-linked-record",
      lessonId: "les-intro-01",
      gradeBands: ["10-11"],
    };
    expect(getRecordPublicationDecision(synthetic)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["missing-source-reference", "malformed-record"]),
    });
  });

  it("fails closed for unknown kinds and malformed known records", () => {
    const bilawal = structuredClone(ragasData.find((raga) => raga.id === "raga-bilawal"));
    const nada = structuredClone(glossaryData.find((term) => term.id === "term-nada"));
    expect(bilawal).toBeDefined();
    expect(nada).toBeDefined();
    if (!bilawal || !nada) return;
    bilawal.arohana_swaras[0] = "INVALID";
    delete (nada as { definition_si?: unknown }).definition_si;
    expect(getRecordPublicationDecision(bilawal).reasonCodes).toContain("malformed-record");
    expect(getRecordPublicationDecision(nada).reasonCodes).toContain("malformed-record");
  });

  it("rejects every required route-rendered Raga and Lesson shape", () => {
    const bilawal = ragasData.find((raga) => raga.id === "raga-bilawal");
    const intro = lessonsData.find((lesson) => lesson.id === "les-intro-01");
    expect(bilawal).toBeDefined();
    expect(intro).toBeDefined();
    if (!bilawal || !intro) return;
    for (const field of ["time_si", "pakad_si", "characteristics_si"] as const) {
      const candidate = structuredClone(bilawal) as unknown as Record<string, unknown>;
      candidate[field] = null;
      expect(getRecordPublicationDecision(candidate)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["malformed-record"]),
      });
    }
    for (const mutate of [
      (candidate: Record<string, unknown>) => { candidate.contentSections = [null]; },
      (candidate: Record<string, unknown>) => { candidate.diagnosticQuestion = null; },
      (candidate: Record<string, unknown>) => { candidate.listenActivity = null; },
      (candidate: Record<string, unknown>) => { candidate.guidedPractice = null; },
      (candidate: Record<string, unknown>) => { candidate.recap_si = [null]; },
    ]) {
      const candidate = structuredClone(intro) as unknown as Record<string, unknown>;
      mutate(candidate);
      expect(getRecordPublicationDecision(candidate)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["malformed-record"]),
      });
    }
  });

  it("rejects missing Quiz, Question, and Exam contract fields", () => {
    const quiz = quizzesData.find((item) => item.id === "quiz-les-intro-01");
    const paper = examPapersData.find((item) => item.id === "exam-ol-model-01");
    expect(quiz).toBeDefined();
    expect(paper).toBeDefined();
    if (!quiz || !paper) return;
    for (const mutate of [
      (candidate: Record<string, unknown>) => { candidate.title_si = null; },
      (candidate: Record<string, unknown>) => {
        ((candidate.questions as Array<Record<string, unknown>>)[0]).difficulty = null;
      },
      (candidate: Record<string, unknown>) => {
        ((candidate.questions as Array<Record<string, unknown>>)[0]).strandId = null;
      },
    ]) {
      const candidate = structuredClone(quiz) as unknown as Record<string, unknown>;
      mutate(candidate);
      expect(getRecordPublicationDecision(candidate).reasonCodes).toContain("malformed-record");
    }
    for (const field of ["title_si", "timeLimitMinutes", "instructions_si"] as const) {
      const candidate = structuredClone(paper) as unknown as Record<string, unknown>;
      candidate[field] = null;
      expect(getRecordPublicationDecision(candidate).reasonCodes).toContain("malformed-record");
    }
  });

  it("fails cyclic runtime records closed without projection recursion", () => {
    const bilawal = structuredClone(ragasData.find((raga) => raga.id === "raga-bilawal")) as unknown as Record<string, unknown>;
    bilawal.self = bilawal;
    expect(() => getRecordPublicationDecision(bilawal)).not.toThrow();
    expect(getRecordPublicationDecision(bilawal)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record"]),
    });
  });

  it("rejects malformed quiz thresholds and impossible question identities", () => {
    const canonical = quizzesData.find((item) => item.id === "quiz-les-intro-01");
    expect(canonical).toBeDefined();
    if (!canonical) return;
    for (const threshold of [-1, 0, 101, Number.NaN, "75"]) {
      const quiz = structuredClone(canonical) as unknown as Record<string, unknown>;
      quiz.passingScorePercent = threshold;
      expect(getRecordPublicationDecision(quiz).reasonCodes).toContain("malformed-record");
    }

    const duplicateAnswers = structuredClone(canonical) as unknown as Record<string, unknown>;
    const duplicateAnswerQuestion = (duplicateAnswers.questions as Array<Record<string, unknown>>)[0];
    const answerId = (duplicateAnswerQuestion.correctAnswerIds as string[])[0];
    duplicateAnswerQuestion.correctAnswerIds = [
      answerId,
      answerId,
    ];
    expect(getRecordPublicationDecision(duplicateAnswers).isPublic).toBe(false);

    const duplicateQuestionIds = structuredClone(canonical);
    duplicateQuestionIds.questions[1].id = duplicateQuestionIds.questions[0].id;
    expect(getRecordPublicationDecision(duplicateQuestionIds).isPublic).toBe(false);

    const matching = structuredClone(canonical) as unknown as Record<string, unknown>;
    const first = (matching.questions as Array<Record<string, unknown>>)[0];
    first.type = "matching";
    delete first.options_si;
    delete first.correctAnswerIds;
    first.matchingPairs = [
      { left_si: "නාදය", right_si: "පළමු" },
      { left_si: "ණාදය", right_si: "දෙවන" },
    ];
    expect(getRecordPublicationDecision(matching).isPublic).toBe(false);
  });

  it("fails blocking lesson cycles closed while allowing the quiz parent backlink", () => {
    const first = lessonsData.find((lesson) => lesson.id === "les-intro-01");
    const second = lessonsData.find((lesson) => lesson.id === "les-swara-01");
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) return;
    const firstPrerequisites = [...first.prerequisites];
    const secondPrerequisites = [...second.prerequisites];
    try {
      first.prerequisites = [first.id];
      expect(getRecordPublicationDecision(first).reasonCodes).toContain("dependency-cycle");
      first.prerequisites = [second.id];
      second.prerequisites = [first.id];
      expect(getRecordPublicationDecision(first).reasonCodes).toContain("dependent-entity-unavailable");
    } finally {
      first.prerequisites = firstPrerequisites;
      second.prerequisites = secondPrerequisites;
    }
    expect(getRecordPublicationDecision(quizzesData.find((quiz) => quiz.id === "quiz-les-intro-01")).isPublic).toBe(true);
    expect(getRecordPublicationDecision(first).reasonCodes).not.toContain("dependency-cycle");
  });

  it("returns detached public projections and complete review records", () => {
    const first = repository.getRagaById("raga-bilawal");
    expect(first).toBeDefined();
    if (!first) return;
    first.gradeBands.splice(0, first.gradeBands.length);
    expect(repository.getRagaById("raga-bilawal")?.gradeBands).toEqual(["10-11"]);
    const reviewLesson = repository.getLessons({ visibility: "review" }).find((lesson) => lesson.id === "les-intro-01");
    expect(reviewLesson?.quizId).toBe("quiz-les-intro-01");
    expect(reviewLesson?.nextRecommendedLessonId).toBe(
      lessonsData.find((lesson) => lesson.id === "les-intro-01")?.nextRecommendedLessonId
    );
  });

  it("rejects malformed or unsupported nested question discriminators", () => {
    const canonical = quizzesData.find((item) => item.id === "quiz-les-intro-01");
    expect(canonical).toBeDefined();
    if (!canonical) return;
    const malformedOptions = structuredClone(canonical) as unknown as Record<string, unknown>;
    ((malformedOptions.questions as unknown[])[0] as Record<string, unknown>).options_si = [null];
    expect(getRecordPublicationDecision(malformedOptions)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record", "nested-question-unpublishable"]),
    });

    const unsupportedType = structuredClone(canonical) as unknown as Record<string, unknown>;
    ((unsupportedType.questions as unknown[])[0] as Record<string, unknown>).type = "audio-id";
    expect(getRecordPublicationDecision(unsupportedType)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record", "nested-question-unpublishable"]),
    });
  });

  it("uses one dependency decision for repository reads, summaries, and optional projections", () => {
    const intro = repository.getLessonById("les-intro-01");
    expect(intro).toBeDefined();
    expect(intro?.nextRecommendedLessonId).toBeUndefined();
    expect(intro?.quizId).toBe("quiz-les-intro-01");
    expect(repository.getLearningPaths()).toEqual([]);
    expect(repository.getPublicationSummary().learningPaths.public).toBe(repository.getLearningPaths().length);
  });

  it("fails closed for mixed Tala aliases, mixed Quiz grades, and unsafe practice BPM", () => {
    const khemta = structuredClone(talasData.find((tala) => tala.id === "tala-khemta")) as unknown as Record<string, unknown>;
    expect(khemta.id).toBe("tala-khemta");
    khemta.aliases_si = ["ඛෙම්ටා තාලය", null];
    expect(getRecordPublicationDecision(khemta).reasonCodes).toContain("malformed-record");

    const unsafeTempo = structuredClone(talasData.find((tala) => tala.id === "tala-khemta")) as unknown as Record<string, unknown>;
    (unsafeTempo.practiceTempoBpm as Record<string, unknown>).thah_bpm = -1;
    expect(getRecordPublicationDecision(unsafeTempo).reasonCodes).toContain("malformed-record");

    const quiz = structuredClone(quizzesData.find((item) => item.id === "quiz-les-intro-01")) as unknown as Record<string, unknown>;
    quiz.gradeBands = ["10-11", null];
    expect(getRecordPublicationDecision(quiz).reasonCodes).toContain("malformed-record");
  });

  it("formats public citations without leaking repository filenames", () => {
    const bilawal = ragasData.find((raga) => raga.id === "raga-bilawal");
    expect(bilawal).toBeDefined();
    if (!bilawal) return;
    const label = formatPublicSourceReference(bilawal.sourceReference);
    expect(label).toBe("පිටු 1, 2");
    expect(label).not.toMatch(/\.pdf/i);
  });

  it("validates exam question arrays as nested publication claims", () => {
    const paper = structuredClone(examPapersData.find((item) => item.id === "exam-ol-model-01"));
    expect(paper).toBeDefined();
    if (!paper) return;
    delete (paper.partA_MCQ[0] as { gradeBands?: unknown }).gradeBands;
    expect(getRecordPublicationDecision(paper)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["nested-question-unpublishable"]),
    });
  });

  it("fails publication closed for malformed canonical entity shapes", () => {
    const khemta = structuredClone(talasData.find((tala) => tala.id === "tala-khemta"));
    expect(khemta).toBeDefined();
    if (!khemta) return;
    delete (khemta as { matras?: unknown }).matras;
    expect(getRecordPublicationDecision(khemta)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record"]),
    });
  });

  it("keeps missing quiz parent grades and parent identity non-public", () => {
    const quiz = structuredClone(quizzesData.find((item) => item.id === "quiz-les-intro-01"));
    expect(quiz).toBeDefined();
    if (!quiz) return;
    delete (quiz as { lessonId?: unknown }).lessonId;
    expect(getRecordPublicationDecision(quiz).isPublic).toBe(false);
    expect(getRecordPublicationDecision(quiz).reasonCodes).toContain("parent-lesson-unavailable");
    delete (quiz.questions[0] as { gradeBands?: unknown }).gradeBands;
    expect(getRecordPublicationDecision(quiz).isPublic).toBe(false);
    expect(getRecordPublicationDecision(quiz).reasonCodes).toContain("nested-question-unpublishable");
  });

  it("requires every disposition issue ID to resolve to the forensic ledger", () => {
    const mutated = structuredClone(musicalCoreFieldDispositions) as typeof musicalCoreFieldDispositions;
    mutated.talas[0].context.issueId = "P02-DANGLING-ISSUE";
    const result = validateMusicalCoreFieldDispositions(talasData, mutated);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "context.issueId")).toBe(true);
  });

  it("rejects malformed and duplicate field-disposition registry rows", () => {
    const malformed = structuredClone(musicalCoreFieldDispositions) as unknown as Record<string, unknown>;
    (malformed.talas as unknown[]).push(null);
    (malformed.issueCatalog as unknown[]).push(structuredClone((malformed.issueCatalog as unknown[])[0]));
    const result = validateMusicalCoreFieldDispositions(talasData, malformed);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "talas")).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes("IDs must be unique"))).toBe(true);
  });
});
