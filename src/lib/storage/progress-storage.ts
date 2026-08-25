import { StudentProgress, LessonCollection, TeacherAssignment, GradeBandType } from "@/types/content";

const STORAGE_KEY_PROGRESS = "swara_maga_student_progress_v1";
const STORAGE_KEY_TEACHER_COLLECTIONS = "swara_maga_teacher_collections_v1";
const STORAGE_KEY_TEACHER_ASSIGNMENTS = "swara_maga_teacher_assignments_v1";
const STORAGE_KEY_LOW_BANDWIDTH = "swara_maga_low_bandwidth_mode";

const DEFAULT_PROGRESS: StudentProgress = {
  completedLessonIds: [],
  masteredConceptIds: [],
  savedLessonIds: [],
  learningPathProgress: {},
  quizAttempts: {},
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split("T")[0],
  lowBandwidthMode: false,
};

// ---------------------------------------------------------------------------
// Reactive snapshot layer (react-hooks v6 adoption slice).
//
// Consumers that previously loaded storage inside a mount effect
// (setState-in-effect) now read through useSyncExternalStore. That hook
// requires getSnapshot to return a REFERENTIALLY STABLE value while the
// underlying bytes are unchanged, so reads go through a raw-string-keyed
// cache and writes notify subscribers instead of mutating local copies.
// Server snapshots return the same defaults the old initial useState values
// used, preserving pre-hydration rendering exactly.
// ---------------------------------------------------------------------------

type StorageChangeListener = () => void;
const storageChangeListeners = new Set<StorageChangeListener>();

let cachedProgress: { raw: string | null; value: StudentProgress } | null = null;
let cachedLowBandwidth: { raw: string | null; value: boolean } | null = null;

function readStoredValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function notifyStorageChanged(): void {
  storageChangeListeners.forEach((listener) => listener());
}

/** Subscribe to progress/low-bandwidth storage changes (own-tab writes and cross-tab storage events). */
export function subscribeToStorageChanges(listener: StorageChangeListener): () => void {
  storageChangeListeners.add(listener);
  return () => {
    storageChangeListeners.delete(listener);
  };
}

/** Stable-reference client snapshot of student progress. */
export function getProgressSnapshot(): StudentProgress {
  const raw = readStoredValue(STORAGE_KEY_PROGRESS);
  if (!cachedProgress || cachedProgress.raw !== raw) {
    let value = DEFAULT_PROGRESS;
    if (raw) {
      try {
        value = { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
      } catch {
        value = DEFAULT_PROGRESS;
      }
    }
    cachedProgress = { raw, value };
  }
  return cachedProgress.value;
}

/** Server/hydration snapshot: the same defaults the legacy initial useState used. */
export function getServerProgressSnapshot(): StudentProgress {
  return DEFAULT_PROGRESS;
}

/** Stable-reference client snapshot of the low-bandwidth flag. */
export function getLowBandwidthModeSnapshot(): boolean {
  const raw = readStoredValue(STORAGE_KEY_LOW_BANDWIDTH);
  if (!cachedLowBandwidth || cachedLowBandwidth.raw !== raw) {
    cachedLowBandwidth = { raw, value: raw === "true" };
  }
  return cachedLowBandwidth.value;
}

/** Server/hydration snapshot: matches the legacy initial useState(false). */
export function getServerLowBandwidthModeSnapshot(): boolean {
  return false;
}

if (typeof window !== "undefined") {
  // Cross-tab changes arrive as storage events; own-tab writes notify directly.
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key.startsWith("swara_maga_")) {
      notifyStorageChanged();
    }
  });
}

export class ProgressStorage {
  public static getProgress(): StudentProgress {
    if (typeof window === "undefined") return DEFAULT_PROGRESS;
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (!data) return DEFAULT_PROGRESS;
      return { ...DEFAULT_PROGRESS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_PROGRESS;
    }
  }

  public static saveProgress(progress: StudentProgress): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
      notifyStorageChanged();
    } catch (e) {
      console.error("Failed to save student progress to localStorage", e);
    }
  }

  public static markLessonComplete(lessonId: string, conceptIds: string[] = []): StudentProgress {
    const current = this.getProgress();
    const completedSet = new Set(current.completedLessonIds);
    completedSet.add(lessonId);

    const masteredSet = new Set(current.masteredConceptIds);
    conceptIds.forEach((c) => masteredSet.add(c));

    // Calculate streak
    const today = new Date().toISOString().split("T")[0];
    let streak = current.streakDays;
    if (current.lastActiveDate !== today) {
      streak += 1;
    }

    const updated: StudentProgress = {
      ...current,
      completedLessonIds: Array.from(completedSet),
      masteredConceptIds: Array.from(masteredSet),
      streakDays: streak,
      lastActiveDate: today,
    };
    this.saveProgress(updated);
    return updated;
  }

  public static toggleSaveLesson(lessonId: string): boolean {
    const current = this.getProgress();
    const saved = new Set(current.savedLessonIds);
    let isSaved = false;

    if (saved.has(lessonId)) {
      saved.delete(lessonId);
      isSaved = false;
    } else {
      saved.add(lessonId);
      isSaved = true;
    }

    this.saveProgress({
      ...current,
      savedLessonIds: Array.from(saved),
    });
    return isSaved;
  }

  public static recordQuizAttempt(
    quizId: string,
    score: number,
    maxScore: number,
    passed: boolean
  ): StudentProgress {
    const current = this.getProgress();
    const updated: StudentProgress = {
      ...current,
      quizAttempts: {
        ...current.quizAttempts,
        [quizId]: {
          score,
          maxScore,
          passed,
          date: new Date().toISOString(),
        },
      },
    };
    this.saveProgress(updated);
    return updated;
  }

  public static getLowBandwidthMode(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY_LOW_BANDWIDTH) === "true";
  }

  public static setLowBandwidthMode(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_LOW_BANDWIDTH, enabled ? "true" : "false");
    notifyStorageChanged();
  }

  // Teacher Collections & Assignments
  public static getTeacherCollections(): LessonCollection[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEACHER_COLLECTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveTeacherCollection(collection: LessonCollection): void {
    if (typeof window === "undefined") return;
    const existing = this.getTeacherCollections();
    const filtered = existing.filter((c) => c.id !== collection.id);
    filtered.push(collection);
    localStorage.setItem(STORAGE_KEY_TEACHER_COLLECTIONS, JSON.stringify(filtered));
  }

  public static getTeacherAssignments(): TeacherAssignment[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEACHER_ASSIGNMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static createTeacherAssignment(
    title: string,
    teacherName: string,
    gradeBand: GradeBandType,
    lessonIds: string[],
    instructions: string
  ): TeacherAssignment {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const assignment: TeacherAssignment = {
      id: `assign-${Date.now()}`,
      code,
      title_si: title,
      teacherName_si: teacherName,
      targetGradeBand: gradeBand,
      lessonIds,
      instructions_si: instructions,
      createdAt: new Date().toISOString().split("T")[0],
    };

    if (typeof window !== "undefined") {
      const existing = this.getTeacherAssignments();
      existing.push(assignment);
      localStorage.setItem(STORAGE_KEY_TEACHER_ASSIGNMENTS, JSON.stringify(existing));
    }

    return assignment;
  }
}
