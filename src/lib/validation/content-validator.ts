import { Lesson, Raga, Tala, Instrument, CulturalTradition, TheatreTradition } from "@/types/content";
import sourcesData from "@/data/sources.json";
import lessonsData from "@/data/lessons.json";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import instrumentsData from "@/data/instruments.json";
import culturalTraditionsData from "@/data/cultural-traditions.json";
import theatreTraditionsData from "@/data/theatre-traditions.json";
import glossaryData from "@/data/glossary.json";
import learningPathsData from "@/data/learning-paths.json";
import examPapersData from "@/data/exam-papers.json";
import quizzesData from "@/data/quizzes.json";
import sourceDocumentsData from "../../../data/source-documents.json";
import sourcePageQualityData from "../../../data/source-page-quality.json";
import reconciliationData from "../../../data/content-reconciliation.json";
import forensicLedgerData from "../../../data/forensic-ledger.json";
import coverageData from "../../../data/content-coverage.json";
import {
  getRecordPublicationDecision,
  UNKNOWN_PROVENANCE,
} from "@/lib/data/publication-policy";
import { repository } from "@/lib/data/repository";

export interface ValidationIssue {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface PublicationValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

type BaselineLedger = {
  inventory: {
    sourceDocuments: number;
    sourcePages: number;
    sourceDocumentReviewStatus: Record<string, number>;
    sourcePageQuality: Record<string, number>;
    rawContentRecords: Record<string, number>;
    rawCompletedReviewMetadata: Record<string, number>;
    rawGradeScope: {
      legacyReconciliationRecords: number;
      legacyReconciliationActions: Record<string, number>;
      legacyReconciliationPublishedRecords: number;
    };
  };
};

type CoverageSnapshot = {
  overview?: Record<string, number>;
  rawContentCounts?: Record<string, number>;
  sourcePageQuality?: Record<string, number | string>;
  sourceDocumentReviewStatus?: Record<string, number>;
  legacyReconciliationSnapshot?: {
    recordCount?: number;
    actionCounts?: Record<string, number>;
    recordsClaimingPublished?: number;
  };
  publicScope?: { publicCounts?: Record<string, number> };
};

const baselineLedger = forensicLedgerData as BaselineLedger;

function baselineIssue(
  entityType: string,
  entityId: string,
  field: string,
  message: string,
  severity: "error" | "warning" = "error"
): ValidationIssue {
  return { entityType, entityId, field, message, severity };
}

export function validateCoverageSnapshot(
  coverageInput: unknown
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const coverage = coverageInput as CoverageSnapshot;
  const expected = baselineLedger.inventory;

  if (coverage.overview?.totalIndexedSourcePages !== expected.sourcePages) {
    issues.push(baselineIssue("generated-doc", "content-coverage", "totalIndexedSourcePages", "Generated coverage pages do not agree with forensic-ledger.json."));
  }
  Object.entries(expected.rawContentRecords).forEach(([entityType, count]) => {
    if (coverage.rawContentCounts?.[entityType] !== count) {
      issues.push(baselineIssue("generated-doc", "content-coverage", `rawContentCounts.${entityType}`, "Generated raw-content count does not agree with forensic-ledger.json."));
    }
  });
  Object.entries(expected.sourcePageQuality).forEach(([qualityField, count]) => {
    if (coverage.sourcePageQuality?.[qualityField] !== count) {
      issues.push(baselineIssue("generated-doc", "content-coverage", `sourcePageQuality.${qualityField}`, "Generated source-quality count does not agree with forensic-ledger.json."));
    }
  });
  const expectedGradeABPercent = Number((((expected.sourcePageQuality.A + expected.sourcePageQuality.B) / expected.sourcePages) * 100).toFixed(1));
  if (coverage.sourcePageQuality?.abExtractionQualityPercent !== expectedGradeABPercent) {
    issues.push(baselineIssue("generated-doc", "content-coverage", "sourcePageQuality.abExtractionQualityPercent", "Generated A/B extraction percentage does not agree with forensic-ledger.json."));
  }
  Object.entries(expected.sourceDocumentReviewStatus).forEach(([status, count]) => {
    if (coverage.sourceDocumentReviewStatus?.[status] !== count) {
      issues.push(baselineIssue("generated-doc", "content-coverage", `sourceDocumentReviewStatus.${status}`, "Generated source-document review-status count does not agree with forensic-ledger.json."));
    }
  });
  if (coverage.legacyReconciliationSnapshot?.recordCount !== expected.rawGradeScope.legacyReconciliationRecords) {
    issues.push(baselineIssue("generated-doc", "content-coverage", "legacyReconciliationSnapshot.recordCount", "Generated reconciliation record count does not agree with forensic-ledger.json."));
  }
  Object.entries(expected.rawGradeScope.legacyReconciliationActions).forEach(([action, count]) => {
    if (coverage.legacyReconciliationSnapshot?.actionCounts?.[action] !== count) {
      issues.push(baselineIssue("generated-doc", "content-coverage", `legacyReconciliationSnapshot.actionCounts.${action}`, "Generated reconciliation action count does not agree with forensic-ledger.json."));
    }
  });
  if (coverage.legacyReconciliationSnapshot?.recordsClaimingPublished !== expected.rawGradeScope.legacyReconciliationPublishedRecords) {
    issues.push(baselineIssue("generated-doc", "content-coverage", "legacyReconciliationSnapshot.recordsClaimingPublished", "Generated reconciliation publication count does not agree with forensic-ledger.json."));
  }
  const publicationSummary = repository.getPublicationSummary();
  Object.entries(publicationSummary).forEach(([entityType, summary]) => {
    if (coverage.publicScope?.publicCounts?.[entityType] !== summary.public) {
      issues.push(baselineIssue("generated-doc", "content-coverage", `publicScope.publicCounts.${entityType}`, "Generated public count does not agree with the repository publication summary."));
    }
  });

  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

/**
 * Validate only what may cross the public boundary. Passing raw records to
 * this function intentionally produces errors for fake completed-review
 * metadata, unsupported grade scope, and missing page-level evidence.
 */
export function validatePublicCollection(
  entityType: string,
  records: unknown[]
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];

  records.forEach((record, index) => {
    const value = (record || {}) as Record<string, unknown>;
    const id = typeof value.id === "string" ? value.id : `${entityType}-${index}`;
    const decision = getRecordPublicationDecision(record);
    const gradeBands = decision.gradeBands;

    if (!decision.isPublic) {
      issues.push(
        baselineIssue(
          entityType,
          id,
          "publication",
          `Record is ${decision.state} and cannot be publicly discoverable (${decision.reasonCodes.join(", ") || "no eligibility reason"}).`
        )
      );
    }
    if (gradeBands.includes("12-13")) {
      issues.push(baselineIssue(entityType, id, "gradeBands", "Unsupported Grade 12-13 content crossed the public boundary."));
    }
    if (!decision.sourceEvidence.supportable) {
      issues.push(
        baselineIssue(
          entityType,
          id,
          "sourceReference",
          `Public claim lacks supportable page evidence: ${decision.sourceEvidence.reason}`
        )
      );
    }

    const reviewMetadata = value.reviewMetadata as Record<string, unknown> | undefined;
    if (reviewMetadata) {
      if (reviewMetadata.status === "Published") {
        issues.push(baselineIssue(entityType, id, "reviewMetadata.status", "A public record still claims a completed Published review."));
      }
      if (reviewMetadata.reviewer !== UNKNOWN_PROVENANCE) {
        issues.push(baselineIssue(entityType, id, "reviewMetadata.reviewer", "A public record exposes an unverified reviewer identity."));
      }
      if (reviewMetadata.reviewDate !== UNKNOWN_PROVENANCE || reviewMetadata.lastVerifiedDate !== UNKNOWN_PROVENANCE) {
        issues.push(baselineIssue(entityType, id, "reviewMetadata.reviewDate", "A public record exposes an unverified review date."));
      }
    }
  });

  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

export function validatePublicBoundary(
  collections: Record<string, unknown[]>
): PublicationValidationResult {
  const issues = Object.entries(collections).flatMap(([entityType, records]) =>
    validatePublicCollection(entityType, records).issues
  );
  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

/**
 * Recalculate the machine-readable inventory from canonical JSON artifacts.
 * This is deliberately separate from musical correctness: it detects stale
 * generated counts without pretending that readable OCR proves a claim.
 */
export function validateForensicInventory(): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const sourceDocuments = sourceDocumentsData as Array<{ pageCount: number; reviewStatus: string }>;
  const sourcePages = sourcePageQualityData as Array<{ confidence: string; hasSinhalaText: boolean }>;
  const rawCollections: Record<string, unknown[]> = {
    lessons: lessonsData,
    ragas: ragasData,
    talas: talasData,
    instruments: instrumentsData,
    culturalTraditions: culturalTraditionsData,
    theatreTraditions: theatreTraditionsData,
    glossary: glossaryData,
    learningPaths: learningPathsData,
    quizzes: quizzesData,
    exams: examPapersData,
  };
  const expected = baselineLedger.inventory;
  const reviewStatusCounts = sourceDocuments.reduce<Record<string, number>>((counts, document) => {
    counts[document.reviewStatus] = (counts[document.reviewStatus] || 0) + 1;
    return counts;
  }, {});
  const qualityCounts = sourcePages.reduce<Record<string, number>>((counts, page) => {
    counts[page.confidence] = (counts[page.confidence] || 0) + 1;
    return counts;
  }, {});
  const pagesContainingSinhalaText = sourcePages.filter((page) => page.hasSinhalaText).length;

  if (sourceDocuments.length !== expected.sourceDocuments) {
    issues.push(baselineIssue("inventory", "source-documents", "sourceDocuments", "Source document count drifted from forensic-ledger.json."));
  }
  if (sourceDocuments.reduce((sum, document) => sum + document.pageCount, 0) !== expected.sourcePages) {
    issues.push(baselineIssue("inventory", "source-documents", "sourcePages", "Source page count drifted from forensic-ledger.json."));
  }
  Object.entries(expected.sourceDocumentReviewStatus).forEach(([status, count]) => {
    if ((reviewStatusCounts[status] || 0) !== count) {
      issues.push(baselineIssue("inventory", "source-documents", status, "Source-document review status count drifted from forensic-ledger.json."));
    }
  });
  Object.entries(expected.sourcePageQuality).forEach(([quality, count]) => {
    if (["A", "B", "C", "D"].includes(quality) && (qualityCounts[quality] || 0) !== count) {
      issues.push(baselineIssue("inventory", "source-page-quality", quality, "Source-page quality count drifted from forensic-ledger.json."));
    }
  });
  if (expected.sourcePageQuality.pagesContainingSinhalaText !== pagesContainingSinhalaText) {
    issues.push(baselineIssue("inventory", "source-page-quality", "pagesContainingSinhalaText", "Sinhala-text page count drifted from forensic-ledger.json."));
  }
  if (expected.sourcePageQuality.pagesWithoutSinhalaText !== sourcePages.length - pagesContainingSinhalaText) {
    issues.push(baselineIssue("inventory", "source-page-quality", "pagesWithoutSinhalaText", "No-Sinhala-text page count drifted from forensic-ledger.json."));
  }
  Object.entries(expected.rawContentRecords).forEach(([entityType, count]) => {
    if ((rawCollections[entityType] || []).length !== count) {
      issues.push(baselineIssue("inventory", entityType, "rawCount", "Raw content count drifted from forensic-ledger.json."));
    }
  });

  const reviewRecords = Object.values(rawCollections).flat();
  const publishedRecords = reviewRecords.filter((record) => {
    const metadata = (record as Record<string, unknown>).reviewMetadata as Record<string, unknown> | undefined;
    return metadata?.status === "Published";
  });
  if (publishedRecords.length !== expected.rawCompletedReviewMetadata.recordsClaimingPublished) {
    issues.push(baselineIssue("inventory", "reviewMetadata", "Published", "Completed review metadata count drifted from forensic-ledger.json."));
  }

  const reconciliation = reconciliationData as Array<Record<string, unknown>>;
  const actionCounts = reconciliation.reduce<Record<string, number>>((counts, record) => {
    const action = typeof record.action === "string" ? record.action : "missing";
    counts[action] = (counts[action] || 0) + 1;
    return counts;
  }, {});
  if (reconciliation.length !== expected.rawGradeScope.legacyReconciliationRecords) {
    issues.push(baselineIssue("inventory", "content-reconciliation", "recordCount", "Reconciliation record count drifted from forensic-ledger.json."));
  }
  Object.entries(expected.rawGradeScope.legacyReconciliationActions).forEach(([action, count]) => {
    if ((actionCounts[action] || 0) !== count) {
      issues.push(baselineIssue("inventory", "content-reconciliation", action, "Reconciliation action count drifted from forensic-ledger.json."));
    }
  });

  issues.push(...validateCoverageSnapshot(coverageData).issues);

  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

export function validateContent(
  lessons: Lesson[],
  ragas: Raga[],
  talas: Tala[],
  instruments: Instrument[],
  culturalTraditions: CulturalTradition[],
  theatreTraditions: TheatreTradition[]
): { isValid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const validSourceIds = new Set(sourcesData.map((s) => s.id));

  // Validate Lessons
  lessons.forEach((l) => {
    if (!l.title_si || !l.title_si.trim()) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "title_si",
        message: "Title in Sinhala is missing or empty",
        severity: "error",
      });
    }

    if (!l.learningGoal_si || !l.learningGoal_si.startsWith("මෙම පාඩම අවසානයේ ඔබට")) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "learningGoal_si",
        message: "Learning goal must start with 'මෙම පාඩම අවසානයේ ඔබට...'",
        severity: "error",
      });
    }

    if (!l.sourceReference || !l.sourceReference.sourceId) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "sourceReference",
        message: "Source reference is missing",
        severity: "error",
      });
    } else if (!validSourceIds.has(l.sourceReference.sourceId)) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "sourceReference.sourceId",
        message: `Referenced sourceId '${l.sourceReference.sourceId}' does not exist in sources.json`,
        severity: "error",
      });
    }

    if (!l.reviewMetadata || !l.reviewMetadata.reviewer) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "reviewMetadata.reviewer",
        message: "Reviewer name is required",
        severity: "error",
      });
    }

    if (l.published && l.reviewMetadata.status !== "Published") {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "published",
        message: "Published lesson must have 'Published' status in reviewMetadata",
        severity: "error",
      });
    }
  });

  // Validate Ragas
  ragas.forEach((r) => {
    if (!r.arohana_swaras || r.arohana_swaras.length === 0) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "arohana_swaras",
        message: "Raga must have non-empty arohana_swaras array",
        severity: "error",
      });
    }
    if (!validSourceIds.has(r.sourceReference.sourceId)) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "sourceReference.sourceId",
        message: `Raga sourceId '${r.sourceReference.sourceId}' is invalid`,
        severity: "error",
      });
    }
  });

  // Validate Talas
  talas.forEach((t) => {
    if (t.matras <= 0 || !t.bols || t.bols.length !== t.matras) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: `Tala bols array length (${t.bols?.length}) does not match matra count (${t.matras})`,
        severity: "error",
      });
    }
  });

  const errors = issues.filter((i) => i.severity === "error");
  return {
    isValid: errors.length === 0,
    issues,
  };
}
