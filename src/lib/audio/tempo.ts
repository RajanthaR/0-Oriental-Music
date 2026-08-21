export const MIN_PRACTICE_BPM = 40;
export const MAX_PRACTICE_BPM = 240;
export const DEFAULT_PRACTICE_BPM = 75;

export function isSafePracticeBpm(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_PRACTICE_BPM &&
    value <= MAX_PRACTICE_BPM
  );
}

export function normalizePracticeBpm(
  value: unknown,
  fallback: number = DEFAULT_PRACTICE_BPM
): number {
  if (isSafePracticeBpm(value)) return value;
  return isSafePracticeBpm(fallback) ? fallback : DEFAULT_PRACTICE_BPM;
}
