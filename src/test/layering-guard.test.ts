import { describe, expect, it } from "vitest";
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

type Graph = Map<string, Set<string>>;

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

/** Every cycle through `node`, reported as readable path chains. */
function findCycles(graph: Graph): string[][] {
  const cycles: string[][] = [];
  const stack: string[] = [];
  const onStack = new Set<string>();
  const done = new Set<string>();

  const walk = (node: string): void => {
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) ?? []) {
      if (onStack.has(next)) {
        cycles.push([...stack.slice(stack.indexOf(next)), next]);
      } else if (!done.has(next) && graph.has(next)) {
        walk(next);
      }
    }
    stack.pop();
    onStack.delete(node);
    done.add(node);
  };

  for (const node of graph.keys()) if (!done.has(node)) walk(node);
  return cycles;
}

describe("module layering", () => {
  const graph = buildGraph();

  it("has no runtime import cycle crossing the data/validation boundary", () => {
    const crossLayer = findCycles(graph)
      .filter((cycle) => {
        const layers = new Set(cycle.map(layerOf).filter(Boolean));
        return layers.has("data") && layers.has("validation");
      })
      .map((cycle) => cycle.join(" -> "));

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
});
