import { describe, expect, it } from "vitest";
import lessonsData from "@/data/lessons.json";
import ragasData from "@/data/ragas.json";
import quizzesData from "@/data/quizzes.json";
import { repository } from "@/lib/data/repository";
import { UNKNOWN_PROVENANCE } from "@/lib/data/publication-policy";
import type { Question, QuestionType, RenderableQuestionType } from "@/types/content";

type RawRecord = Record<string, unknown>;

const rawLessons = lessonsData as unknown as RawRecord[];
const rawRagas = ragasData as unknown as RawRecord[];
const rawQuizzes = quizzesData as unknown as RawRecord[];

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
  it("memoizes publication summaries and invalidates the memo after a CMS mutation", () => {
    const first = repository.getPublicationSummary();
    expect(repository.getPublicationSummary()).toBe(first);

    const lesson = findRawRecord(rawLessons, "les-intro-01");
    const originalMetadata = structuredClone(lesson.reviewMetadata);
    const originalPublished = lesson.published;
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Needs Revision", false)).toBe(true);
      expect(repository.getPublicationSummary()).not.toBe(first);
    } finally {
      lesson.reviewMetadata = originalMetadata;
      lesson.published = originalPublished;
    }
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
