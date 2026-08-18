import { describe, it, expect } from "vitest";
import { validateCatalogIdentityContracts, validateContent, validatePublicCollection } from "@/lib/validation/content-validator";
import { repository } from "@/lib/data/repository";
import talasData from "@/data/talas.json";
import quizzesData from "@/data/quizzes.json";
import type { Raga, Tala } from "@/types/content";

describe("Content Validation Suite", () => {
  const lessons = repository.getLessons();
  const ragas = repository.getRagas();
  const publicTalas = repository.getTalas();
  const talas = talasData as unknown as Tala[];
  const instruments = repository.getInstruments();
  const culturalTraditions = repository.getCulturalTraditions();
  const theatreTraditions = repository.getTheatreTraditions();

  it("validates every public input while reporting contained raw-catalog contract debt", () => {
    const report = validateContent(
      lessons,
      ragas,
      publicTalas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );

    const errors = report.issues.filter((i) => i.severity === "error");
    const publicIds = new Set([
      ...lessons,
      ...ragas,
      ...publicTalas,
      ...instruments,
      ...culturalTraditions,
      ...theatreTraditions,
    ].map((record) => record.id));
    expect(errors.some((issue) => publicIds.has(issue.entityId))).toBe(false);
    expect(new Set(errors.map((issue) => issue.entityType))).toEqual(
      new Set(["Glossary", "LearningPath", "Quiz"])
    );
    expect(errors).toHaveLength(40);
    expect(report.isValid).toBe(false);
  });

  it("should ensure every lesson has a standard Sinhala learning goal starting with 'මෙම පාඩම අවසානයේ ඔබට'", () => {
    lessons.forEach((l) => {
      expect(l.learningGoal_si.startsWith("මෙම පාඩම අවසානයේ ඔබට")).toBe(true);
    });
  });

  it("should ensure all ragas have valid arohana and avarohana swaras arrays", () => {
    ragas.forEach((r) => {
      expect(r.arohana_swaras.length).toBeGreaterThan(0);
      expect(r.avarohana_swaras.length).toBeGreaterThan(0);
    });
  });

  it("should ensure all talas have bols matching their matra count", () => {
    publicTalas.forEach((t) => {
      expect(t.bols.length).toBe(t.matras);
    });
  });

  it("rejects duplicate canonical IDs", () => {
    const duplicateRagas = [...ragas, { ...ragas[0] }] as Raga[];
    const report = validateContent(
      lessons,
      duplicateRagas,
      talas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.field === "id" && issue.message.includes("Duplicate"))).toBe(true);
  });

  it("rejects invalid tala structure and normalized alias collisions", () => {
    const invalidStructure = {
      ...talas[0],
      vibhagStructure: [2, 2],
    } as Tala;
    const aliasCollision = {
      ...talas[1],
      aliases_si: ["දාද්‍රා තාලය"],
    } as Tala;
    const report = validateContent(
      lessons,
      ragas,
      [invalidStructure, aliasCollision, ...talas.slice(2)],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.field === "vibhagStructure")).toBe(true);
    expect(report.issues.some((issue) => issue.field === "aliases_si" && issue.message.includes("collides"))).toBe(true);
  });

  it("rejects an in-range bol vibhagIndex that contradicts cumulative vibhag membership", () => {
    const invalidTala = structuredClone(talas[0]) as Tala;
    invalidTala.bols[2].vibhagIndex = 1;
    const report = validateContent(
      lessons,
      ragas,
      [invalidTala, ...talas.slice(1)],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) =>
      issue.entityId === invalidTala.id &&
      issue.field === "bols" &&
      issue.message.includes("match the vibhag")
    )).toBe(true);
  });

  it.each(["", "   "])("rejects blank non-rest tabla bol %j", (blankBol) => {
    const invalidTala = structuredClone(talas[0]) as Tala;
    invalidTala.bols[0].bol_si = blankBol;
    const report = validateContent(
      lessons,
      ragas,
      [invalidTala, ...talas.slice(1)],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) =>
      issue.entityId === invalidTala.id && issue.field === "bols.bol_si"
    )).toBe(true);
  });

  it("rejects malformed boolean bol flags", () => {
    const invalidTala = structuredClone(talas[0]) as Tala;
    (invalidTala.bols[1] as unknown as { isTali: unknown }).isTali = "false";
    const report = validateContent(
      lessons,
      ragas,
      [invalidTala as Tala, ...talas.slice(1)],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.entityId === invalidTala.id && issue.field === "bols")).toBe(true);
  });

  it("returns validation issues instead of throwing on malformed tala fields", () => {
    const malformedTala = {
      ...structuredClone(talas[0]),
      name_si: null,
      aliases_si: null,
      vibhagStructure: null,
      bols: [null],
    } as unknown as Tala;

    expect(() => validateContent(
      lessons,
      ragas,
      [malformedTala, ...talas.slice(1)],
      instruments,
      culturalTraditions,
      theatreTraditions
    )).not.toThrow();
    const report = validateContent(
      lessons,
      ragas,
      [malformedTala, ...talas.slice(1)],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.isValid).toBe(false);
    expect(report.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      "name_si",
      "vibhagStructure",
      "bols",
    ]));
  });

  it("rejects unknown raga swara tokens", () => {
    const invalidRaga = {
      ...ragas[0],
      arohana_swaras: [...ragas[0].arohana_swaras, "X"],
    } as Raga;
    const report = validateContent(
      lessons,
      [invalidRaga, ...ragas.slice(1)],
      talas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.message.includes("Unknown swara token"))).toBe(true);
  });

  it("rejects duplicate catalog IDs and search-equivalent glossary or terminology identities", () => {
    const issues = validateCatalogIdentityContracts(
      [{ type: "Glossary", records: [{ id: "term-a" }, { id: "term-a" }] }],
      [
        { id: "term-a", term_si: "නාදය", term_en: "Sound", transliteration: "Nadaya" },
        { id: "term-b", term_si: "ණාදය", term_en: "Tone", transliteration: "Nadaya" },
      ],
      [
        { id: "term-a", term_si: "ස්වරය", term_en: "Swara", transliteration: "Svaraya", knownVariants: ["ස්වර"] },
        { id: "term-b", term_si: "ලය", term_en: "Rhythm", transliteration: "Laya", knownVariants: ["ස්වර"] },
      ]
    );
    expect(issues.map((issue) => `${issue.entityType}.${issue.field}`)).toEqual(expect.arrayContaining([
      "Glossary.id",
      "Glossary.term_si",
      "Terminology.knownVariants",
    ]));
  });

  it("returns structural issues for null and primitive catalog entries without throwing", () => {
    const malformedCatalogs = [
      { type: "Raga", records: [null, "text", 42] },
      { type: "Tala", records: [null, false] },
    ];
    expect(() => validateCatalogIdentityContracts(malformedCatalogs, [null, "term"] as unknown[], [42] as unknown[])).not.toThrow();
    const issues = validateCatalogIdentityContracts(malformedCatalogs, [null, "term"] as unknown[], [42] as unknown[]);
    expect(issues.some((issue) => issue.field === "record")).toBe(true);
    expect(issues.some((issue) => issue.entityType === "Glossary")).toBe(true);
    expect(issues.some((issue) => issue.entityType === "Terminology")).toBe(true);
  });

  it("fails hostile and sparse outer identity collections closed without throwing", () => {
    const sparse: unknown[] = [];
    sparse.length = 3;
    const throwing = new Proxy([], {
      ownKeys() {
        throw new Error("hostile catalog");
      },
    });
    for (const candidate of [sparse, throwing, null, 42]) {
      expect(() => validateCatalogIdentityContracts(candidate, candidate, candidate)).not.toThrow();
      expect(validateCatalogIdentityContracts(candidate, candidate, candidate).length).toBeGreaterThan(0);
    }
  });

  it("rejects exact and whitespace-normalized duplicate IDs in public collections", () => {
    const first = structuredClone(ragas[0]) as unknown as Record<string, unknown>;
    const exact = structuredClone(ragas[0]) as unknown as Record<string, unknown>;
    const spaced = structuredClone(ragas[0]) as unknown as Record<string, unknown>;
    spaced.id = ` ${String(first.id)} `;
    expect(validatePublicCollection("Raga", [first, exact])).toMatchObject({ isValid: false });
    expect(validatePublicCollection("Raga", [first, spaced])).toMatchObject({ isValid: false });
  });

  it("rejects standalone question collection labels because questions are nested quiz/exam records", () => {
    const question = repository.getQuizzes()[0]?.questions[0];
    expect(question).toBeDefined();
    if (!question) return;

    for (const label of ["Question", "questions"]) {
      const report = validatePublicCollection(label, [question]);
      expect(report.isValid).toBe(false);
      expect(report.issues).toEqual([
        expect.objectContaining({
          entityType: label,
          field: "entityType",
          message: expect.stringContaining("unsupported"),
        }),
      ]);
    }
  });

  it("rejects non-array top-level catalogs instead of treating them as empty", () => {
    const report = validateContent(null, {}, "ragas", false, 42, undefined);
    expect(report.isValid).toBe(false);
    expect(report.issues.filter((issue) => issue.field === "catalog")).toHaveLength(6);
  });

  it("does not throw when a published lesson has missing review metadata", () => {
    const malformed = structuredClone(lessons[0]) as unknown as Record<string, unknown>;
    delete malformed.reviewMetadata;
    malformed.published = true;
    expect(() => validateContent(
      [malformed],
      ragas,
      publicTalas,
      instruments,
      culturalTraditions,
      theatreTraditions
    )).not.toThrow();
    const report = validateContent(
      [malformed],
      ragas,
      publicTalas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.isValid).toBe(false);
    expect(report.issues.some((issue) => issue.field === "reviewMetadata.status")).toBe(true);
  });

  it("rejects canonical-as-variant and duplicate variants within one terminology record", () => {
    const issues = validateCatalogIdentityContracts([], [], [{
      id: "term-one",
      term_si: "ස්වරය",
      term_en: "Swara",
      transliteration: "Svaraya",
      knownVariants: ["ස්වරය", "ස්වර", "ස්වර"],
    }]);
    expect(issues.filter((issue) => issue.field === "knownVariants").length).toBeGreaterThanOrEqual(2);
  });

  it("rejects empty raga descents and invalid sample-phrase swaras", () => {
    const emptyDescent = structuredClone(ragas[0]) as Raga;
    emptyDescent.avarohana_swaras = [];
    const invalidPhrase = structuredClone(ragas[1]) as Raga;
    invalidPhrase.samplePhrases = [{ name_si: "mutation", swaras: ["INVALID"] }];
    const report = validateContent(
      lessons,
      [emptyDescent, invalidPhrase, ...ragas.slice(2)],
      publicTalas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.entityId === emptyDescent.id && issue.field === "avarohana_swaras")).toBe(true);
    expect(report.issues.some((issue) => issue.entityId === invalidPhrase.id && issue.field === "samplePhrases.swaras")).toBe(true);
  });

  it("rejects canonical-as-alias, same-record duplicate, and cross-record tala identities", () => {
    const canonicalAlias = structuredClone(talas[0]) as Tala;
    canonicalAlias.aliases_si = [canonicalAlias.name_si];
    const repeatedAlias = structuredClone(talas[1]) as Tala;
    repeatedAlias.aliases_si = ["කෙහර්වා", "කෙහර්වා"];
    const crossRecord = structuredClone(talas[2]) as Tala;
    crossRecord.aliases_si = [talas[0].name_si];
    const report = validateContent(
      lessons,
      ragas,
      [canonicalAlias, repeatedAlias, crossRecord, ...talas.slice(3)],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    const aliasIssues = report.issues.filter((issue) => issue.field === "aliases_si");
    expect(aliasIssues.some((issue) => issue.message.toLowerCase().includes("canonical"))).toBe(true);
    expect(aliasIssues.some((issue) => issue.message.toLowerCase().includes("duplicate"))).toBe(true);
    expect(aliasIssues.some((issue) => issue.message.toLowerCase().includes("collides"))).toBe(true);
  });

  it("requires the runtime tala alias and quiz parent contracts", () => {
    const missingAliases = structuredClone(talas[0]) as unknown as Record<string, unknown>;
    delete missingAliases.aliases_si;
    const report = validateContent(
      lessons,
      ragas,
      [missingAliases, ...talas.slice(1)] as unknown as Tala[],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.entityId === talas[0].id && issue.field === "aliases_si")).toBe(true);
  });
});

describe("public Quiz aggregate evidence", () => {
  const PUBLIC_QUIZ_ID = "quiz-les-intro-01";

  function rawQuiz(): Record<string, unknown> {
    const quiz = (quizzesData as unknown as Record<string, unknown>[])
      .find((candidate) => candidate.id === PUBLIC_QUIZ_ID);
    if (!quiz) throw new Error(`Missing quiz fixture: ${PUBLIC_QUIZ_ID}`);
    return structuredClone(quiz);
  }

  it("accepts a valid aggregate Quiz that carries no direct source reference", () => {
    const quiz = rawQuiz();
    // A Quiz container never declares its own sourceReference; the aggregate
    // chain is the public parent lesson plus every directly-sourced question.
    expect(quiz.sourceReference).toBeUndefined();
    expect(repository.getQuizById(PUBLIC_QUIZ_ID)?.id).toBe(PUBLIC_QUIZ_ID);

    // Requiring decision.sourceEvidence.supportable failed this valid Quiz.
    expect(validatePublicCollection("Quiz", [quiz])).toEqual({ isValid: true, issues: [] });
    expect(validatePublicCollection("quizzes", [quiz])).toEqual({ isValid: true, issues: [] });
  });

  it("rejects a Quiz whose parent lesson is not public", () => {
    const quiz = rawQuiz();
    quiz.lessonId = "les-raga-bhairav";
    const result = validatePublicCollection("Quiz", [quiz]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "lessonId")).toBe(true);
  });

  it("rejects a Quiz whose parent lesson is missing entirely", () => {
    const quiz = rawQuiz();
    quiz.lessonId = "les-does-not-exist";
    const result = validatePublicCollection("Quiz", [quiz]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "lessonId")).toBe(true);
  });

  it("rejects a Quiz with an empty question set", () => {
    const quiz = rawQuiz();
    quiz.questions = [];
    const result = validatePublicCollection("Quiz", [quiz]);
    expect(result.isValid).toBe(false);
    // The record contract rejects an empty question set before the aggregate rule
    // runs. What must never happen is a spurious direct-evidence issue.
    expect(result.issues.some((issue) => issue.field === "record" || issue.field === "questions")).toBe(true);
    expect(result.issues.some((issue) => issue.field === "sourceReference")).toBe(false);
  });

  it("rejects a Quiz whose question set is malformed rather than an array", () => {
    const quiz = rawQuiz();
    quiz.questions = { length: 1 };
    const result = validatePublicCollection("Quiz", [quiz]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "questions" || issue.field === "record")).toBe(true);
  });

  it("rejects a Quiz question that lacks supportable direct page evidence", () => {
    const quiz = rawQuiz();
    const questions = quiz.questions as Record<string, unknown>[];
    questions[0] = {
      ...questions[0],
      sourceReference: {
        sourceId: "SRC-G10-NADA",
        pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 9999",
      },
    };
    const result = validatePublicCollection("Quiz", [quiz]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "questions[0].sourceReference")).toBe(true);
  });

  it("rejects a Quiz question that declares no explicit grade scope", () => {
    const quiz = rawQuiz();
    const questions = quiz.questions as Record<string, unknown>[];
    const withoutGrades = { ...questions[0] };
    delete withoutGrades.gradeBands;
    questions[0] = withoutGrades;
    const result = validatePublicCollection("Quiz", [quiz]);
    expect(result.isValid).toBe(false);
    // The nested question contract rejects a missing grade scope first; the
    // aggregate rule is the second line of defence, never a bypass.
    expect(result.issues.some((issue) =>
      issue.field === "record" || issue.field === "questions[0].gradeBands")).toBe(true);
    expect(result.issues.some((issue) => issue.field === "sourceReference")).toBe(false);
  });

  it("rejects a Quiz question whose type is not renderable", () => {
    const quiz = rawQuiz();
    const questions = quiz.questions as Record<string, unknown>[];
    questions[0] = { ...questions[0], type: "audio-id", audioNotes: ["S"] };
    const result = validatePublicCollection("Quiz", [quiz]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "record" || issue.field === "publication")).toBe(true);
  });
});
