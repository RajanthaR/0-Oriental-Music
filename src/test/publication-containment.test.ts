import { describe, expect, it } from "vitest";
import coverageData from "../../data/content-coverage.json";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import sourcesData from "@/data/sources.json";
import musicalCoreFieldDispositions from "../../data/musical-core-field-dispositions.json";
import { repository } from "@/lib/data/repository";
import {
  DEPENDENCY_FIELD_RULES,
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  evaluateSourceReference,
  formatPublicSourceReference,
  getContextClaimPublicationDecision,
  getRecordPublicationDecision,
  getPublicationDecision,
  getSourceCorpusInventory,
  getSourceDocumentSummary,
  getTalaFieldDisposition,
  isKnownQuarantinedEntityId,
  UNKNOWN_PROVENANCE,
  sanitizePublicRecord,
  sanitizeReviewRecord,
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
  it("declares the complete blocking and nonblocking dependency matrix", () => {
    expect(DEPENDENCY_FIELD_RULES).toEqual({
      prerequisites: { blocking: true, catalog: "lessons" },
      "steps[].lessonId": { blocking: true, catalog: "lessons" },
      nextRecommendedLessonId: { blocking: false, catalog: "lessons" },
      quizId: { blocking: false, catalog: "quizzes" },
      masteryQuizId: { blocking: true, catalog: "quizzes" },
      nextRecommendedPathId: { blocking: false, catalog: "learningPaths" },
      lessonId: { blocking: true, catalog: "lessons" },
      talaId: { blocking: true, catalog: "talas" },
      targetTalaId: { blocking: true, catalog: "talas" },
      audioTalaId: { blocking: true, catalog: "talas" },
      ragaId: { blocking: true, catalog: "ragas" },
      targetRagaId: { blocking: true, catalog: "ragas" },
      selectedRagaId: { blocking: true, catalog: "ragas" },
    });
  });

  it.each(Object.entries(DEPENDENCY_FIELD_RULES))(
    "applies the declarative %s dependency rule to the publication decision",
    (field, rule) => {
      const canonicalLesson = lessonsData.find((lesson) => lesson.id === "les-intro-01");
      const canonicalQuiz = quizzesData.find((quiz) => quiz.id === "quiz-les-intro-01");
      expect(canonicalLesson).toBeDefined();
      expect(canonicalQuiz).toBeDefined();
      if (!canonicalLesson || !canonicalQuiz) return;

      const candidate = structuredClone(field === "lessonId" ? canonicalQuiz : canonicalLesson) as unknown as Record<string, unknown>;
      let expectedPath = field;
      if (field === "prerequisites") {
        candidate.prerequisites = ["missing-dependency"];
        expectedPath = "prerequisites[0]";
      } else if (field === "steps[].lessonId") {
        candidate.steps = [{ lessonId: "missing-dependency" }];
        expectedPath = "steps[0].lessonId";
      } else {
        candidate[field] = "missing-dependency";
      }

      const decision = getRecordPublicationDecision(candidate);
      const disposition = decision.nestedDispositions.find((item) => item.path === expectedPath);
      expect(disposition, `${field} disposition`).toMatchObject({
        isPublic: false,
        blocking: rule.blocking,
        reasonCodes: expect.arrayContaining(["dependent-entity-unavailable"]),
      });
      expect(decision.isPublic).toBe(!rule.blocking);
      if (!rule.blocking) {
        expect((decision.publicProjection as Record<string, unknown> | undefined)?.[field]).toBeUndefined();
      }
    },
  );

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
      expect(isKnownQuarantinedEntityId(record.id)).toBe(false);
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
    expect(isKnownQuarantinedEntityId("  raga-bhairav  ")).toBe(true);
    const paddedBhairav = structuredClone(ragasData.find((raga) => raga.id === "raga-bhairav"));
    expect(paddedBhairav).toBeDefined();
    if (paddedBhairav) {
      paddedBhairav.id = "  raga-bhairav  ";
      expect(getRecordPublicationDecision(paddedBhairav)).toMatchObject({
        isPublic: false,
        state: "quarantined",
        reasonCodes: expect.arrayContaining(["known-forensic-issue"]),
      });
    }
  });

  it("prevents CMS review status updates from leaking quarantined records into public getters", () => {
    const success = repository.updateLessonReviewStatus("les-raga-bhairav", "Published", true);
    expect(success).toBe(false);
    expect(repository.getLessons().some((l) => l.id === "les-raga-bhairav")).toBe(false);
    expect(repository.getLessonById("les-raga-bhairav")).toBeUndefined();

  });

  it("keeps malformed raw lessons nonpublic while review and CMS paths fail safely", () => {
    const lessonCatalog = lessonsData as unknown as Array<Record<string, unknown>>;
    const rawIndex = lessonCatalog.findIndex((lesson) => lesson.id === "les-intro-01");
    const raw = lessonCatalog[rawIndex];
    expect(raw).toBeDefined();
    if (!raw) return;
    const original = structuredClone(raw);
    try {
      delete raw.reviewMetadata;
      expect(getRecordPublicationDecision(raw)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["malformed-record"]),
      });
      expect(repository.getLessons({ visibility: "review" }).find((lesson) => lesson.id === raw.id)?.reviewMetadata)
        .toMatchObject({ status: "Needs Revision" });
      expect(repository.updateLessonStatus(String(raw.id), "Needs Revision", "Review Agent", "Safe repair")).toBe(true);
      const repaired = lessonCatalog[rawIndex];
      expect(repaired.reviewMetadata).toMatchObject({ status: "Needs Revision", reviewer: "Review Agent" });

      repaired.title_si = null;
      expect(repository.updateLessonStatus(String(repaired.id), "Needs Revision", "Review Agent", "Invalid record")).toBe(false);
    } finally {
      lessonCatalog[rawIndex] = original;
    }
  });

  it("keeps partial and mismatched publication decisions fail closed", () => {
    const partial = {
      id: "synthetic-partial",
      gradeBands: ["10-11"],
      sourceReference: {
        sourceId: "SRC-G10-NADA",
        pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටුව 2",
      },
    };
    expect(getPublicationDecision(partial)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["unknown-record-kind", "malformed-record"]),
    });

    const validLesson = lessonsData.find((lesson) => lesson.id === "les-intro-01");
    expect(validLesson).toBeDefined();
    if (!validLesson) return;
    const publicDecision = getRecordPublicationDecision(validLesson);
    expect(publicDecision.isPublic).toBe(true);
    const malformed = structuredClone(validLesson) as Record<string, unknown>;
    delete malformed.title_si;
    expect(sanitizePublicRecord(malformed)).toBeUndefined();
  });

  it("fails publication batches closed for whitespace-normalized duplicate IDs", () => {
    const first = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    const second = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    second.id = ` ${String(first.id)} `;
    const result = evaluatePublicationBatch([first, second]);
    expect(result).toMatchObject({ isValid: true });
    expect(result.decisions).toHaveLength(2);
    expect(result.decisions.every((decision) =>
      !decision.isPublic && decision.reasonCodes.includes("duplicate-record-id"))).toBe(true);
  });

  it("preserves stable failure reasons at the checked batch boundary", () => {
    const sparse: unknown[] = [];
    sparse.length = 2;
    expect(evaluatePublicationBatch(null)).toMatchObject({
      isValid: false,
      decisions: [],
      failureReason: "non-array",
    });
    expect(evaluatePublicationBatch(sparse)).toMatchObject({
      isValid: false,
      decisions: [],
      failureReason: "unsafe-container",
    });
  });

  it("never substitutes trusted defaults for explicitly malformed catalog inputs", () => {
    const accessorBacked: Record<string, unknown> = {};
    Object.defineProperty(accessorBacked, "ragas", {
      enumerable: true,
      get() {
        throw new Error("catalog getter must not run");
      },
    });
    const inputs: unknown[] = [
      { ragas: undefined },
      { ragas: null },
      { ragas: Symbol("unsafe") },
      accessorBacked,
    ];
    for (const input of inputs) {
      const context = createPublicationEvaluationContext(input as never);
      expect(context.safe).toBe(false);
      expect(context.catalogs.ragas).toEqual([]);
      expect(evaluatePublicationBatch([ragasData[0]], context)).toMatchObject({
        isValid: false,
        decisions: [],
        failureReason: "unsafe-container",
      });
    }
  });

  it("uses one normalized identity index for context, batch, review, and repository reads", () => {
    const first = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    const second = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    second.id = ` ${String(first.id)} `;
    const context = createPublicationEvaluationContext({ ragas: [first, second] });
    expect(context.safe).toBe(true);
    expect(getRecordPublicationDecision(first, context)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["unknown-record-kind"]),
    });
    expect(evaluatePublicationBatch(context.catalogs.ragas, context).decisions.every(
      (decision) => decision.reasonCodes.includes("duplicate-record-id"),
    )).toBe(true);
    expect(sanitizeReviewRecord(first, context)).toMatchObject({ id: "raga-bilawal" });

    const mutableRepository = repository as unknown as { ragas: unknown[] };
    const original = mutableRepository.ragas;
    try {
      mutableRepository.ragas = [first, second];
      expect(repository.getRagas()).toEqual([]);
      expect(repository.getRagaById(String(first.id))).toBeUndefined();
      expect(repository.getPublicationSummary().ragas).toMatchObject({
        raw: 2,
        public: 0,
        needsReview: 2,
        failureReasons: ["duplicate-record-id"],
      });
    } finally {
      mutableRepository.ragas = original;
    }

    const mutableLessons = repository as unknown as { lessons: unknown[] };
    const originalLessons = mutableLessons.lessons;
    const lessonA = structuredClone(lessonsData[0]) as unknown as Record<string, unknown>;
    const lessonB = structuredClone(lessonsData[0]) as unknown as Record<string, unknown>;
    lessonB.id = ` ${String(lessonA.id)} `;
    try {
      mutableLessons.lessons = [lessonA, lessonB];
      expect(repository.getLessons({ visibility: "review" })).toEqual([]);
      expect(repository.updateLessonReviewStatus(String(lessonA.id), "Needs Revision", false)).toBe(false);
    } finally {
      mutableLessons.lessons = originalLessons;
    }
  });

  it("fails every evidence helper closed for unsafe or forged evaluation contexts", () => {
    const reference = ragasData[0].sourceReference;
    const unsafe = createPublicationEvaluationContext({ lessons: undefined });
    expect(evaluateSourceReference(reference, unsafe)).toMatchObject({
      supportable: false,
      reasonCode: "unsafe-evaluation-context",
    });
    expect(getContextClaimPublicationDecision(talasData[0], unsafe)).toMatchObject({
      isPublic: false,
      reasonCode: "unsafe-evaluation-context",
    });
    expect(getSourceDocumentSummary(reference.sourceId, unsafe)).toMatchObject({
      pageCount: 0,
      evidenceQuality: "missing",
    });

    const valid = createPublicationEvaluationContext();
    const forged = Object.freeze({ safe: true, catalogs: valid.catalogs }) as never;
    expect(() => getSourceDocumentSummary(reference.sourceId, forged)).not.toThrow();
    expect(getSourceDocumentSummary(reference.sourceId, forged)).toMatchObject({
      pageCount: 0,
      evidenceQuality: "missing",
    });
  });

  it("deep-freezes the dependency matrix so policy cannot be changed at runtime", () => {
    expect(Object.isFrozen(DEPENDENCY_FIELD_RULES)).toBe(true);
    for (const rule of Object.values(DEPENDENCY_FIELD_RULES)) expect(Object.isFrozen(rule)).toBe(true);
    expect(() => {
      (DEPENDENCY_FIELD_RULES.prerequisites as { blocking: boolean }).blocking = false;
    }).toThrow();
    expect(DEPENDENCY_FIELD_RULES.prerequisites.blocking).toBe(true);
  });

  it("exposes only frozen publication snapshots, not mutable evaluation caches", () => {
    const context = createPublicationEvaluationContext();
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.catalogs)).toBe(true);
    expect(Object.isFrozen(context.catalogs.lessons)).toBe(true);
    for (const privateField of ["memo", "stack", "snapshots", "knownKinds", "sourceDocuments", "sourcePageQuality"]) {
      expect((context as unknown as Record<string, unknown>)[privateField]).toBeUndefined();
    }
  });

  it("reports unsafe catalog captures as current needs-review inventory", () => {
    const mutableRepository = repository as unknown as { ragas: unknown[] };
    const original = mutableRepository.ragas;
    const sparse: unknown[] = [];
    sparse.length = original.length;
    try {
      mutableRepository.ragas = sparse;
      const summary = repository.getPublicationSummary().ragas;
      expect(summary).toEqual({
        raw: original.length,
        public: 0,
        quarantined: 0,
        needsReview: original.length,
        failureReasons: ["unsafe-container"],
      });
    } finally {
      mutableRepository.ragas = original;
    }
  });

  it("snapshots source references before evidence fields are read", () => {
    const canonical = ragasData[0].sourceReference;
    let getterReads = 0;
    const stateful = new Proxy(structuredClone(canonical) as Record<string, unknown>, {
      get(target, property, receiver) {
        getterReads += 1;
        if (property === "sourceId") return "SRC-COUNTERFEIT";
        return Reflect.get(target, property, receiver);
      },
    });
    expect(evaluateSourceReference(stateful as unknown as typeof canonical))
      .toMatchObject({ supportable: true, reasonCode: "supportable" });
    expect(getterReads).toBe(0);
  });

  it("fails CMS operations safely for hostile IDs and metadata containers", () => {
    const raw = lessonsData.find((lesson) => lesson.id === "les-intro-01") as unknown as Record<string, unknown>;
    const originalMetadata = raw.reviewMetadata;
    const hostileMetadata = new Proxy(structuredClone(originalMetadata) as Record<string, unknown>, {
      ownKeys() {
        throw new Error("hostile metadata");
      },
    });
    try {
      raw.reviewMetadata = hostileMetadata;
      expect(() => repository.updateLessonStatus("les-intro-01", "Needs Revision", "Reviewer", "Notes"))
        .not.toThrow();
      expect(repository.updateLessonStatus("les-intro-01", "Needs Revision", "Reviewer", "Notes")).toBe(false);

      const hostileId = new Proxy({ toString: () => "les-intro-01" }, {
        getPrototypeOf() {
          throw new Error("hostile id");
        },
      });
      expect(() => (repository.updateLessonReviewStatus as unknown as (...args: unknown[]) => boolean)(
        hostileId,
        "Needs Revision",
        false,
      )).not.toThrow();
      expect((repository.updateLessonReviewStatus as unknown as (...args: unknown[]) => boolean)(
        hostileId,
        "Needs Revision",
        false,
      )).toBe(false);
    } finally {
      raw.reviewMetadata = originalMetadata;
    }
  });

  it("keeps CMS publication evidence immutable and applies status changes atomically", () => {
    const mutableRepository = repository as unknown as { lessons: unknown[] };
    const index = mutableRepository.lessons.findIndex(
      (candidate) => candidate && typeof candidate === "object" && (candidate as Record<string, unknown>).id === "les-intro-01",
    );
    const original = mutableRepository.lessons[index];
    const lesson = structuredClone(original) as Record<string, unknown>;
    const verifiedMetadata = {
      status: "Rights & Source Verification",
      reviewer: "Verified reviewer fixture",
      reviewDate: "2026-08-15",
      lastVerifiedDate: "2026-08-15",
      changeNotes: "Verified claim-level evidence fixture",
      license: "Verified educational licence fixture",
      reuseStatus: "Curriculum Canonical",
    };
    lesson.reviewMetadata = verifiedMetadata;
    Object.defineProperty(lesson, "published", {
      value: false,
      writable: false,
      configurable: true,
      enumerable: true,
    });
    mutableRepository.lessons[index] = lesson;
    try {
      expect(repository.updateLessonStatus(
        "les-intro-01",
        "Published",
        "FORGED REVIEWER",
        "forged notes",
      )).toBe(false);
      expect(mutableRepository.lessons[index]).toBe(lesson);
      expect(lesson.reviewMetadata).toEqual(verifiedMetadata);
      expect(lesson.published).toBe(false);

      expect(repository.updateLessonStatus(
        "les-intro-01",
        "Published",
        verifiedMetadata.reviewer,
        verifiedMetadata.changeNotes,
      )).toBe(true);
      const replacement = mutableRepository.lessons[index] as Record<string, unknown>;
      expect(replacement).not.toBe(lesson);
      expect(replacement.published).toBe(true);
      expect(replacement.reviewMetadata).toMatchObject({
        status: "Published",
        reviewer: verifiedMetadata.reviewer,
        changeNotes: verifiedMetadata.changeNotes,
      });
      expect(lesson.published).toBe(false);
      expect(lesson.reviewMetadata).toEqual(verifiedMetadata);
    } finally {
      mutableRepository.lessons[index] = original;
    }
  });

  it("evaluates CMS publication against the same repository source snapshot", () => {
    const mutableRepository = repository as unknown as { lessons: unknown[]; sources: unknown[] };
    const index = mutableRepository.lessons.findIndex(
      (candidate) => candidate && typeof candidate === "object" && (candidate as Record<string, unknown>).id === "les-intro-01",
    );
    const originalLesson = mutableRepository.lessons[index];
    const originalSources = mutableRepository.sources;
    const lesson = structuredClone(originalLesson) as Record<string, unknown>;
    lesson.reviewMetadata = {
      status: "Rights & Source Verification",
      reviewer: "Verified reviewer fixture",
      reviewDate: "2026-08-15",
      lastVerifiedDate: "2026-08-15",
      changeNotes: "Verified claim-level evidence fixture",
      license: "Verified educational licence fixture",
      reuseStatus: "Curriculum Canonical",
    };
    lesson.published = false;
    mutableRepository.lessons[index] = lesson;
    mutableRepository.sources = [];
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", true)).toBe(false);
      expect(repository.updateLessonStatus(
        "les-intro-01",
        "Published",
        "Verified reviewer fixture",
        "Verified claim-level evidence fixture",
      )).toBe(false);
      expect(mutableRepository.lessons[index]).toBe(lesson);
      expect(lesson.published).toBe(false);
    } finally {
      mutableRepository.lessons[index] = originalLesson;
      mutableRepository.sources = originalSources;
    }
  });

  it("fails closed after a previously trusted raw record becomes accessor-backed", () => {
    const candidate = structuredClone(ragasData[0]) as Record<string, unknown>;
    expect(getRecordPublicationDecision(candidate).isPublic).toBe(true);
    let getterCalls = 0;
    Object.defineProperty(candidate, "id", {
      enumerable: true,
      configurable: true,
      get() {
        getterCalls += 1;
        throw new Error("hostile id getter");
      },
    });
    expect(getRecordPublicationDecision(candidate)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record"]),
    });
    expect(getterCalls).toBe(0);
  });

  it("quarantines dependent claims when a source ID becomes ambiguous", () => {
    const sourceCatalog = sourcesData as unknown as Array<Record<string, unknown>>;
    const originalLength = sourceCatalog.length;
    try {
      const bilawal = ragasData.find((raga) => raga.id === "raga-bilawal");
      expect(bilawal).toBeDefined();
      if (!bilawal) return;
      const sourceId = bilawal.sourceReference.sourceId;
      const source = sourceCatalog.find((candidate) => candidate.id === sourceId);
      expect(source).toBeDefined();
      if (!source) return;
      const duplicate = structuredClone(source);
      sourceCatalog.push(duplicate);
      expect(getRecordPublicationDecision(bilawal)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["ambiguous-source-record"]),
      });
    } finally {
      sourceCatalog.splice(originalLength);
    }
  });

  it("uses the repository source snapshot for both source rows and source summaries", () => {
    const mutableRepository = repository as unknown as { sources: unknown[] };
    const original = mutableRepository.sources;
    const changed = structuredClone(sourcesData) as unknown as Array<Record<string, unknown>>;
    const target = changed[0];
    target.originalFilename = `missing-${String(target.originalFilename)}`;
    try {
      mutableRepository.sources = changed;
      const source = repository.getSourceById(String(target.id));
      const summary = repository.getSourceDocumentSummary(String(target.id));
      expect(source?.evidenceState).toBe(summary.reviewStatus);
      expect(source?.evidenceQuality).toBe(summary.evidenceQuality);
      expect(summary).toMatchObject({
        pageCount: 0,
        evidenceQuality: "missing",
        reviewStatus: "No matching extracted document",
      });
    } finally {
      mutableRepository.sources = original;
    }
  });

  it("rebuilds identity containment when a catalog mutates without changing length", () => {
    const catalog = lessonsData as unknown as Array<Record<string, unknown>>;
    const original = catalog[1];
    const replacement = structuredClone(catalog[0]);
    catalog[1] = replacement;
    try {
      expect(getRecordPublicationDecision(replacement)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["unknown-record-kind", "malformed-record"]),
      });
      expect(repository.getLessons()).toEqual([]);
      expect(repository.getPublicationSummary().lessons).toMatchObject({
        raw: catalog.length,
        public: 0,
        needsReview: catalog.length,
      });
    } finally {
      catalog[1] = original;
    }
  });

  it("returns structured failures rather than throwing for malformed validator inputs", () => {
    expect(() => validatePublicCollection("Raga", null)).not.toThrow();
    expect(validatePublicCollection("Raga", null)).toMatchObject({ isValid: false });
    expect(() => validatePublicBoundary(null)).not.toThrow();
    expect(validatePublicBoundary(null)).toMatchObject({ isValid: false });
    expect(() => validateForensicLedger(null)).not.toThrow();
    expect(validateForensicLedger(null)).toMatchObject({ isValid: false });
    expect(() => validateCoverageSnapshot(null)).not.toThrow();
    expect(validateCoverageSnapshot(null)).toMatchObject({ isValid: false });

    const hostile = new Proxy(structuredClone(ragasData[0]) as Record<string, unknown>, {
      ownKeys() {
        throw new Error("hostile ownKeys");
      },
    });
    expect(() => validatePublicCollection("Raga", [hostile])).not.toThrow();
    expect(validatePublicCollection("Raga", [hostile])).toMatchObject({ isValid: false });
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
    const publicLesson = repository.getLessons()[0];
    expect(publicLesson).toBeDefined();
    expect(validatePublicCollection("Raga", [publicLesson])).toMatchObject({ isValid: false });
    expect(validatePublicCollection("Bogus", [publicLesson])).toMatchObject({ isValid: false });
  });

  it("rejects padded source IDs consistently across publication and validation", () => {
    const lesson = structuredClone(lessonsData.find((candidate) => candidate.id === "les-intro-01"));
    expect(lesson).toBeDefined();
    if (!lesson) return;
    lesson.sourceReference.sourceId = " SRC-G10-NADA ";
    expect(getRecordPublicationDecision(lesson)).toMatchObject({ isPublic: false });
    expect(validatePublicCollection("Lesson", [lesson])).toMatchObject({ isValid: false });
  });

  it("withholds Tala dispositions from unsafe registered evaluation contexts", () => {
    const unsafe = createPublicationEvaluationContext({ lessons: undefined });
    expect(unsafe.safe).toBe(false);
    expect(getTalaFieldDisposition("tala-khemta", unsafe)).toBeUndefined();
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

  it("returns structured Tala disposition errors for malformed bol rows", () => {
    const malformed = structuredClone(musicalCoreFieldDispositions) as unknown as Record<string, unknown>;
    const entries = malformed.talas as Array<Record<string, unknown>>;
    const khemta = entries.find((entry) => entry.talaId === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    const bols = khemta.bols as unknown[];
    bols[0] = null;
    expect(() => validateMusicalCoreFieldDispositions(talasData, malformed)).not.toThrow();
    const result = validateMusicalCoreFieldDispositions(talasData, malformed);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "bols[0]")).toBe(true);
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
    const dependent = structuredClone(lessonsData.find((lesson) => lesson.id === "les-intro-01")) as unknown as Record<string, unknown>;
    dependent.selectedRagaId = "raga-bhairav";
    expect(getRecordPublicationDecision(dependent)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["dependent-entity-unavailable"]),
    });
  });

  it("quarantines recognized dependencies that do not resolve", () => {
    const dependent = structuredClone(lessonsData.find((lesson) => lesson.id === "les-intro-01")) as unknown as Record<string, unknown>;
    (dependent.listenActivity as Record<string, unknown>).talaId = "tala-does-not-exist";
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
    const knownQuiz = structuredClone(quizzesData.find((quiz) => quiz.id === "quiz-les-intro-01")) as unknown as Record<string, unknown>;
    delete (knownQuiz.questions as Array<Record<string, unknown>>)[0].sourceReference;
    const decision = getRecordPublicationDecision(knownQuiz);
    expect(decision).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["nested-question-unpublishable", "malformed-record"]),
    });
    expect(decision.nestedDispositions.find((item) => item.path === "questions[0]")?.reasonCodes)
      .toContain("missing-source-reference");
  });

  it("returns detached source grade arrays", () => {
    const firstRead = repository.getSources();
    expect(firstRead.length).toBeGreaterThan(0);
    const originalGrades = [...firstRead[0].grades];
    firstRead[0].grades.push("12-13");
    expect(repository.getSourceById(firstRead[0].id)?.grades).toEqual(originalGrades);
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
