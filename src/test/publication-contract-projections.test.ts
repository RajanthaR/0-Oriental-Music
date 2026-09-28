import { describe, expect, it } from "vitest";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import quizzesData from "@/data/quizzes.json";
import examPapersData from "@/data/exam-papers.json";
import lessonsData from "@/data/lessons.json";
import glossaryData from "@/data/glossary.json";
import { repository } from "@/lib/data/repository";
import {
  DEPENDENCY_FIELD_RULES,
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  getPublicationDecision,
  getRecordPublicationDecision,
  sanitizePublicRecord,
} from "@/lib/data/publication-policy";
import { validatePublicCollection } from "@/lib/validation/content-validator";
import { MAX_GRAPH_NODES } from "@/lib/validation/content-contracts";

describe("dependency, grade, and contract containment", () => {
  it("declares the complete blocking and nonblocking dependency matrix", () => {
    expect(Object.fromEntries(DEPENDENCY_FIELD_RULES)).toEqual({
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

  it.each(Array.from(DEPENDENCY_FIELD_RULES.entries()))(
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

  it("deep-freezes the dependency matrix so policy cannot be changed at runtime", () => {
    for (const rule of Array.from(DEPENDENCY_FIELD_RULES.values())) expect(Object.isFrozen(rule)).toBe(true);
    expect(() => {
      (DEPENDENCY_FIELD_RULES.get("prerequisites") as { blocking: boolean }).blocking = false;
    }).toThrow();
    expect(DEPENDENCY_FIELD_RULES.get("prerequisites")?.blocking).toBe(true);
  });

  it("rejects padded source IDs consistently across publication and validation", () => {
    const lesson = structuredClone(lessonsData.find((candidate) => candidate.id === "les-intro-01"));
    expect(lesson).toBeDefined();
    if (!lesson) return;
    lesson.sourceReference.sourceId = " SRC-G10-NADA ";
    expect(getRecordPublicationDecision(lesson)).toMatchObject({ isPublic: false });
    expect(validatePublicCollection("Lesson", [lesson])).toMatchObject({ isValid: false });
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
      reasonCodes: expect.arrayContaining(["unsafe-container"]),
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

  it("downgrades a public decision when its bounded projection cannot be produced", () => {
    const base = structuredClone(lessonsData.find((lesson) => lesson.id === "les-intro-01")) as
      | Record<string, unknown>
      | undefined;
    expect(base).toBeDefined();
    if (!base) return;
    const shared = {
      ...(base.sourceReference as Record<string, unknown>),
      status: "Published",
      reviewer: "SME",
      reviewDate: "2026-08-17",
      lastVerifiedDate: "2026-08-17",
      changeNotes: "Projection parity regression",
      license: "Curriculum Canonical",
      reuseStatus: "Curriculum Canonical",
      heading_si: "සංකල්පය",
      content_si: "සංකල්ප අන්තර්ගතය",
      question_si: "ප්‍රශ්නය",
      explanation_si: "පැහැදිලි කිරීම",
      options_si: ["10-11"],
      correctIndex: 0,
      title_si: "පුහුණු ක්‍රියාකාරකම",
      instruction_si: "පුහුණු වන්න",
      interactiveTool: "ear-training",
    } as Record<string, unknown>;
    const secondShared = {
      ...shared,
      term_si: "පදය",
      meaning_si: "අර්ථය",
      rowLabel_si: "පේළිය",
      notes: ["S"],
      type: "swara-demo",
    } as Record<string, unknown>;
    shared.keyTerms = [secondShared];
    shared.notationTable = [secondShared];
    const sections: Record<string, unknown>[] = [shared, secondShared];
    for (let index = 2; index < MAX_GRAPH_NODES - 9; index += 1) {
      sections.push({ heading_si: `කොටස ${index}`, content_si: "අන්තර්ගතය" });
    }
    const candidate = {
      ...base,
      id: "les-projection-parity",
      slug: "les-projection-parity",
      gradeBands: shared.options_si,
      prerequisites: [],
      competencyIds: shared.options_si,
      recap_si: shared.options_si,
      contentSections: sections,
      diagnosticQuestion: shared,
      listenActivity: secondShared,
      performActivity: secondShared,
      guidedPractice: shared,
      independentPractice: shared,
      sourceReference: { ...(base.sourceReference as Record<string, unknown>) },
      reviewMetadata: secondShared,
      published: true,
    };
    const context = createPublicationEvaluationContext({ lessons: [candidate] });
    const evaluation = evaluatePublicationBatch([candidate], context);
    expect(evaluation.isValid).toBe(true);
    expect(evaluation.decisions[0]).toMatchObject({
      state: "needs-review",
      isPublic: false,
      reasonCodes: expect.arrayContaining(["evaluation-failed"]),
    });
    expect(evaluation.decisions[0]?.publicProjection).toBeUndefined();
  });
});
