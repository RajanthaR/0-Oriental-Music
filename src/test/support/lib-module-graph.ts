/**
 * Shared runtime import-graph builder for the layering guards.
 *
 * Used by src/test/layering-guard.test.ts to scan the live `src/lib` tree and
 * by its in-file negative fixtures, so the edge-classification rules have
 * exactly one implementation.
 */

import fs from "fs";
import path from "path";
import ts from "typescript";
import type { Graph } from "./cycles";

const SOURCE_ROOT = path.join(process.cwd(), "src");
export const LIB_ROOT = path.join(SOURCE_ROOT, "lib");

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

/** Resolve an alias or relative specifier to a concrete source file. */
function resolveSourceSpecifier(spec: string, importerFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) {
    base = path.join(SOURCE_ROOT, spec.slice(2));
  } else if (spec.startsWith("./") || spec.startsWith("../")) {
    const importer = path.isAbsolute(importerFile)
      ? importerFile
      : path.resolve(process.cwd(), importerFile);
    base = path.resolve(path.dirname(importer), spec);
  } else {
    return null;
  }

  const candidates = /\.tsx?$/.test(base)
    ? [base]
    : [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  for (const candidate of candidates) {
    const relativeToSource = path.relative(SOURCE_ROOT, candidate);
    if (relativeToSource.startsWith("..") || path.isAbsolute(relativeToSource)) continue;
    if (fs.existsSync(candidate)) return toPosix(candidate);
  }
  return null;
}

/**
 * Static runtime dependency edges only. `import type` and type-only named
 * specifiers are erased at compile time and cannot participate in a runtime
 * cycle; `export ... from` re-exports and side-effect imports can, so they are
 * included.
 */
export function runtimeEdgesFromSource(text: string, importerFile: string): Set<string> {
  const edges = new Set<string>();
  const source = ts.createSourceFile(importerFile, text, ts.ScriptTarget.Latest, false);
  for (const statement of source.statements) {
    const spec = runtimeModuleSpecifier(statement);
    if (!spec) continue;
    const resolved = resolveSourceSpecifier(spec, importerFile);
    if (resolved) edges.add(resolved);
  }
  return edges;
}

function runtimeModuleSpecifier(statement: ts.Statement): string | null {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause;
    if (clause?.isTypeOnly) return null;
    const namedBindings = clause?.namedBindings;
    if (clause && !clause.name && namedBindings && ts.isNamedImports(namedBindings)) {
      const specifiers = namedBindings.elements;
      if (specifiers.length > 0 && specifiers.every((specifier) => specifier.isTypeOnly)) {
        return null;
      }
    }
    return stringModuleSpecifier(statement.moduleSpecifier);
  }

  if (ts.isExportDeclaration(statement)) {
    if (statement.isTypeOnly) return null;
    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      const specifiers = statement.exportClause.elements;
      if (specifiers.length > 0 && specifiers.every((specifier) => specifier.isTypeOnly)) {
        return null;
      }
    }
    return statement.moduleSpecifier
      ? stringModuleSpecifier(statement.moduleSpecifier)
      : null;
  }

  return null;
}

function stringModuleSpecifier(node: ts.Expression): string | null {
  return ts.isStringLiteralLike(node) ? node.text : null;
}

export function runtimeEdges(file: string): Set<string> {
  return runtimeEdgesFromSource(fs.readFileSync(file, "utf-8"), file);
}

export function buildLibGraph(): Graph {
  const graph: Graph = new Map();
  for (const file of sourceFiles(LIB_ROOT)) graph.set(toPosix(file), runtimeEdges(file));
  return graph;
}
