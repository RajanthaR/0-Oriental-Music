import type { EvidenceQuality } from "@/lib/evidence/source-evidence";
import { normalizeRecordId } from "@/lib/shared/bounded-values";

/**
 * Pure decision vocabulary for the publication engine.
 *
 * These types and the central quarantine list are shared by the evaluation
 * state, the source-evidence policy, the Tala disposition policy, and the
 * record decision engine. Keeping them in one leaf module lets the engine be
 * split along real seams without any module importing the others for types.
 * Runtime values are unchanged from Phase 2.
 */

export const PUBLIC_GRADE_BANDS = ["6-7", "8-9", "10-11"] as const;
export type PublicGradeBand = (typeof PUBLIC_GRADE_BANDS)[number];

export type PublicationState = "public" | "quarantined" | "needs-review";

export type SourceEvidenceFailureCode =
  | "missing-source-reference"
  | "unknown-source"
  | "ambiguous-source-record"
  | "ambiguous-source-document"
  | "source-document-needs-review"
  | "mismatched-source-document"
  | "missing-page-evidence"
  | "page-out-of-range"
  | "low-quality-page-evidence"
  | "source-grade-mismatch"
  | "unsafe-evaluation-context";

export type PublicationReasonCode =
  | "unsupported-grade"
  | "known-forensic-issue"
  | "missing-grade-scope"
  | "parent-lesson-unavailable"
  | "empty-question-set"
  | "nested-question-unpublishable"
  | "unpaired-context-claim"
  | "field-disposition-needs-review"
  | "dependent-entity-unavailable"
  | "dependency-cycle"
  | "duplicate-record-id"
  | "malformed-record"
  | "unknown-record-kind"
  | "unsafe-container"
  | "non-array"
  | "evaluation-failed"
  | SourceEvidenceFailureCode;

export type SourceEvidenceReasonCode = SourceEvidenceFailureCode | "supportable";

export interface SourceEvidenceDecision {
  sourceId?: string;
  documentId?: string;
  documentSlug?: string;
  pageNumbers: number[];
  quality: EvidenceQuality;
  supportable: boolean;
  reasonCode: SourceEvidenceReasonCode;
  reason: string;
}

export interface PublicationDecision {
  state: PublicationState;
  isPublic: boolean;
  gradeBands: string[];
  reasonCodes: PublicationReasonCode[];
  sourceEvidence: SourceEvidenceDecision;
  reviewState: "needs-review";
  nestedDispositions: NestedPublicationDisposition[];
  withheldFields: string[];
  /** The exact sanitized value public repositories may expose. */
  publicProjection?: unknown;
}

export interface NestedPublicationDisposition {
  path: string;
  isPublic: boolean;
  blocking: boolean;
  reasonCodes: PublicationReasonCode[];
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
  "les-raga-bhairav",
  "les-exam-skills",
  "raga-bhairav",
  "tala-roopak",
  "tala-lawani",
  "tala-khemta",
  "exam-al-model-01",
  "path-exam-prep",
  "term-sound",
  "term-ahata-nada",
  "term-anahata-nada",
]);

export function isKnownQuarantinedEntityId(value: unknown): boolean {
  const id = normalizeRecordId(value);
  return !!id && KNOWN_QUARANTINED_ENTITY_IDS.has(id);
}
