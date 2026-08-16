import { describe, expect, it } from "vitest";
import lessons from "@/data/lessons.json";
import ragas from "@/data/ragas.json";
import talas from "@/data/talas.json";
import instruments from "@/data/instruments.json";
import culturalTraditions from "@/data/cultural-traditions.json";
import theatreTraditions from "@/data/theatre-traditions.json";
import glossary from "@/data/glossary.json";
import learningPaths from "@/data/learning-paths.json";
import quizzes from "@/data/quizzes.json";
import examPapers from "@/data/exam-papers.json";
import sources from "@/data/sources.json";
import {
  cloneBoundedRecord,
  inspectGraph,
  projectPublicRecord,
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";
import { getRecordPublicationDecision } from "@/lib/data/publication-policy";

describe("closed runtime content contracts", () => {
  it.each([
    ["lesson", lessons[0]],
    ["raga", ragas[0]],
    ["tala", talas[0]],
    ["instrument", instruments[0]],
    ["cultural-tradition", culturalTraditions[0]],
    ["theatre-tradition", theatreTraditions[0]],
    ["glossary", glossary[0]],
    ["learning-path", learningPaths[0]],
    ["quiz", quizzes[0]],
    ["exam-paper", examPapers[0]],
  ])("accepts the canonical %s record", (kind, record) => {
    expect(validateContentRecord(record, kind as never)).toMatchObject({ kind, isValid: true, issues: [] });
  });

  it.each([
    ["lesson", lessons[0]],
    ["raga", ragas[0]],
    ["tala", talas[0]],
    ["instrument", instruments[0]],
    ["cultural-tradition", culturalTraditions[0]],
    ["theatre-tradition", theatreTraditions[0]],
    ["glossary", glossary[0]],
    ["learning-path", learningPaths[0]],
    ["quiz", quizzes[0]],
    ["exam-paper", examPapers[0]],
    ["question", quizzes[0].questions[0]],
    ["source", sources[0]],
  ])("infers the canonical %s kind before field access", (kind, record) => {
    expect(validateContentRecord(record)).toMatchObject({ kind, isValid: true, issues: [] });
  });

  const malformedCases: Array<[
    string,
    ContentEntityKind,
    unknown,
    (record: Record<string, unknown>) => void,
  ]> = [
    ["lesson review metadata", "lesson", lessons[0], (record) => { delete record.reviewMetadata; }],
    ["lesson optional English title", "lesson", lessons[0], (record) => { record.title_en = 42; }],
    ["lesson nested section", "lesson", lessons[0], (record) => { record.contentSections = [null]; }],
    ["lesson practice Tala target", "lesson", lessons[0], (record) => { (record.guidedPractice as Record<string, unknown>).targetTalaId = 42; }],
    ["lesson difficulty", "lesson", lessons[0], (record) => { record.difficulty = "INVALID"; }],
    ["lesson strand", "lesson", lessons[0], (record) => { record.strandId = "strand-unknown"; }],
    ["raga characteristics", "raga", ragas[0], (record) => { delete record.characteristics_si; }],
    ["tala aliases", "tala", talas[0], (record) => { delete record.aliases_si; }],
    ["tala orphan context reference", "tala", talas[0], (record) => {
      delete record.context_si;
      record.contextSourceReference = { sourceId: "SRC-EPD-TB-G10", pageOrSection: "sg10_emus_chap1_mulikanga.pdf පිටුව 6" };
    }],
    ["instrument maintenance", "instrument", instruments[0], (record) => { delete record.maintenanceAndSafety_si; }],
    ["cultural instruments", "cultural-tradition", culturalTraditions[0], (record) => { delete record.instrumentsUsed_si; }],
    ["cultural verse", "cultural-tradition", culturalTraditions[0], (record) => { record.verseExamples_si = [null]; }],
    ["theatre personalities", "theatre-tradition", theatreTraditions[0], (record) => { delete record.keyPersonalities_si; }],
    ["theatre song", "theatre-tradition", theatreTraditions[0], (record) => { record.featuredSongs_si = [null]; }],
    ["glossary definition", "glossary", glossary[0], (record) => { delete record.definition_si; }],
    ["learning-path diagnostic", "learning-path", learningPaths[0], (record) => { delete record.diagnosticQuestion; }],
    ["quiz title", "quiz", quizzes[0], (record) => { delete record.title_si; }],
    ["quiz question difficulty", "quiz", quizzes[0], (record) => {
      ((record.questions as Array<Record<string, unknown>>)[0]).difficulty = "INVALID";
    }],
    ["exam instructions", "exam-paper", examPapers[0], (record) => { delete record.instructions_si; }],
    ["question strand", "question", quizzes[0].questions[0], (record) => { record.strandId = "strand-unknown"; }],
  ];

  it.each(malformedCases)("rejects a malformed %s contract", (_label, kind, canonical, mutate) => {
    const candidate = structuredClone(canonical) as Record<string, unknown>;
    mutate(candidate);
    expect(validateContentRecord(candidate, kind).isValid).toBe(false);
    if (kind !== "question") {
      expect(getRecordPublicationDecision(candidate)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["malformed-record"]),
      });
    }
  });

  it.each([
    ["lesson", lessons[0]],
    ["raga", ragas[0]],
    ["tala", talas[0]],
    ["instrument", instruments[0]],
    ["cultural-tradition", culturalTraditions[0]],
    ["theatre-tradition", theatreTraditions[0]],
    ["glossary", glossary[0]],
    ["learning-path", learningPaths[0]],
    ["quiz", quizzes[0]],
    ["exam-paper", examPapers[0]],
  ] as const)("projects every canonical %s field through an allowlist", (kind, canonical) => {
    const candidate = structuredClone(canonical) as Record<string, unknown>;
    candidate.untrustedExtra = "withheld";
    const projection = projectPublicRecord(candidate, kind) as Record<string, unknown>;
    expect(projection.untrustedExtra).toBeUndefined();
    for (const key of Object.keys(canonical)) expect(projection).toHaveProperty(key);
  });

  it("rejects missing metadata and invalid finite domains before publication", () => {
    const missingMetadata = structuredClone(lessons[0]) as Record<string, unknown>;
    delete missingMetadata.reviewMetadata;
    expect(validateContentRecord(missingMetadata, "lesson").isValid).toBe(false);
    expect(validateContentRecord(missingMetadata, "lesson").issues.map((issue) => issue.field)).toContain("reviewMetadata");

    const invalidDifficulty = structuredClone(learningPaths[0]) as Record<string, unknown>;
    invalidDifficulty.difficulty = "not-a-difficulty";
    expect(validateContentRecord(invalidDifficulty, "learning-path").isValid).toBe(false);

    const invalidNestedCheckpoint = structuredClone(learningPaths[0]) as Record<string, unknown>;
    (invalidNestedCheckpoint.steps as Array<Record<string, unknown>>)[0].checkpointType = "checkpoint";
    expect(validateContentRecord(invalidNestedCheckpoint, "learning-path").isValid).toBe(false);
  });

  it.each([
    ["grade band", "raga", ragas[0], (record: Record<string, unknown>) => { record.gradeBands = ["11"]; }],
    ["review status", "lesson", lessons[0], (record: Record<string, unknown>) => { (record.reviewMetadata as Record<string, unknown>).status = "INVALID"; }],
    ["reuse status", "lesson", lessons[0], (record: Record<string, unknown>) => { (record.reviewMetadata as Record<string, unknown>).reuseStatus = "INVALID"; }],
    ["audio activity type", "lesson", lessons[0], (record: Record<string, unknown>) => { (record.listenActivity as Record<string, unknown>).type = "INVALID"; }],
    ["practice tool", "lesson", lessons[0], (record: Record<string, unknown>) => { (record.guidedPractice as Record<string, unknown>).interactiveTool = "INVALID"; }],
    ["question type", "quiz", quizzes[0], (record: Record<string, unknown>) => { ((record.questions as Array<Record<string, unknown>>)[0]).type = "INVALID"; }],
    ["instrument category", "instrument", instruments[0], (record: Record<string, unknown>) => { record.category_si = "INVALID"; }],
    ["instrument origin", "instrument", instruments[0], (record: Record<string, unknown>) => { record.origin_si = "INVALID"; }],
    ["cultural category", "cultural-tradition", culturalTraditions[0], (record: Record<string, unknown>) => { record.category_si = "INVALID"; }],
    ["theatre type", "theatre-tradition", theatreTraditions[0], (record: Record<string, unknown>) => { record.type_si = "INVALID"; }],
    ["glossary category", "glossary", glossary[0], (record: Record<string, unknown>) => { record.category_si = "INVALID"; }],
  ] as const)("rejects an invalid finite-domain %s", (_label, kind, canonical, mutate) => {
    const candidate = structuredClone(canonical) as Record<string, unknown>;
    mutate(candidate);
    expect(validateContentRecord(candidate, kind)).toMatchObject({ isValid: false });
  });

  it("requires playable references and validates optional question fields when present", () => {
    const audioQuestion = structuredClone(quizzes[0].questions[0]) as Record<string, unknown>;
    audioQuestion.type = "audio-id";
    delete audioQuestion.options_si;
    delete audioQuestion.correctAnswerIds;
    expect(validateContentRecord(audioQuestion, "question").isValid).toBe(false);

    const notationQuestion = { ...audioQuestion, type: "notation-id" };
    expect(validateContentRecord(notationQuestion, "question").isValid).toBe(false);

    const malformedOptional = structuredClone(quizzes[0].questions[0]) as Record<string, unknown>;
    malformedOptional.audioTalaId = 42;
    expect(validateContentRecord(malformedOptional, "question").isValid).toBe(false);
  });

  it("validates source-catalog records without dereferencing malformed input", () => {
    expect(validateContentRecord(sources[0], "source")).toMatchObject({ isValid: true });
    const malformed = structuredClone(sources[0]) as Record<string, unknown>;
    malformed.grades = null;
    expect(() => validateContentRecord(malformed, "source")).not.toThrow();
    expect(validateContentRecord(malformed, "source").isValid).toBe(false);
  });

  it("rejects unknown or ambiguous kinds and never publishes them", () => {
    const unknown = { id: "synthetic", gradeBands: ["10-11"], sourceReference: { sourceId: "SRC-G10-NADA", pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටුව 2" } };
    expect(validateContentRecord(unknown).isValid).toBe(false);
    expect(getRecordPublicationDecision(unknown).reasonCodes).toEqual(expect.arrayContaining(["unknown-record-kind", "malformed-record"]));
    const ambiguous = {
      ...unknown,
      questions: [],
      lessonId: "lesson",
      passingScorePercent: 70,
      partA_MCQ: [],
      partB_Structured: [],
      timeLimitMinutes: 60,
    };
    expect(validateContentRecord(ambiguous).kind).toBeUndefined();

    const expectedKindBypass = {
      ...structuredClone(sources[0]),
      type: "mcq",
      prompt_si: "ambiguous",
      explanation_si: "ambiguous",
      strandId: "fundamentals",
    };
    expect(validateContentRecord(expectedKindBypass, "source")).toMatchObject({ isValid: false });

    const fullyShapedButUnregistered = structuredClone(ragas[0]);
    fullyShapedButUnregistered.id = "raga-unregistered";
    expect(getRecordPublicationDecision(fullyShapedButUnregistered)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["unknown-record-kind", "malformed-record"]),
    });
  });

  it("allowlists public fields and detaches the projection", () => {
    const candidate = structuredClone(ragas[0]) as Record<string, unknown>;
    candidate.secret = "must not cross the boundary";
    const projection = projectPublicRecord(candidate, "raga") as Record<string, unknown>;
    expect(projection.secret).toBeUndefined();
    expect(projection.reviewMetadata).toMatchObject({ status: "Needs Revision" });
    (projection.gradeBands as string[]).push("12-13");
    expect(candidate.gradeBands).toEqual(["10-11"]);
  });

  it("accepts shared DAGs but rejects cycles and graph budget overruns", () => {
    const shared = { value: "same" };
    expect(inspectGraph({ left: shared, right: shared }).safe).toBe(true);

    const direct: Record<string, unknown> = {};
    direct.self = direct;
    expect(inspectGraph(direct).reason).toBe("cycle");

    const first: Record<string, unknown> = {};
    const second: Record<string, unknown> = {};
    first.next = second;
    second.next = first;
    expect(inspectGraph(first).reason).toBe("cycle");

    const atDepthLimit: Record<string, unknown> = {};
    let cursor = atDepthLimit;
    for (let index = 0; index < 256; index += 1) {
      cursor.child = {};
      cursor = cursor.child as Record<string, unknown>;
    }
    expect(inspectGraph(atDepthLimit).safe).toBe(true);
    cursor.child = {};
    expect(inspectGraph(atDepthLimit).reason).toBe("depth-limit");

    const wide: Record<string, unknown> = {};
    // The root itself is one node, so 9,999 children reaches the 10,000-node budget.
    for (let index = 0; index < 9_999; index += 1) wide[`node-${index}`] = {};
    expect(inspectGraph(wide).safe).toBe(true);
    wide["node-over-limit"] = {};
    expect(inspectGraph(wide).reason).toBe("node-limit");
    expect(cloneBoundedRecord(direct)).toBeUndefined();

    const sparse: unknown[] = [];
    sparse.length = 1_000_000;
    expect(inspectGraph(sparse).safe).toBe(false);

    const overlong = Array.from({ length: 10_001 }, () => "S");
    expect(inspectGraph(overlong).reason).toBe("node-limit");

    const hostileRecord = structuredClone(ragas[0]) as Record<string, unknown>;
    hostileRecord.untrustedSparse = sparse;
    expect(() => getRecordPublicationDecision(hostileRecord)).not.toThrow();
    expect(getRecordPublicationDecision(hostileRecord)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record"]),
    });
  });
});
