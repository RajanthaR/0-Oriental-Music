const SOURCE_PUBLIC_FIELDS = [
  "id",
  "title",
  "originalFilename",
  "publisher",
  "grades",
  "year",
  "language",
  "tier",
  "location",
  "status",
  "license",
  "url",
] as const;

const SOURCE_TRANSPARENCY_FIELDS = ["evidenceState", "evidenceQuality"] as const;

// Single shared source of truth for the public unknown/unverified metadata
// shape; the evidence layer owns the values so validation cannot drift from
// publication projection.
import { SANITIZED_SOURCE_METADATA, jsonValuesMatch } from "@/lib/evidence/source-evidence";

function sourceValuesMatch(left: unknown, right: unknown): boolean {
  return jsonValuesMatch(left, right);
}

/**
 * Validate a public Quiz's aggregate source evidence.
 *
 * A Quiz declares no `sourceReference` of its own: `getQuizContainerPublicationDecision`
 * deliberately evaluates an absent reference, so `decision.sourceEvidence.supportable`
 * is always false for a Quiz. Requiring it directly failed every valid Quiz.
 *
 * The real contract is aggregate, and this function re-derives it independently of
 * the publication decision so a policy regression cannot silently pass validation:
 *
 * 1. the parent lesson must be public;
 * 2. the question set must be non-empty; and
 * 3. every question must carry its own explicit grade scope and its own
 *    supportable direct page evidence.
 *
 * None of those gates is weakened here.
 */
function quizAggregateEvidenceIssues(
  entityType: string,
  id: string,
  record: unknown,
  decision: PublicationDecision,
  evaluationContext: PublicationEvaluationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const lessonId = readOwnDataField(record, "lessonId");
  const normalizedLessonId = normalizeRecordId(lessonId);
  if (!normalizedLessonId) {
    issues.push(baselineIssue(entityType, id, "lessonId", "A public Quiz must resolve a parent-lesson disposition."));
  } else {
    const parent = evaluationContext.catalogs.lessons.find(
      (lesson) => normalizeRecordId(readOwnDataField(lesson, "id")) === normalizedLessonId
    );
    if (!parent) {
      issues.push(baselineIssue(entityType, id, "lessonId", "A public Quiz must resolve a parent-lesson disposition."));
    } else {
      const parentDecision = getRecordPublicationDecision(parent, evaluationContext);
      if (!parentDecision.isPublic) {
        issues.push(baselineIssue(
          entityType,
          id,
          "lessonId",
          `A public Quiz requires a public parent lesson (${parentDecision.reasonCodes.join(", ") || "no eligibility reason"}).`,
        ));
      }
    }
  }

  const questions = readOwnDataField(record, "questions");
  if (!Array.isArray(questions) || questions.length === 0) {
    return issues;
  }

  questions.forEach((question, index) => {
    const field = `questions[${index}]`;
    if (!isRecord(question)) {
      return;
    }
    // gradeBands presence is enforced by the canonical record contract; the
    // aggregate rule only checks evidence that the contract does not cover.
    const evidence = evaluateSourceReference(
      readOwnDataField(question, "sourceReference") as SourceReference | undefined,
      evaluationContext,
    );
    if (!evidence.supportable) {
      issues.push(baselineIssue(
        entityType,
        id,
        `${field}.sourceReference`,
        `Public Quiz question lacks supportable page evidence: ${evidence.reason}`,
      ));
    }
  });

  return issues;
}

/**
 * Sources are a public transparency catalog, not curricular records.  The
 * repository validates raw source shape, then exposes an allowlisted,
 * unknown/unverified projection with evidence summary fields.  Keep this
 * boundary separate from the grade/sourceReference publication decision used
 * by learner-visible claims.
 */
function validateSourceTransparencyCollection(
  entityType: string,
  records: unknown,
): PublicationValidationResult {
  try {
    const issues: ValidationIssue[] = [];
    const snapshot = cloneBoundedRecord(records);
    if (!Array.isArray(snapshot)) {
      return {
        isValid: false,
        issues: [baselineIssue(entityType, "catalog", "records", "Source transparency collection must be a bounded dense plain-data array.")],
      };
    }

    const repositorySources = repository.getSources();
    const repositoryById = new Map<string, Record<string, unknown>>();
    repositorySources.forEach((source) => {
      // Canonical identity so the transparency rows, repository projection, and
      // publication decisions all key on the same value.
      const id = normalizeEntityId(source.id) ?? "";
      if (id) repositoryById.set(id, source as unknown as Record<string, unknown>);
    });

    const seenIds = new Set<string>();
    snapshot.forEach((candidate, index) => {
      const rawId = readOwnDataField(candidate, "id");
      const normalizedId = normalizeEntityId(rawId) ?? "";
      const id = normalizedId || `${entityType}-${index}`;
      if (!normalizedId || seenIds.has(normalizedId)) {
        issues.push(baselineIssue(entityType, id, "id", "Source transparency IDs must be unique, non-empty normalized strings."));
      } else {
        seenIds.add(normalizedId);
      }

      const contract = validateContentRecord(candidate, "source");
      if (!contract.isValid) {
        issues.push(baselineIssue(entityType, id, "record", "Source transparency record does not satisfy the source contract."));
        return;
      }

      const projection = projectPublicRecord(candidate, "source");
      if (!projection || !isRecord(projection) || !validateContentRecord(projection, "source").isValid) {
        issues.push(baselineIssue(entityType, id, "projection", "Source transparency record could not be safely projected."));
        return;
      }

      Object.entries(SANITIZED_SOURCE_METADATA).forEach(([field, expected]) => {
        if (readOwnDataField(projection, field) !== expected) {
          issues.push(baselineIssue(entityType, id, `projection.${field}`, "Source transparency projection must retain the existing unknown/unverified metadata."));
        }
      });

      const reprojected = projectPublicRecord(projection, "source");
      if (!reprojected || !isRecord(reprojected) || SOURCE_PUBLIC_FIELDS.some((field) =>
        !sourceValuesMatch(readOwnDataField(projection, field), readOwnDataField(reprojected, field))
      )) {
        issues.push(baselineIssue(entityType, id, "projection", "Source transparency projection must be stable when projected again."));
      }

      const repositorySource = repositoryById.get(normalizedId);
      if (repositorySource) {
        SOURCE_PUBLIC_FIELDS.forEach((field) => {
          if (!sourceValuesMatch(readOwnDataField(projection, field), readOwnDataField(repositorySource, field))) {
            issues.push(baselineIssue(entityType, id, `projection.${field}`, "Source transparency projection disagrees with repository.getSources()."));
          }
        });
      }

      const hasTransparencyFields = SOURCE_TRANSPARENCY_FIELDS.some((field) =>
        readOwnDataField(candidate, field) !== undefined
      );
      if (hasTransparencyFields) {
        if (!repositorySource) {
          issues.push(baselineIssue(entityType, id, "evidenceState", "Source evidence summary must resolve through repository.getSources()."));
        } else {
          SOURCE_PUBLIC_FIELDS.forEach((field) => {
            if (!sourceValuesMatch(readOwnDataField(candidate, field), readOwnDataField(repositorySource, field))) {
              issues.push(baselineIssue(entityType, id, field, "Sanitized source transparency fields disagree with repository.getSources()."));
            }
          });
          SOURCE_TRANSPARENCY_FIELDS.forEach((field) => {
            const value = readOwnDataField(candidate, field);
            if (typeof value !== "string" || !value.trim() || !sourceValuesMatch(value, readOwnDataField(repositorySource, field))) {
              issues.push(baselineIssue(entityType, id, field, "Source evidence summary disagrees with repository.getSources()."));
            }
          });
        }
      }
    });

    return {
      isValid: issues.every((issue) => issue.severity !== "error"),
      issues,
    };
  } catch {
    return {
      isValid: false,
      issues: [baselineIssue(entityType, "catalog", "records", "Source transparency collection could not be safely validated.")],
    };
  }
}


import type { SourceReference } from "@/types/content";
import {
  evaluateSourceReference,
  evaluatePublicationBatch,
  createPublicationEvaluationContext,
  getRecordPublicationDecision,
  UNKNOWN_PROVENANCE,
  type PublicationCatalogInputs,
  type PublicationDecision,
  type PublicationEvaluationContext,
} from "@/lib/data/publication-policy";
import { repository } from "@/lib/data/repository";
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
import musicalCoreFieldDispositionsData from "../../../data/musical-core-field-dispositions.json";
import { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";
import { planTablaBol } from "@/lib/audio/tabla";
import { isSafePracticeBpm } from "@/lib/audio/tempo";
import {
  cloneBoundedRecord,
  isMappedTalaBolToken,
  isRecord,
  normalizeEntityId,
  normalizeRecordId,
  isValidSwaraToken,
  projectPublicRecord,
  readOwnDataField,
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";
import {
  identityKey,
  baselineIssue as sharedBaselineIssue,
  type PublicationValidationResult,
  type ValidationIssue,
} from "@/lib/validation/validation-issues";
import { validateCatalogIdentityContracts } from "@/lib/validation/content-validator";
import { validateForensicLedger } from "@/lib/data/catalog-integrity";
import { inspectDispositionRegistry } from "@/lib/evidence/disposition-registry";
import type { Lesson, Raga, Tala, Instrument, CulturalTradition, TheatreTradition } from "@/types/content";

function baselineIssue(
  entityType: string,
  entityId: string,
  field: string,
  message: string,
  severity: "error" | "warning" = "error"
): ValidationIssue {
  return { entityType, entityId, field, message, severity };
}

function entityId(value: unknown, index: number): string {
  const id = readOwnDataField(value, "id");
  return typeof id === "string" ? id : String(index);
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


export function validateMusicalCoreFieldDispositions(
  rawTalas: unknown[] = talasData as unknown[],
  registryInput: unknown = musicalCoreFieldDispositionsData
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const registrySnapshot = cloneBoundedRecord(registryInput);
  const registry = isRecord(registrySnapshot) ? registrySnapshot : {};
  const rawTalaSnapshot = cloneBoundedRecord(rawTalas);
  const safeRawTalas = Array.isArray(rawTalaSnapshot) ? rawTalaSnapshot : [];
  const evaluationContext = createPublicationEvaluationContext();

  // Every structural rule lives in the shared registry contract, so publication
  // gating and this forensic validator cannot drift apart. Only the raw-catalog
  // parity and source-evidence rules below are unique to forensic validation.
  const inspection = inspectDispositionRegistry(registryInput);
  inspection.issues.forEach((issue) => {
    issues.push({
      entityType: "TalaFieldDisposition",
      entityId: issue.entityId,
      field: issue.field,
      message: issue.message,
      severity: "error",
    });
  });
  const issueCatalogIds = inspection.issueCatalogIds;

  // The shared contract accepts any unique subset of requiredFields. The current
  // forensic state is narrower: `structure` is the one field still unclosed, and
  // a registry that silently drops it would promote all eight quarantined Talas.
  if (JSON.stringify(readOwnDataField(registry, "unclosedRequiredFields")) !== JSON.stringify(["structure"])) {
    issues.push({ entityType: "TalaFieldDisposition", entityId: "registry", field: "policy", message: "Registry must explicitly record the unclosed structure field under whole-entity quarantine", severity: "error" });
  }

  type DispositionEntry = {
    talaId: string;
    context: { status: string; scope?: string; value?: string; sourceReference?: unknown; quality?: string; issueId?: string };
    theka: { status: string; value?: string; sourceReference?: unknown; quality?: string; issueId?: string };
    bols: Array<{ matra: number; status: string; value?: string; sourceReference?: unknown; quality?: string; issueId?: string }>;
  };
  const entryById = inspection.entryById as Map<string, Record<string, unknown>> as unknown as Map<string, DispositionEntry>;
  const hasLedgerConsistentEvidence = (reference: unknown, status: string): boolean => { // ledger self-consistency; see hasPublishableFieldEvidence in publication-policy for quality-gated publish
    if (!isRecord(reference) || typeof reference.sourceId !== "string" || typeof reference.pageOrSection !== "string") return false;
    const decision = evaluateSourceReference(reference as unknown as SourceReference, evaluationContext);
    if (status === "verified") return decision.supportable;
    return !!decision.documentId && decision.pageNumbers.length > 0 && [
      "supportable",
      "source-document-needs-review",
      "low-quality-page-evidence",
    ].includes(decision.reasonCode);
  };
  const seen = new Set<string>();
  safeRawTalas.forEach((candidate, index) => {
    if (!isRecord(candidate) || typeof candidate.id !== "string") {
      issues.push({ entityType: "TalaFieldDisposition", entityId: String(index), field: "talaId", message: "Disposition input must identify a tala", severity: "error" });
      return;
    }
    const id = candidate.id.trim();
    if (!id || id !== candidate.id || seen.has(id)) {
      issues.push({
        entityType: "TalaFieldDisposition",
        entityId: id || String(index),
        field: "talaId",
        message: "Disposition input Tala IDs must be normalized and unique",
        severity: "error",
      });
      return;
    }
    seen.add(id);
    const entry = entryById.get(id);
    if (!entry) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: "record", message: "Every tala must have a closed-world field disposition", severity: "error" });
      return;
    }
    if (!entry.context || !entry.theka || !Array.isArray(entry.bols)) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: "fields", message: "Context, theka, and bols disposition rows are required", severity: "error" });
      return;
    }
    ["context", "theka"].forEach((field) => {
      const value = entry[field as "context" | "theka"];
      if (value.status !== "verified" && value.status !== "needs-review") {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field, message: "Disposition status must be verified or needs-review", severity: "error" });
      }
      if (!value.quality || !value.issueId) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field, message: "Every disposition requires quality and forensic issue anchors", severity: "error" });
      } else if (!issueCatalogIds.has(value.issueId)) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `${field}.issueId`, message: "Disposition issue ID must resolve through the structured issue catalog", severity: "error" });
      }
      const contextScope = field === "context" ? entry.context.scope : undefined;
      const evidenceRequired = value.quality !== "missing" && !(field === "context" && contextScope === "not-claimed");
      if (evidenceRequired && !hasLedgerConsistentEvidence(value.sourceReference, value.status)) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `${field}.sourceReference`, message: "Readable disposition fields require exact supportable source evidence", severity: "error" });
      }
    });
    if (entry.context.scope !== "not-claimed" && entry.context.quality !== "missing" && entry.context.value !== candidate.context_si) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: "context.value", message: "Context disposition must preserve the exact raw auditable value", severity: "error" });
    }
    if (entry.theka.quality !== "missing" && entry.theka.value !== candidate.theka_si) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: "theka.value", message: "Theka disposition must preserve the raw auditable value", severity: "error" });
    }
    const rawBols = Array.isArray(candidate.bols) ? candidate.bols : [];
    if (entry.bols.length !== rawBols.length) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: "bols", message: "Disposition must enumerate every raw tala bol cell", severity: "error" });
    }
    entry.bols.forEach((bol, bolIndex) => {
      if (!isRecord(bol)) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}]`, message: "Bol disposition entries must be safe objects", severity: "error" });
        return;
      }
      const bolMatra = readOwnDataField(bol, "matra");
      const bolStatus = readOwnDataField(bol, "status");
      if (bolMatra !== bolIndex + 1 || (bolStatus !== "verified" && bolStatus !== "needs-review")) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}]`, message: "Bol disposition must preserve sequential matra and status", severity: "error" });
      }
      const rawBol = isRecord(rawBols[bolIndex]) ? rawBols[bolIndex] : undefined;
      const bolQuality = readOwnDataField(bol, "quality");
      const bolValue = readOwnDataField(bol, "value");
      if (bolQuality !== "missing" && bolValue !== readOwnDataField(rawBol, "bol_si")) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}].value`, message: "Bol disposition must preserve the raw auditable cell", severity: "error" });
      }
      const bolIssueId = readOwnDataField(bol, "issueId");
      if (!bolQuality || !bolIssueId) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}]`, message: "Every bol disposition requires quality and forensic issue anchors", severity: "error" });
      } else if (typeof bolIssueId !== "string" || !issueCatalogIds.has(bolIssueId)) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}].issueId`, message: "Bol issue ID must resolve through the structured issue catalog", severity: "error" });
      }
      if (bolQuality !== "missing" && !hasLedgerConsistentEvidence(readOwnDataField(bol, "sourceReference"), typeof bolStatus === "string" ? bolStatus : "")) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}].sourceReference`, message: "Readable bol fields require exact supportable source evidence", severity: "error" });
      }
    });
  });
  // Closed world in the registry -> raw direction: a disposition row for an
  // entity that is not in the raw catalog is an orphan.
  entryById.forEach((entry, talaId) => {
    if (!seen.has(talaId)) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: talaId, field: "record", message: "Disposition contains an entity absent from the raw tala catalog", severity: "error" });
    }
  });
  return { isValid: issues.length === 0, issues };
}

export function validateCoverageSnapshot(
  coverageInput: unknown
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const safeCoverage = cloneBoundedRecord(coverageInput);
  if (!safeCoverage || !isRecord(safeCoverage)) {
    return {
      isValid: false,
      issues: [baselineIssue("generated-doc", "content-coverage", "record", "Coverage snapshot must be a bounded plain-data object.")],
    };
  }
  const coverage = safeCoverage as CoverageSnapshot;
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

export function validatePublicCollection(
  entityType: string,
  records: unknown
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const kindByLabel: Readonly<Record<string, ContentEntityKind>> = {
    Lesson: "lesson",
    lessons: "lesson",
    Raga: "raga",
    ragas: "raga",
    Tala: "tala",
    talas: "tala",
    Instrument: "instrument",
    instruments: "instrument",
    CulturalTradition: "cultural-tradition",
    culturalTraditions: "cultural-tradition",
    TheatreTradition: "theatre-tradition",
    theatreTraditions: "theatre-tradition",
    Glossary: "glossary",
    glossary: "glossary",
    LearningPath: "learning-path",
    learningPaths: "learning-path",
    Quiz: "quiz",
    quizzes: "quiz",
    ExamPaper: "exam-paper",
    exams: "exam-paper",
    Source: "source",
    sources: "source",
  };
  const requestedEntityType = typeof entityType === "string" ? entityType : "unknown";
  const expectedKind = kindByLabel[requestedEntityType];
  if (!expectedKind) {
    return {
      isValid: false,
      issues: [baselineIssue(requestedEntityType, "catalog", "entityType", `Public collection entity type '${requestedEntityType}' is unsupported.`)],
    };
  }

  if (expectedKind === "source") {
    return validateSourceTransparencyCollection(requestedEntityType, records);
  }

  const snapshot = cloneBoundedRecord(records);
  if (!Array.isArray(snapshot)) {
    return {
      isValid: false,
      issues: [baselineIssue(entityType, "catalog", "records", "Public collection must be a bounded dense plain-data array.")],
    };
  }

  const catalogByKind: Partial<Record<ContentEntityKind, keyof PublicationCatalogInputs>> = {
    lesson: "lessons",
    raga: "ragas",
    tala: "talas",
    instrument: "instruments",
    "cultural-tradition": "culturalTraditions",
    "theatre-tradition": "theatreTraditions",
    glossary: "glossary",
    "learning-path": "learningPaths",
    quiz: "quizzes",
    "exam-paper": "examPapers",
  };
  const catalogKey = catalogByKind[expectedKind];
  const evaluationContext = createPublicationEvaluationContext(
    catalogKey ? { [catalogKey]: snapshot } as PublicationCatalogInputs : {},
  );
  const publicationBatch = evaluatePublicationBatch(snapshot, evaluationContext);
  if (!publicationBatch.isValid || publicationBatch.decisions.length !== snapshot.length) {
    return {
      isValid: false,
      issues: [baselineIssue(
        entityType,
        "catalog",
        "publication",
        `Public collection evaluation failed (${publicationBatch.failureReason ?? "incomplete-decision-batch"}).`,
      )],
    };
  }

  const seenIds = new Set<string>();
  snapshot.forEach((record, index) => {
    const value = record;
    const idValue = readOwnDataField(value, "id");
    const id = typeof idValue === "string" ? idValue : `${entityType}-${index}`;
    const normalizedId = normalizeEntityId(idValue) ?? "";
    if (!normalizedId || seenIds.has(normalizedId)) {
      issues.push(baselineIssue(entityType, id, "id", "Public collection IDs must be unique, non-empty normalized strings."));
    } else {
      seenIds.add(normalizedId);
    }
    if (!validateContentRecord(value, expectedKind).isValid) {
      issues.push(baselineIssue(entityType, id, "record", `Public record does not satisfy the declared ${expectedKind} contract.`));
      return;
    }
    const decision = publicationBatch.decisions[index];
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
    if (expectedKind === "quiz") {
      issues.push(...quizAggregateEvidenceIssues(entityType, id, value, decision, evaluationContext));
    } else if (!decision.sourceEvidence.supportable) {
      issues.push(
        baselineIssue(
          entityType,
          id,
          "sourceReference",
          `Public claim lacks supportable page evidence: ${decision.sourceEvidence.reason}`
        )
      );
    }

    if (readOwnDataField(value, "published") === true) {
      issues.push(baselineIssue(entityType, id, "published", "A public record still claims published=true."));
    }

    const reviewMetadata = readOwnDataField(value, "reviewMetadata");
    if (reviewMetadata) {
      const reviewStatus = readOwnDataField(reviewMetadata, "status");
      const reviewer = readOwnDataField(reviewMetadata, "reviewer");
      const reviewDate = readOwnDataField(reviewMetadata, "reviewDate");
      const lastVerifiedDate = readOwnDataField(reviewMetadata, "lastVerifiedDate");
      if (reviewStatus === "Published") {
        issues.push(baselineIssue(entityType, id, "reviewMetadata.status", "A public record still claims a completed Published review."));
      }
      if (reviewer !== UNKNOWN_PROVENANCE) {
        issues.push(baselineIssue(entityType, id, "reviewMetadata.reviewer", "A public record exposes an unverified reviewer identity."));
      }
      if (reviewDate !== UNKNOWN_PROVENANCE || lastVerifiedDate !== UNKNOWN_PROVENANCE) {
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
  collections: unknown
): PublicationValidationResult {
  const safeCollections = cloneBoundedRecord(collections);
  if (!safeCollections || !isRecord(safeCollections)) {
    return {
      isValid: false,
      issues: [baselineIssue("public-boundary", "collections", "record", "Public collection map must be a bounded plain-data object.")],
    };
  }
  const issues = Object.entries(safeCollections).flatMap(([entityType, records]) =>
    validatePublicCollection(entityType, records).issues
  );
  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

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

