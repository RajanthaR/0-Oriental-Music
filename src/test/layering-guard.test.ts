import { describe, expect, it, vi } from "vitest";
import { canonicalCycleSet, cyclicModuleSets, type Graph } from "./support/cycles";
import fs from "fs";
import path from "path";

/**
 * Layering guard: the `src/lib/data` and `src/lib/validation` layers must not
 * form a runtime import cycle.
 *
 * Phase 2 recorded the bidirectional `data` <-> `validation` dependency as
 * accepted structural residual, and the follow-up slice was tasked with
 * resolving it. Nothing verified that mechanically, so a rearranged-but-still
 * bidirectional graph read as "closed": `data/publication-audit` and
 * `data/catalog-integrity` imported `validation/content-validator`, which in
 * turn imported runtime values from `data/publication-policy` and re-exported
 * from both of those data modules.
 *
 * Cycles like that survive because the bindings are only dereferenced inside
 * function bodies at call time, not during module evaluation. They break later,
 * silently, when an import is hoisted or a binding is read at module top level.
 * This test fails the build instead.
 */

const LIB = path.join(process.cwd(), "src", "lib");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function toPosix(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}

/** Resolve an `@/...` specifier to a concrete file, or null if it isn't source. */
function resolveAlias(spec: string): string | null {
  if (!spec.startsWith("@/")) return null;
  const base = path.join(process.cwd(), "src", spec.slice(2));
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate)) return toPosix(candidate);
  }
  return null;
}

/**
 * Runtime dependency edges only. `import type` and type-only named specifiers
 * are erased at compile time and cannot participate in a runtime cycle;
 * `export ... from` re-exports very much can, so they are included.
 */
function runtimeEdges(file: string): Set<string> {
  const text = fs.readFileSync(file, "utf-8");
  const edges = new Set<string>();
  const pattern = /^(?:import|export)\s+(type\s+)?([^;]*?)from\s+["']([^"']+)["']/gm;
  for (const match of text.matchAll(pattern)) {
    const [, typeKeyword, clause, spec] = match;
    if (typeKeyword) continue;
    const inner = clause.trim();
    if (inner.startsWith("{")) {
      const specifiers = inner.replace(/^\{|\}$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      if (specifiers.length > 0 && specifiers.every((s) => s.startsWith("type "))) continue;
    }
    const resolved = resolveAlias(spec);
    if (resolved) edges.add(resolved);
  }
  return edges;
}

function buildGraph(): Graph {
  const graph: Graph = new Map();
  for (const file of sourceFiles(LIB)) graph.set(toPosix(file), runtimeEdges(file));
  return graph;
}

function layerOf(file: string): "data" | "validation" | null {
  if (file.includes("src/lib/data/")) return "data";
  if (file.includes("src/lib/validation/")) return "validation";
  return null;
}


describe("module layering", () => {
  const graph = buildGraph();
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
   * Accepted same-layer residual, now mechanically pinned (M1).
   *
   * The Phase 2 follow-up recorded a lazy same-layer factory cycle as an
   * accepted structural residual; the acceptance record itself lives in the
   * PR #4 review narrative and data/forensic-ledger.json, not in a
   * resolvable in-repo symbol — so this comment deliberately states the
   * provenance instead of citing a path#symbol anchor that does not exist.
   *
   * This slice enumerated every runtime import cycle under src/lib
   * mechanically. Correction found by switching to complete SCC
   * decomposition: the earlier DFS back-edge walk reported two separate
   * pairs, but `publication-policy`, `source-evidence-policy`, and
   * `tala-disposition-policy` are actually ONE strongly connected module set
   * of three (policy imports both policies; both import policy's context
   * factory; tala-disposition also imports source-evidence). The second
   * cyclic set is the `repository` <-> `search-engine` pair. Every
   * cyclically imported binding is dereferenced only inside function bodies
   * at call time (default-parameter factories and per-call lookups), never
   * at module top level, and each set evaluates cleanly under either import
   * order.
   *
   * That property is what this guard pins. If any new cycle appears anywhere,
   * if one of these intended sets gains or loses a member, or if a member
   * stops evaluating under reversed import order, this test fails instead of
   * drifting silently.
   */
  it("allows exactly the documented lazy same-layer cycle sets", () => {
    const allowed = new Set([
      canonicalCycleSet([
        "src/lib/data/publication-policy.ts",
        "src/lib/data/source-evidence-policy.ts",
        "src/lib/data/tala-disposition-policy.ts",
      ]),
      canonicalCycleSet([
        "src/lib/data/repository.ts",
        "src/lib/search/search-engine.ts",
      ]),
    ]);

    // SCC decomposition is complete and order-independent by construction;
    // deduplication keeps the comparison a set of distinct module sets.
    const observed = [...new Set(cyclicSets)];
    expect(observed.sort()).toEqual([...allowed].sort());
  });

  it.each([
    ["@/lib/data/publication-policy", "@/lib/data/source-evidence-policy"],
    ["@/lib/data/publication-policy", "@/lib/data/tala-disposition-policy"],
    ["@/lib/data/repository", "@/lib/search/search-engine"],
  ])("evaluates %s first without exposing an uninitialized cyclic binding", async (firstSpec, secondSpec) => {
    vi.resetModules();
    await expect(import(firstSpec)).resolves.toBeTruthy();
    await expect(import(secondSpec)).resolves.toBeTruthy();
    // Re-importing in the swapped order must not throw either: every cyclic
    // binding is call-time-only, so neither order can read `undefined`.
    vi.resetModules();
    await expect(import(secondSpec)).resolves.toBeTruthy();
    await expect(import(firstSpec)).resolves.toBeTruthy();
  });
});
