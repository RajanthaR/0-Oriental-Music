import { Lesson, Raga, Tala, Instrument, CulturalTradition, TheatreTradition } from "@/types/content";
import sourcesData from "@/data/sources.json";

export interface ValidationIssue {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export function validateContent(
  lessons: Lesson[],
  ragas: Raga[],
  talas: Tala[],
  instruments: Instrument[],
  culturalTraditions: CulturalTradition[],
  theatreTraditions: TheatreTradition[]
): { isValid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const validSourceIds = new Set(sourcesData.map((s) => s.id));

  // Validate Lessons
  lessons.forEach((l) => {
    if (!l.title_si || !l.title_si.trim()) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "title_si",
        message: "Title in Sinhala is missing or empty",
        severity: "error",
      });
    }

    if (!l.learningGoal_si || !l.learningGoal_si.startsWith("මෙම පාඩම අවසානයේ ඔබට")) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "learningGoal_si",
        message: "Learning goal must start with 'මෙම පාඩම අවසානයේ ඔබට...'",
        severity: "error",
      });
    }

    if (!l.sourceReference || !l.sourceReference.sourceId) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "sourceReference",
        message: "Source reference is missing",
        severity: "error",
      });
    } else if (!validSourceIds.has(l.sourceReference.sourceId)) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "sourceReference.sourceId",
        message: `Referenced sourceId '${l.sourceReference.sourceId}' does not exist in sources.json`,
        severity: "error",
      });
    }

    if (!l.reviewMetadata || !l.reviewMetadata.reviewer) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "reviewMetadata.reviewer",
        message: "Reviewer name is required",
        severity: "error",
      });
    }

    if (l.published && l.reviewMetadata.status !== "Published") {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "published",
        message: "Published lesson must have 'Published' status in reviewMetadata",
        severity: "error",
      });
    }
  });

  // Validate Ragas
  ragas.forEach((r) => {
    if (!r.arohana_swaras || r.arohana_swaras.length === 0) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "arohana_swaras",
        message: "Raga must have non-empty arohana_swaras array",
        severity: "error",
      });
    }
    if (!validSourceIds.has(r.sourceReference.sourceId)) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "sourceReference.sourceId",
        message: `Raga sourceId '${r.sourceReference.sourceId}' is invalid`,
        severity: "error",
      });
    }
  });

  // Validate Talas
  talas.forEach((t) => {
    if (t.matras <= 0 || !t.bols || t.bols.length !== t.matras) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: `Tala bols array length (${t.bols?.length}) does not match matra count (${t.matras})`,
        severity: "error",
      });
    }
  });

  const errors = issues.filter((i) => i.severity === "error");
  return {
    isValid: errors.length === 0,
    issues,
  };
}
