"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Filter,
  Plus,
  BookOpen,
  Share2,
  Printer,
  FileCheck,
  AlertCircle,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { repository } from "@/lib/data/repository";
import { GradeBandType, Lesson, LessonCollection, TeacherAssignment } from "@/types/content";
import { ProgressStorage } from "@/lib/storage/progress-storage";

export default function TeacherWorkspacePage() {
  const [selectedGrade, setSelectedGrade] = useState<GradeBandType>("10-11");
  const [selectedStrand, setSelectedStrand] = useState<string>("all");
  const [selectedLessonsForCollection, setSelectedLessonsForCollection] = useState<string[]>([]);
  const [collectionTitle, setCollectionTitle] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [createdAssignment, setCreatedAssignment] = useState<TeacherAssignment | null>(null);
  const [copied, setCopied] = useState(false);
  const [printLessonId, setPrintLessonId] = useState<string | null>(null);

  const strands = repository.getStrands();
  const allLessons = repository.getLessons({
    gradeBand: selectedGrade,
    strandId: selectedStrand === "all" ? undefined : selectedStrand,
  });

  const handleToggleLessonSelection = (id: string) => {
    setSelectedLessonsForCollection((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionTitle.trim() || selectedLessonsForCollection.length === 0) return;

    const assign = ProgressStorage.createTeacherAssignment(
      collectionTitle,
      teacherName || "සංගීත ආචාර්ය",
      selectedGrade,
      selectedLessonsForCollection,
      instructions
    );
    setCreatedAssignment(assign);
  };

  const handleCopyCode = () => {
    if (!createdAssignment) return;
    navigator.clipboard.writeText(
      `ස්වර මඟ පැවරුම් කේතය: ${createdAssignment.code}\nපාඩම් මාලාව: ${createdAssignment.title_si}\nලින්ක් එක: ${window.location.origin}/lessons?code=${createdAssignment.code}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const printLesson = printLessonId ? repository.getLessonById(printLessonId) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-800 mb-3">
          <Users className="w-4 h-4" />
          <span>ගුරුවරුන් සඳහා විශේෂිතයි</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          ගුරු පියස (Teacher Workspace)
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          NIE විෂය නිර්දේශ නිපුණතා අනුව පාඩම් තෝරා ගැනීම, පන්ති කාමර පැවරුම් කේත නිර්මාණය කිරීම සහ මුද්‍රණය කළ හැකි සාරාංශ සටහන් ලබාගැනීම.
        </p>
      </div>

      {/* Main Grid: Left side lesson selector, right side assignment creator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Col 1 & 2: Lesson & Competency Filter */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span>1. නිපුණතා හා පාඩම් පෙරහන</span>
            </h2>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  ශ්‍රේණි කාණ්ඩය:
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value as GradeBandType)}
                  className="w-full bg-surface-warm border border-border rounded-xl px-3 py-2 text-xs text-text focus:ring-1 focus:ring-primary"
                >
                  <option value="6-7">6–7 ශ්‍රේණි (ආරම්භක)</option>
                  <option value="8-9">8–9 ශ්‍රේණි (මධ්‍යම)</option>
                  <option value="10-11">10–11 ශ්‍රේණි (සාමාන්‍ය පෙළ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  විෂය ධාරාව:
                </label>
                <select
                  value={selectedStrand}
                  onChange={(e) => setSelectedStrand(e.target.value)}
                  className="w-full bg-surface-warm border border-border rounded-xl px-3 py-2 text-xs text-text focus:ring-1 focus:ring-primary"
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

            {/* Lessons Selection List */}
            <div className="space-y-2 pt-3 border-t border-border-light">
              <span className="text-xs font-bold text-text block">
                පාඩම් තෝරාගන්න (තෝරාගත් ගණන: {selectedLessonsForCollection.length}):
              </span>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {allLessons.map((les) => {
                  const isSelected = selectedLessonsForCollection.includes(les.id);
                  return (
                    <div
                      key={les.id}
                      onClick={() => handleToggleLessonSelection(les.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-amber-50 border-accent font-bold text-text"
                          : "bg-surface-warm border-border-light text-text-secondary hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-primary w-4 h-4 rounded pointer-events-none"
                        />
                        <div>
                          <span className="block font-bold text-text">{les.title_si}</span>
                          <span className="text-[11px] text-text-muted">
                            නිපුණතා: {les.competencyIds.join(", ")} | මිනිත්තු {les.estimatedMinutes}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintLessonId(les.id);
                        }}
                        className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center rounded-lg border border-border bg-white text-text-muted hover:text-primary transition-colors text-[11px] flex items-center gap-1 shrink-0"
                        title="මුද්‍රණය සඳහා සටහන බලන්න"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">සටහන</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Assignment Generator Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-4">
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <Share2 className="w-4 h-4 text-accent" />
              <span>2. පැවරුම් කේතය සාදන්න</span>
            </h2>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  පැවරුමේ නම (Title):
                </label>
                <input
                  type="text"
                  required
                  value={collectionTitle}
                  onChange={(e) => setCollectionTitle(e.target.value)}
                  placeholder="උදා: 10A සතියේ ස්වර අභ්‍යාසය"
                  className="w-full bg-surface-warm border border-border rounded-xl p-2.5 text-text focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  ගුරුතුමා / ගුරුතුමියගේ නම:
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="උදා: එස්. පෙරේරා මිය"
                  className="w-full bg-surface-warm border border-border rounded-xl p-2.5 text-text focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  සිසුන්ට උපදෙස් (Instructions):
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="මෙම පාඩම් සම්පූර්ණ කර අවසාන ප්‍රශ්නාවලියට පිළිතුරු සපයන්න."
                  className="w-full bg-surface-warm border border-border rounded-xl p-2.5 text-text focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={selectedLessonsForCollection.length === 0 || !collectionTitle.trim()}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                පැවරුම් කේතය ලබාගන්න
              </button>
            </form>

            {createdAssignment && (
              <div className="bg-green-50 p-4 rounded-2xl border border-forest-green/40 mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-green-900">පැවරුම් කේතය:</span>
                  <span className="font-mono font-black text-lg text-primary tracking-wider bg-white px-2 py-0.5 rounded border border-green-300">
                    {createdAssignment.code}
                  </span>
                </div>
                <p className="text-green-800 text-[11px]">
                  මෙම කේතය හෝ පහත සබැඳිය සිසුන්ට ලබා දෙන්න:
                </p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full flex items-center justify-center gap-1.5 bg-forest-green hover:bg-green-800 text-white font-bold py-2 rounded-xl transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      පිටපත් විය!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      සබැඳිය පිටපත් කරන්න
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Lesson Outline Modal / View */}
      {printLesson && (
        <div className="bg-white rounded-3xl p-8 border-2 border-primary shadow-warm-lg space-y-6">
          <div className="flex items-center justify-between border-b border-border-light pb-4">
            <div>
              <span className="text-xs font-bold text-accent uppercase">
                මුද්‍රණය සඳහා වන පාඩම් සටහන
              </span>
              <h2 className="text-xl font-bold text-primary">{printLesson.title_si}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <Printer className="w-4 h-4" /> මුද්‍රණය කරන්න (Print)
              </button>
              <button
                type="button"
                onClick={() => setPrintLessonId(null)}
                className="text-xs text-text-muted hover:text-text px-2 py-1"
              >
                වසන්න ✕
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
            <div>
              <span className="font-bold text-text block">1. ඉගෙනුම් අරමුණ:</span>
              <p>{printLesson.learningGoal_si}</p>
            </div>

            <div>
              <span className="font-bold text-text block">2. ප්‍රධාන කරුණු:</span>
              {printLesson.contentSections.map((sec, i) => (
                <div key={i} className="mt-2 pl-3 border-l-2 border-accent">
                  <span className="font-bold text-text">{sec.heading_si}: </span>
                  <span>{sec.content_si}</span>
                </div>
              ))}
            </div>

            <div>
              <span className="font-bold text-text block">3. සාරාංශය (Recap):</span>
              <ul className="list-disc list-inside">
                {printLesson.recap_si.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
