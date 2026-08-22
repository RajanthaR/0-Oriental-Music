/**
 * Dependency-free catalog identity contracts.
 *
 * This module deliberately imports only from within the validation layer
 * (`content-contracts` and `validation-issues`, both dependency-free leaves).
 * It must never import from `@/lib/data/**`.
 *
 * Rationale: `src/lib/data/catalog-integrity.ts` and
 * `src/lib/data/publication-audit.ts` need `validateCatalogIdentityContracts`.
 * While it lived in `content-validator.ts` — which imports runtime values from
 * `@/lib/data/publication-policy` and re-exports from two data modules — those
 * imports formed a runtime `data` <-> `validation` import cycle. Keeping this
 * function in a leaf module lets the data layer depend on validation in one
 * direction only. `src/test/layering-guard.test.ts` enforces this mechanically.
 */

import {
  cloneBoundedRecord,
  isRecord,
  readOwnDataField,
} from "@/lib/validation/content-contracts";
import { identityKey, type ValidationIssue } from "@/lib/validation/validation-issues";

export { identityKey };

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
