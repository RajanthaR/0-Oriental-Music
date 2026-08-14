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
