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
import terminologyData from "../../../data/terminology-si.json";
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
  issueSchema: {
    requiredIssueFields: string[];
    optionalIssueFields?: string[];
    requiredEvidenceFields: string[];
    optionalEvidenceFields?: string[];
    severityValues: string[];
    publicVisibilityValues: string[];
    confidenceValues: string[];
    evidenceBasisValues: string[];
    statusValues: string[];
  };
  inventory: {
    sourceDocuments: number;
    sourcePages: number;
    sourceDocumentReviewStatus: Record<string, number>;
    sourcePageQuality: Record<string, number>;
    rawContentCounts: Record<string, number>;
    rawCompletedReviewMetadata: Record<string, number>;
    rawGradeScope: {
      legacyReconciliationRecords: number;
      legacyReconciliationActions: Record<string, number>;
      legacyReconciliationPublishedRecords: number;
    };
  };
  issues?: Array<{
    id: string;
    severity: string;
    entityOrPath: string;
    currentClaim: string;
    evidence: Array<{
      path: string;
      locator: string;
      exactSection?: string;
      exactPageOrSection?: string;
      [key: string]: unknown;
    }>;
    disposition: string;
    publicVisibility: string;
    confidence: string;
    confidenceScope?: string;
    evidenceBasis: string;
    status: string;
    [key: string]: unknown;
  }>;
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
  Object.entries(expected.rawContentCounts).forEach(([entityType, count]) => {
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

    if (value.published === true) {
      issues.push(baselineIssue(entityType, id, "published", "A public record still claims published=true."));
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
  Object.entries(expected.rawContentCounts).forEach(([entityType, count]) => {
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
  const swaraMagaReviewerRecords = reviewRecords.filter((record) => {
    const metadata = (record as Record<string, unknown>).reviewMetadata as Record<string, unknown> | undefined;
    return typeof metadata?.reviewer === "string" && metadata.reviewer.includes("Swara Maga");
  });
  if (swaraMagaReviewerRecords.length !== expected.rawCompletedReviewMetadata.recordsUsingSwaraMagaReviewer) {
    issues.push(baselineIssue("inventory", "reviewMetadata", "reviewer", "Unverified Swara Maga reviewer count drifted from forensic-ledger.json."));
  }
  const recordsWith2026ReviewDates = reviewRecords.filter((record) => {
    const metadata = (record as Record<string, unknown>).reviewMetadata as Record<string, unknown> | undefined;
    return typeof metadata?.reviewDate === "string" && metadata.reviewDate.startsWith("2026-");
  });
  if (recordsWith2026ReviewDates.length !== expected.rawCompletedReviewMetadata.recordsWith2026ReviewDates) {
    issues.push(baselineIssue("inventory", "reviewMetadata", "reviewDate", "Unverified 2026 review-date count drifted from forensic-ledger.json."));
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
  issues.push(...validateForensicLedger(baselineLedger).issues);

  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

/**
 * Validate that every issue and evidence entry in forensic-ledger.json adheres
 * to the explicit schema contract, uses allowed enumerated values, and provides
 * complete path/locator fields.
 */
export function validateForensicLedger(
  ledgerInput: unknown = forensicLedgerData
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const ledger = (ledgerInput || {}) as Record<string, unknown>;
  const schema = (ledger.issueSchema || {}) as {
    requiredIssueFields?: string[];
    optionalIssueFields?: string[];
    requiredEvidenceFields?: string[];
    optionalEvidenceFields?: string[];
    severityValues?: string[];
    publicVisibilityValues?: string[];
    confidenceValues?: string[];
    evidenceBasisValues?: string[];
    statusValues?: string[];
  };

  const requiredIssueFields = schema.requiredIssueFields || [];
  const optionalIssueFields = schema.optionalIssueFields || [];
  const allowedIssueFields = new Set([...requiredIssueFields, ...optionalIssueFields]);

  const requiredEvidenceFields = schema.requiredEvidenceFields || [];
  const optionalEvidenceFields = schema.optionalEvidenceFields || [];
  const allowedEvidenceFields = new Set([...requiredEvidenceFields, ...optionalEvidenceFields]);

  const severitySet = new Set(schema.severityValues || []);
  const visibilitySet = new Set(schema.publicVisibilityValues || []);
  const confidenceSet = new Set(schema.confidenceValues || []);
  const basisSet = new Set(schema.evidenceBasisValues || []);
  const statusSet = new Set(schema.statusValues || []);

  if (!Array.isArray(schema.requiredIssueFields) || schema.requiredIssueFields.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issueSchema", "requiredIssueFields", "Schema must define requiredIssueFields."));
  }
  if (!Array.isArray(schema.requiredEvidenceFields) || schema.requiredEvidenceFields.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issueSchema", "requiredEvidenceFields", "Schema must define requiredEvidenceFields."));
  }
  if (!Array.isArray(schema.evidenceBasisValues) || schema.evidenceBasisValues.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issueSchema", "evidenceBasisValues", "Schema must define evidenceBasisValues."));
  }

  const ledgerIssues = Array.isArray(ledger.issues) ? (ledger.issues as Array<Record<string, unknown>>) : [];
  if (ledgerIssues.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issues", "length", "Forensic ledger must contain at least one issue entry."));
  }

  const seenIssueIds = new Set<string>();

  ledgerIssues.forEach((issue, index) => {
    if (!issue || typeof issue !== "object") {
      issues.push(baselineIssue("forensic-ledger", `issue-${index}`, "format", "Issue must be a non-null object."));
      return;
    }

    const issueId = typeof issue.id === "string" ? issue.id : `issue-${index}`;

    if (seenIssueIds.has(issueId)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "id", `Duplicate issue ID '${issueId}'.`));
    }
    seenIssueIds.add(issueId);

    requiredIssueFields.forEach((field) => {
      if (issue[field] === undefined || issue[field] === null || issue[field] === "") {
        issues.push(baselineIssue("forensic-ledger", issueId, field, `Issue is missing required field '${field}'.`));
      }
    });

    Object.keys(issue).forEach((field) => {
      if (!allowedIssueFields.has(field)) {
        issues.push(baselineIssue("forensic-ledger", issueId, field, `Unknown field '${field}' on issue object.`));
      }
    });

    if (issue.severity && !severitySet.has(issue.severity as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "severity", `Invalid severity '${issue.severity}'.`));
    }
    if (issue.publicVisibility && !visibilitySet.has(issue.publicVisibility as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "publicVisibility", `Invalid publicVisibility '${issue.publicVisibility}'.`));
    }
    if (issue.confidence && !confidenceSet.has(issue.confidence as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "confidence", `Invalid confidence '${issue.confidence}'.`));
    }
    if (issue.evidenceBasis && !basisSet.has(issue.evidenceBasis as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "evidenceBasis", `Invalid evidenceBasis '${issue.evidenceBasis}'.`));
    }
    if (issue.status && !statusSet.has(issue.status as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "status", `Invalid status '${issue.status}'.`));
    }

    if (!Array.isArray(issue.evidence) || issue.evidence.length === 0) {
      issues.push(baselineIssue("forensic-ledger", issueId, "evidence", "Issue must have a non-empty evidence array."));
    } else {
      (issue.evidence as Array<Record<string, unknown>>).forEach((entry, eIndex) => {
        if (!entry || typeof entry !== "object") {
          issues.push(baselineIssue("forensic-ledger", `${issueId}.evidence[${eIndex}]`, "format", "Evidence entry must be a non-null object."));
          return;
        }
        const entryLocator = typeof entry.locator === "string" ? entry.locator : `entry-${eIndex}`;
        requiredEvidenceFields.forEach((field) => {
          if (!entry[field] || typeof entry[field] !== "string" || !entry[field].trim()) {
            issues.push(baselineIssue("forensic-ledger", `${issueId}.evidence[${eIndex}]`, field, `Evidence entry '${entryLocator}' missing required field '${field}'.`));
          }
        });
        Object.keys(entry).forEach((field) => {
          if (!allowedEvidenceFields.has(field)) {
            issues.push(baselineIssue("forensic-ledger", `${issueId}.evidence[${eIndex}]`, field, `Unknown field '${field}' on evidence entry.`));
          }
        });
      });
    }
  });

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
  const allEntities = [
    ...lessons.map((item) => ({ type: "Lesson", item })),
    ...ragas.map((item) => ({ type: "Raga", item })),
    ...talas.map((item) => ({ type: "Tala", item })),
    ...instruments.map((item) => ({ type: "Instrument", item })),
    ...culturalTraditions.map((item) => ({ type: "CulturalTradition", item })),
    ...theatreTraditions.map((item) => ({ type: "TheatreTradition", item })),
  ];
  const seenIds = new Set<string>();
  allEntities.forEach(({ type, item }) => {
    if (seenIds.has(item.id)) {
      issues.push({
        entityType: type,
        entityId: item.id,
        field: "id",
        message: `Duplicate canonical content ID '${item.id}'`,
        severity: "error",
      });
    }
    seenIds.add(item.id);
  });

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
    const validSwaras = new Set(["S", "r", "R", "g", "G", "M", "m", "P", "d", "D", "n", "N", "S'", ".r", ".R", ".g", ".G", ".M", ".m", ".P", ".d", ".D", ".n", ".N"]);
    [...(r.arohana_swaras || []), ...(r.avarohana_swaras || [])].forEach((swara) => {
      if (!validSwaras.has(swara)) {
        issues.push({
          entityType: "Raga",
          entityId: r.id,
          field: "arohana_swaras/avarohana_swaras",
          message: `Unknown swara token '${swara}'`,
          severity: "error",
        });
      }
    });
    if (!r.arohana_si?.trim() || !r.avarohana_si?.trim() || !r.pakad_si?.trim()) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "notation",
        message: "Public raga display notation must include arohana, avarohana, and pakad",
        severity: "error",
      });
    }
    if (!r.sourceReference || !r.sourceReference.sourceId) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "sourceReference",
        message: "Source reference is missing",
        severity: "error",
      });
    } else if (!validSourceIds.has(r.sourceReference.sourceId)) {
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
    if (t.vibhagStructure.reduce((sum, size) => sum + size, 0) !== t.matras) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "vibhagStructure",
        message: "Tala vibhag sizes must sum to its matra count",
        severity: "error",
      });
    }
    if (t.vibhagCount !== t.vibhagStructure.length) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "vibhagCount",
        message: "Tala vibhagCount must equal vibhagStructure length",
        severity: "error",
      });
    }
    if (t.bols?.some((bol, index) => bol.matra !== index + 1 || bol.vibhagIndex < 0 || bol.vibhagIndex >= t.vibhagCount)) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: "Tala bol matras must be sequential and reference a valid vibhag",
        severity: "error",
      });
    }
    if (t.bols?.filter((bol) => bol.isSam).length !== 1 || t.bols?.some((bol) => bol.isKhali && bol.isTali)) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: "Tala must contain one sam and may not mark a bol as both tali and khali",
        severity: "error",
      });
    }
  });

  const normalizedTalaNames = new Map<string, string>();
  talas.forEach((tala) => {
    [tala.name_si, ...(tala.aliases_si || [])].forEach((name) => {
      const normalized = name.normalize("NFC").toLocaleLowerCase().replace(/[\s()|,.-]/g, "");
      const existing = normalizedTalaNames.get(normalized);
      if (existing && existing !== tala.id) {
        issues.push({
          entityType: "Tala",
          entityId: tala.id,
          field: "aliases_si",
          message: `Normalized tala name/alias '${name}' collides with '${existing}'`,
          severity: "error",
        });
      } else {
        normalizedTalaNames.set(normalized, tala.id);
      }
    });
  });

  allEntities.forEach(({ type, item }) => {
    const decision = getRecordPublicationDecision(item);
    if (!decision.isPublic) {
      issues.push({
        entityType: type,
        entityId: item.id,
        field: "sourceReference",
        message: `Canonical public input failed publication evidence: ${decision.reasonCodes.join(", ")}`,
        severity: "error",
      });
    }
  });

  const requiredTerms: Record<string, string> = {
    "term-pitch": "තාරතාවය",
    "term-intensity": "විපුලතාවය",
    "term-timbre": "ධ්වනි ගුණය",
    "term-frequency": "සංඛ්‍යාතය",
  };
  Object.entries(requiredTerms).forEach(([id, expected]) => {
    const glossaryTerm = glossaryData.find((term) => term.id === id);
    const terminologyTerm = terminologyData.find((term) => term.id === id);
    if (!glossaryTerm?.term_si.includes(expected) || !terminologyTerm?.term_si.includes(expected)) {
      issues.push({
        entityType: "Terminology",
        entityId: id,
        field: "term_si",
        message: `Canonical terminology must retain '${expected}' across catalogs`,
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
