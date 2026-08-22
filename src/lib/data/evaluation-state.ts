import {
  isRecord,
  normalizeRecordId,
  readOwnDataField,
} from "@/lib/shared/bounded-values";
import type { ContentEntityKind } from "@/lib/validation/content-contracts";
import type { SourceDocumentRecord, SourcePageQualityRecord } from "@/lib/evidence/source-evidence";
import type { PublicationDecision } from "@/lib/data/decision-types";

/**
 * Per-operation evaluation state for the publication engine.
 *
 * All decisions belonging to one public operation share these detached
 * inputs. This prevents identity, evidence, dependency, and projection code
 * from observing different versions of caller-owned or mutable catalog data.
 * Mutable indexes, snapshots, the recursion stack, and the per-operation memo
 * stay private to this module behind a WeakMap keyed by the frozen context.
 */

export type PublicationCatalogSnapshot = {
  readonly sources: readonly unknown[];
  readonly lessons: readonly unknown[];
  readonly ragas: readonly unknown[];
  readonly talas: readonly unknown[];
  readonly instruments: readonly unknown[];
  readonly culturalTraditions: readonly unknown[];
  readonly theatreTraditions: readonly unknown[];
  readonly glossary: readonly unknown[];
  readonly learningPaths: readonly unknown[];
  readonly quizzes: readonly unknown[];
  readonly examPapers: readonly unknown[];
};

export type PublicationCatalogInputs = Partial<Record<keyof PublicationCatalogSnapshot, unknown>>;

export interface PublicationEvaluationContext {
  readonly catalogs: PublicationCatalogSnapshot;
  readonly safe: boolean;
}

export type PublicationEvaluationState = {
  sourceDocuments: SourceDocumentRecord[];
  sourcePageQuality: SourcePageQualityRecord[];
  musicalCoreFieldDispositions: unknown;
  knownKinds: Map<string, ContentEntityKind | "ambiguous">;
  snapshots: WeakMap<object, Record<string, unknown>>;
  stack: Set<string>;
  memo: WeakMap<object, PublicationDecision>;
  rawCounts: Readonly<Record<keyof PublicationCatalogSnapshot, number>>;
};

const PUBLICATION_CONTEXT_STATE = new WeakMap<PublicationEvaluationContext, PublicationEvaluationState>();

export function getEvaluationState(context: PublicationEvaluationContext): PublicationEvaluationState {
  const state = PUBLICATION_CONTEXT_STATE.get(context);
  if (!state) throw new Error("Unknown publication evaluation context.");
  return state;
}

export function getSafeEvaluationState(context: PublicationEvaluationContext): PublicationEvaluationState | undefined {
  try {
    if (!context || context.safe !== true) return undefined;
    return PUBLICATION_CONTEXT_STATE.get(context);
  } catch {
    return undefined;
  }
}

export function registerKnownKinds(
  knownKinds: Map<string, ContentEntityKind | "ambiguous">,
  kind: ContentEntityKind,
  records: readonly unknown[],
): void {
  records.forEach((record) => {
    if (!isRecord(record)) return;
    const id = readOwnDataField(record, "id");
    const normalizedId = normalizeRecordId(id);
    if (!normalizedId) return;
    const previous = knownKinds.get(normalizedId);
    knownKinds.set(normalizedId, previous ? "ambiguous" : kind);
  });
}

export function setPublicationEvaluationState(
  context: PublicationEvaluationContext,
  state: PublicationEvaluationState,
): void {
  PUBLICATION_CONTEXT_STATE.set(context, state);
}
