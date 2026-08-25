"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Lock,
  Play,
  Award,
  Sparkles,
  HelpCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { repository } from "@/lib/data/repository";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  subscribeToStorageChanges,
} from "@/lib/storage/progress-storage";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export default function LearningPathDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathId = params.id as string;

  const path = repository.getLearningPathById(pathId);
  const [showDiagnostic, setShowDiagnostic] = useState<boolean>(true);
  const [diagnosticPassed, setDiagnosticPassed] = useState<boolean | null>(null);
  const [selectedDiagnosticOpt, setSelectedDiagnosticOpt] = useState<number | null>(null);
  const [showMastery, setShowMastery] = useState(false);

  // Completed steps derive from the storage snapshot (react-hooks v6
  // adoption): server snapshot null yields the legacy initial empty list.
  const progressSnapshot = useSyncExternalStore(
    subscribeToStorageChanges,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  const completedSteps = useMemo(() => {
    if (!path) return [];
    return path.steps
      .filter((step) => progressSnapshot.completedLessonIds.includes(step.lessonId))
      .map((step) => step.stepNumber);
  }, [path, progressSnapshot]);

  if (!path) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-4">ඉගෙනුම් මාර්ගය හමු නොවීය.</h2>
        <Link href="/learning-paths" className="text-primary underline text-sm">
          සියලු ඉගෙනුම් මාර්ග වෙත ආපසු යන්න
        </Link>
      </div>
    );
  }

  const handleDiagnosticSubmit = () => {
    if (selectedDiagnosticOpt === null) return;
    const isCorrect = selectedDiagnosticOpt === path.diagnosticQuestion.correctIndex;
    setDiagnosticPassed(isCorrect);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Link href="/learning-paths" className="hover:underline">
          ඉගෙනුම් මාර්ග
        </Link>
        <span>/</span>
        <span className="text-text font-semibold truncate">{path.title_si}</span>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-lg mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary">
            {path.difficulty} මට්ටම
          </span>
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ඇස්තමේන්තුගත කාලය: පැය {path.estimatedHours}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-primary mb-3">
          “{path.goalStatement_si}”
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
          {path.description_si}
        </p>

        {/* Progress summary */}
        <div className="bg-surface-warm p-4 rounded-2xl border border-border-light flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold text-text block mb-0.5">මාර්ගයේ ප්‍රගතිය:</span>
            <span className="text-text-muted">
              පියවර {completedSteps.length} / {path.steps.length} සම්පූර්ණයි
            </span>
          </div>
          <div className="w-32 bg-white h-2.5 rounded-full overflow-hidden border border-border">
            <div
              style={{
                width: `${(completedSteps.length / path.steps.length) * 100}%`,
              }}
              className="h-full bg-forest-green transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Step 1: Initial Diagnostic Question Card */}
      {showDiagnostic && diagnosticPassed === null && (
        <div className="bg-amber-50 rounded-3xl p-6 border-2 border-accent mb-8 shadow-warm-md">
          <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>මූලික ඇගයීම් ප්‍රශ්නය (Diagnostic Check)</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-text mb-4">
            {path.diagnosticQuestion.question_si}
          </h3>

          <div className="space-y-2 mb-4">
            {path.diagnosticQuestion.options_si.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDiagnosticOpt(idx)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all ${
                  selectedDiagnosticOpt === idx
                    ? "bg-amber-200/80 border-accent font-bold text-text"
                    : "bg-white border-border hover:bg-amber-100/50 text-text"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDiagnostic(false)}
              className="text-xs text-text-muted hover:underline"
            >
              මෙය මඟහැර පියවර වෙත යන්න →
            </button>

            <button
              type="button"
              onClick={handleDiagnosticSubmit}
              disabled={selectedDiagnosticOpt === null}
              className="bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              පරීක්ෂා කරන්න
            </button>
          </div>
        </div>
      )}

      {diagnosticPassed !== null && (
        <div
          className={`rounded-3xl p-5 mb-8 border ${
            diagnosticPassed
              ? "bg-green-50 border-forest-green text-green-950"
              : "bg-amber-50 border-accent text-amber-950"
          }`}
        >
          <span className="font-bold block text-sm mb-1">
            {diagnosticPassed
              ? "🎉 විශිෂ්ටයි! ඔබ මූලික සංකල්පය හොඳින් දනී."
              : "💡 හොඳ උත්සාහයක්! මෙම මාර්ගය ඔබට වඩාත් ප්‍රයෝජනවත් වනු ඇත."}
          </span>
          <p className="text-xs leading-relaxed">{path.diagnosticQuestion.explanation_si}</p>
        </div>
      )}

      {/* Steps Timeline / Path Steps */}
      <div className="space-y-4 mb-10">
        <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <span>ඉගෙනුම් පියවර අනුක්‍රමය (Path Steps)</span>
        </h2>

        {path.steps.map((step, idx) => {
          const lesson = repository.getLessonById(step.lessonId);
          const isDone = completedSteps.includes(step.stepNumber);
          const isUnlocked = idx === 0 || completedSteps.includes(step.stepNumber - 1);

          return (
            <div
              key={step.stepNumber}
              className={`rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone
                  ? "bg-green-50/50 border-green-200"
                  : isUnlocked
                  ? "bg-white border-border shadow-warm-sm"
                  : "bg-surface-warm border-border-light opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    isDone
                      ? "bg-forest-green text-white"
                      : isUnlocked
                      ? "bg-primary text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : step.stepNumber}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-text-muted uppercase">
                      {step.checkpointType === "milestone" ? "මයිල්ස්ටෝන් පියවර" : `පියවර ${step.stepNumber}`}
                    </span>
                    {isDone && (
                      <span className="text-[10px] bg-green-100 text-forest-green font-bold px-2 py-0.5 rounded-full">
                        සම්පූර්ණයි
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text mt-0.5">
                    {lesson?.title_si || "පාඩම"}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 max-w-xl">
                    {lesson?.summary_si}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {isUnlocked ? (
                  <Link
                    href={`/lessons/${step.lessonId}`}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isDone
                        ? "bg-white border border-border text-text hover:bg-surface-warm"
                        : "bg-primary hover:bg-primary-dark text-white shadow-sm"
                    }`}
                  >
                    <span>{isDone ? "නැවත බලන්න" : "පාඩම අරඹන්න"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-text-muted font-medium py-2 px-3">
                    <Lock className="w-3.5 h-3.5" />
                    <span>පෙර පියවර සම්පූර්ණ කරන්න</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Path Completion & Recommended Next Path */}
      {completedSteps.length === path.steps.length && path.nextRecommendedPathId && (
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-6 sm:p-8 text-white shadow-warm-lg text-center max-w-2xl mx-auto">
          <Sparkles className="w-10 h-10 text-amber-300 mx-auto mb-3" />
          <h3 className="text-xl sm:text-2xl font-black mb-2">
            සුබ පැතුම්! ඔබ මෙම ඉගෙනුම් මාර්ගය සාර්ථකව අවසන් කළා!
          </h3>
          <p className="text-xs sm:text-sm text-[#F7E6E8] mb-6">
            ඔබේ මීළඟ සංගීතමය ඉලක්කය කරා ගමන් කිරීමට සූදානම්ද?
          </p>
          <Link
            href={`/learning-paths/${path.nextRecommendedPathId}`}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-sm transition-all"
          >
            <span>මීළඟ නිර්දේශිත මාර්ගය අරඹන්න</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
