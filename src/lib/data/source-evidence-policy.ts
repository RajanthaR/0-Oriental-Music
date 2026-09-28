import type { SourceReference } from "@/types/content";
import {
  getEvaluationState,
  getSafeEvaluationState,
  type PublicationEvaluationContext,
} from "@/lib/data/evaluation-state";
import {
  type SourceDocumentSummary,
  type SourceEvidenceDecision,
} from "@/lib/data/decision-types";
import {
  parseSourceLocator,
  type EvidenceQuality,
  type SourceDocumentRecord,
  type SourcePageQualityRecord,
} from "@/lib/evidence/source-evidence";
import { captureEvaluationValue } from "@/lib/data/snapshot-capture";
// Neutral context creation lives below every policy module; importing it from
// here (rather than from publication-policy) is what broke the policy triangle.
import { createPublicationEvaluationContext } from "@/lib/data/evaluation-context";
import { validateContentRecord, isSourceReference as isContractSourceReference } from "@/lib/validation/content-contracts";
import { cloneBoundedRecord, isRecord, normalizeRecordId, readOwnDataField } from "@/lib/shared/bounded-values";

type PublicationRecordShape = {
  [key: string]: unknown;
  gradeBand?: unknown;
  gradeBands?: unknown;
  sourceReference?: unknown;
};

export interface PublicationInput {
  id: string;
  gradeBands: string[];
  sourceReference?: SourceReference;
}

export function unsafeContextEvidence(): SourceEvidenceDecision {
  return {
    pageNumbers: [],
    quality: "missing",
    supportable: false,
    reasonCode: "unsafe-evaluation-context",
    reason: "The publication evaluation context is malformed, unregistered, or incomplete.",
  };
}
export type SourceResolution =
  | { status: "missing-source" }
  | { status: "ambiguous-source-record" }
  | { status: "missing-document" }
  | { status: "ambiguous-document" }
  | { status: "found"; document: SourceDocumentRecord };

export function resolveSourceDocument(sourceId: string, context: PublicationEvaluationContext): SourceResolution {
  if (countSourceRecordsById(sourceId, context) > 1) return { status: "ambiguous-source-record" };
  const sourceMatches = getSourceRecordsById(sourceId, context);
  if (sourceMatches.length === 0) return { status: "missing-source" };
  if (sourceMatches.length > 1) return { status: "ambiguous-source-record" };
  const source = sourceMatches[0];

  const matches = getEvaluationState(context).sourceDocuments.filter(
    (document) => document.originalFilename === source.originalFilename
  );
  if (matches.length === 0) return { status: "missing-document" };
  if (matches.length > 1) return { status: "ambiguous-document" };
  return { status: "found", document: matches[0] };
}

type LocatorParseResult = {
  pageNumbers: number[];
  mismatchedDocument: boolean;
  malformed: boolean;
};

function explicitPageReferences(pageOrSection: string, expectedFilename: string): LocatorParseResult {
  return parseSourceLocator(pageOrSection, expectedFilename);
}


function uniquePageEvidence(
  documentSlug: string,
  pageNumbers: number[],
  context: PublicationEvaluationContext,
): SourcePageQualityRecord[] | undefined {
  const requestedPages = new Set(pageNumbers);
  const evidenceByPage = new Map<number, SourcePageQualityRecord>();
  for (const page of getEvaluationState(context).sourcePageQuality) {
    if (page.documentSlug !== documentSlug || !requestedPages.has(page.pageNumber)) continue;
    if (evidenceByPage.has(page.pageNumber)) return undefined;
    evidenceByPage.set(page.pageNumber, page);
  }
  if (evidenceByPage.size !== requestedPages.size) return undefined;
  return pageNumbers.map((pageNumber) => evidenceByPage.get(pageNumber) as SourcePageQualityRecord);
}

function qualityForPages(documentSlug: string, pageNumbers: number[], context: PublicationEvaluationContext): EvidenceQuality {
  const evidence = uniquePageEvidence(documentSlug, pageNumbers, context);
  if (!evidence) return "missing";
  const qualities = evidence.map((page) => page.confidence);

  if (qualities.length === 0) return "missing";
  
  const uniqueQualities = new Set(qualities);
  if (uniqueQualities.has("D")) return uniqueQualities.size === 1 ? "D" : "mixed";
  if (uniqueQualities.has("C")) return uniqueQualities.size === 1 ? "C" : "mixed";
  if (uniqueQualities.has("B")) return uniqueQualities.size === 1 ? "B" : "mixed";
  return "A";
}

function hasReadablePages(documentSlug: string, pageNumbers: number[], context: PublicationEvaluationContext): boolean {
  const citedPages = uniquePageEvidence(documentSlug, pageNumbers, context);
  return Boolean(citedPages?.every(
    (page) => (page.confidence === "A" || page.confidence === "B") && page.hasSinhalaText
  ));
}

function getRecordShape(record: unknown): PublicationRecordShape {
  return isRecord(record) ? (record as PublicationRecordShape) : {};
}

function isSourceReference(value: unknown): value is SourceReference {
  return isContractSourceReference(value);
}

function resolveRecordSourceReference(value: PublicationRecordShape): SourceReference | undefined {
  const reference = readOwnDataField(value, "sourceReference");
  return isSourceReference(reference) ? reference : undefined;
}

export function toPublicationInput(record: unknown): PublicationInput {
  try {
    const snapshot = cloneBoundedRecord(record);
    if (!snapshot) return { id: "", gradeBands: [], sourceReference: undefined };
    const value = getRecordShape(snapshot);
    const id = readOwnDataField(value, "id");
    return {
      id: typeof id === "string" ? id : "",
      gradeBands: getGradeBands(value),
      sourceReference: resolveRecordSourceReference(value),
    };
  } catch {
    return { id: "", gradeBands: [], sourceReference: undefined };
  }
}

function getGradeBands(value: PublicationRecordShape): string[] {
  const bands = new Set<string>();

  const gradeBand = readOwnDataField(value, "gradeBand");
  const gradeBands = readOwnDataField(value, "gradeBands");
  if (typeof gradeBand === "string") bands.add(gradeBand);
  if (Array.isArray(gradeBands)) {
    gradeBands.forEach((band) => {
      if (typeof band === "string") bands.add(band);
    });
  }

  return Array.from(bands);
}

export function getSourceDocumentSummary(
  sourceId: string,
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): SourceDocumentSummary {
  try {
    if (!getSafeEvaluationState(context)) {
      return {
        reviewStatus: "Unverified / unsafe evaluation context",
        pageCount: 0,
        evidenceQuality: "missing",
      };
    }
    const resolution = resolveSourceDocument(sourceId, context);
    if (resolution.status === "missing-source") {
      return {
        reviewStatus: "No matching source record",
        pageCount: 0,
        evidenceQuality: "missing",
      };
    }
    if (resolution.status !== "found") {
      return {
        reviewStatus:
          resolution.status === "missing-document"
            ? "No matching extracted document"
            : resolution.status === "ambiguous-source-record"
            ? "Ambiguous source record ID"
            : "Ambiguous extracted document mapping",
        pageCount: 0,
        evidenceQuality: "missing",
      };
    }

    const document = resolution.document;
    const state = getEvaluationState(context);
    const pages = state.sourcePageQuality.filter((page) => page.documentSlug === document.slug);
    const quality = pages.length === 0
      ? "missing"
      : pages.some((page) => page.confidence === "D")
      ? "mixed"
      : pages.some((page) => page.confidence === "C")
      ? "C"
      : pages.some((page) => page.confidence === "B")
      ? "B"
      : "A";

    return {
      documentId: document.id,
      documentSlug: document.slug,
      reviewStatus: document.reviewStatus,
      pageCount: document.pageCount,
      evidenceQuality: quality,
    };
  } catch {
    return {
      reviewStatus: "Unverified / unsafe evaluation context",
      pageCount: 0,
      evidenceQuality: "missing",
    };
  }
}

export type SourceCorpusUnavailableReason = "unsafe-evaluation-context" | "inventory-read-failed";

export type SourceCorpusInventory =
  | {
      available: true;
      sourceRecords: number;
      sourceDocuments: number;
      sourcePages: number;
      qualityCounts: Record<string, number>;
    }
  | {
      available: false;
      reason: SourceCorpusUnavailableReason;
    };

/**
 * Report the extracted-source inventory, or an explicit unavailable state.
 *
 * The counts are only meaningful when the evaluation context is safe. A
 * malformed source-document row, page-quality row, page registry, or Tala
 * disposition registry already clears `context.safe`, and this boundary must not
 * present numbers derived from that state as an ordinary inventory.
 */
export function getSourceCorpusInventory(
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): SourceCorpusInventory {
  try {
    const state = getSafeEvaluationState(context);
    if (!state) return { available: false, reason: "unsafe-evaluation-context" };
    const qualityCounts = state.sourcePageQuality.reduce<Record<string, number>>((counts, page) => {
      counts[page.confidence] = (counts[page.confidence] || 0) + 1;
      return counts;
    }, Object.create(null) as Record<string, number>);
    return {
      available: true,
      sourceRecords: getValidatedSourceRecords(context).length,
      sourceDocuments: state.sourceDocuments.length,
      sourcePages: state.sourceDocuments.reduce((sum, document) => sum + document.pageCount, 0),
      qualityCounts,
    };
  } catch {
    return { available: false, reason: "inventory-read-failed" };
  }
}

export function evaluateSourceReference(
  reference: SourceReference | undefined,
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): SourceEvidenceDecision {
  try {
    if (!getSafeEvaluationState(context)) return unsafeContextEvidence();
    const referenceSnapshot = captureEvaluationValue(reference, false);
    const sourceIdValue = isSourceReference(referenceSnapshot) ? readOwnDataField(referenceSnapshot, "sourceId") : undefined;
    const pageOrSectionValue = isSourceReference(referenceSnapshot) ? readOwnDataField(referenceSnapshot, "pageOrSection") : undefined;
    const sourceId = typeof sourceIdValue === "string" ? sourceIdValue : undefined;
    const pageOrSection = typeof pageOrSectionValue === "string" ? pageOrSectionValue : undefined;
    if (!sourceId || !pageOrSection?.trim()) {
      return {
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "missing-source-reference",
        reason: "Claim-level source ID and exact page/section evidence are required.",
      };
    }

    const resolution = resolveSourceDocument(sourceId, context);
    if (resolution.status !== "found") {
      const isAmbiguous = resolution.status === "ambiguous-document" || resolution.status === "ambiguous-source-record";
      return {
        sourceId,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: isAmbiguous
          ? resolution.status === "ambiguous-source-record" ? "ambiguous-source-record" : "ambiguous-source-document"
          : "unknown-source",
        reason:
          resolution.status === "missing-source"
            ? "The source ID is not present in the canonical source catalog."
            : resolution.status === "missing-document"
            ? "The supplied source catalog has no matching extracted document."
            : resolution.status === "ambiguous-source-record"
            ? "The source ID maps to more than one canonical source record."
            : "The source filename maps to more than one extracted document.",
      };
    }

    const document = resolution.document;
    const locator = explicitPageReferences(pageOrSection, document.originalFilename);
    if (locator.mismatchedDocument) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "mismatched-source-document",
        reason: "The page locator names a PDF other than the document selected by its source ID.",
      };
    }

    const pageNumbers = locator.pageNumbers;
    const inRangePages = pageNumbers.filter((page) => page <= document.pageCount);
    const quality = qualityForPages(document.slug, inRangePages, context);

    if (locator.malformed || pageNumbers.length === 0) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "missing-page-evidence",
        reason: "No exact numeric page evidence was supplied.",
      };
    }

    if (inRangePages.length !== pageNumbers.length) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "page-out-of-range",
        reason: "At least one cited page number falls outside the extracted document page range.",
      };
    }

    if (document.reviewStatus !== "Source Triaged") {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: inRangePages,
        quality,
        supportable: false,
        reasonCode: "source-document-needs-review",
        reason: `The extracted document is ${document.reviewStatus}; source triage is not complete.`,
      };
    }

    if (!hasReadablePages(document.slug, inRangePages, context)) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: inRangePages,
        quality,
        supportable: false,
        reasonCode: "low-quality-page-evidence",
        reason: "The cited pages do not contain an A/B readable Sinhala evidence page.",
      };
    }

    return {
      sourceId,
      documentId: document.id,
      documentSlug: document.slug,
      pageNumbers: inRangePages,
      quality,
      supportable: true,
      reasonCode: "supportable",
      reason: "The source ID, extracted document, page range, and readable page evidence agree.",
    };
  } catch {
    return {
      pageNumbers: [],
      quality: "missing",
      supportable: false,
      reasonCode: "missing-source-reference",
      reason: "Claim-level source ID and exact page/section evidence are required.",
    };
  }
}
export type SourceRecord = {
  id: string;
  originalFilename: string;
  grades: string[];
};

export function getValidatedSourceRecords(context: PublicationEvaluationContext): SourceRecord[] {
  return context.catalogs.sources.flatMap((candidate) =>
    validateContentRecord(candidate, "source").isValid && isRecord(candidate)
      ? [candidate as unknown as SourceRecord]
      : []
  );
}

export function getSourceRecordsById(sourceId: string, context: PublicationEvaluationContext): SourceRecord[] {
  const normalizedSourceId = normalizeRecordId(sourceId);
  const matches: SourceRecord[] = [];
  for (const candidate of context.catalogs.sources) {
    if (!isRecord(candidate) || normalizeRecordId(readOwnDataField(candidate, "id")) !== normalizedSourceId) continue;
    if (!validateContentRecord(candidate, "source").isValid) continue;
    matches.push(candidate as unknown as SourceRecord);
  }
  return matches;
}

export function countSourceRecordsById(sourceId: string, context: PublicationEvaluationContext): number {
  const normalizedSourceId = normalizeRecordId(sourceId);
  let count = 0;
  for (const candidate of context.catalogs.sources) {
    if (isRecord(candidate) && normalizeRecordId(readOwnDataField(candidate, "id")) === normalizedSourceId) count += 1;
  }
  return count;
}
