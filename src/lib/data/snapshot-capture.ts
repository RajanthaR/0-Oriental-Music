import { cloneBoundedRecord, deepFreezeBoundedSnapshot } from "@/lib/shared/bounded-values";

/**
 * Bounded detached capture used by the evaluation context and evidence
 * policies. Frozen snapshots preserve the Phase 2 guarantee that callers can
 * rely on captured values being deeply immutable.
 */
export function captureEvaluationValue(value: unknown, freezeSnapshot: boolean = true): unknown | undefined {
  try {
    const snapshot = cloneBoundedRecord(value);
    if (snapshot === undefined) return undefined;
    if (!freezeSnapshot) return snapshot;
    deepFreezeBoundedSnapshot(snapshot);
    return snapshot;
  } catch {
    return undefined;
  }
}

export function captureEvaluationArray(value: unknown): unknown[] | undefined {
  const snapshot = captureEvaluationValue(value);
  return Array.isArray(snapshot) ? snapshot : undefined;
}