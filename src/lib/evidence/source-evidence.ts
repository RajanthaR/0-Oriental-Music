import sourceDocumentsData from "../../../data/source-documents.json";
import sourcePageQualityData from "../../../data/source-page-quality.json";
import musicalCoreFieldDispositionsData from "../../../data/musical-core-field-dispositions.json";
import { inspectDispositionRegistry } from "@/lib/evidence/disposition-registry";
import {
  cloneBoundedRecord,
  deepFreezeBoundedSnapshot,
  isRecord,
  readOwnDataField,
} from "@/lib/shared/bounded-values";

/**
 * Extracted-document and page-quality evidence projection.
 *
 * This neutral `lib/evidence` layer owns the raw forensic registries (source
 * documents, page quality, Tala field dispositions) and the bounded detached
 * snapshot they feed. It sits below both the publication policy
 * (`lib/data`) and the validators (`lib/validation`): it imports only plain
 * data, the shared bounded primitives, and the shared disposition-registry
 * contract — never either consumer — so both layers evaluate identical
 * evidence without a cross-layer dependency.
 *
 * Freshness: every call re-captures the registries through the bounded graph
 * boundary, exactly as the pre-refactor per-operation capture did. Nothing is
 * memoized across calls; Phase 2 explicitly removed summary/context
 * memoization and the parity suites prove freshness by mutating these JSON
 * imports between operations.
 */

export type EvidenceQuality = "A" | "B" | "C" | "D" | "mixed" | "missing";

export type SourceDocumentRecord = {
  id: string;
  slug: string;
  originalFilename: string;
  pageCount: number;
  reviewStatus: string;
};

export type SourcePageQualityRecord = {
  documentSlug: string;
  pageNumber: number;
  confidence: EvidenceQuality;
  hasSinhalaText: boolean;
};

export function isSourceDocumentRecord(value: unknown): value is SourceDocumentRecord {
  const hasText = (field: string) => {
    const candidate = isRecord(value) ? readOwnDataField(value, field) : undefined;
    return typeof candidate === "string" && candidate.trim().length > 0;
  };
  return isRecord(value) && hasText("id") && hasText("slug") && hasText("originalFilename") &&
    Number.isSafeInteger(readOwnDataField(value, "pageCount")) &&
    (readOwnDataField(value, "pageCount") as number) > 0 && hasText("reviewStatus");
}

export function isSourcePageQualityRecord(value: unknown): value is SourcePageQualityRecord {
  const confidence = isRecord(value) ? readOwnDataField(value, "confidence") : undefined;
  const documentSlug = isRecord(value) ? readOwnDataField(value, "documentSlug") : undefined;
  return isRecord(value) && typeof documentSlug === "string" && documentSlug.trim().length > 0 &&
    Number.isSafeInteger(readOwnDataField(value, "pageNumber")) &&
    (readOwnDataField(value, "pageNumber") as number) > 0 &&
    (confidence === "A" || confidence === "B" || confidence === "C" || confidence === "D") &&
    typeof readOwnDataField(value, "hasSinhalaText") === "boolean";
}

export function hasValidPageQualityRegistry(
  documents: SourceDocumentRecord[],
  pages: SourcePageQualityRecord[],
): boolean {
  const pageCountsBySlug = new Map<string, number>();
  for (const document of documents) {
    if (pageCountsBySlug.has(document.slug)) return false;
    pageCountsBySlug.set(document.slug, document.pageCount);
  }
  const seenPages = new Set<string>();
  for (const page of pages) {
    const pageCount = pageCountsBySlug.get(page.documentSlug);
    const key = `${page.documentSlug}:${page.pageNumber}`;
    if (pageCount === undefined || page.pageNumber > pageCount || seenPages.has(key)) return false;
    seenPages.add(key);
  }
  return true;
}

// Publication gating and forensic validation share one registry contract. An
// incomplete, conflicting, or malformed registry — a wrong policy, drifted
// required-field lists, an unresolvable issue anchor, a bad status, or a
// duplicate/denormalized talaId — makes the evaluation context unsafe rather
// than leaving publication gating with a weaker subset of the rules.
export function hasCompleteDispositionRegistry(value: unknown): boolean {
  try {
    return inspectDispositionRegistry(value).ok;
  } catch {
    return false;
  }
}

export type EvidenceRegistrySnapshot = {
  readonly sourceDocuments: readonly SourceDocumentRecord[];
  readonly sourcePageQuality: readonly SourcePageQualityRecord[];
  /** Detached disposition-registry value; undefined when capture failed. */
  readonly musicalCoreFieldDispositions: unknown;
  /** True only when every registry captured completely and passed its contract. */
  readonly safe: boolean;
};

/**
 * Capture one fresh, detached, deep-frozen snapshot of the three raw forensic
 * registries. The pre-refactor implementation froze captured values inside
 * `captureEvaluationValue`; this preserves that guarantee while never caching
 * across calls.
 */
export function getEvidenceRegistrySnapshot(): EvidenceRegistrySnapshot {
  const documents = cloneBoundedRecord(sourceDocumentsData);
  const pages = cloneBoundedRecord(sourcePageQualityData);
  const dispositions = cloneBoundedRecord(musicalCoreFieldDispositionsData);
  const sourceDocuments = (documents ?? []) as SourceDocumentRecord[];
  const sourcePages = (pages ?? []) as SourcePageQualityRecord[];
  const safe =
    !!documents && documents.every(isSourceDocumentRecord) &&
    !!pages && pages.every(isSourcePageQualityRecord) &&
    hasValidPageQualityRegistry(sourceDocuments, sourcePages) &&
    dispositions !== undefined && hasCompleteDispositionRegistry(dispositions);
  if (documents) deepFreezeBoundedSnapshot(documents);
  if (pages) deepFreezeBoundedSnapshot(pages);
  if (dispositions) deepFreezeBoundedSnapshot(dispositions);
  return Object.freeze({
    sourceDocuments: Object.freeze(sourceDocuments),
    sourcePageQuality: Object.freeze(sourcePages),
    musicalCoreFieldDispositions: dispositions,
    safe,
  });
}

export type LocatorParseResult = {
  pageNumbers: number[];
  mismatchedDocument: boolean;
  malformed: boolean;
};

const MAX_LOCATOR_LENGTH = 4_096;
const MAX_LOCATOR_TERMS = 256;
const MAX_LOCATOR_PAGES = 1_024;

/**
 * Exact-locator parser: consumes an exact expected filename plus one bounded
 * integer page clause. Filename-free, prefixed/suffixed, format-control,
 * confusable, extra-document, and malformed-page forms all fail closed.
 */
export function parseSourceLocator(pageOrSection: string, expectedFilename: string): LocatorParseResult {
  if (typeof pageOrSection !== "string" || typeof expectedFilename !== "string") {
    return { pageNumbers: [], mismatchedDocument: false, malformed: true };
  }
  if (pageOrSection.length > MAX_LOCATOR_LENGTH || expectedFilename.length > MAX_LOCATOR_LENGTH) {
    return { pageNumbers: [], mismatchedDocument: false, malformed: true };
  }
  if (/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/.test(pageOrSection) || /[\uFF0E\uFE52\uFF61]/.test(pageOrSection)) {
    return { pageNumbers: [], mismatchedDocument: false, malformed: true };
  }

  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pageList = "([0-9]+(?:\\s*[-–]\\s*[0-9]+)?(?:\\s*,\\s*[0-9]+(?:\\s*[-–]\\s*[0-9]+)?)*)";
  const exactPattern = new RegExp(
    `^${escapeRegex(expectedFilename.trim())}\\s+(?:පිටුව|පිටු|pdf\\s*pages?|pages?)\\s+${pageList}$`,
    "i"
  );
  const exactMatch = pageOrSection.trim().match(exactPattern);
  if (!exactMatch) {
    const pdfTokenCount = Array.from(pageOrSection.matchAll(/\.pdf/gi)).length;
    const startsWithExpected = pageOrSection.trim().toLocaleLowerCase().startsWith(expectedFilename.trim().toLocaleLowerCase());
    return { pageNumbers: [], mismatchedDocument: pdfTokenCount > 1 || (pdfTokenCount === 1 && !startsWithExpected), malformed: true };
  }

  const pageClause = exactMatch[1];
  if (!pageClause) {
    return { pageNumbers: [], mismatchedDocument: false, malformed: true };
  }
  const pageTokens = pageClause.split(",");
  if (pageTokens.length > MAX_LOCATOR_TERMS) {
    return { pageNumbers: [], mismatchedDocument: false, malformed: true };
  }
  const pages = new Set<number>();
  for (const token of pageTokens) {
    const range = token.trim().split(/\s*[-–]\s*/);
    const start = Number(range[0]);
    const end = range[1] === undefined ? start : Number(range[1]);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end - start > 1000) {
      return { pageNumbers: [], mismatchedDocument: false, malformed: true };
    }
    if (pages.size + (end - start + 1) > MAX_LOCATOR_PAGES) {
      return { pageNumbers: [], mismatchedDocument: false, malformed: true };
    }
    for (let page = start; page <= end; page += 1) pages.add(page);
  }

  return {
    pageNumbers: Array.from(pages).sort((a, b) => a - b),
    mismatchedDocument: false,
    malformed: false,
  };
}

/** The canonical Sinhala unknown/unverified provenance label. */
export const UNKNOWN_PROVENANCE_LABEL = "නොදනී / සනාථ වී නැත";

/** Public source rows may expose only this explicit unknown/unverified shape. */
export const SANITIZED_SOURCE_METADATA: Readonly<Record<string, string>> = Object.freeze({
  publisher: UNKNOWN_PROVENANCE_LABEL,
  year: UNKNOWN_PROVENANCE_LABEL,
  location: UNKNOWN_PROVENANCE_LABEL,
  license: UNKNOWN_PROVENANCE_LABEL,
  tier: "මූලාශ්‍ර වාර්තාව (සනාථ නොකළ)",
  status: "Unverified / source review pending",
});

/** Shared helper for the exact JSON equality used by metadata drift checks. */
export function jsonValuesMatch(left: unknown, right: unknown): boolean {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}
