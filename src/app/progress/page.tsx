"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Award,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { ProgressStorage } from "@/lib/storage/progress-storage";
import { repository } from "@/lib/data/repository";
import { StudentProgress, Lesson } from "@/types/content";

export default function StudentProgressDashboard() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => {
    setProgress(ProgressStorage.getProgress());
  }, []);

  if (!progress) {
    return <div className="p-10 text-center text-xs">ප්‍රගතිය පූරණය වෙමින් පවතී...</div>;
  }

  const allLessons = repository.getLessons();
  const completedLessons = allLessons.filter((l) =>
    progress.completedLessonIds.includes(l.id)
  );
  const savedLessons = allLessons.filter((l) =>
    progress.savedLessonIds.includes(l.id)
  );

  const totalLessons = allLessons.length;
  const completionPercent = Math.round((completedLessons.length / totalLessons) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>පෞද්ගලික ඉගෙනුම් පුවරුව</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          මගේ ප්‍රගතිය (My Progress)
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ඔබ සම්පූර්ණ කළ පාඩම්, ප්‍රගුණ කළ සංගීත සංකල්ප, අඛණ්ඩ දින පුහුණුව සහ සුරැකි පාඩම් මෙතැනින් බලන්න.
        </p>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak card */}
        <div className="bg-white rounded-3xl p-5 border border-border shadow-warm-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-accent flex items-center justify-center font-black text-xl shrink-0">
            {progress.streakDays || 1}🔥
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">අඛණ්ඩ පුහුණුව</span>
            <span className="text-base font-extrabold text-text">
              දින {progress.streakDays || 1}
            </span>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="bg-white rounded-3xl p-5 border border-border shadow-warm-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-100 text-forest-green flex items-center justify-center font-bold text-lg shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">සම්පූර්ණ පාඩම්</span>
            <span className="text-base font-extrabold text-text">
              {completedLessons.length} / {totalLessons}
            </span>
          </div>
        </div>

        {/* Mastered Concepts */}
        <div className="bg-white rounded-3xl p-5 border border-border shadow-warm-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center font-bold text-lg shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">ප්‍රගුණ සංකල්ප</span>
            <span className="text-base font-extrabold text-text">
              {progress.masteredConceptIds.length || completedLessons.length * 2}
            </span>
          </div>
        </div>

        {/* Saved Bookmarks */}
        <div className="bg-white rounded-3xl p-5 border border-border shadow-warm-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
            <Bookmark className="w-6 h-6 fill-amber-700" />
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-bold block">සුරැකි පාඩම්</span>
            <span className="text-base font-extrabold text-text">
              {savedLessons.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-border shadow-warm-md space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
          <span className="text-text">සමස්ත විෂය නිර්දේශ ප්‍රගතිය:</span>
          <span className="text-primary">{completionPercent}%</span>
        </div>
        <div className="w-full bg-surface-warm h-3 rounded-full overflow-hidden border border-border-light">
          <div
            style={{ width: `${completionPercent}%` }}
            className="h-full bg-primary transition-all duration-500"
          />
        </div>
      </div>

      {/* Saved Lessons Section */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-text flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-accent" />
          <span>සුරැකි පාඩම් (Saved Lessons)</span>
        </h2>

        {savedLessons.length === 0 ? (
          <div className="bg-surface-warm rounded-2xl p-6 border border-border-light text-center text-xs text-text-muted">
            ඔබ තවමත් කිසිදු පාඩමක් සුරැකී නැත. පාඩම් පිටුවල ඇති Bookmark අයිකනය ඔබා මෙහි තබාගත හැක.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedLessons.map((les) => (
              <Link
                key={les.id}
                href={`/lessons/${les.id}`}
                className="bg-white rounded-2xl p-4 border border-border shadow-warm-sm hover:border-accent flex items-center justify-between transition-all"
              >
                <div>
                  <h3 className="font-bold text-sm text-text">{les.title_si}</h3>
                  <span className="text-xs text-text-muted">මිනිත්තු {les.estimatedMinutes}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Completed Lessons Section */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-text flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-forest-green" />
          <span>සම්පූර්ණ කළ පාඩම්</span>
        </h2>

        {completedLessons.length === 0 ? (
          <div className="bg-surface-warm rounded-2xl p-6 border border-border-light text-center text-xs text-text-muted">
            තවමත් පාඩමක් සම්පූර්ණ කර නැත. මුල් පාඩමෙන් අරඹන්න!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedLessons.map((les) => (
              <Link
                key={les.id}
                href={`/lessons/${les.id}`}
                className="bg-white rounded-2xl p-4 border border-green-200 shadow-warm-sm flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-forest-green shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-text">{les.title_si}</h3>
                    <span className="text-[11px] text-forest-green font-semibold">සම්පූර්ණයි</span>
                  </div>
                </div>
                <span className="text-xs text-primary font-bold">නැවත බලන්න →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
