import { Lesson, Raga, Tala, Instrument, CulturalTradition, TheatreTradition, SourceReference } from "@/types/content";
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
import {
  evaluateSourceReference,
  getRecordPublicationDecision,
  UNKNOWN_PROVENANCE,
} from "@/lib/data/publication-policy";
import { repository } from "@/lib/data/repository";
import { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";
import { planTablaBol } from "@/lib/audio/tabla";
import { isSafePracticeBpm } from "@/lib/audio/tempo";

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

export type IdentityRecord = {
  id?: unknown;
  name_si?: unknown;
  name_en?: unknown;
  aliases_si?: unknown;
  title_si?: unknown;
  title_en?: unknown;
  term_si?: unknown;
  term_en?: unknown;
  transliteration?: unknown;
  knownVariants?: unknown;
};

const identityKey = (value: string) =>
  normalizeSinhalaText(value).replace(/[\s()|,.'’\-–—/]/g, "");

export function validateCatalogIdentityContracts(
  catalogs: Array<{ type: string; records: unknown[] }>,
  glossaryRecords: unknown[],
  terminologyRecords: unknown[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const issueFor = (type: string, entityId: string, field: string, message: string): void => {
    issues.push({ entityType: type, entityId, field, message, severity: "error" });
  };
  const objectRecords = (type: string, records: unknown[]): Array<{ record: Record<string, unknown>; index: number }> => {
    const result: Array<{ record: Record<string, unknown>; index: number }> = [];
    records.forEach((candidate, index) => {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        issueFor(type, String(index), "record", `${type} record must be a non-null object`);
        return;
      }
      result.push({ record: candidate as Record<string, unknown>, index });
    });
    return result;
  };

  catalogs.forEach(({ type, records }) => {
    const ids = new Set<string>();
    objectRecords(type, Array.isArray(records) ? records : []).forEach(({ record, index }) => {
      const id = typeof record.id === "string" ? record.id.trim() : "";
      if (!id || ids.has(id)) {
        issueFor(type, id || String(index), "id", `Duplicate or missing ${type} ID`);
      } else ids.add(id);
    });
  });

  const sharedTermIdentities = new Map<string, string>();
  const validateTerms = (type: "Glossary" | "Terminology", records: unknown[]) => {
    const identities = new Map<string, { id: string; canonical: boolean }>();
    objectRecords(type, Array.isArray(records) ? records : []).forEach(({ record }) => {
      const id = typeof record.id === "string" ? record.id : "";
      const canonical = typeof record.term_si === "string" ? record.term_si.trim() : "";
      if (!canonical) {
        issueFor(type, id, "term_si", `${type} canonical term is missing`);
      }
      const sharedVariants = [record.term_en, record.transliteration]
        .filter((variant): variant is string => typeof variant === "string" && !!variant.trim());
      const variants: unknown[] = type === "Terminology"
        ? [...sharedVariants, ...(Array.isArray(record.knownVariants) ? record.knownVariants : [])]
        : sharedVariants;
      if (type === "Terminology" && (!Array.isArray(record.knownVariants) || variants.some((variant) => typeof variant !== "string" || !variant.trim()))) {
        issueFor(type, id, "knownVariants", "Terminology variants must be non-empty strings");
      }
      const variantNames = variants.filter((variant): variant is string => typeof variant === "string" && !!variant.trim());
      if (type === "Terminology") {
        const canonicalKey = identityKey(canonical);
        const localVariantKeys = new Set<string>();
        (Array.isArray(record.knownVariants) ? record.knownVariants : []).forEach((variant) => {
          if (typeof variant !== "string" || !variant.trim()) return;
          const key = identityKey(variant);
          if (key === canonicalKey) {
            issueFor(type, id, "knownVariants", "Canonical terminology identity must not also be a variant");
          } else if (localVariantKeys.has(key)) {
            issueFor(type, id, "knownVariants", "Duplicate terminology variant within one record");
          }
          localVariantKeys.add(key);
        });
      }
      [{ name: canonical, canonical: true }, ...variantNames.map((name) => ({ name, canonical: false }))]
        .filter(({ name }) => !!name)
          .forEach(({ name, canonical: isCanonical }) => {
            const key = identityKey(name);
            const existing = identities.get(key);
           if (existing && existing.id !== id) {
             issueFor(type, id, isCanonical ? "term_si" : type === "Terminology" ? "knownVariants" : "term_en", `Search-equivalent ${type.toLowerCase()} identity collides with '${existing.id}'`);
           } else if (!existing) {
             identities.set(key, { id, canonical: isCanonical });
           }
           const sharedOwner = sharedTermIdentities.get(key);
           if (sharedOwner && sharedOwner !== id) {
             issueFor(type, id, type === "Terminology" ? "knownVariants" : "term_si", `Search-equivalent terminology/glossary identity collides with '${sharedOwner}'`);
           } else {
             sharedTermIdentities.set(key, id);
           }
         });
    });
  };

  validateTerms("Glossary", glossaryRecords);
  validateTerms("Terminology", terminologyRecords);

  const identityFields = ["name_si", "name_en", "aliases_si", "title_si", "title_en"] as const;
  catalogs.forEach(({ type, records }) => {
    const owners = new Map<string, { id: string; canonical: boolean }>();
    objectRecords(type, Array.isArray(records) ? records : []).forEach(({ record, index }) => {
      const id = typeof record.id === "string" ? record.id : String(index);
      const canonicalValues = identityFields
        .filter((field) => field === "name_si" || field === "name_en" || field === "title_si" || field === "title_en")
        .flatMap((field) => typeof record[field] === "string" ? [record[field] as string] : []);
      const aliases = Array.isArray(record.aliases_si) ? record.aliases_si : [];
      if (record.aliases_si !== undefined && !Array.isArray(record.aliases_si)) {
        issueFor(type, id, "aliases_si", "Aliases must be an array of non-empty strings");
      }
      const local = new Map<string, { name: string; canonical: boolean }>();
      [...canonicalValues.map((name) => ({ name, canonical: true })), ...aliases.map((name) => ({ name, canonical: false }))]
        .forEach(({ name, canonical }) => {
          if (typeof name !== "string" || !name.trim()) {
            issueFor(type, id, "aliases_si", "Identity values must be non-empty strings");
            return;
          }
          const key = identityKey(name);
          const localExisting = local.get(key);
          if (localExisting) {
            issueFor(type, id, "aliases_si", localExisting.canonical !== canonical
              ? `Canonical identity '${name}' must not also be an alias`
              : `Duplicate identity '${name}' within one record`);
          } else {
            local.set(key, { name, canonical });
          }
          const existing = owners.get(key);
          if (existing && existing.id !== id) {
            issueFor(type, id, "aliases_si", `Search-equivalent identity '${name}' collides with '${existing.id}'`);
          } else if (!existing) {
            owners.set(key, { id, canonical });
          }
        });
    });
  });
  return issues;
}

export const SELECTED_PHASE_2_SOURCE_IDS = [
  "SRC-EPD-TB-G10",
  "SRC-EPD-TB-G11",
  "SRC-G10-NADA",
  "SRC-G11-RAGA-ID",
] as const;

export function validateSelectedSourceMetadata(
  runtimeSources: unknown,
  manifestSources: unknown,
  sourceDocuments: unknown,
  humanCatalog: unknown
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const addIssue = (id: string, field: string, message: string) => issues.push({
    entityType: "SourceMetadata",
    entityId: id,
    field,
    message,
    severity: "error" as const,
  });
  const records = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value) ? value.filter(isRecord) : [];
  const runtime = records(runtimeSources);
  const manifest = records(manifestSources);
  const documents = records(sourceDocuments);
  const humanText = typeof humanCatalog === "string" ? humanCatalog : "";
  const sharedFields = [
    "title",
    "originalFilename",
    "grades",
    "year",
    "language",
    "tier",
    "location",
    "status",
    "license",
  ] as const;

  SELECTED_PHASE_2_SOURCE_IDS.forEach((id) => {
    const runtimeRecord = runtime.find((entry) => entry.id === id);
    const manifestRecord = manifest.find((entry) => entry.id === id);
    if (!runtimeRecord || !manifestRecord) {
      addIssue(id, "id", "Selected Phase 2 source must exist in both JSON catalogs");
      return;
    }
    const filename = runtimeRecord.originalFilename;
    const document = typeof filename === "string"
      ? documents.find((entry) => entry.originalFilename === filename)
      : undefined;
    if (!document) {
      addIssue(id, "originalFilename", "Selected source must resolve to exactly one extracted document filename");
    }
    sharedFields.forEach((field) => {
      if (JSON.stringify(runtimeRecord[field]) !== JSON.stringify(manifestRecord[field])) {
        addIssue(id, field, `Runtime and manifest source metadata disagree for '${field}'`);
      }
    });
    ["publisher", "year", "location", "license"].forEach((field) => {
      if (runtimeRecord[field] !== UNKNOWN_PROVENANCE || manifestRecord[field] !== UNKNOWN_PROVENANCE) {
        addIssue(id, field, `Unsupported '${field}' metadata must remain explicitly unknown`);
      }
    });
    if (runtimeRecord.tier !== "Unverified source metadata" || manifestRecord.tier !== "Unverified source metadata") {
      addIssue(id, "tier", "Selected source tier must remain unverified");
    }
    if (runtimeRecord.url !== undefined || manifestRecord.url !== undefined) {
      addIssue(id, "url", "Selected source URL is not established by the supplied corpus");
    }
    if (runtimeRecord.topics !== undefined || manifestRecord.topics !== undefined) {
      addIssue(id, "topics", "Selected source topics must come only from extracted-document triage");
    }
    if (document) {
      const grades = Array.isArray(runtimeRecord.grades) ? runtimeRecord.grades : [];
      if (typeof document.statedGrade !== "string" || !grades.includes(document.statedGrade)) {
        addIssue(id, "grades", "Selected source grade must match the extracted document");
      }
      const expectedStatus = document.reviewStatus === "Review Required"
        ? "Review Required"
        : "Source identity triaged; metadata unverified";
      if (runtimeRecord.status !== expectedStatus) {
        addIssue(id, "status", "Selected source status must reflect extracted-document triage");
      }
    }
    const humanRow = humanText.split(/\r?\n/).find((line) => line.includes(`\`${id}\``)) || "";
    if (!humanRow || typeof filename !== "string" || !humanRow.includes(filename) || !humanRow.includes(UNKNOWN_PROVENANCE)) {
      addIssue(id, "SOURCES.md", "Human source row must retain the exact filename and explicit unknown metadata");
    }
    if (/භෛරව්|Bhairav|edupub|Canonical School Source|Educational Reference|\|\s*20(?:19|20)\s*\|/.test(humanRow)) {
      addIssue(id, "SOURCES.md", "Human source row contains an unsupported topic or provenance claim");
    }
  });

  return { isValid: issues.length === 0, issues };
}

export function validateMusicalCoreFieldDispositions(
  rawTalas: unknown[] = talasData as unknown[],
  registryInput: unknown = musicalCoreFieldDispositionsData
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const registry = isRecord(registryInput) ? registryInput : {};
  const ledgerIssueIds = new Set(
    Array.isArray(forensicLedgerData.issues)
      ? forensicLedgerData.issues.filter(isRecord).map((issue) => issue.id).filter((id): id is string => typeof id === "string")
      : []
  );
  const rawIssueCatalog = asUnknownArray(registry.issueCatalog);
  const issueCatalog = rawIssueCatalog.filter(isRecord);
  const issueCatalogIds = new Set<string>();
  rawIssueCatalog.forEach((candidate, index) => {
    if (!isRecord(candidate)) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: String(index), field: "issueCatalog", message: "Disposition issue catalog entries must be objects", severity: "error" });
      return;
    }
    if (typeof candidate.id === "string") {
      if (issueCatalogIds.has(candidate.id)) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: candidate.id, field: "issueCatalog", message: "Disposition issue catalog IDs must be unique", severity: "error" });
      }
      issueCatalogIds.add(candidate.id);
    }
  });
  issueCatalog.forEach((issue, index) => {
    if (typeof issue.id !== "string" || typeof issue.ledgerIssueId !== "string" || !ledgerIssueIds.has(issue.ledgerIssueId)) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: typeof issue.id === "string" ? issue.id : String(index), field: "issueCatalog", message: "Disposition issue catalog entries must resolve to a forensic-ledger issue", severity: "error" });
    }
  });
  const rawEntries = asUnknownArray(registry.talas);
  rawEntries.forEach((candidate, index) => {
    if (!isRecord(candidate)) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: String(index), field: "talas", message: "Disposition tala rows must be objects", severity: "error" });
    }
  });
  const entries = rawEntries.filter(isRecord) as Array<{
    talaId: string;
    context: { status: string; scope?: string; value?: string; sourceReference?: unknown; quality?: string; issueId?: string };
    theka: { status: string; value?: string; sourceReference?: unknown; quality?: string; issueId?: string };
    bols: Array<{ matra: number; status: string; value?: string; sourceReference?: unknown; quality?: string; issueId?: string }>;
  }>;
  if (
    registry.policy !== "whole-entity-quarantine" ||
    JSON.stringify(registry.requiredFields) !== JSON.stringify(["context", "structure", "theka", "bols"]) ||
    JSON.stringify(registry.unclosedRequiredFields) !== JSON.stringify(["structure"])
  ) {
    issues.push({ entityType: "TalaFieldDisposition", entityId: "registry", field: "policy", message: "Registry must explicitly record the unclosed structure field under whole-entity quarantine", severity: "error" });
  }
  const entryById = new Map(entries.map((entry) => [entry.talaId, entry]));
  if (entryById.size !== entries.length) {
    issues.push({ entityType: "TalaFieldDisposition", entityId: "registry", field: "talaId", message: "Registry tala IDs must be unique", severity: "error" });
  }
  const hasExactEvidence = (reference: unknown, status: string): boolean => {
    if (!isRecord(reference) || typeof reference.sourceId !== "string" || typeof reference.pageOrSection !== "string") return false;
    const decision = evaluateSourceReference(reference as unknown as SourceReference);
    if (status === "verified") return decision.supportable;
    return !!decision.documentId && decision.pageNumbers.length > 0 && [
      "supportable",
      "source-document-needs-review",
      "low-quality-page-evidence",
    ].includes(decision.reasonCode);
  };
  const seen = new Set<string>();
  asUnknownArray(rawTalas).forEach((candidate, index) => {
    if (!isRecord(candidate) || typeof candidate.id !== "string") {
      issues.push({ entityType: "TalaFieldDisposition", entityId: String(index), field: "talaId", message: "Disposition input must identify a tala", severity: "error" });
      return;
    }
    const id = candidate.id;
    const entry = entryById.get(id);
    if (!entry) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: "record", message: "Every tala must have a closed-world field disposition", severity: "error" });
      return;
    }
    seen.add(id);
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
      if (evidenceRequired && !hasExactEvidence(value.sourceReference, value.status)) {
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
      if (bol.matra !== bolIndex + 1 || (bol.status !== "verified" && bol.status !== "needs-review")) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}]`, message: "Bol disposition must preserve sequential matra and status", severity: "error" });
      }
      const rawBol = isRecord(rawBols[bolIndex]) ? rawBols[bolIndex] : undefined;
      if (bol.quality !== "missing" && bol.value !== rawBol?.bol_si) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}].value`, message: "Bol disposition must preserve the raw auditable cell", severity: "error" });
      }
      if (!bol.quality || !bol.issueId) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}]`, message: "Every bol disposition requires quality and forensic issue anchors", severity: "error" });
      } else if (!issueCatalogIds.has(bol.issueId)) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}].issueId`, message: "Bol issue ID must resolve through the structured issue catalog", severity: "error" });
      }
      if (bol.quality !== "missing" && !hasExactEvidence(bol.sourceReference, bol.status)) {
        issues.push({ entityType: "TalaFieldDisposition", entityId: id, field: `bols[${bolIndex}].sourceReference`, message: "Readable bol fields require exact supportable source evidence", severity: "error" });
      }
    });
  });
  entries.forEach((entry) => {
    if (!seen.has(entry.talaId)) {
      issues.push({ entityType: "TalaFieldDisposition", entityId: entry.talaId, field: "record", message: "Disposition contains an entity absent from the raw tala catalog", severity: "error" });
    }
  });
  return { isValid: issues.length === 0, issues };
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
  const historicalBaseline = isRecord(ledger.historicalBaseline) ? ledger.historicalBaseline : {};
  const auditedThrough = isRecord(ledger.auditedThrough) ? ledger.auditedThrough : {};
  if (typeof ledger.phase !== "string" || !ledger.phase.startsWith("Phase 2 closeout")) {
    issues.push(baselineIssue("forensic-ledger", "header", "phase", "Ledger header must identify the Phase 2 closeout scope."));
  }
  if (typeof ledger.authority !== "string" || /current checkout/i.test(ledger.authority)) {
    issues.push(baselineIssue("forensic-ledger", "header", "authority", "Ledger authority must not claim a stored SHA is the current checkout."));
  }
  if (
    historicalBaseline.phase !== "Prompt 1 / publication containment and source baseline" ||
    historicalBaseline.baseSha !== "6e62a3ad2d9621b8790d35af3358b08fafceaa57"
  ) {
    issues.push(baselineIssue("forensic-ledger", "header", "historicalBaseline", "Prompt 1 baseline phase and base SHA must remain immutable historical metadata."));
  }
  if (
    auditedThrough.phase !== "Phase 2 p02r4 findings input" ||
    auditedThrough.baseSha !== "beba1479f473b3413b3f2de48a27c558e1937c6f" ||
    auditedThrough.reviewedHead !== "97c0c138b2b90ac27516a3c8c3716361ac537981" ||
    auditedThrough.reviewRunId !== "20260815-235819-p02r4" ||
    auditedThrough.status !== "Findings input only; not acceptance evidence"
  ) {
    issues.push(baselineIssue("forensic-ledger", "header", "auditedThrough", "Latest audited Phase 2 findings-input scope must be explicit and must not claim acceptance."));
  }
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
  if (ledger.issueCountBaseline !== ledgerIssues.length) {
    issues.push(baselineIssue("forensic-ledger", "issues", "issueCountBaseline", "Ledger issue count baseline must remain synchronized."));
  }

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

function asUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function entityId(value: unknown, index: number): string {
  return isRecord(value) && typeof value.id === "string" ? value.id : String(index);
}

export function validateContent(
  lessons: unknown,
  ragas: unknown,
  talas: unknown,
  instruments: unknown,
  culturalTraditions: unknown,
  theatreTraditions: unknown
): { isValid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const validSourceIds = new Set(sourcesData.map((s) => s.id));
  const structuralRecords = (type: string, value: unknown): Record<string, unknown>[] => {
    if (!Array.isArray(value)) {
      issues.push({ entityType: type, entityId: "catalog", field: "catalog", message: `${type} catalog must be an array`, severity: "error" });
      return [];
    }
    return asUnknownArray(value).flatMap((candidate, index) => {
      if (!isRecord(candidate)) {
        issues.push({
          entityType: type,
          entityId: String(index),
          field: "record",
          message: `${type} record must be a non-null object`,
          severity: "error",
        });
        return [];
      }
      return [candidate];
    });
  };
  const lessonRecords = structuralRecords("Lesson", lessons) as unknown as Lesson[];
  const ragaRecords = structuralRecords("Raga", ragas) as unknown as Raga[];
  const talaRecords = structuralRecords("Tala", talas) as unknown as Tala[];
  const instrumentRecords = structuralRecords("Instrument", instruments) as unknown as Instrument[];
  const culturalRecords = structuralRecords("CulturalTradition", culturalTraditions) as unknown as CulturalTradition[];
  const theatreRecords = structuralRecords("TheatreTradition", theatreTraditions) as unknown as TheatreTradition[];
  const allEntities = [
    ...lessonRecords.map((item) => ({ type: "Lesson", item })),
    ...ragaRecords.map((item) => ({ type: "Raga", item })),
    ...talaRecords.map((item) => ({ type: "Tala", item })),
    ...instrumentRecords.map((item) => ({ type: "Instrument", item })),
    ...culturalRecords.map((item) => ({ type: "CulturalTradition", item })),
    ...theatreRecords.map((item) => ({ type: "TheatreTradition", item })),
  ];
  const seenIds = new Set<string>();
  allEntities.forEach(({ type, item }) => {
    const id = typeof item.id === "string" ? item.id : "";
    if (!id) {
      issues.push({ entityType: type, entityId: "", field: "id", message: `${type} ID is missing`, severity: "error" });
      return;
    }
    if (seenIds.has(id)) {
      issues.push({
        entityType: type,
        entityId: id,
        field: "id",
        message: `Duplicate canonical content ID '${id}'`,
        severity: "error",
      });
    }
    seenIds.add(id);
  });

  // Validate Lessons
  lessonRecords.forEach((l) => {
    if (typeof l.title_si !== "string" || !l.title_si.trim()) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "title_si",
        message: "Title in Sinhala is missing or empty",
        severity: "error",
      });
    }

    if (typeof l.learningGoal_si !== "string" || !l.learningGoal_si.startsWith("මෙම පාඩම අවසානයේ ඔබට")) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "learningGoal_si",
        message: "Learning goal must start with 'මෙම පාඩම අවසානයේ ඔබට...'",
        severity: "error",
      });
    }

    if (!l.sourceReference || typeof l.sourceReference.sourceId !== "string" || !l.sourceReference.sourceId) {
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

    if (!l.reviewMetadata || typeof l.reviewMetadata.reviewer !== "string" || !l.reviewMetadata.reviewer) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "reviewMetadata.reviewer",
        message: "Reviewer name is required",
        severity: "error",
      });
    }

    if (l.published && (!l.reviewMetadata || typeof l.reviewMetadata !== "object" || l.reviewMetadata.status !== "Published")) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "reviewMetadata.status",
        message: "Published lesson must have 'Published' status in reviewMetadata",
        severity: "error",
      });
    }
  });

  // Validate Ragas
  ragaRecords.forEach((r) => {
    if (!Array.isArray(r.arohana_swaras) || r.arohana_swaras.length === 0) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "arohana_swaras",
        message: "Raga must have non-empty arohana_swaras array",
        severity: "error",
      });
    }
    const validSwaras = new Set(["S", "r", "R", "g", "G", "M", "m", "P", "d", "D", "n", "N", "S'", ".r", ".R", ".g", ".G", ".M", ".m", ".P", ".d", ".D", ".n", ".N"]);
    const arohana = Array.isArray(r.arohana_swaras) ? r.arohana_swaras : [];
    const avarohana = Array.isArray(r.avarohana_swaras) ? r.avarohana_swaras : [];
    if (!Array.isArray(r.avarohana_swaras) || r.avarohana_swaras.length === 0) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "avarohana_swaras",
        message: "Raga must have non-empty avarohana_swaras array",
        severity: "error",
      });
    }
    [...arohana, ...avarohana].forEach((swara) => {
      if (typeof swara !== "string" || !validSwaras.has(swara)) {
        issues.push({
          entityType: "Raga",
          entityId: r.id,
          field: "arohana_swaras/avarohana_swaras",
          message: `Unknown swara token '${swara}'`,
          severity: "error",
        });
      }
    });
    if (
      typeof r.arohana_si !== "string" || !r.arohana_si.trim() ||
      typeof r.avarohana_si !== "string" || !r.avarohana_si.trim() ||
      typeof r.pakad_si !== "string" || !r.pakad_si.trim()
    ) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "notation",
        message: "Public raga display notation must include arohana, avarohana, and pakad",
        severity: "error",
      });
    }
    if (!r.sourceReference || typeof r.sourceReference.sourceId !== "string" || !r.sourceReference.sourceId) {
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
    if (!Array.isArray(r.samplePhrases)) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "samplePhrases",
        message: "Raga samplePhrases must be an array",
        severity: "error",
      });
    } else {
      r.samplePhrases.forEach((phrase, phraseIndex) => {
        if (!phrase || typeof phrase !== "object" || !Array.isArray(phrase.swaras) || phrase.swaras.length === 0) {
          issues.push({
            entityType: "Raga",
            entityId: r.id,
            field: "samplePhrases.swaras",
            message: `Sample phrase ${phraseIndex} must contain a swaras array`,
            severity: "error",
          });
          return;
        }
        phrase.swaras.forEach((swara) => {
          if (typeof swara !== "string" || !validSwaras.has(swara)) {
            issues.push({
              entityType: "Raga",
              entityId: r.id,
              field: "samplePhrases.swaras",
              message: `Unknown sample phrase swara '${String(swara)}'`,
              severity: "error",
            });
          }
        });
      });
    }
  });

  // Validate Talas
  talaRecords.forEach((t) => {
    const vibhagStructure = Array.isArray(t.vibhagStructure) ? t.vibhagStructure : [];
    const bols = Array.isArray(t.bols) ? t.bols : [];
    const validVibhagStructure =
      vibhagStructure.length > 0 &&
      vibhagStructure.every((size) => Number.isInteger(size) && size > 0);
    const validBolObjects = bols.every((bol) =>
      !!bol &&
      typeof bol === "object" &&
      Number.isInteger(bol.matra) &&
      Number.isInteger(bol.vibhagIndex) &&
      typeof bol.bol_si === "string" &&
      typeof bol.action_si === "string" &&
      !!bol.action_si.trim() &&
      typeof bol.isSam === "boolean" &&
      typeof bol.isTali === "boolean" &&
      typeof bol.isKhali === "boolean"
    );

    if (t.matras <= 0 || !validBolObjects || bols.length !== t.matras) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: `Tala bols array is malformed or its length (${bols.length}) does not match matra count (${t.matras})`,
        severity: "error",
      });
    }
    if (!validVibhagStructure || vibhagStructure.reduce((sum, size) => sum + size, 0) !== t.matras) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "vibhagStructure",
        message: "Tala vibhag sizes must sum to its matra count",
        severity: "error",
      });
    }
    if (t.vibhagCount !== vibhagStructure.length) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "vibhagCount",
        message: "Tala vibhagCount must equal vibhagStructure length",
        severity: "error",
      });
    }
    const expectedVibhagByMatra: number[] = [];
    if (validVibhagStructure) {
      vibhagStructure.forEach((size, vibhagIndex) => {
        for (let index = 0; index < size; index += 1) expectedVibhagByMatra.push(vibhagIndex);
      });
    }
    if (validBolObjects && bols.some((bol, index) =>
      bol.matra !== index + 1 ||
      bol.vibhagIndex !== expectedVibhagByMatra[index]
    )) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: "Tala bol matras must be sequential and match the vibhag implied by vibhagStructure",
        severity: "error",
      });
    }
    if (validBolObjects && (bols.filter((bol) => bol.isSam).length !== 1 || bols.some((bol) => bol.isKhali && bol.isTali))) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: "Tala must contain one sam and may not mark a bol as both tali and khali",
        severity: "error",
      });
    }

    if (validBolObjects && bols.some((bol) => {
      if (typeof bol.bol_si !== "string" || !bol.bol_si.trim()) return true;
      const plan = planTablaBol(bol.bol_si);
      if (bol.bol_si === "-") return plan.length !== 0;
      return plan.length === 0 || plan.some((stroke) => stroke.kind === "fallback" || stroke.kind === "rest");
    })) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols.bol_si",
        message: "Every non-rest tala bol must map to a non-empty intentional tabla stroke plan",
        severity: "error",
      });
    }

    const tempo = t.practiceTempoBpm;
    if (
      !tempo ||
      typeof tempo !== "object" ||
      ![tempo.thah_bpm, tempo.dugun_bpm, tempo.chaugun_bpm].every(isSafePracticeBpm)
    ) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "practiceTempoBpm",
        message: "Application practice tempos must be finite values between 40 and 240 BPM",
        severity: "error",
      });
    }
  });

  const normalizedTalaNames = new Map<string, { id: string; canonical: boolean }>();
  talaRecords.forEach((tala) => {
    if (typeof tala.name_si !== "string" || !tala.name_si.trim()) {
      issues.push({ entityType: "Tala", entityId: tala.id, field: "name_si", message: "Tala canonical name is missing", severity: "error" });
    }
    if (!Array.isArray(tala.aliases_si) || tala.aliases_si.some((name) => typeof name !== "string" || !name.trim())) {
      issues.push({ entityType: "Tala", entityId: tala.id, field: "aliases_si", message: "Tala aliases must be an array of non-empty strings", severity: "error" });
    }
    const names = [
      ...(typeof tala.name_si === "string" ? [{ name: tala.name_si, canonical: true }] : []),
      ...(Array.isArray(tala.aliases_si) ? tala.aliases_si.filter((name): name is string => typeof name === "string").map((name) => ({ name, canonical: false })) : []),
    ];
    const seenWithinRecord = new Map<string, { canonical: boolean }>();
    names.forEach(({ name, canonical }) => {
      const normalized = identityKey(name);
      const localExisting = seenWithinRecord.get(normalized);
      if (localExisting) {
        issues.push({
          entityType: "Tala",
          entityId: tala.id,
          field: "aliases_si",
          message: localExisting.canonical !== canonical
            ? `Canonical identity '${name}' must not also be a tala alias`
            : `Duplicate identity '${name}' within one tala record`,
          severity: "error",
        });
      } else {
        seenWithinRecord.set(normalized, { canonical });
      }
      const existing = normalizedTalaNames.get(normalized);
      if (existing && existing.id !== tala.id) {
        issues.push({
          entityType: "Tala",
          entityId: tala.id,
          field: "aliases_si",
          message: `Normalized tala name/alias '${name}' collides with '${existing.id}'`,
          severity: "error",
        });
      } else {
        normalizedTalaNames.set(normalized, { id: tala.id, canonical });
      }
    });
  });

  const rawCatalogs: Array<{ type: string; records: unknown[] }> = [
    { type: "Lesson", records: Array.isArray(lessons) ? lessons : [] },
    { type: "Raga", records: Array.isArray(ragas) ? ragas : [] },
    { type: "Tala", records: Array.isArray(talas) ? talas : [] },
    { type: "Instrument", records: Array.isArray(instruments) ? instruments : [] },
    { type: "CulturalTradition", records: Array.isArray(culturalTraditions) ? culturalTraditions : [] },
    { type: "TheatreTradition", records: Array.isArray(theatreTraditions) ? theatreTraditions : [] },
    { type: "Glossary", records: glossaryData },
    { type: "LearningPath", records: learningPathsData },
    { type: "Quiz", records: quizzesData },
    { type: "ExamPaper", records: examPapersData },
    { type: "Terminology", records: terminologyData },
  ];
  issues.push(...validateCatalogIdentityContracts(
    rawCatalogs,
    glossaryData.filter((term) => getRecordPublicationDecision(term).isPublic),
    terminologyData
  ));

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
