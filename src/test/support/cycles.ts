/**
 * Shared runtime-import-cycle engine for the layering guards.
 *
 * Used by src/test/layering-guard.test.ts (live tree pinning) and
 * src/test/guard-engine-fixture.test.ts (synthetic-input proofs), so the
 * detection semantics have exactly one implementation.
 */

export type Graph = Map<string, Set<string>>;

/**
 * Cyclic module sets via Tarjan SCC decomposition (iterative).
 *
 * A DFS back-edge walk only reports cycles its single traversal happens to
 * enter, so overlapping cycles in one strongly connected component can be
 * missed depending on iteration order — an incomplete inventory would make
 * "exactly these cycles" pins weaker than they claim. SCCs have exactly the
 * right semantics: every module set that forms any cycle at all is one
 * strongly connected component, found completely and independent of
 * iteration order.
 */
export function cyclicModuleSets(graph: Graph): string[][] {
  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const sccStack: string[] = [];
  const components: string[][] = [];

  for (const root of graph.keys()) {
    if (indices.has(root)) continue;
    // Frames replace recursion: [node, iterator position].
    const frames: Array<{ node: string; position: number }> = [{ node: root, position: 0 }];
    indices.set(root, index);
    lowlink.set(root, index);
    index += 1;
    sccStack.push(root);
    onStack.add(root);

    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const successors = [...(graph.get(frame.node) ?? [])].filter((n) => graph.has(n));
      if (frame.position < successors.length) {
        const next = successors[frame.position];
        frame.position += 1;
        if (!indices.has(next)) {
          indices.set(next, index);
          lowlink.set(next, index);
          index += 1;
          sccStack.push(next);
          onStack.add(next);
          frames.push({ node: next, position: 0 });
        } else if (onStack.has(next)) {
          lowlink.set(frame.node, Math.min(lowlink.get(frame.node)!, indices.get(next)!));
        }
      } else {
        frames.pop();
        if (frames.length > 0) {
          const parent = frames[frames.length - 1].node;
          lowlink.set(parent, Math.min(lowlink.get(parent)!, lowlink.get(frame.node)!));
        }
        if (lowlink.get(frame.node) === indices.get(frame.node)) {
          const component: string[] = [];
          let member: string | undefined;
          do {
            member = sccStack.pop();
            onStack.delete(member!);
            component.push(member!);
          } while (member !== frame.node);
          // A component is a cycle iff it has more than one member, or the
          // single member imports itself.
          if (component.length > 1 || (graph.get(component[0]) ?? new Set()).has(component[0])) {
            components.push(component.sort());
          }
        }
      }
    }
  }
  return components;
}

/** Order-independent canonical form of one cyclic module set. */
export function canonicalCycleSet(cycle: string[]): string {
  return [...new Set(cycle)].sort().join(" -> ");
}
