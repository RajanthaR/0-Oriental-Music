import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import lessonsData from "@/data/lessons.json";
import ragasData from "@/data/ragas.json";
import quizzesData from "@/data/quizzes.json";
import sourcePageQualityData from "../../data/source-page-quality.json";
import { repository } from "@/lib/data/repository";
import { getRecordPublicationDecision, UNKNOWN_PROVENANCE } from "@/lib/data/publication-policy";
import { validateContentRecord } from "@/lib/validation/content-contracts";
import type { Question, QuestionType, RenderableQuestionType } from "@/types/content";

type RawRecord = Record<string, unknown>;

type SemanticReference = {
  path: string;
  symbol: string;
  line?: number;
};

type FindingTraceability = {
  reviewEvidence: string;
  test: SemanticReference;
  fix: SemanticReference;
  anchor: SemanticReference;
  disposition: string;
};

const ACCEPTANCE_HARDENING_FINDING_IDS = [
  ...Array.from({ length: 20 }, (_, index) => `C3-${String(index + 1).padStart(2, "0")}`),
  "P02-PITCH-OWNERSHIP-001",
  "P02-PROJECT-SCOPE-001",
] as const;

const CYCLE_2_FINDING_IDS = ["V15", "V23"] as const;
const FINAL_ACCEPTANCE_FOLLOWUP_IDS = [
  "FA-V01", "FA-V03", "FA-V04", "FA-V05", "FA-V06", "FA-V07", "FA-V08",
  "FA-V09", "FA-V10", "FA-V11", "FA-V14", "FA-V15", "FA-V16", "FA-V17",
] as const;

const rawLessons = lessonsData as unknown as RawRecord[];
const rawRagas = ragasData as unknown as RawRecord[];
const rawQuizzes = quizzesData as unknown as RawRecord[];
const rawPageQuality = sourcePageQualityData as Array<Record<string, unknown>>;

function findRawRecord(records: RawRecord[], id: string): RawRecord {
  const record = records.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Missing test fixture: ${id}`);
  return record;
}

function completeReviewMetadata(): RawRecord {
  return {
    status: "Rights & Source Verification",
    reviewer: "සනාථ කළ විෂය විශේෂඥ",
    reviewDate: "2026-08-15",
    lastVerifiedDate: "2026-08-15",
    changeNotes: "සම්පූර්ණ මූලාශ්‍ර හා ප්‍රකාශන සමාලෝචනය අවසන් කරන ලදී.",
    license: "Curriculum Canonical",
    reuseStatus: "Curriculum Canonical",
  };
}

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function expectSemanticReference(reference: SemanticReference, label: string): void {
  expect(reference.path, `${label} path`).toMatch(/^(?:src|docs|AGENTS\.md)/);
  expect(reference.symbol, `${label} symbol`).not.toBe("");
  const source = readWorkspaceFile(reference.path);
  expect(source, `${label} symbol ${reference.symbol}`).toContain(reference.symbol);
  if (reference.line !== undefined) {
    expect(reference.line, `${label} line`).toBeGreaterThan(0);
    const anchoredLine = source.split(/\r?\n/)[reference.line - 1];
    expect(anchoredLine, `${label} exact anchored line`).toContain(reference.symbol);
  }
}

function referenceLabel(reference: SemanticReference, includeLine: boolean): string {
  return includeLine && reference.line !== undefined
    ? `${reference.path}:${reference.line} (${reference.symbol})`
    : `${reference.path}#${reference.symbol}`;
}

function parseTraceabilityRows(markdown: string): Map<string, string[]> {
  const rows = new Map<string, string[]>();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (!match || !ACCEPTANCE_HARDENING_FINDING_IDS.includes(match[1] as typeof ACCEPTANCE_HARDENING_FINDING_IDS[number])) continue;
    const cells = line.split("|").slice(1, -1).map((cell) =>
      cell.trim().replace(/^`|`$/g, "").replace(/^\*\*|\*\*$/g, ""),
    );
    rows.set(match[1], cells.slice(1));
  }
  return rows;
}

describe("Phase 2 final contract closeout", () => {
  it("records the acceptance-hardening scope without rewriting blocked review history", () => {
    const agents = readWorkspaceFile("AGENTS.md");
    const closeout = readWorkspaceFile("docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md");
    const correctionLog = readWorkspaceFile("docs/FORENSIC_CORRECTION_LOG.md");
    const fieldMatrix = readWorkspaceFile("docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md");
    const ledger = JSON.parse(
      readWorkspaceFile("data/forensic-ledger.json"),
    ) as Record<string, unknown>;
    const acceptance = ledger.acceptanceHardeningInput as Record<string, unknown>;

    expect(agents).toContain("current verified public curriculum boundary is **Grades 6–11**");
    expect(agents).toContain("Grade 12–13 and A/L records may remain in raw forensic datasets");
    expect(agents).not.toContain("all 13 canonical sources");
    expect(closeout).toContain("20260816-191000-p02-final-contract-c3");
    expect(closeout).toContain("It is findings input only; it is not acceptance evidence");
    expect(closeout).toContain("C3-01");
    expect(closeout).toContain("C3-20");
    expect(closeout).toContain("P02-PITCH-OWNERSHIP-001");
    expect(acceptance.startingHead).toBe("4c8ab9755d20d4d23cc8081fe831f448b15f3a2e");
    expect(acceptance.status).toContain("not acceptance evidence");
    expect(acceptance.validatedFindingIds).toEqual(ACCEPTANCE_HARDENING_FINDING_IDS.slice(0, 20));
    expect(acceptance.authorizedAdditionalFindings).toEqual(ACCEPTANCE_HARDENING_FINDING_IDS.slice(20));

    const traceability = acceptance.traceability as Record<string, FindingTraceability>;
    expect(Object.keys(traceability)).toEqual([...ACCEPTANCE_HARDENING_FINDING_IDS]);
    const exactTable = closeout.split("### Exact scoped finding traceability")[1]?.split(/\n## /)[0];
    expect(exactTable).toBeDefined();
    const tableIds = Array.from(exactTable?.matchAll(/^\|\s*`([^`]+)`\s*\|/gm) ?? [], (match) => match[1]);
    expect(tableIds).toEqual([...ACCEPTANCE_HARDENING_FINDING_IDS]);
    const traceabilityRows = parseTraceabilityRows(exactTable ?? "");

    for (const findingId of ACCEPTANCE_HARDENING_FINDING_IDS) {
      const entry = traceability[findingId];
      expect(entry, `${findingId} traceability`).toBeDefined();
      expect(entry.reviewEvidence, `${findingId} review evidence`).toContain("20260816-191000-p02-final-contract-c3");
      expect(entry.disposition, `${findingId} disposition`).toBe("FIXED-PENDING-REREVIEW");
      expectSemanticReference(entry.test, `${findingId} test`);
      expectSemanticReference(entry.fix, `${findingId} fix`);
      expectSemanticReference(entry.anchor, `${findingId} anchor`);
      expect(closeout, `${findingId} closeout row`).toContain(`| \`${findingId}\` |`);
      expect(traceabilityRows.get(findingId), `${findingId} exact traceability cells`).toEqual([
        entry.reviewEvidence.split("/").pop(),
        referenceLabel(entry.test, true),
        referenceLabel(entry.fix, false),
        referenceLabel(entry.anchor, true),
        entry.disposition,
      ]);
    }

    expect(correctionLog).toContain("P02-FINAL-06");
    expect(fieldMatrix).toContain("P02-FINAL-06");

    const cycle2 = ledger.acceptanceHardeningCycle2 as Record<string, unknown>;
    expect(cycle2.selectedFindingIds).toEqual(CYCLE_2_FINDING_IDS);
    expect(cycle2.status).toContain("not acceptance evidence");
    expect(closeout).toContain("20260816-200203-p02-acceptance-c2-8f89f6b1");
    expect(correctionLog).toContain("V15");
    expect(fieldMatrix).toContain("V23");
  });

  it("resolves current musical-core anchors by symbol and heading, not by nonblank line counts", () => {
    const closeout = readWorkspaceFile("docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md");
    const correctionLog = readWorkspaceFile("docs/FORENSIC_CORRECTION_LOG.md");
    const fieldMatrix = readWorkspaceFile("docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md");
    const ledger = JSON.parse(readWorkspaceFile("data/forensic-ledger.json")) as Record<string, unknown>;
    const cycle2 = ledger.acceptanceHardeningCycle2 as Record<string, unknown>;
    const anchors = cycle2.currentSemanticAnchors as SemanticReference[];
    expect(anchors).toHaveLength(5);
    for (const anchor of anchors) expectSemanticReference(anchor, "cycle-2 current anchor");

    const documents = [closeout, correctionLog, fieldMatrix];
    for (const anchor of anchors) {
      for (const document of documents) {
        expect(document, `${anchor.path} ${anchor.symbol}`).toContain(anchor.path);
        expect(document, `${anchor.path} ${anchor.symbol}`).toContain(anchor.symbol);
      }
    }
  });

  it("traces every final-acceptance blocker by stable path and symbol", () => {
    const closeout = readWorkspaceFile("docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md");
    const correctionLog = readWorkspaceFile("docs/FORENSIC_CORRECTION_LOG.md");
    const fieldMatrix = readWorkspaceFile("docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md");
    const ledger = JSON.parse(readWorkspaceFile("data/forensic-ledger.json")) as Record<string, unknown>;
    const followup = ledger.finalAcceptanceFollowup as Record<string, unknown>;
    expect(followup.reviewRunId).toBe("20260817-054012-p02-final-acceptance-a17068ff");
    expect(followup.validatedFindingIds).toEqual([...FINAL_ACCEPTANCE_FOLLOWUP_IDS]);
    expect(followup.status).toContain("not acceptance evidence");
    expect(correctionLog).toContain("Phase 2 final-acceptance follow-up");
    expect(fieldMatrix).toContain("Final-acceptance follow-up boundary");

    const traceability = followup.semanticTraceability as Record<string, string>;
    expect(Object.keys(traceability)).toEqual([...FINAL_ACCEPTANCE_FOLLOWUP_IDS]);
    for (const id of FINAL_ACCEPTANCE_FOLLOWUP_IDS) {
      expect(closeout).toContain(`| \`${id}\` |`);
      const reference = traceability[id];
      const separator = reference.indexOf("#");
      expect(separator, `${id} separator`).toBeGreaterThan(0);
      const path = reference.slice(0, separator);
      const symbol = reference.slice(separator + 1);
      expect(readWorkspaceFile(path), `${id} ${symbol}`).toContain(symbol);
    }
  });

  it("recomputes publication summaries from current inputs without memoized identity", () => {
    const first = repository.getPublicationSummary();
    const second = repository.getPublicationSummary();
    expect(second).not.toBe(first);
    expect(second).toStrictEqual(first);

    const lessonIndex = rawLessons.findIndex((candidate) => candidate.id === "les-intro-01");
    expect(lessonIndex).toBeGreaterThanOrEqual(0);
    const originalLesson = rawLessons[lessonIndex];
    const originalSnapshot = structuredClone(originalLesson);
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Needs Revision", false)).toMatchObject({ ok: true });
      const afterMutation = repository.getPublicationSummary();
      expect(afterMutation).not.toBe(second);
      expect(afterMutation).toStrictEqual(second);
    } finally {
      rawLessons[lessonIndex] = originalLesson;
      Object.assign(originalLesson, originalSnapshot);
    }
  });

  it("recomputes public decisions when source-page evidence changes without a content mutation", () => {
    const page = rawPageQuality.find(
      (candidate) => candidate.documentSlug === "grade_11_raga_identification" && candidate.pageNumber === 1,
    );
    if (!page) throw new Error("Missing Grade 11 raga page-quality fixture");
    const originalConfidence = page.confidence;
    const before = repository.getPublicationSummary();
    try {
      page.confidence = "D";
      const after = repository.getPublicationSummary();
      expect(after).not.toBe(before);
      expect(after.ragas.public).toBeLessThan(before.ragas.public);
      expect(repository.getRagas()).toEqual([]);
    } finally {
      page.confidence = originalConfidence;
    }
    expect(repository.getPublicationSummary().ragas.public).toBe(before.ragas.public);
  });

  it("keeps raw forensic question variants separate from the renderable UI union", () => {
    const renderableTypes = [
      "mcq",
      "multi-select",
      "matching",
      "ordering",
      "true-false",
      "short-answer",
    ] as const satisfies readonly RenderableQuestionType[];
    const forensicOnlyType: QuestionType = "audio-id";
    expect(renderableTypes).toHaveLength(6);
    expect(renderableTypes).not.toContain(forensicOnlyType as RenderableQuestionType);

    // @ts-expect-error forensic-only audio questions are not renderable UI questions.
    const rejectedAudioType: Question["type"] = "audio-id";
    // @ts-expect-error forensic-only notation questions are not renderable UI questions.
    const rejectedNotationType: Question["type"] = "notation-id";
    expect([rejectedAudioType, rejectedNotationType]).toEqual(["audio-id", "notation-id"]);

    const firstQuestion = (rawQuizzes[0].questions as RawRecord[])[0] as unknown as Question;
    expect(renderableTypes).toContain(firstQuestion.type as RenderableQuestionType);
  });

  it("strips forged forensic fields from otherwise renderable public questions", () => {
    const quiz = structuredClone(findRawRecord(rawQuizzes, "quiz-les-intro-01"));
    const firstQuestion = (quiz.questions as RawRecord[])[0];
    firstQuestion.audioNotes = ["S", "R"];
    firstQuestion.diagramSvg = "<svg aria-label=\"forensic\" />";

    const decision = getRecordPublicationDecision(quiz);
    expect(decision.isPublic).toBe(true);
    const projectedQuestion = ((decision.publicProjection as RawRecord).questions as RawRecord[])[0];
    expect(projectedQuestion).not.toHaveProperty("audioNotes");
    expect(projectedQuestion).not.toHaveProperty("diagramSvg");

    firstQuestion.audioTalaId = "tala-roopak";
    expect(getRecordPublicationDecision(quiz)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["dependent-entity-unavailable"]),
    });
  });

  it("rejects both CMS publication entry points when raw metadata is synthesized or incomplete", () => {
    const mutableRepository = repository as unknown as { lessons: RawRecord[] };
    const originalCatalog = mutableRepository.lessons;
    mutableRepository.lessons = structuredClone(originalCatalog);
    const lessonIndex = mutableRepository.lessons.findIndex((candidate) => candidate.id === "les-intro-01");
    expect(lessonIndex).toBeGreaterThanOrEqual(0);
    const originalLesson = mutableRepository.lessons[lessonIndex];
    const originalSnapshot = structuredClone(originalLesson);
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", true)).toMatchObject({ ok: false });
      expect(repository.updateLessonStatus("les-intro-01", "Published", "Release Agent", "publish")).toMatchObject({ ok: false });
      expect(findRawRecord(mutableRepository.lessons, "les-intro-01").reviewMetadata).toEqual(originalSnapshot.reviewMetadata);
      expect(findRawRecord(mutableRepository.lessons, "les-intro-01").published).toBe(originalSnapshot.published);

      const malformedLesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      delete malformedLesson.reviewMetadata;
      expect(repository.updateLessonReviewStatus("les-intro-01", "Needs Revision", false)).toMatchObject({ ok: true });
      const repairedLesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      expect((repairedLesson.reviewMetadata as RawRecord).reviewer).toBe(UNKNOWN_PROVENANCE);
      expect((repairedLesson.reviewMetadata as RawRecord).license).toBe(UNKNOWN_PROVENANCE);
    } finally {
      mutableRepository.lessons = originalCatalog;
    }
  });

  it("rejects every CMS status/published mismatch without changing raw state", () => {
    const mutableRepository = repository as unknown as { lessons: RawRecord[] };
    const originalCatalog = mutableRepository.lessons;
    mutableRepository.lessons = structuredClone(originalCatalog);
    const lessonIndex = mutableRepository.lessons.findIndex((candidate) => candidate.id === "les-intro-01");
    expect(lessonIndex).toBeGreaterThanOrEqual(0);
    const originalLesson = mutableRepository.lessons[lessonIndex];
    const originalSnapshot = structuredClone(originalLesson);
    try {
      const lesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      lesson.reviewMetadata = completeReviewMetadata();
      lesson.published = false;
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", false)).toMatchObject({ ok: false });
      expect(repository.updateLessonReviewStatus("les-intro-01", "Rights & Source Verification", true)).toMatchObject({ ok: false });
      const unchangedLesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      expect(unchangedLesson.reviewMetadata).toEqual(completeReviewMetadata());
      expect(unchangedLesson.published).toBe(false);
    } finally {
      mutableRepository.lessons = originalCatalog;
    }
  });

  it.each([
    [true, "Needs Revision"],
    [false, "Published"],
  ])("rejects raw Lesson published=%s with review status %s", (published, status) => {
    const lesson = structuredClone(findRawRecord(rawLessons, "les-intro-01"));
    lesson.published = published;
    (lesson.reviewMetadata as RawRecord).status = status;
    expect(validateContentRecord(lesson, "lesson").isValid).toBe(false);
    expect(getRecordPublicationDecision(lesson)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record"]),
    });
  });

  it("allows publication only from complete raw review evidence and a public source decision", () => {
    const mutableRepository = repository as unknown as { lessons: RawRecord[] };
    const originalCatalog = mutableRepository.lessons;
    mutableRepository.lessons = structuredClone(originalCatalog);
    const lessonIndex = mutableRepository.lessons.findIndex((candidate) => candidate.id === "les-intro-01");
    expect(lessonIndex).toBeGreaterThanOrEqual(0);
    const originalLesson = mutableRepository.lessons[lessonIndex];
    const originalSnapshot = structuredClone(originalLesson);
    try {
      const lesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      lesson.reviewMetadata = completeReviewMetadata();
      lesson.published = false;
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", true)).toMatchObject({ ok: true });
      const publishedLesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      expect(publishedLesson).not.toBe(lesson);
      expect(publishedLesson.published).toBe(true);
      expect((publishedLesson.reviewMetadata as RawRecord).status).toBe("Published");
    } finally {
      mutableRepository.lessons = originalCatalog;
    }
  });

  it("rejects complete-looking CMS metadata when the source/publication gate is not public", () => {
    const mutableRepository = repository as unknown as { lessons: RawRecord[] };
    const originalCatalog = mutableRepository.lessons;
    mutableRepository.lessons = structuredClone(originalCatalog);
    const lessonIndex = mutableRepository.lessons.findIndex((candidate) => candidate.id === "les-intro-01");
    expect(lessonIndex).toBeGreaterThanOrEqual(0);
    const originalLesson = mutableRepository.lessons[lessonIndex];
    const originalSnapshot = structuredClone(originalLesson);
    try {
      const lesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      lesson.reviewMetadata = completeReviewMetadata();
      lesson.sourceReference = {
        ...(originalSnapshot.sourceReference as RawRecord),
        pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 9999",
      };
      expect(repository.updateLessonStatus("les-intro-01", "Published", "Release Agent", "publish")).toMatchObject({ ok: false });
      const unchangedLesson = findRawRecord(mutableRepository.lessons, "les-intro-01");
      expect(unchangedLesson.published).toBe(originalSnapshot.published);
      expect((unchangedLesson.reviewMetadata as RawRecord).status).toBe("Rights & Source Verification");
    } finally {
      mutableRepository.lessons = originalCatalog;
    }
  });

  it.each(["audio-id", "notation-id"])(
    "keeps unsupported %s questions out of public quiz lists, lookups, and summaries",
    (unsupportedType) => {
      const quiz = findRawRecord(rawQuizzes, "quiz-les-intro-01");
      const questions = quiz.questions as RawRecord[];
      const originalQuestion = questions[0];
      try {
        const unsupportedQuestion: RawRecord = { ...originalQuestion, type: unsupportedType };
        if (unsupportedType === "audio-id") unsupportedQuestion.audioNotes = ["S"];
        else unsupportedQuestion.diagramSvg = "<svg aria-label=\"notation\" />";
        questions[0] = unsupportedQuestion;

        expect(repository.getQuizById("quiz-les-intro-01")).toBeUndefined();
        expect(repository.getQuizzes().some((candidate) => candidate.id === "quiz-les-intro-01")).toBe(false);
        expect(repository.getPublicationSummary().quizzes.public).toBe(0);
      } finally {
        questions[0] = originalQuestion;
      }
    },
  );

  it("fails closed for duplicate top-level IDs across public list, lookup, and summary consumers", () => {
    const originalLength = rawRagas.length;
    const duplicate = structuredClone(rawRagas[0]);
    try {
      rawRagas.push(duplicate);
      expect(repository.getRagas()).toEqual([]);
      expect(repository.getRagaById(String(rawRagas[0].id))).toBeUndefined();
      expect(repository.getPublicationSummary().ragas).toMatchObject({
        raw: originalLength + 1,
        public: 0,
        needsReview: originalLength + 1,
      });
    } finally {
      rawRagas.length = originalLength;
    }
  });
});
