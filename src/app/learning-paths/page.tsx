"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, ArrowRight, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { GradeBandType } from "@/types/content";

export default function LearningPathsPage() {
  const [selectedGrade, setSelectedGrade] = useState<GradeBandType | "all">("all");

  const allPaths = repository.getLearningPaths(
    selectedGrade === "all" ? undefined : selectedGrade
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Compass className="w-4 h-4 text-accent" />
          <span>සංකල්ප පාදක ඉගෙනුම් මාර්ග</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          ඉලක්ක පාදක ඉගෙනුම් මාර්ග
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ඔබට ළඟා කර ගැනීමට අවශ්‍ය සංගීතමය ඉලක්කය තෝරාගෙන, පූර්වාවශ්‍යතා සපුරමින් පියවරෙන් පියවර ඉදිරියට යන්න.
        </p>
      </div>

      {/* Grade Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-border-light pb-4">
        <span className="text-xs font-bold text-text-secondary mr-2">ශ්‍රේණි පෙරහන:</span>
        {(["all", "6-7", "8-9", "10-11"] as const).map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => setSelectedGrade(grade)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === grade
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-border text-text hover:bg-surface-warm"
            }`}
          >
            {grade === "all" ? "සියලු ශ්‍රේණි" : `${grade} ශ්‍රේණි`}
          </button>
        ))}
      </div>

      {/* Grid of Learning Paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPaths.map((path) => (
          <div
            key={path.id}
            className="bg-white rounded-3xl p-6 border border-border shadow-warm-md hover:shadow-warm-lg hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary">
                  {path.difficulty}
                </span>
                <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> පැය {path.estimatedHours}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-text mb-2">
                “{path.goalStatement_si}”
              </h2>

              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {path.description_si}
              </p>

              {/* Steps summary */}
              <div className="bg-surface-warm p-3 rounded-xl border border-border-light mb-4 space-y-1.5 text-xs text-text-secondary">
                <span className="font-bold block text-[11px] text-text">ප්‍රධාන පියවර {path.steps.length}:</span>
                {path.steps.slice(0, 3).map((step, idx) => {
                  const lesson = repository.getLessonById(step.lessonId);
                  return (
                    <div key={step.stepNumber} className="flex items-center gap-1.5 truncate">
                      <span className="w-4 h-4 rounded-full bg-white border border-border flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{lesson?.title_si || `පියවර ${idx + 1}`}</span>
                    </div>
                  );
                })}
                {path.steps.length > 3 && (
                  <span className="text-[10px] text-text-muted italic block pl-5">
                    + තවත් පියවර {path.steps.length - 3} ක්
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/learning-paths/${path.id}`}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-sm transition-all"
            >
              <span>මාර්ගය අරඹන්න</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
