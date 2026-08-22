/**
 * Dependency-free primitives shared by the data and validation layers.
 *
 * Phase 2 recorded an accepted structural residual: `src/lib/data/` and
 * `src/lib/validation/` became bidirectional, and three files crossed the
 * project's 1,000-line threshold. This module is the agreed cure for the
 * dependency half: it hosts genuinely shared, dependency-free primitives
 * (identity normalization, dense-array checks, bounded traversal/cloning)
 * that both layers may import without creating a cross-layer edge.
 *
 * Hard rules preserved verbatim from the bounded-graph contract:
 * - iterative own-property traversal with depth 256 / 10,000-node limits;
 * - no accessor invocation and no inherited value acceptance;
 * - every reflective failure fails closed (undefined/false), never throws;
 * - shared DAGs pass, cycles and budget overruns fail.
 *
 * This module intentionally imports nothing except types from the domain
 * model, so it can sit below both `lib/data` and `lib/validation`.
 */

import type { GradeBandType } from "@/types/content";

export const MAX_GRAPH_DEPTH = 256;
export const MAX_GRAPH_NODES = 10_000;
export const MAX_ARRAY_ITEMS = 10_000;

export const UNKNOWN_PROVENANCE = "නොදනී / සනාථ වී නැත";

export const GRADE_BANDS = ["6-7", "8-9", "10-11", "12-13"] as const;
export type RuntimeGradeBand = (typeof GRADE_BANDS)[number];

export type GraphFailureReason = "cycle" | "depth-limit" | "node-limit" | "unreadable";

export interface GraphSafetyResult {
  safe: boolean;
  nodes: number;
  reason?: GraphFailureReason;
  depth?: number;
}

const DANGEROUS_JSON_KEYS = new Set(["__proto__", "prototype", "constructor"]);

type SafeOwnEntry = { key: string; value: unknown };
type SafeOwnEntries = {
  isArray: boolean;
  length: number;
  entries: SafeOwnEntry[];
};

/**
 * Read only descriptor values from a plain JSON-shaped object.  This is the
 * trust boundary for runtime content: no accessor is invoked and no
 * inherited value is accepted.  All reflective operations are guarded since
 * a Proxy can throw from any of them.
 *
 * The enumerable traversal is intentionally incremental and bounded instead
 * of asking Reflect.ownKeys() for an unbounded key list before applying the
 * width limit.  JavaScript still lets a Proxy's ownKeys trap materialize an
 * arbitrarily large list before `for...in` can observe it; that unavoidable
 * userland limitation is why this function catches every reflective failure
 * and fails closed, rather than claiming a Proxy allocation bound.
 */
export function safeOwnEntries(value: object): SafeOwnEntries | undefined {
  try {
    const isArray = Array.isArray(value);
    const prototype = Object.getPrototypeOf(value);
    if (isArray) {
      if (prototype !== Array.prototype && prototype !== null) return undefined;
    } else if (prototype !== Object.prototype && prototype !== null) {
      return undefined;
    }

    const entries: SafeOwnEntry[] = [];
    const maximumEntries = isArray ? MAX_ARRAY_ITEMS : MAX_GRAPH_NODES;

    // `for...in` exposes enumerable string keys one at a time.  Descriptor
    // reads identify inherited keys without invoking a getter and let us
    // reject enumerable accessors before their values are touched.
    for (const key in value) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor) continue;
      if (entries.length >= maximumEntries) return undefined;
      if (DANGEROUS_JSON_KEYS.has(key) || !descriptor.enumerable || !("value" in descriptor) ||
          Object.prototype.hasOwnProperty.call(descriptor, "get") ||
          Object.prototype.hasOwnProperty.call(descriptor, "set")) return undefined;
      entries.push({ key, value: descriptor.value });
    }

    // Non-enumerable and symbol properties are outside the JSON content
    // model and are intentionally ignored.  Avoiding a second own-key scan
    // also ensures a stateful Proxy cannot change the record between capture
    // passes; every accepted field comes from the single descriptor snapshot
    // above and public projections remain explicit allowlists.

    if (!isArray) {
      return { isArray: false, length: entries.length, entries };
    }

    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (!lengthDescriptor || lengthDescriptor.enumerable || !("value" in lengthDescriptor) ||
        typeof lengthDescriptor.value !== "number" || !Number.isInteger(lengthDescriptor.value) ||
        lengthDescriptor.value < 0 || lengthDescriptor.value > MAX_ARRAY_ITEMS ||
        entries.length !== lengthDescriptor.value) return undefined;

    const indexedEntries: SafeOwnEntry[] = [];
    indexedEntries.length = lengthDescriptor.value;
    for (const entry of entries) {
      if (entry.key === "length" || !/^\d+$/.test(entry.key)) return undefined;
      const index = Number(entry.key);
      if (!Number.isSafeInteger(index) || index < 0 || index >= lengthDescriptor.value || String(index) !== entry.key || indexedEntries[index]) {
        return undefined;
      }
      indexedEntries[index] = entry;
    }
    for (let index = 0; index < indexedEntries.length; index += 1) {
      if (!indexedEntries[index]) return undefined;
    }
    return { isArray: true, length: lengthDescriptor.value, entries: indexedEntries };
  } catch {
    return undefined;
  }
}

function hasPlainDataShape(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  try {
    return !Array.isArray(value) && safeOwnEntries(value)?.isArray === false;
  } catch {
    return false;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return hasPlainDataShape(value);
}

/** Safe descriptor-value access for policy and validation helpers. */
export function readOwnDataField(value: unknown, field: string): unknown {
  if (typeof field !== "string" || DANGEROUS_JSON_KEYS.has(field) || value === null || typeof value !== "object") return undefined;
  try {
    const entries = safeOwnEntries(value);
    return entries?.entries.find((entry) => entry.key === field)?.value;
  } catch {
    return undefined;
  }
}

/** Capture a bounded, detached plain-data snapshot without invoking getters. */
export function captureSafeSnapshot<T>(value: T, knownGraphSafety?: GraphSafetyResult): T | undefined {
  if (value === null || typeof value !== "object") return value;
  try {
    if (knownGraphSafety && !knownGraphSafety.safe) return undefined;
    const rootEntries = safeOwnEntries(value as object);
    if (!rootEntries) return undefined;
    const root: unknown = rootEntries.isArray ? [] : {};
    const seen = new WeakMap<object, object>();
    const colors = new WeakMap<object, 1 | 2>();
    const stack: Array<{ source: object; target: object; depth: number; entries: SafeOwnEntry[]; index: number }> = [{
      source: value as object,
      target: root as object,
      depth: 0,
      entries: rootEntries.entries,
      index: 0,
    }];
    seen.set(value as object, root as object);
    colors.set(value as object, 1);
    let nodes = 1;
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (current.index >= current.entries.length) {
        colors.set(current.source, 2);
        stack.pop();
        continue;
      }
      const entry = current.entries[current.index++];
      const child = entry.value;
      if (child === null || typeof child !== "object") {
        (current.target as Record<string, unknown>)[entry.key] = child;
        continue;
      }
      const childDepth = current.depth + 1;
      if (childDepth > MAX_GRAPH_DEPTH) return undefined;
      const color = colors.get(child);
      if (color === 1) return undefined;
      const existing = seen.get(child);
      if (existing && color === 2) {
        (current.target as Record<string, unknown>)[entry.key] = existing;
        continue;
      }
      if (nodes >= MAX_GRAPH_NODES) return undefined;
      const childEntries = safeOwnEntries(child);
      if (!childEntries) return undefined;
      const target = childEntries.isArray ? [] : {};
      seen.set(child, target);
      colors.set(child, 1);
      nodes += 1;
      (current.target as Record<string, unknown>)[entry.key] = target;
      stack.push({ source: child, target, depth: childDepth, entries: childEntries.entries, index: 0 });
    }
    return root as T;
  } catch {
    return undefined;
  }
}

/** Iterative cycle/depth/node guard shared by all public-boundary operations. */
export function inspectGraph(value: unknown): GraphSafetyResult {
  if (value === null || typeof value !== "object") return { safe: true, nodes: 0 };
  type Frame = { value: object; depth: number; entries: SafeOwnEntry[]; index: number };
  const colors = new WeakMap<object, 1 | 2>();
  const stack: Frame[] = [];
  let nodes = 0;
  const push = (candidate: object, depth: number): GraphSafetyResult | undefined => {
    if (depth > MAX_GRAPH_DEPTH) return { safe: false, nodes, reason: "depth-limit", depth };
    const color = colors.get(candidate);
    if (color === 1) return { safe: false, nodes, reason: "cycle", depth };
    if (color === 2) return undefined;
    if (nodes >= MAX_GRAPH_NODES) return { safe: false, nodes, reason: "node-limit", depth };
    try {
      if (Array.isArray(candidate)) {
        const lengthDescriptor = Object.getOwnPropertyDescriptor(candidate, "length");
        if (lengthDescriptor && "value" in lengthDescriptor && typeof lengthDescriptor.value === "number" && lengthDescriptor.value > MAX_ARRAY_ITEMS) {
          return { safe: false, nodes, reason: "node-limit", depth };
        }
      }
    } catch {
      return { safe: false, nodes, reason: "unreadable", depth };
    }
    const own = safeOwnEntries(candidate);
    if (!own) return { safe: false, nodes, reason: "unreadable", depth };
    if (own.length > MAX_GRAPH_NODES) return { safe: false, nodes, reason: "node-limit", depth };
    nodes += 1;
    colors.set(candidate, 1);
    stack.push({ value: candidate, depth, entries: own.entries, index: 0 });
    return undefined;
  };
  const initialFailure = push(value, 0);
  if (initialFailure) return initialFailure;
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.entries.length) {
      colors.set(frame.value, 2);
      stack.pop();
      continue;
    }
    const child = frame.entries[frame.index++].value;
    if (child !== null && typeof child === "object") {
      const failure = push(child, frame.depth + 1);
      if (failure) return failure;
    }
  }
  return { safe: true, nodes };
}

/** Detached all-field copy for review/admin views; iterative and bounded. */
export function cloneBoundedRecord<T>(value: T, knownGraphSafety?: GraphSafetyResult): T | undefined {
  return captureSafeSnapshot(value, knownGraphSafety);
}

/**
 * Deep-freeze a detached plain-data snapshot iteratively. Shared DAG nodes are
 * frozen once; cycles cannot occur in a successful captureSafeSnapshot result,
 * and the seen-set keeps hostile self-referencing input from looping anyway.
 */
export function deepFreezeBoundedSnapshot(snapshot: unknown): void {
  if (!snapshot || typeof snapshot !== "object") return;
  const pending: object[] = [snapshot];
  const seen = new Set<object>();
  while (pending.length > 0) {
    const current = pending.pop() as object;
    if (seen.has(current)) continue;
    seen.add(current);
    try {
      Object.values(current).forEach((child) => {
        if (child && typeof child === "object") pending.push(child);
      });
      Object.freeze(current);
    } catch {
      // A hostile object that resists freezing simply stays unfrozen; callers
      // already treat capture failures as fail-closed values.
    }
  }
}

export function isDenseArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false;
  try {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Keep this explicit rather than using Unicode property escapes: the project
// intentionally type-checks without an ES2015 `target`, while these ranges
// cover ASCII/C1 controls, zero-width markers, and the bidi format controls
// that can make two visible IDs look identical.
const FORBIDDEN_ENTITY_ID_CONTROLS = /[\u0000-\u001F\u007F-\u009F\u00AD\u0600-\u0605\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/;

/**
 * Return one canonical identity for entity and nested-question IDs.  Invalid
 * values return undefined so callers cannot accidentally use an empty or
 * control-bearing string as an identity key.
 */
export function normalizeEntityId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.normalize("NFC").trim();
  if (!normalized || FORBIDDEN_ENTITY_ID_CONTROLS.test(normalized)) return undefined;
  return normalized;
}

export function normalizeRecordId(value: unknown): string {
  return normalizeEntityId(value) ?? "";
}

export function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isGradeBand(value: unknown): value is RuntimeGradeBand {
  return typeof value === "string" && (GRADE_BANDS as readonly string[]).includes(value);
}

export function isGradeBandArray(value: unknown, allowEmpty = false): value is RuntimeGradeBand[] {
  const snapshot = captureSafeSnapshot(value);
  return Array.isArray(snapshot) && (allowEmpty || snapshot.length > 0) && snapshot.every(isGradeBand);
}

/** Public grade bands accepted by the application browse boundary. */
export const PUBLIC_GRADE_BAND_VALUES = ["6-7", "8-9", "10-11"] as const;

/**
 * Type-compatibility bridge: the shared runtime band union is structurally
 * identical to the domain model's GradeBandType, so callers in both layers
 * keep their existing typing without this module importing anything further.
 */
export type SharedGradeBand = GradeBandType;
