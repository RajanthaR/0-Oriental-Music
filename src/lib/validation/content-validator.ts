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
  normalizeEntityId,
  readOwnDataField,
} from "@/lib/validation/content-contracts";
import {
  baselineIssue,
  identityKey,
  type PublicationValidationResult,
  type ValidationIssue,
} from "@/lib/validation/validation-issues";

export type { ValidationIssue, PublicationValidationResult } from "@/lib/validation/validation-issues";
export { validateMusicalCoreFieldDispositions, validateCoverageSnapshot, validatePublicCollection, validatePublicBoundary, validateForensicInventory } from "@/lib/data/publication-audit";
export { validateContent, validateForensicLedger } from "@/lib/data/catalog-integrity";

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

export { identityKey };

export function validateCatalogIdentityContracts(
  catalogs: unknown,
  glossaryRecords: unknown,
  terminologyRecords: unknown
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
      const safe = cloneBoundedRecord(candidate);
      if (!safe || !isRecord(safe)) {
        issueFor(type, String(index), "record", `${type} record must be a safe plain-data object`);
        return;
      }
      result.push({ record: safe, index });
    });
    return result;
  };

  const catalogSnapshot = cloneBoundedRecord(catalogs);
  const glossarySnapshot = cloneBoundedRecord(glossaryRecords);
  const terminologySnapshot = cloneBoundedRecord(terminologyRecords);
  const catalogEntries = Array.isArray(catalogSnapshot) ? catalogSnapshot : [];
  if (!Array.isArray(catalogSnapshot)) {
    issueFor("Catalog", "catalog", "catalogs", "Catalog collection must be an array");
  }
  catalogEntries.forEach((entry, entryIndex) => {
    const entryRecord = isRecord(entry) ? entry : undefined;
    const rawType = readOwnDataField(entryRecord, "type");
    const type = typeof rawType === "string" ? rawType : `Catalog-${entryIndex}`;
    const records = readOwnDataField(entryRecord, "records");
    if (!Array.isArray(records)) {
      issueFor(type, "catalog", "records", "Catalog records must be an array");
      return;
    }
    const ids = new Set<string>();
    objectRecords(type, records).forEach(({ record, index }) => {
      const rawId = readOwnDataField(record, "id");
      const id = typeof rawId === "string" ? rawId.trim() : "";
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

  if (!Array.isArray(glossarySnapshot)) issueFor("Glossary", "catalog", "records", "Glossary records must be a safe dense array");
  if (!Array.isArray(terminologySnapshot)) issueFor("Terminology", "catalog", "records", "Terminology records must be a safe dense array");
  validateTerms("Glossary", Array.isArray(glossarySnapshot) ? glossarySnapshot : []);
  validateTerms("Terminology", Array.isArray(terminologySnapshot) ? terminologySnapshot : []);

  const identityFields = ["name_si", "name_en", "aliases_si", "title_si", "title_en"] as const;
  catalogEntries.forEach((entry, entryIndex) => {
    const entryRecord = isRecord(entry) ? entry : undefined;
    const rawType = readOwnDataField(entryRecord, "type");
    const type = typeof rawType === "string" ? rawType : `Catalog-${entryIndex}`;
    const records = readOwnDataField(entryRecord, "records");
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

