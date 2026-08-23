import { describe, expect, it } from "vitest";
import { canonicalCycleSet, cyclicModuleSets } from "./support/cycles";

/**
 * Synthetic-input tests for the shared cycle-detection engine
 * (src/test/support/cycles.ts) used by the layering guards. The guards'
 * failure proofs on the live tree were performed during the slice
 * (reintroducing real defects); this suite permanently pins the engine's
 * detection semantics against known graphs, so refactors cannot silently
 * disable detection.
 */

describe("cycle engine (synthetic graphs)", () => {
  it("finds a two-node mutual cycle", () => {
    const graph = new Map<string, Set<string>>([
      ["a.ts", new Set(["b.ts"])],
      ["b.ts", new Set(["a.ts"])],
    ]);
    expect(cyclicModuleSets(graph)).toEqual([["a.ts", "b.ts"]]);
  });

  it("finds a three-node triangle", () => {
    const graph = new Map<string, Set<string>>([
      ["a.ts", new Set(["b.ts"])],
      ["b.ts", new Set(["c.ts"])],
      ["c.ts", new Set(["a.ts"])],
    ]);
    expect(cyclicModuleSets(graph)).toEqual([["a.ts", "b.ts", "c.ts"]]);
  });

  it("finds one strongly connected set when two cycles overlap inside it", () => {
    // a<->b and b<->c plus a->c: three elementary cycles over ONE scc.
    const graph = new Map<string, Set<string>>([
      ["a.ts", new Set(["b.ts", "c.ts"])],
      ["b.ts", new Set(["a.ts", "c.ts"])],
      ["c.ts", new Set(["a.ts", "b.ts"])],
    ]);
    const sets = cyclicModuleSets(graph);
    expect(sets).toHaveLength(1);
    expect(sets[0]).toEqual(["a.ts", "b.ts", "c.ts"]);
  });

  it("finds a single self-import", () => {
    const graph = new Map<string, Set<string>>([["a.ts", new Set(["a.ts"])]]);
    expect(cyclicModuleSets(graph)).toEqual([["a.ts"]]);
  });

  it("returns nothing for a clean DAG", () => {
    const graph = new Map<string, Set<string>>([
      ["a.ts", new Set(["b.ts"])],
      ["b.ts", new Set(["c.ts"])],
      ["c.ts", new Set<string>()],
    ]);
    expect(cyclicModuleSets(graph)).toEqual([]);
  });

  it("finds two disjoint cyclic sets independently of iteration order", () => {
    const edges: Array<[string, Set<string>]> = [
      ["z.ts", new Set(["y.ts"])],
      ["y.ts", new Set(["z.ts"])],
      ["a.ts", new Set(["b.ts"])],
      ["b.ts", new Set(["c.ts"])],
      ["c.ts", new Set(["a.ts"])],
      ["solo.ts", new Set<string>()],
    ];
    for (const order of [edges, [...edges].reverse()]) {
      const graph = new Map<string, Set<string>>(order);
      const sets = cyclicModuleSets(graph).map((s) => canonicalCycleSet(s));
      expect(sets.sort()).toEqual(
        [
          canonicalCycleSet(["z.ts", "y.ts"]),
          canonicalCycleSet(["a.ts", "b.ts", "c.ts"]),
        ].sort(),
      );
    }
  });

  it("canonicalizes cycle sets order-independently", () => {
    expect(canonicalCycleSet(["b.ts", "a.ts"])).toBe(canonicalCycleSet(["a.ts", "b.ts"]));
    expect(canonicalCycleSet(["a.ts", "b.ts"])).toBe("a.ts -> b.ts");
  });
});
