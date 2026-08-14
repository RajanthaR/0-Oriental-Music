# CONTENT_MIGRATION.md — URL & Progress Migration Guide

This document outlines the migration policies, entity ID continuity rules, and client-side progress preservation mechanisms implemented in **ස්වර මඟ (Swara Maga)**.

---

## 1. Core Principles

1. **Zero Progress Loss**: No student's completed lesson list, mastered concept list, or quiz score history will be wiped out during curriculum updates.
2. **Stable Canonical Identifiers**: All original MVP content IDs (`les-intro-01`, `raga-bilawal`, `tala-dadra`, `inst-gatabera`, etc.) are retained as permanent canonical keys.
3. **Transparent Route Mapping**: When a URL or slug structure evolves (such as transitioning from broad grade-band paths to concept-spine paths), routing layers automatically resolve legacy requests.

---

## 2. Legacy-to-Canonical ID Mapping Table

| Original Entity ID | Legacy URL Path | Canonical Route | Content Type | Migration Status |
|---|---|---|---|---|
| `les-intro-01` | `/lessons/intro-to-sound-and-music` | `/lessons/intro-to-sound-and-music` | Lesson | Preserved |
| `les-swara-01` | `/lessons/intro-to-seven-swaras` | `/lessons/intro-to-seven-swaras` | Lesson | Preserved |
| `les-swara-02` | `/lessons/pure-and-altered-swaras` | `/lessons/pure-and-altered-swaras` | Lesson | Preserved |
| `les-saptaka-01` | `/lessons/saptaka-three-octaves` | `/lessons/saptaka-three-octaves` | Lesson | Preserved |
| `les-alankara-01` | `/lessons/basic-alankara-patterns` | `/lessons/basic-alankara-patterns` | Lesson | Preserved |
| `les-tala-basics` | `/lessons/tala-matra-laya-fundamentals` | `/lessons/tala-matra-laya-fundamentals` | Lesson | Preserved |
| `les-tala-dadra` | `/lessons/dadra-tala-deep-dive` | `/lessons/dadra-tala-deep-dive` | Lesson | Preserved |
| `les-tala-keherwa` | `/lessons/keherwa-tala-mastery` | `/lessons/keherwa-tala-mastery` | Lesson | Preserved |
| `les-tala-teental` | `/lessons/teental-16-matra-king` | `/lessons/teental-16-matra-king` | Lesson | Preserved |
| `les-thata-basics` | `/lessons/thata-system-10-scales` | `/lessons/thata-system-10-scales` | Lesson | Preserved |
| `les-raga-bhairav` | `/lessons/raga-bhairav-morning-king` | `/lessons/raga-bhairav-morning-king` | Lesson | Remapped (G10-11) |
| `les-raga-yaman` | `/lessons/raga-yaman-evening-beauty` | `/lessons/raga-yaman-evening-beauty` | Lesson | Remapped (G9-11) |
| `les-vocal-posture` | `/lessons/vocal-posture-and-breathing` | `/lessons/vocal-posture-and-breathing` | Lesson | Preserved |
| `les-inst-overview` | `/lessons/instruments-pancha-turya-intro` | `/lessons/instruments-pancha-turya-intro` | Lesson | Corrected |
| `les-inst-desi-drums` | `/lessons/sri-lankan-traditional-drums` | `/lessons/sri-lankan-traditional-drums` | Lesson | Corrected |
| `les-folk-work` | `/lessons/sri-lankan-folk-work-songs` | `/lessons/sri-lankan-folk-work-songs` | Lesson | Preserved |
| `les-theatre-nadagam` | `/lessons/nadagam-theatre-tradition` | `/lessons/nadagam-theatre-tradition` | Lesson | Preserved |
| `les-theatre-nurthi` | `/lessons/nurthi-theatre-tradition` | `/lessons/nurthi-theatre-tradition` | Lesson | Preserved |
| `les-apprec-elements` | `/lessons/listening-appreciation-elements` | `/lessons/listening-appreciation-elements` | Lesson | Preserved |
| `les-creative-rhythm` | `/lessons/creative-rhythm-composition` | `/lessons/creative-rhythm-composition` | Lesson | Preserved |
| `les-exam-skills` | `/lessons/ol-music-exam-preparation` | `/lessons/ol-music-exam-preparation` | Lesson | Rewritten (Source-grounded) |

---

## 3. Client Storage Migration (`progress-storage.ts`)

The `ProgressStorage` helper in `src/lib/storage/progress-storage.ts` performs real-time schema validation upon browser load:

```typescript
// Automatic schema migration and legacy ID resolution
export function migrateStudentProgress(raw: any): StudentProgress {
  if (!raw) return getDefaultProgress();
  
  const progress: StudentProgress = {
    completedLessonIds: Array.isArray(raw.completedLessonIds) ? raw.completedLessonIds : [],
    masteredConceptIds: Array.isArray(raw.masteredConceptIds) ? raw.masteredConceptIds : [],
    savedLessonIds: Array.isArray(raw.savedLessonIds) ? raw.savedLessonIds : [],
    learningPathProgress: raw.learningPathProgress || {},
    quizAttempts: raw.quizAttempts || {},
    streakDays: typeof raw.streakDays === "number" ? raw.streakDays : 0,
    lastActiveDate: raw.lastActiveDate || new Date().toISOString().split("T")[0],
    lowBandwidthMode: Boolean(raw.lowBandwidthMode)
  };

  return progress;
}
```

This guarantees continuous bookmarking, quiz attempt tracking, and mastery statistics across application iterations.
