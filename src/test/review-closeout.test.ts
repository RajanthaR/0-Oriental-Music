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

describe("Phase 2 final contract closeout", () => {
  it("records the acceptance-hardening scope without rewriting blocked review history", () => {
    const agents = readFileSync(resolve(process.cwd(), "AGENTS.md"), "utf8");
    const closeout = readFileSync(
      resolve(process.cwd(), "docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md"),
      "utf8",
    );
    const ledger = JSON.parse(
      readFileSync(resolve(process.cwd(), "data/forensic-ledger.json"), "utf8"),
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
    expect(acceptance.validatedFindingIds).toHaveLength(20);
  });

  it("resolves every acceptance-hardening line-qualified anchor", () => {
    const closeout = readFileSync(
      resolve(process.cwd(), "docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md"),
      "utf8",
    );
    const section = closeout.split("## Acceptance-hardening findings input")[1]?.split(/\n## /)[0];
    expect(section).toBeDefined();
    const anchors = Array.from(section.matchAll(/`((?:src|AGENTS\.md)[^`:\n]*|AGENTS\.md):(\d+)`/g));
    expect(anchors.length).toBeGreaterThanOrEqual(20);
    for (const [, relativePath, rawLine] of anchors) {
      const lines = readFileSync(resolve(process.cwd(), relativePath), "utf8").split(/\r?\n/);
      const line = Number(rawLine);
      expect(lines[line - 1], `${relativePath}:${line}`).toBeDefined();
      expect(lines[line - 1].trim(), `${relativePath}:${line}`).not.toBe("");
    }
  });

  it("recomputes publication summaries from current inputs without memoized identity", () => {
    const first = repository.getPublicationSummary();
    const second = repository.getPublicationSummary();
    expect(second).not.toBe(first);
    expect(second).toStrictEqual(first);

    const lesson = findRawRecord(rawLessons, "les-intro-01");
    const originalMetadata = structuredClone(lesson.reviewMetadata);
    const originalPublished = lesson.published;
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Needs Revision", false)).toBe(true);
      const afterMutation = repository.getPublicationSummary();
      expect(afterMutation).not.toBe(second);
      expect(afterMutation).toStrictEqual(second);
    } finally {
      lesson.reviewMetadata = originalMetadata;
      lesson.published = originalPublished;
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
    const lesson = findRawRecord(rawLessons, "les-intro-01");
    const originalMetadata = structuredClone(lesson.reviewMetadata);
    const originalPublished = lesson.published;
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", true)).toBe(false);
      expect(repository.updateLessonStatus("les-intro-01", "Published", "Release Agent", "publish")).toBe(false);
      expect(lesson.reviewMetadata).toEqual(originalMetadata);
      expect(lesson.published).toBe(originalPublished);

      delete lesson.reviewMetadata;
      expect(repository.updateLessonReviewStatus("les-intro-01", "Needs Revision", false)).toBe(true);
      expect((lesson.reviewMetadata as RawRecord).reviewer).toBe(UNKNOWN_PROVENANCE);
      expect((lesson.reviewMetadata as RawRecord).license).toBe(UNKNOWN_PROVENANCE);
    } finally {
      lesson.reviewMetadata = originalMetadata;
      lesson.published = originalPublished;
    }
  });

  it("rejects every CMS status/published mismatch without changing raw state", () => {
    const lesson = findRawRecord(rawLessons, "les-intro-01");
    const originalMetadata = structuredClone(lesson.reviewMetadata);
    const originalPublished = lesson.published;
    try {
      lesson.reviewMetadata = completeReviewMetadata();
      lesson.published = false;
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", false)).toBe(false);
      expect(repository.updateLessonReviewStatus("les-intro-01", "Rights & Source Verification", true)).toBe(false);
      expect(lesson.reviewMetadata).toEqual(completeReviewMetadata());
      expect(lesson.published).toBe(false);
    } finally {
      lesson.reviewMetadata = originalMetadata;
      lesson.published = originalPublished;
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
    const lesson = findRawRecord(rawLessons, "les-intro-01");
    const originalMetadata = structuredClone(lesson.reviewMetadata);
    const originalPublished = lesson.published;
    try {
      lesson.reviewMetadata = completeReviewMetadata();
      lesson.published = false;
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", true)).toBe(true);
      expect(lesson.published).toBe(true);
      expect((lesson.reviewMetadata as RawRecord).status).toBe("Published");
    } finally {
      lesson.reviewMetadata = originalMetadata;
      lesson.published = originalPublished;
    }
  });

  it("rejects complete-looking CMS metadata when the source/publication gate is not public", () => {
    const lesson = findRawRecord(rawLessons, "les-intro-01");
    const originalMetadata = structuredClone(lesson.reviewMetadata);
    const originalSourceReference = structuredClone(lesson.sourceReference);
    const originalPublished = lesson.published;
    try {
      lesson.reviewMetadata = completeReviewMetadata();
      lesson.sourceReference = {
        ...(originalSourceReference as RawRecord),
        pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 9999",
      };
      expect(repository.updateLessonStatus("les-intro-01", "Published", "Release Agent", "publish")).toBe(false);
      expect(lesson.published).toBe(originalPublished);
      expect((lesson.reviewMetadata as RawRecord).status).toBe("Rights & Source Verification");
    } finally {
      lesson.reviewMetadata = originalMetadata;
      lesson.sourceReference = originalSourceReference;
      lesson.published = originalPublished;
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
