/**
 * Shared runtime import-graph builder for the layering guards.
 *
 * Used by src/test/layering-guard.test.ts to scan the live `src/lib` tree and
 * by its in-file negative fixtures, so the edge-classification rules have
 * exactly one implementation.
 */

import fs from "fs";
import path from "path";
import type { Graph } from "./cycles";

export const LIB_ROOT = path.join(process.cwd(), "src", "lib");

export function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

export function toPosix(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}

/** Resolve an `@/...` specifier to a concrete file, or null if it isn't source. */
export function resolveAlias(spec: string): string | null {
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
export function runtimeEdgesFromSource(text: string): Set<string> {
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

export function runtimeEdges(file: string): Set<string> {
  return runtimeEdgesFromSource(fs.readFileSync(file, "utf-8"));
}

export function buildLibGraph(): Graph {
  const graph: Graph = new Map();
  for (const file of sourceFiles(LIB_ROOT)) graph.set(toPosix(file), runtimeEdges(file));
  return graph;
}
