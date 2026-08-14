"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Clock, ArrowRight, Bookmark, BookmarkCheck } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { GradeBandType } from "@/types/content";
import { ProgressStorage } from "@/lib/storage/progress-storage";

export default function LessonsDirectoryPage() {
  const [selectedGrade, setSelectedGrade] = useState<GradeBandType | "all">("all");
  const [selectedStrand, setSelectedStrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  React.useEffect(() => {
    setSavedIds(ProgressStorage.getProgress().savedLessonIds);
  }, []);

  const strands = repository.getStrands();
  const lessons = repository.getLessons({
    gradeBand: selectedGrade === "all" ? undefined : selectedGrade,
    strandId: selectedStrand === "all" ? undefined : selectedStrand,
    query: searchQuery,
  });

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const isSaved = ProgressStorage.toggleSaveLesson(id);
    setSavedIds((prev) =>
      isSaved ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <BookOpen className="w-4 h-4 text-accent" />
          <span>සම්පූර්ණ පාඩම් මාලාව</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          පෙරදිග සංගීතය විෂය පාඩම්
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          නිපුණතා පාදක, සජීවී බ්‍රවුසර් ශ්‍රව්‍ය ආදර්ශන සහ ප්‍රායෝගික අභ්‍යාස සහිත සියලුම පාඩම් මෙතැනින් ගවේෂණය කරන්න.
        </p>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-warm-sm mb-8 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="පාඩම් මාතෘකාව, ස්වර, තාල හෝ සංකල්ප සෙවීම..."
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Grade Band Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-light text-xs">
          <span className="font-bold text-text-secondary mr-2">ශ්‍රේණිය:</span>
          {(["all", "6-7", "8-9", "10-11", "12-13"] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedGrade === grade
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-warm text-text hover:bg-white border border-border-light"
              }`}
            >
              {grade === "all" ? "සියල්ල" : `${grade}`}
            </button>
          ))}
        </div>

        {/* Strand Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-text-secondary mr-2">ධාරාව:</span>
          <select
            value={selectedStrand}
            onChange={(e) => setSelectedStrand(e.target.value)}
            className="bg-surface-warm border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:ring-1 focus:ring-primary"
          >
            <option value="all">සියලු විෂය ධාරා</option>
            {strands.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_si}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => {
          const isSaved = savedIds.includes(lesson.id);
          const strand = repository.getStrandById(lesson.strandId);

          return (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-warm-sm hover:shadow-warm-md hover:border-accent/60 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
                    {strand?.name_si || "විෂය පාඩම"}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => toggleSave(e, lesson.id)}
                    className="p-1 rounded-lg text-text-muted hover:text-accent transition-colors"
                    title={isSaved ? "සුරැකූ ලැයිස්තුවෙන් ඉවත් කරන්න" : "පාඩම සුරකින්න"}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-accent fill-accent" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <h3 className="text-base font-bold text-text group-hover:text-primary transition-colors mb-2 leading-snug">
                  {lesson.title_si}
                </h3>

                <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-2">
                  {lesson.summary_si}
                </p>
              </div>

              <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> මිනිත්තු {lesson.estimatedMinutes}
                </span>
                <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>හදාරන්න</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
