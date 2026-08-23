import { afterEach, describe, expect, it } from "vitest";
import { repository } from "@/lib/data/repository";
import { searchIndex } from "@/lib/search/search-engine";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import {
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  getRecordPublicationDecision,
  getTalaFieldDisposition,
} from "@/lib/data/publication-policy";
import {
  MAX_ARRAY_ITEMS,
  MAX_GRAPH_DEPTH,
  MAX_GRAPH_NODES,
  inspectGraph,
  validateContentRecord,
} from "@/lib/validation/content-contracts";
import { validatePublicCollection } from "@/lib/validation/content-validator";

type RawRecord = Record<string, unknown>;

const ragas = ragasData as unknown as RawRecord[];
const talas = talasData as unknown as RawRecord[];

/**
 * Build a record whose own-property graph sits at, or one step past, a bounded
 * traversal limit. Each carries a valid unique `id` so identity checks pass and
 * the graph shape is the only thing under test.
 *
 * The limits are budgets for the **whole captured graph**, so a record that is
 * individually at the exact limit pushes the combined catalog past it. Both
 * halves of that boundary are asserted below.
 */
function deepRecord(id: string, depth: number): RawRecord {
  const root: RawRecord = { id };
  let cursor: RawRecord = root;
  for (let index = 0; index < depth; index += 1) {
    const child: RawRecord = {};
    cursor.child = child;
    cursor = child;
  }
  return root;
}

function wideRecord(id: string, keys: number): RawRecord {
  const root: RawRecord = { id };
  for (let index = 0; index < keys; index += 1) root[`node-${index}`] = {};
  return root;
}

function cyclicRecord(id: string): RawRecord {
  const root: RawRecord = { id };
  root.self = root;
  return root;
}

function mutualCycleRecord(id: string): RawRecord {
  const first: RawRecord = { id };
  const second: RawRecord = { partner: first };
  first.partner = second;
  return first;
}

function sparseBearingRecord(id: string): RawRecord {
  const sparse: unknown[] = [];
  sparse.length = 8;
  return { id, arohana_swaras: sparse };
}

function oversizedArrayRecord(id: string): RawRecord {
  return { id, arohana_swaras: Array.from({ length: MAX_ARRAY_ITEMS + 1 }, () => "S") };
}

function sharedDagRecord(id: string): RawRecord {
  const shared: RawRecord = { note: "S" };
  return {
    id,
    first: shared,
    second: shared,
    third: [shared, shared],
    fourth: { nested: shared },
  };
}

/** Individually traversable, and still traversable inside the catalog. */
const WITHIN_BUDGET_SHAPES: Array<[string, () => RawRecord]> = [
  ["a deep graph inside the depth budget", () => deepRecord("raga-depth-within", 200)],
  ["a wide graph inside the node budget", () => wideRecord("raga-width-within", 4_000)],
  ["a shared DAG reused across several fields", () => sharedDagRecord("raga-shared-dag")],
  [
    "a primitive array at the exact item limit",
    () => ({ id: "raga-array-at-limit", arohana_swaras: Array.from({ length: MAX_ARRAY_ITEMS }, () => "S") }),
  ],
];

/** Individually at the exact limit, which puts the combined catalog over it. */
const AT_RECORD_LIMIT_SHAPES: Array<[string, () => RawRecord]> = [
  ["a graph at the exact depth limit", () => deepRecord("raga-depth-at-limit", MAX_GRAPH_DEPTH)],
  ["a graph at the exact node limit", () => wideRecord("raga-width-at-limit", MAX_GRAPH_NODES - 1)],
];

/** Already past a limit, or otherwise untraversable, on its own. */
const OVER_LIMIT_SHAPES: Array<[string, () => RawRecord]> = [
  ["a graph one level past the depth limit", () => deepRecord("raga-depth-over-limit", MAX_GRAPH_DEPTH + 1)],
  ["a graph one node past the node limit", () => wideRecord("raga-width-over-limit", MAX_GRAPH_NODES)],
  ["a direct self-cycle", () => cyclicRecord("raga-cycle")],
  ["a mutual cycle", () => mutualCycleRecord("raga-mutual-cycle")],
  ["a sparse nested array", () => sparseBearingRecord("raga-sparse")],
  ["an object array one item past the item limit", () => oversizedArrayRecord("raga-array-over-limit")],
];

function withInjectedRagas<T>(rows: unknown[], run: () => T): T {
  const mutable = repository as unknown as { ragas: unknown[] };
  const original = mutable.ragas;
  mutable.ragas = rows;
  try {
    return run();
  } finally {
    mutable.ragas = original;
  }
}

const publicRagaId = String(ragas[0].id);

/**
 * Exercise every public boundary that can receive a caller-shaped record: the
 * checked batch, the repository list, the repository direct lookup, search, and
 * the publication summary. No exported validator or getter may throw for any
 * input, and the hostile record must never become publicly discoverable.
 */
async function expectBoundedFailClosed(record: RawRecord): Promise<void> {
  const rows = [...ragas, record];
  const combinedIsSafe = inspectGraph(rows).safe;

  // (a) checked batch evaluation
  expect(() => evaluatePublicationBatch(rows, createPublicationEvaluationContext({ ragas: rows }))).not.toThrow();
  expect(() => getRecordPublicationDecision(record)).not.toThrow();
  expect(() => validateContentRecord(record, "raga")).not.toThrow();
  expect(() => validatePublicCollection("Raga", rows)).not.toThrow();
  expect(getRecordPublicationDecision(record).isPublic).toBe(false);
  // Yield between the synchronous boundary groups so a budget-scale record
  // cannot starve the Vitest worker's RPC channel (see the within-budget test).
  return new Promise<void>((resolve) => setTimeout(resolve, 0)).then(() => {
    return withInjectedRagasAsync(rows, () => {
      // (b) repository list
      expect(() => repository.getRagas()).not.toThrow();
      // (c) repository direct lookup
      expect(() => repository.getRagaById(publicRagaId)).not.toThrow();
      expect(() => repository.getRagaById(String(record.id))).not.toThrow();
      // (d) search
      expect(() => searchIndex.search("raga")).not.toThrow();
      expect(() => searchIndex.search(String(record.id))).not.toThrow();
      expect(() => repository.getPublicSearchCatalogs()).not.toThrow();
      // (e) publication summary
      expect(() => repository.getPublicationSummary()).not.toThrow();

      // The hostile record is never public on any surface.
      expect(repository.getRagas().some((raga) => raga.id === record.id)).toBe(false);
      expect(repository.getRagaById(String(record.id))).toBeUndefined();
      expect(searchIndex.search(String(record.id))).toEqual([]);

      const summary = repository.getPublicationSummary().ragas;
      expect(summary.raw).toBe(rows.length);

      if (combinedIsSafe) {
        // The record alone is over budget; the catalog is not. Genuine records stay
        // public and only the hostile one is withheld.
        expect(repository.getRagaById(publicRagaId)?.id).toBe(publicRagaId);
        expect(summary.public).toBe(repository.getRagas().length);
        expect(summary.public).toBeGreaterThan(0);
      } else {
        // The combined catalog graph is over budget, so the whole catalog fails
        // closed rather than serving a partially-traversed snapshot.
        expect(repository.getRagas()).toEqual([]);
        expect(repository.getRagaById(publicRagaId)).toBeUndefined();
        expect(summary.public).toBe(0);
        expect(summary.needsReview).toBe(rows.length);
      }
    });
  });
}

/** Async variant of withInjectedRagas so the yield above can restore the catalog after the probes settle. */
async function withInjectedRagasAsync<T>(rows: unknown[], run: () => T): Promise<T> {
  return withInjectedRagas(rows, run);
}

afterEach(() => {
  // A failed assertion must not leak an injected catalog into the next test.
  expect(repository.getRagas().length).toBeGreaterThan(0);
});

describe("bounded graph limits at every public boundary", () => {
  it("resolves a baseline public raga through every boundary", () => {
    expect(repository.getRagaById(publicRagaId)?.id).toBe(publicRagaId);
    expect(repository.getRagas().length).toBeGreaterThan(0);
    expect(repository.getPublicationSummary().ragas.public).toBeGreaterThan(0);
    expect(inspectGraph(ragas).safe).toBe(true);
  });

  it.each(WITHIN_BUDGET_SHAPES)(
    "keeps every boundary safe and the catalog serving for %s",
    async (_label, make) => {
      const record = make();
      const rows = [...ragas, record];
      expect(inspectGraph(record).safe).toBe(true);
      expect(inspectGraph(rows).safe).toBe(true);
      // Yield to the worker RPC loop between the synchronous boundary probes:
      // budget-scale records (~4,000 keys) keep each probe busy long enough
      // that Vitest 3 reports an onTaskUpdate transport timeout when the whole
      // sequence runs without a macrotask break. Assertions are unchanged.
      await new Promise((resolve) => setTimeout(resolve, 0));
      await expectBoundedFailClosed(record);
    },
    // Budget-scale shapes deliberately traverse every boundary repeatedly;
    // the default 5s per-test timeout cannot apply to that workload.
    //
    // History: the wide shape originally ran ~90-250s per attempt on one
    // workstation (monotonic machine variance), which forced a 600s ceiling.
    // Profiling showed 86% of samples inside safeOwnEntries: the dependency
    // walk re-enumerated every record's own keys once per key
    // (readOwnDataField per Object.keys entry), making wide records quadratic.
    // The walk now iterates one safeOwnEntries() descriptor snapshot, which is
    // linear. Measured after the fix: each budget-scale boundary probe runs in
    // tens of milliseconds and this whole file passes in ~16s wall clock (~20s
    // under full-suite parallel load). The publication-decision parity dump
    // was measured byte-identical between pristine 1d0ee6a and the fixed tree
    // (SHA256 832A96F0479E320E7A57FDBE9F153312607AEBFC3690E632A2D60AB0556BF9BC)
    // via scripts/dump-publication-parity.mjs — an earlier draft cited
    // ACA5F893..., a probe-internal intermediate hash. Expect well under 10s
    // per hosted-CI run of this file; >30s would mean the traversal went
    // superlinear again, not slow hardware.
    // 60s leaves more than an order of magnitude of headroom over measured
    // per-test cost while staying bounded; the graph shapes, boundaries, and
    // assertions are unchanged.
    60_000,
  );

  it.each(AT_RECORD_LIMIT_SHAPES)(
    "traverses %s alone but fails the combined catalog closed without throwing",
    async (_label, make) => {
      const record = make();
      const rows = [...ragas, record];
      // Exactly at the limit on its own...
      expect(inspectGraph(record).safe).toBe(true);
      // ...and one step over once the catalog wraps it.
      expect(inspectGraph(rows).safe).toBe(false);
      await expectBoundedFailClosed(record);
    },
  );

  it.each(OVER_LIMIT_SHAPES)("fails %s closed without throwing at any boundary", async (_label, make) => {
    const record = make();
    expect(inspectGraph(record).safe).toBe(false);
    const decision = getRecordPublicationDecision(record);
    expect(decision.isPublic).toBe(false);
    expect(decision.reasonCodes.length).toBeGreaterThan(0);
    await expectBoundedFailClosed(record);
  });

  it("fails a sparse outer catalog container closed at the batch and summary boundaries", () => {
    const sparseOuter: unknown[] = [...ragas];
    sparseOuter.length = ragas.length + 4;
    expect(inspectGraph(sparseOuter).safe).toBe(false);

    expect(() => evaluatePublicationBatch(sparseOuter)).not.toThrow();
    expect(evaluatePublicationBatch(sparseOuter)).toMatchObject({
      isValid: false,
      failureReason: "unsafe-container",
    });

    withInjectedRagas(sparseOuter, () => {
      expect(repository.getRagas()).toEqual([]);
      expect(repository.getRagaById(publicRagaId)).toBeUndefined();
      expect(searchIndex.search("raga")).toEqual([]);
      expect(repository.getPublicationSummary().ragas).toMatchObject({
        public: 0,
        raw: sparseOuter.length,
        failureReasons: ["unsafe-container"],
      });
    });
  });

  it("fails an oversized outer catalog container closed at the batch boundary", () => {
    const oversized = Array.from({ length: MAX_ARRAY_ITEMS + 1 }, (_, index) => ({ id: `raga-bulk-${index}` }));
    expect(() => evaluatePublicationBatch(oversized)).not.toThrow();
    expect(evaluatePublicationBatch(oversized)).toMatchObject({
      isValid: false,
      failureReason: "unsafe-container",
    });

    withInjectedRagas(oversized, () => {
      expect(repository.getRagas()).toEqual([]);
      expect(repository.getRagaById(publicRagaId)).toBeUndefined();
      expect(searchIndex.search("raga")).toEqual([]);
      expect(repository.getPublicationSummary().ragas.public).toBe(0);
    });
  });

  it("counts a shared DAG once per unique node rather than once per reference path", () => {
    const record = sharedDagRecord("raga-shared-dag-amplification");
    const inspected = inspectGraph(record);
    expect(inspected.safe).toBe(true);
    // Five reference paths to one shared object must not multiply the node count.
    expect(inspected.nodes).toBeLessThan(12);

    const rows = [...ragas, record, sharedDagRecord("raga-shared-dag-second")];
    expect(inspectGraph(rows).safe).toBe(true);
    withInjectedRagas(rows, () => {
      expect(() => repository.getRagas()).not.toThrow();
      expect(() => repository.getPublicationSummary()).not.toThrow();
      expect(repository.getRagas().some((raga) => String(raga.id).startsWith("raga-shared-dag"))).toBe(false);
      expect(repository.getRagaById(publicRagaId)?.id).toBe(publicRagaId);
    });
  });
});

describe("whole-entity Tala quarantine across every public surface", () => {
  // Every Tala in the raw catalog, enumerated explicitly so a new or renamed
  // record cannot silently escape the quarantine through a count-only check.
  const QUARANTINED_TALA_IDS = [
    "tala-dadra",
    "tala-keherwa",
    "tala-teental",
    "tala-jhaptal",
    "tala-deepchandi",
    "tala-roopak",
    "tala-lawani",
    "tala-khemta",
  ] as const;

  it("enumerates exactly the raw Tala catalog", () => {
    expect([...QUARANTINED_TALA_IDS].sort()).toEqual(talas.map((tala) => String(tala.id)).sort());
  });

  it.each(QUARANTINED_TALA_IDS)("withholds %s from every public surface", (talaId) => {
    // Direct route lookup
    expect(repository.getTalaById(talaId)).toBeUndefined();
    // Public list
    expect(repository.getTalas().some((tala) => tala.id === talaId)).toBe(false);
    // Search, by ID and by canonical Sinhala name
    expect(searchIndex.search(talaId)).toEqual([]);
    const rawName = talas.find((tala) => tala.id === talaId)?.name_si;
    expect(typeof rawName).toBe("string");
    expect(searchIndex.search(String(rawName)).some((result) => result.id === talaId)).toBe(false);
    // Public search catalogs
    expect(repository.getPublicSearchCatalogs().talas.some((tala) => tala.id === talaId)).toBe(false);
    // Field disposition never certifies the entity
    expect(getTalaFieldDisposition(talaId)?.allRequiredFieldsVerified).toBe(false);
    // Publication decision on the raw record
    const raw = talas.find((tala) => tala.id === talaId);
    expect(raw).toBeDefined();
    expect(getRecordPublicationDecision(raw).isPublic).toBe(false);
  });

  it("reports zero public Talas in the publication summary", () => {
    const summary = repository.getPublicationSummary().talas;
    expect(summary.public).toBe(0);
    expect(summary.raw).toBe(QUARANTINED_TALA_IDS.length);
    expect(repository.getTalas()).toEqual([]);
  });
});
