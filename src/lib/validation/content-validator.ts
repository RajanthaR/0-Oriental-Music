import { SourceReference } from "@/types/content";
import sourcesData from "@/data/sources.json";
import talasData from "@/data/talas.json";
import musicalCoreFieldDispositionsData from "../../../data/musical-core-field-dispositions.json";
import {
  evaluateSourceReference,
  createPublicationEvaluationContext,
  UNKNOWN_PROVENANCE,
} from "@/lib/data/publication-policy";
import { inspectDispositionRegistry } from "@/lib/evidence/disposition-registry";
import { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";
import {
  cloneBoundedRecord,
  isRecord,
  readOwnDataField,
} from "@/lib/validation/content-contracts";
import {
  type PublicationValidationResult,
  type ValidationIssue,
} from "@/lib/validation/validation-issues";

export type { ValidationIssue, PublicationValidationResult } from "@/lib/validation/validation-issues";
export { validateMusicalCoreFieldDispositions, validateCoverageSnapshot, validatePublicCollection, validatePublicBoundary, validateForensicInventory } from "@/lib/data/publication-audit";
export { validateContent, validateForensicLedger } from "@/lib/data/catalog-integrity";

// Catalog identity contracts live in a dependency-free leaf module so the data
// layer can import them without creating a data <-> validation import cycle.
export { identityKey, validateCatalogIdentityContracts } from "@/lib/validation/identity-contracts";
export type { IdentityRecord } from "@/lib/validation/identity-contracts";

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
  const records = (value: unknown): Record<string, unknown>[] => {
    const snapshot = cloneBoundedRecord(value);
    return Array.isArray(snapshot) ? snapshot.filter(isRecord) : [];
  };
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
    const runtimeMatches = runtime.filter((entry) => readOwnDataField(entry, "id") === id);
    const manifestMatches = manifest.filter((entry) => readOwnDataField(entry, "id") === id);
    const runtimeRecord = runtimeMatches[0];
    const manifestRecord = manifestMatches[0];
    if (runtimeMatches.length > 1 || manifestMatches.length > 1) {
      addIssue(id, "id", "Selected Phase 2 source ID must be unique in both JSON catalogs");
    }
    if (!runtimeRecord || !manifestRecord) {
      addIssue(id, "id", "Selected Phase 2 source must exist in both JSON catalogs");
      return;
    }
    const filenameValue = readOwnDataField(runtimeRecord, "originalFilename");
    const filename = typeof filenameValue === "string" ? filenameValue : undefined;
    const documentMatches = filename
      ? documents.filter((entry) => readOwnDataField(entry, "originalFilename") === filename)
      : [];
    const document = documentMatches[0];
    if (documentMatches.length !== 1) {
      addIssue(id, "originalFilename", "Selected source must resolve to exactly one extracted document filename");
    }
    const runtimeValue = (field: string): unknown => readOwnDataField(runtimeRecord, field);
    const manifestValue = (field: string): unknown => readOwnDataField(manifestRecord, field);
    sharedFields.forEach((field) => {
      if (JSON.stringify(runtimeValue(field)) !== JSON.stringify(manifestValue(field))) {
        addIssue(id, field, `Runtime and manifest source metadata disagree for '${field}'`);
      }
    });
    ["publisher", "year", "location", "license"].forEach((field) => {
      if (runtimeValue(field) !== UNKNOWN_PROVENANCE || manifestValue(field) !== UNKNOWN_PROVENANCE) {
        addIssue(id, field, `Unsupported '${field}' metadata must remain explicitly unknown`);
      }
    });
    if (runtimeValue("tier") !== "Unverified source metadata" || manifestValue("tier") !== "Unverified source metadata") {
      addIssue(id, "tier", "Selected source tier must remain unverified");
    }
    if (runtimeValue("url") !== undefined || manifestValue("url") !== undefined) {
      addIssue(id, "url", "Selected source URL is not established by the supplied corpus");
    }
    if (runtimeValue("topics") !== undefined || manifestValue("topics") !== undefined) {
      addIssue(id, "topics", "Selected source topics must come only from extracted-document triage");
    }
    if (document) {
      const gradesValue = runtimeValue("grades");
      const grades = Array.isArray(gradesValue) ? gradesValue : [];
      const statedGrade = readOwnDataField(document, "statedGrade");
      if (typeof statedGrade !== "string" || !grades.includes(statedGrade)) {
        addIssue(id, "grades", "Selected source grade must match the extracted document");
      }
      const reviewStatus = readOwnDataField(document, "reviewStatus");
      const expectedStatus = reviewStatus === "Review Required"
        ? "Review Required"
        : "Source identity triaged; metadata unverified";
      if (runtimeValue("status") !== expectedStatus) {
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

