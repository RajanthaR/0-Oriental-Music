"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, Clock, ArrowRight, BookOpen, CheckCircle2, FileText } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { GradeBandType } from "@/types/content";

export default function ExamPracticeCenterPage() {
  const [selectedGrade, setSelectedGrade] = useState<GradeBandType | "all">("all");
  const examPapers = repository.getExamPapers(
    selectedGrade === "all" ? undefined : selectedGrade
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Award className="w-4 h-4 text-accent" />
          <span>විභාග පෙරහුරු මධ්‍යස්ථානය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          විභාග අභ්‍යාස සහ මාදිලි ප්‍රශ්න පත්‍ර
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          මූලාශ්‍ර සමාලෝචනය අවසන් වූ 10–11 ශ්‍රේණි අභ්‍යාස පමණක් මෙහි පෙන්වනු ලැබේ. දැනට පවතින ප්‍රශ්න පත්‍ර සත්‍යාපනය අවසන් වන තෙක් ප්‍රකාශයට පත් නොකෙරේ.
        </p>
      </div>

      {/* Grade Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-light pb-4">
        <span className="text-xs font-bold text-text-secondary mr-2">විභාග මට්ටම:</span>
        {(["all", "10-11"] as const).map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => setSelectedGrade(grade)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === grade
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-border text-text hover:bg-surface-warm"
            }`}
          >
            {grade === "all"
              ? "සියලු විභාග"
              : grade === "10-11"
              ? "අ.පො.ස. (සා.පෙළ) - 10-11 ශ්‍රේණි"
              : "10–11 ශ්‍රේණි"}
          </button>
        ))}
      </div>

      {/* Exam Papers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {examPapers.length === 0 && (
          <div className="md:col-span-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-6 text-center text-sm font-bold">
            මෙම මට්ටම සඳහා දැනට විභාග අභ්‍යාස අඩංගු නොවේ.
          </div>
        )}
        {examPapers.map((paper) => (
          <div
            key={paper.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-md hover:shadow-warm-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  සාමාන්‍ය පෙළ (O/L)
                </span>
                <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> මිනිත්තු {paper.timeLimitMinutes}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-text mb-3">
                {paper.title_si}
              </h2>

              <div className="bg-surface-warm p-4 rounded-2xl border border-border-light mb-6 space-y-2 text-xs text-text-secondary">
                <span className="font-bold text-text block">උපදෙස් සහ ව්‍යුහය:</span>
                <ul className="list-disc list-inside space-y-1">
                  {paper.instructions_si.map((ins, idx) => (
                    <li key={idx}>{ins}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Link
              href={`/exams/${paper.id}`}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm py-3.5 rounded-xl shadow-sm transition-all"
            >
              <span>ප්‍රශ්න පත්‍රයට පිළිතුරු සපයන්න</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
