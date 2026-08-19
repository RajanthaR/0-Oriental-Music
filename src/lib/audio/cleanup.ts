/**
 * Failure-atomic cleanup helpers for caller-owned Web Audio work.
 *
 * Every audio consumer owns its playback handles and timers through refs. A
 * cancellation function is supplied by the audio engine and is therefore outside
 * the consumer's control: it may throw while a host tears down, while a handle is
 * already settled, or while a hostile mock is installed.
 *
 * Two rules make cleanup atomic:
 *
 * 1. **Release ownership first.** Ownership is taken out of the ref before the
 *    cancellation runs, so a throwing cancel can never leave a stale handle owned.
 * 2. **Isolate every cancellation.** One failing cancel must not skip the timers,
 *    notes, or handles that still need to be stopped after it.
 *
 * These helpers are dependency-free so they can be shared by client components
 * and route pages alike.
 */

export type CancellableHandle = () => void;

export type MutableRef<T> = { current: T };

/** Run one cleanup step without letting its failure escape to the caller. */
export function runIsolatedCleanup(work: () => void): void {
  try {
    work();
  } catch (error) {
    try {
      console.error("Audio cleanup step failed:", error);
    } catch {
      // Diagnostics must not prevent remaining cleanup.
    }
  }
}

/** Take a single handle out of its ref, then cancel it in isolation. */
export function releaseHandleRef<THandle extends CancellableHandle>(
  ref: MutableRef<THandle | null>,
): void {
  const handle = ref.current;
  ref.current = null;
  if (handle) runIsolatedCleanup(handle);
}

/** Take every handle out of its owning set, then cancel each one in isolation. */
export function releaseHandleSet<THandle extends CancellableHandle>(
  ref: MutableRef<Set<THandle>>,
): void {
  const handles = Array.from(ref.current);
  ref.current.clear();
  handles.forEach((handle) => runIsolatedCleanup(handle));
}

/** Take a single timer out of its ref, then clear it in isolation. */
export function releaseTimerRef(
  ref: MutableRef<number | null>,
  clearTimer: (timerId: number) => void,
): void {
  const timerId = ref.current;
  ref.current = null;
  if (timerId !== null) runIsolatedCleanup(() => clearTimer(timerId));
}

/** Take every timer out of its owning set, then clear each one in isolation. */
export function releaseTimerSet(
  ref: MutableRef<Set<number>>,
  clearTimer: (timerId: number) => void,
): void {
  const timerIds = Array.from(ref.current);
  ref.current.clear();
  timerIds.forEach((timerId) => runIsolatedCleanup(() => clearTimer(timerId)));
}
