import { describe, expect, it } from "vitest";
import coverageData from "../../data/content-coverage.json";
import ragasData from "@/data/ragas.json";
import { repository } from "@/lib/data/repository";
import {
  getRecordPublicationDecision,
  getSourceCorpusInventory,
  KNOWN_QUARANTINED_ENTITY_IDS,
  UNKNOWN_PROVENANCE,
} from "@/lib/data/publication-policy";
import {
  validateForensicInventory,
  validatePublicBoundary,
  validatePublicCollection,
} from "@/lib/validation/content-validator";

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
    ];

    publicCollections.forEach((record) => {
      expect(getRecordPublicationDecision(record).isPublic).toBe(true);
      expect(getRecordPublicationDecision(record).gradeBands).not.toContain("12-13");
      expect(KNOWN_QUARANTINED_ENTITY_IDS.has(record.id)).toBe(false);
    });
  });

  it("contains named records on direct lookup", () => {
    expect(repository.getLessonById("les-raga-bhairav")).toBeUndefined();
    expect(repository.getLessonById("les-tala-dadra")).toBeUndefined();
    expect(repository.getRagaById("raga-bhairav")).toBeUndefined();
    expect(repository.getRagaById("raga-bilawal")).toBeUndefined();
    expect(repository.getTalaById("tala-roopak")).toBeUndefined();
    expect(repository.getTalaById("tala-lawani")).toBeUndefined();
    expect(repository.getExamPaperById("exam-al-model-01")).toBeUndefined();
    expect(repository.getLearningPathById("path-exam-prep")).toBeUndefined();
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
    expect(getSourceCorpusInventory()).toMatchObject({ sourceDocuments: 30, sourcePages: 1023 });
  });

  it("detects drift in every mirrored forensic coverage section", () => {
    const mutableCoverage = coverageData as unknown as {
      rawContentCounts: Record<string, number>;
      sourceQualityMetrics: Record<string, number>;
      sourceDocumentStates: Record<string, number>;
      legacyReconciliationSnapshot: {
        actionCounts: Record<string, number>;
      };
      publicScope: { publicCounts: Record<string, number> };
    };
    const original = {
      rawRagas: mutableCoverage.rawContentCounts.ragas,
      gradeB: mutableCoverage.sourceQualityMetrics.gradeBPagesCount,
      reviewRequired: mutableCoverage.sourceDocumentStates["Review Required"],
      remapGrade: mutableCoverage.legacyReconciliationSnapshot.actionCounts.REMAP_GRADE,
      publicRagas: mutableCoverage.publicScope.publicCounts.ragas,
    };

    try {
      mutableCoverage.rawContentCounts.ragas += 1;
      mutableCoverage.sourceQualityMetrics.gradeBPagesCount += 1;
      mutableCoverage.sourceDocumentStates["Review Required"] += 1;
      mutableCoverage.legacyReconciliationSnapshot.actionCounts.REMAP_GRADE += 1;
      mutableCoverage.publicScope.publicCounts.ragas += 1;

      const result = validateForensicInventory();
      expect(result.isValid).toBe(false);
      expect(result.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
        "rawContentCounts.ragas",
        "sourceQualityMetrics.gradeBPagesCount",
        "sourceDocumentStates.Review Required",
        "legacyReconciliationSnapshot.actionCounts.REMAP_GRADE",
        "publicScope.publicCounts.ragas",
      ]));
    } finally {
      mutableCoverage.rawContentCounts.ragas = original.rawRagas;
      mutableCoverage.sourceQualityMetrics.gradeBPagesCount = original.gradeB;
      mutableCoverage.sourceDocumentStates["Review Required"] = original.reviewRequired;
      mutableCoverage.legacyReconciliationSnapshot.actionCounts.REMAP_GRADE = original.remapGrade;
      mutableCoverage.publicScope.publicCounts.ragas = original.publicRagas;
    }
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
});
