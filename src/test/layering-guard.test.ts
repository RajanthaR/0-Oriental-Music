import { describe, expect, it } from "vitest";
import { canonicalCycleSet, cyclicModuleSets } from "./support/cycles";
import { buildLibGraph } from "./support/lib-module-graph";

/**
 * Layering guard: the runtime import graph under `src/lib` must contain zero
 * strongly connected components.
 *
 * Phase 2 recorded the bidirectional `data` <-> `validation` dependency as an
 * accepted structural residual, and the follow-up slice resolved it. Two
 * same-layer residuals remained intentionally permitted and pinned here:
 *
 *   1. publication-policy <-> source-evidence-policy <-> tala-disposition-policy
 *      (default-parameter context factories pointing upward)
 *   2. repository <-> search-engine (search pulling default data from the
 *      repository while the repository filtered results through search)
 *
 * Both were call-time-dereferenced and safe under either import order, but
 * they were accepted residuals, not desired architecture: every cyclically
 * imported binding only worked because dereference happened to stay inside
 * function bodies. The P02 structural slice removed both SCCs at real
 * dependency seams (neutral evaluation-context module below the policies;
 * explicit-input SearchIndex composed at the repository-facing layer), so the
 * guard now demands a completely acyclic runtime graph.
 *
 * Type-only imports stay excluded from classification: they are erased at
 * compile time and cannot participate in a runtime cycle.
 */

describe("module layering", () => {
  const graph = buildLibGraph();
  const cyclicSets = cyclicModuleSets(graph).map((set) => canonicalCycleSet(set));

  it("has no runtime import cycle crossing the data/validation boundary", () => {
    const crossLayer = cyclicModuleSets(graph)
      .filter((component) => {
        const layers = new Set(component.map(layerOf).filter(Boolean));
        return layers.has("data") && layers.has("validation");
      })
      .map((component) => component.join(" -> "));

    expect(crossLayer).toEqual([]);
  });

  it("keeps catalog identity contracts in a data-free leaf module", () => {
    // The data layer imports this module, so it must never reach back into data.
    const leaf = "src/lib/validation/identity-contracts.ts";
    expect(graph.has(leaf)).toBe(true);
    const reachesData = [...(graph.get(leaf) ?? [])].filter((dep) => layerOf(dep) === "data");
    expect(reachesData).toEqual([]);
  });

  it("routes data-layer identity validation through the leaf, not content-validator", () => {
    const offenders = [...graph.entries()]
      .filter(([file]) => layerOf(file) === "data")
      .filter(([, deps]) => [...deps].some((d) => d.endsWith("validation/content-validator.ts")))
      .map(([file]) => file);

    expect(offenders).toEqual([]);
  });

  /**
   * Zero-tolerance pin. The two previously documented same-layer residual SCCs
   * were eliminated by the P02 structural slice; any runtime cycle anywhere
     under src/lib now fails the build instead of being added to an allowlist.
   */
  it("permits zero runtime import cycles anywhere under src/lib", () => {
    expect(cyclicSets).toEqual([]);
  });

  /**
   * Negative fixture proving this guard still bites: re-introducing the exact
   * back-edge this slice removed (search engine pulling default data from the
   * repository) recreates the historical SCC through the live
   * repository -> engine filtering edge, and the zero-cycle pin above reports
   * it as a failure.
   */
  it("fails when a new runtime import cycle is introduced", () => {
    const engine = "src/lib/search/search-engine.ts";
    const mutated = new Map(graph);
    mutated.set(engine, new Set([...(graph.get(engine) ?? []), "src/lib/data/repository.ts"]));
    const injected = cyclicModuleSets(mutated).map((component) => canonicalCycleSet(component));
    expect(injected).toEqual([
      canonicalCycleSet(["src/lib/data/repository.ts", engine]),
    ]);
    // And the live graph itself must not contain the back-edge.
    expect([...(graph.get(engine) ?? [])]).not.toContain("src/lib/data/repository.ts");
  });

  /**
   * Negative fixture pinning the type-only exclusion rule: mutual imports that
   * carry no runtime bindings must not enter the graph, so a type-level
   * dependency can never be misreported as a runtime cycle.
   */
  it("classifies type-only imports as non-runtime edges", async () => {
    const { runtimeEdgesFromSource } = await import("./support/lib-module-graph");
    const typeOnlyPair = [
      'import type { Raga } from "@/lib/types/content";',
      'import { type Lesson } from "@/lib/types/content";',
    ].join("\n");
    expect(runtimeEdgesFromSource(typeOnlyPair).size).toBe(0);

    // The value form of the same specifier IS a runtime edge: flipping one
    // import back to a value import must produce an edge, proving the rule
    // distinguishes the two rather than dropping all imports of that module.
    const valueImport = [
      'import { repository } from "@/lib/data/repository";',
    ].join("\n");
    expect(runtimeEdgesFromSource(valueImport)).toEqual(
      new Set(["src/lib/data/repository.ts"]),
    );
  });
});

function layerOf(file: string): "data" | "validation" | null {
  if (file.includes("src/lib/data/")) return "data";
  if (file.includes("src/lib/validation/")) return "validation";
  return null;
}
