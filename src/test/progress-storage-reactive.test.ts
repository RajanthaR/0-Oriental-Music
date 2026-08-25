import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLowBandwidthModeSnapshot,
  getProgressSnapshot,
  getServerLowBandwidthModeSnapshot,
  getServerProgressSnapshot,
  subscribeToStorageChanges,
  ProgressStorage,
} from "@/lib/storage/progress-storage";
import type { StudentProgress } from "@/types/content";

/**
 * Reactive snapshot layer contracts (react-hooks v6 adoption slice).
 *
 * useSyncExternalStore consumers depend on three properties that this file
 * pins: referential stability of snapshots while raw storage is unchanged,
 * change notification on every write path, and server snapshots that match
 * the legacy initial-render values so pre-hydration markup is unchanged.
 */
describe("ProgressStorage reactive snapshot layer", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns referentially stable progress snapshots while raw storage is unchanged", () => {
    const first = getProgressSnapshot();
    const second = getProgressSnapshot();
    expect(second).toBe(first);
  });

  it("changes the snapshot identity after a write through any save path", () => {
    ProgressStorage.saveProgress({
      ...getProgressSnapshot(),
      savedLessonIds: ["les-intro-01"],
    });
    expect(getProgressSnapshot().savedLessonIds).toEqual(["les-intro-01"]);
    expect(getProgressSnapshot()).not.toBe(getServerProgressSnapshot());

    ProgressStorage.toggleSaveLesson("les-swara-01");
    expect(getProgressSnapshot().savedLessonIds).toContain("les-swara-01");
  });

  it("notifies subscribers on own-tab writes and cross-tab storage events", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToStorageChanges(listener);

    ProgressStorage.setLowBandwidthMode(true);
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent("storage", { key: "swara_maga_student_progress_v1" }));
    expect(listener).toHaveBeenCalledTimes(2);

    // Unrelated keys must not wake consumers.
    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    ProgressStorage.setLowBandwidthMode(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps low-bandwidth snapshot in step with setLowBandwidthMode", () => {
    expect(getLowBandwidthModeSnapshot()).toBe(false);
    ProgressStorage.setLowBandwidthMode(true);
    expect(getLowBandwidthModeSnapshot()).toBe(true);
    ProgressStorage.setLowBandwidthMode(false);
    expect(getLowBandwidthModeSnapshot()).toBe(false);
  });

  it("server snapshots match the legacy initial-render values and stay stable", () => {
    const server = getServerProgressSnapshot();
    expect(server.completedLessonIds).toEqual([]);
    expect(server.streakDays).toBe(1);
    expect(server.lastLessonId ?? server.savedLessonIds).toBeDefined();
    expect(getServerProgressSnapshot()).toBe(server);
    expect(getServerLowBandwidthModeSnapshot()).toBe(false);
  });

  it("falls back to defaults for corrupt raw storage instead of throwing", () => {
    const probe = getProgressSnapshot();
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("{not json");
    const snapshot = getProgressSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.completedLessonIds).toEqual(probe.completedLessonIds);
  });

  it("marks lessons complete through markLessonComplete and notifies", () => {
    const listener = vi.fn();
    subscribeToStorageChanges(listener);
    const updated: StudentProgress = ProgressStorage.markLessonComplete("les-intro-01");
    expect(updated.completedLessonIds).toContain("les-intro-01");
    expect(getProgressSnapshot().completedLessonIds).toContain("les-intro-01");
    expect(listener).toHaveBeenCalled();
  });
});
