import type { ReviewMetadata, SourceReference } from "@/types/content";
import sourcesData from "@/data/sources.json";
import sourceDocumentsData from "../../../data/source-documents.json";
import sourcePageQualityData from "../../../data/source-page-quality.json";

export const UNKNOWN_PROVENANCE = "නොදනී / සනාථ වී නැත";

export const PUBLIC_GRADE_BANDS = ["6-7", "8-9", "10-11"] as const;
export type PublicGradeBand = (typeof PUBLIC_GRADE_BANDS)[number];

export type PublicationState = "public" | "quarantined" | "needs-review";
export type EvidenceQuality = "A" | "B" | "C" | "D" | "mixed" | "missing";

export type PublicationReasonCode =
  | "unsupported-grade"
  | "known-forensic-issue"
  | "missing-grade-scope"
  | "missing-source-reference"
  | "unknown-source"
  | "ambiguous-source-document"
  | "source-document-needs-review"
  | "missing-page-evidence"
  | "page-out-of-range"
  | "low-quality-page-evidence";

export interface SourceEvidenceDecision {
  sourceId?: string;
  documentId?: string;
  documentSlug?: string;
  pageNumbers: number[];
  quality: EvidenceQuality;
  supportable: boolean;
  reason: string;
}

export interface PublicationDecision {
  state: PublicationState;
  isPublic: boolean;
  gradeBands: string[];
  reasonCodes: PublicationReasonCode[];
  sourceEvidence: SourceEvidenceDecision;
  reviewState: "needs-review";
}

export interface SourceDocumentSummary {
  documentId?: string;
  documentSlug?: string;
  reviewStatus: string;
  pageCount: number;
  evidenceQuality: EvidenceQuality;
}

/**
 * These identifiers are intentionally retained in the raw datasets and are
 * blocked centrally until a later phase supplies claim-level correction
 * evidence. A route must never decide this independently.
 */
export const KNOWN_QUARANTINED_ENTITY_IDS = new Set([
  "les-intro-01",
  "les-tala-dadra",
  "les-raga-bhairav",
  "les-exam-skills",
  "raga-bilawal",
  "raga-bhairav",
  "tala-dadra",
  "tala-roopak",
  "tala-lawani",
  "term-nada",
  "term-sound",
  "term-ahata-nada",
  "term-anahata-nada",
  "exam-al-model-01",
  "path-exam-prep",
]);

const sourceDocuments = sourceDocumentsData as Array<{
  id: string;
  slug: string;
  originalFilename: string;
  pageCount: number;
  reviewStatus: string;
}>;

const sourcePageQuality = sourcePageQualityData as Array<{
  documentSlug: string;
  pageNumber: number;
  confidence: EvidenceQuality;
  hasSinhalaText: boolean;
}>;

const sourceRecords = sourcesData as Array<{
  id: string;
  originalFilename: string;
  grades: string[];
}>;

function numericPageReferences(pageOrSection: string): number[] {
  return Array.from(new Set((pageOrSection.match(/\d+/g) || []).map(Number))).filter(
    (page) => Number.isInteger(page) && page > 0
  );
}

function qualityForPages(documentSlug: string, pageNumbers: number[]): EvidenceQuality {
  const qualities = sourcePageQuality
    .filter((page) => page.documentSlug === documentSlug && pageNumbers.includes(page.pageNumber))
    .map((page) => page.confidence);

  if (qualities.length === 0) return "missing";
  if (qualities.includes("D")) return qualities.length === 1 ? "D" : "mixed";
  if (qualities.includes("C")) return qualities.length === 1 ? "C" : "mixed";
  if (qualities.includes("B")) return qualities.length === 1 ? "B" : "mixed";
  return "A";
}

function hasReadablePage(documentSlug: string, pageNumbers: number[]): boolean {
  return sourcePageQuality.some(
    (page) =>
      page.documentSlug === documentSlug &&
      pageNumbers.includes(page.pageNumber) &&
      (page.confidence === "A" || page.confidence === "B") &&
      page.hasSinhalaText
  );
}

export function getSourceDocumentSummary(sourceId: string): SourceDocumentSummary {
  const source = sourceRecords.find((record) => record.id === sourceId);
  if (!source) {
    return {
      reviewStatus: "No matching source record",
      pageCount: 0,
      evidenceQuality: "missing",
    };
  }

  const matches = sourceDocuments.filter(
    (document) => document.originalFilename === source.originalFilename
  );
  if (matches.length !== 1) {
    return {
      reviewStatus: matches.length === 0 ? "No matching extracted document" : "Ambiguous extracted document mapping",
      pageCount: 0,
      evidenceQuality: "missing",
    };
  }

  const document = matches[0];
  const pages = sourcePageQuality.filter((page) => page.documentSlug === document.slug);
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
}

export function getSourceCorpusInventory() {
  const qualityCounts = sourcePageQuality.reduce<Record<string, number>>((counts, page) => {
    counts[page.confidence] = (counts[page.confidence] || 0) + 1;
    return counts;
  }, {});
  return {
    sourceRecords: sourceRecords.length,
    sourceDocuments: sourceDocuments.length,
    sourcePages: sourceDocuments.reduce((sum, document) => sum + document.pageCount, 0),
    qualityCounts,
  };
}

export function evaluateSourceReference(
  reference: SourceReference | undefined
): SourceEvidenceDecision {
  if (!reference || !reference.sourceId || !reference.pageOrSection?.trim()) {
    return {
      pageNumbers: [],
      quality: "missing",
      supportable: false,
      reason: "Claim-level source ID and exact page/section evidence are required.",
    };
  }

  const source = sourceRecords.find((record) => record.id === reference.sourceId);
  if (!source) {
    return {
      sourceId: reference.sourceId,
      pageNumbers: [],
      quality: "missing",
      supportable: false,
      reason: "The source ID is not present in the canonical source catalog.",
    };
  }

  const matches = sourceDocuments.filter(
    (document) => document.originalFilename === source.originalFilename
  );
  if (matches.length !== 1) {
    return {
      sourceId: reference.sourceId,
      pageNumbers: [],
      quality: "missing",
      supportable: false,
      reason:
        matches.length === 0
          ? "The supplied source catalog has no matching extracted document."
          : "The source filename maps to more than one extracted document.",
    };
  }

  const document = matches[0];
  const pageNumbers = numericPageReferences(reference.pageOrSection);
  const inRangePages = pageNumbers.filter((page) => page <= document.pageCount);
  const quality = qualityForPages(document.slug, inRangePages);

  if (document.reviewStatus !== "Source Triaged") {
    return {
      sourceId: reference.sourceId,
      documentId: document.id,
      documentSlug: document.slug,
      pageNumbers: inRangePages,
      quality,
      supportable: false,
      reason: `The extracted document is ${document.reviewStatus}; source triage is not complete.`,
    };
  }

  if (pageNumbers.length === 0) {
    return {
      sourceId: reference.sourceId,
      documentId: document.id,
      documentSlug: document.slug,
      pageNumbers: [],
      quality: "missing",
      supportable: false,
      reason: "No exact numeric page evidence was supplied.",
    };
  }

  if (inRangePages.length === 0) {
    return {
      sourceId: reference.sourceId,
      documentId: document.id,
      documentSlug: document.slug,
      pageNumbers: [],
      quality: "missing",
      supportable: false,
      reason: "All cited page numbers fall outside the extracted document page range.",
    };
  }

  if (!hasReadablePage(document.slug, inRangePages)) {
    return {
      sourceId: reference.sourceId,
      documentId: document.id,
      documentSlug: document.slug,
      pageNumbers: inRangePages,
      quality,
      supportable: false,
      reason: "The cited pages do not contain an A/B readable Sinhala evidence page.",
    };
  }

  return {
    sourceId: reference.sourceId,
    documentId: document.id,
    documentSlug: document.slug,
    pageNumbers: inRangePages,
    quality,
    supportable: true,
    reason: "The source ID, extracted document, page range, and readable page evidence agree.",
  };
}

function getGradeBands(record: unknown): string[] {
  if (!record || typeof record !== "object") return [];
  const value = record as Record<string, unknown>;
  const bands = new Set<string>();

  if (typeof value.gradeBand === "string") bands.add(value.gradeBand);
  if (Array.isArray(value.gradeBands)) {
    value.gradeBands.forEach((band) => {
      if (typeof band === "string") bands.add(band);
    });
  }

  ["partA_MCQ", "partB_Structured"].forEach((field) => {
    const questions = value[field];
    if (!Array.isArray(questions)) return;
    questions.forEach((question) => {
      if (!question || typeof question !== "object") return;
      const questionBands = (question as Record<string, unknown>).gradeBands;
      if (!Array.isArray(questionBands)) return;
      questionBands.forEach((band) => {
        if (typeof band === "string") bands.add(band);
      });
    });
  });

  if (bands.size === 0) {
    const reference = value.sourceReference;
    if (reference && typeof reference === "object") {
      const sourceId = (reference as Record<string, unknown>).sourceId;
      if (typeof sourceId === "string") {
        const source = sourceRecords.find((record) => record.id === sourceId);
        source?.grades.forEach((band) => bands.add(band));
      }
    }
  }

  return Array.from(bands);
}

export function getRecordGradeBands(record: unknown): string[] {
  return getGradeBands(record);
}

function hasUnsupportedGrade(gradeBands: string[]): boolean {
  return gradeBands.includes("12-13");
}

function hasPublicGrade(gradeBands: string[]): boolean {
  return gradeBands.some((band) => PUBLIC_GRADE_BANDS.includes(band as PublicGradeBand) || band === "7");
}

export function getPublicationDecision(record: unknown): PublicationDecision {
  const value = (record || {}) as Record<string, unknown>;
  const id = typeof value.id === "string" ? value.id : "";
  const gradeBands = getGradeBands(record);
  const sourceReference = value.sourceReference as SourceReference | undefined;
  const sourceEvidence = evaluateSourceReference(sourceReference);
  const reasonCodes: PublicationReasonCode[] = [];

  if (hasUnsupportedGrade(gradeBands)) reasonCodes.push("unsupported-grade");
  if (KNOWN_QUARANTINED_ENTITY_IDS.has(id)) reasonCodes.push("known-forensic-issue");
  if (gradeBands.length === 0) reasonCodes.push("missing-grade-scope");
  if (!sourceReference) reasonCodes.push("missing-source-reference");
  if (sourceReference && !sourceEvidence.sourceId) reasonCodes.push("unknown-source");
  if (sourceEvidence.reason.includes("more than one")) reasonCodes.push("ambiguous-source-document");
  if (sourceEvidence.reason.includes("no matching extracted document")) reasonCodes.push("unknown-source");
  if (sourceEvidence.reason.includes("page evidence")) reasonCodes.push("missing-page-evidence");
  if (sourceEvidence.reason.includes("outside")) reasonCodes.push("page-out-of-range");
  if (sourceEvidence.reason.includes("readable Sinhala")) reasonCodes.push("low-quality-page-evidence");
  if (sourceEvidence.reason.includes("source triage")) reasonCodes.push("source-document-needs-review");

  const quarantined = hasUnsupportedGrade(gradeBands) || KNOWN_QUARANTINED_ENTITY_IDS.has(id);
  const publicByEvidence = hasPublicGrade(gradeBands) && sourceEvidence.supportable;
  const state: PublicationState = quarantined
    ? "quarantined"
    : publicByEvidence
    ? "public"
    : "needs-review";

  return {
    state,
    isPublic: state === "public",
    gradeBands,
    reasonCodes: Array.from(new Set(reasonCodes)),
    sourceEvidence,
    reviewState: "needs-review",
  };
}

export function sanitizeReviewMetadata(metadata: ReviewMetadata | undefined): ReviewMetadata {
  return {
    status: "Needs Revision",
    reviewer: UNKNOWN_PROVENANCE,
    reviewDate: UNKNOWN_PROVENANCE,
    lastVerifiedDate: UNKNOWN_PROVENANCE,
    changeNotes:
      "Publication containment baseline: the previous review metadata is not evidence of a completed review.",
    license: UNKNOWN_PROVENANCE,
    reuseStatus: "Unknown / Unverified",
  };
}

export function sanitizePublicRecord<T>(record: T): T {
  if (!record || typeof record !== "object") return record;
  const value = { ...(record as Record<string, unknown>) };
  if ("reviewMetadata" in value) {
    value.reviewMetadata = sanitizeReviewMetadata(value.reviewMetadata as ReviewMetadata | undefined);
  }
  if ("published" in value) value.published = false;
  return value as T;
}

export function isPublicGradeBand(value: string): value is PublicGradeBand {
  return PUBLIC_GRADE_BANDS.includes(value as PublicGradeBand);
}
