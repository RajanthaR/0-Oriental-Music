import { describe, expect, it, vi } from "vitest";
import {
  releaseHandleRef,
  releaseHandleSet,
  releaseTimerRef,
  releaseTimerSet,
  runIsolatedCleanup,
  type CancellableHandle,
} from "@/lib/audio/cleanup";

describe("failure-atomic audio cleanup", () => {
  it("contains a throwing cleanup step without letting it escape", () => {
    expect(() => runIsolatedCleanup(() => { throw new Error("cleanup failed"); })).not.toThrow();
    const performed = vi.fn();
    runIsolatedCleanup(performed);
    expect(performed).toHaveBeenCalledTimes(1);
  });

  it("surrenders single-handle ownership before cancelling so a throwing cancel cannot strand it", () => {
    const cancel = vi.fn(() => { throw new Error("cancel failed"); });
    let ownedDuringCancel: CancellableHandle | null | undefined;
    const ref: { current: CancellableHandle | null } = { current: null };
    const handle = Object.assign(() => {
      ownedDuringCancel = ref.current;
      cancel();
    }, {});
    ref.current = handle;

    expect(() => releaseHandleRef(ref)).not.toThrow();
    // Ownership was already released when the cancellation ran, so a throw can
    // never leave the caller holding a cancelled handle.
    expect(ownedDuringCancel).toBeNull();
    expect(ref.current).toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);

    // Releasing again is a no-op: the handle cannot be cancelled twice.
    releaseHandleRef(ref);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels every owned handle even when an earlier cancellation throws", () => {
    const order: string[] = [];
    const first = Object.assign(() => { order.push("first"); throw new Error("first failed"); }, {});
    const second = Object.assign(() => { order.push("second"); }, {});
    const third = Object.assign(() => { order.push("third"); throw new Error("third failed"); }, {});
    const ref = { current: new Set<CancellableHandle>([first, second, third]) };

    expect(() => releaseHandleSet(ref)).not.toThrow();
    expect(order).toEqual(["first", "second", "third"]);
    expect(ref.current.size).toBe(0);
  });

  it("clears an owned timer in isolation and treats timer id zero as owned", () => {
    const cleared: number[] = [];
    const throwingRef: { current: number | null } = { current: 7 };
    expect(() => releaseTimerRef(throwingRef, () => { throw new Error("clear failed"); })).not.toThrow();
    expect(throwingRef.current).toBeNull();

    const zeroRef: { current: number | null } = { current: 0 };
    releaseTimerRef(zeroRef, (timerId) => cleared.push(timerId));
    expect(cleared).toEqual([0]);
    expect(zeroRef.current).toBeNull();

    const emptyRef: { current: number | null } = { current: null };
    releaseTimerRef(emptyRef, (timerId) => cleared.push(timerId));
    expect(cleared).toEqual([0]);
  });

  it("clears every owned timer even when an earlier clear throws", () => {
    const cleared: number[] = [];
    const ref = { current: new Set<number>([1, 2, 3]) };

    expect(() => releaseTimerSet(ref, (timerId) => {
      cleared.push(timerId);
      if (timerId === 1) throw new Error("clear failed");
    })).not.toThrow();

    expect(cleared).toEqual([1, 2, 3]);
    expect(ref.current.size).toBe(0);
  });
});
