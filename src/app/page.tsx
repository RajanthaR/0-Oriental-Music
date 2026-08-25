"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Music,
  Compass,
  BookOpen,
  Award,
  Users,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Volume2,
  Feather,
  Radio,
  Drama,
  HelpCircle,
} from "lucide-react";
import { GradeBandType } from "@/types/content";
import { repository } from "@/lib/data/repository";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  subscribeToStorageChanges,
} from "@/lib/storage/progress-storage";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";

export default function HomePage() {
  const [selectedGrade, setSelectedGrade] = useState<GradeBandType>("10-11");
  // Storage-derived state via useSyncExternalStore (react-hooks v6 adoption):
  // the server snapshot returns the same defaults the legacy mount-effect
  // initial state used, so prerendered markup is unchanged; the client
  // snapshot replaces the post-hydration setState-in-effect pass.
  const progressSnapshot = useSyncExternalStore(
    subscribeToStorageChanges,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  const studentProgress = {
    completedCount: progressSnapshot.completedLessonIds.length,
    streak: progressSnapshot.streakDays || 1,
    lastLessonId:
      progressSnapshot.completedLessonIds[progressSnapshot.completedLessonIds.length - 1] ||
      "les-swara-01",
  };

  const strands = repository.getStrands();
  const learningPaths = repository.getLearningPaths(selectedGrade);
  const featuredLessons = repository.getLessons({ gradeBand: selectedGrade }).slice(0, 4);
  const continueLesson = repository.getLessonById(studentProgress.lastLessonId);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-surface-warm to-background pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Sinhala Welcome Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border shadow-warm-sm text-xs font-bold text-primary mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>ශ්‍රී ලංකා පාසල් පෙරදිග සංගීතය ඩිජිටල් ඉගෙනුම් වේදිකාව</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-primary tracking-tight leading-tight sm:leading-tight mb-4">
              සංගීතයේ රිද්මය සොයා <br />
              <span className="text-accent">“ස්වර මඟ”</span> ඔස්සේ පියනඟමු
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-8 max-w-2xl mx-auto">
              පෙළපොත් අනුපිළිවෙළට සීමා නොවී, සංකල්පීය සබඳතා, සජීවී බ්‍රවුසර් ශ්‍රව්‍ය ආදර්ශන, අන්තර්ක්‍රියාකාරී තාල මෙවලම් සහ විභාග ප්‍රශ්නාවලි මඟින් පෙරදිග සංගීතය ප්‍රායෝගිකව ප්‍රගුණ කරන්න.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/learning-paths"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-2xl shadow-warm-md hover:scale-105 transition-all"
              >
                <span>ඉගෙනීම අරඹන්න</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/practice"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-surface-warm text-text font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl border border-border shadow-warm-sm transition-all"
              >
                <Volume2 className="w-4 h-4 text-accent" />
                <span>පුහුණු මෙවලම් අත්හදා බලන්න</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grade-Band Selector & Continue Learning Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-border shadow-warm-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-5 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-text">
                ඔබේ ශ්‍රේණි කාණ්ඩය තෝරන්න (Grade Band):
              </h2>
              <p className="text-xs text-text-muted">
                ශ්‍රේණියට උචිත නිපුණතා සහ විෂය ගැඹුර අනුව අන්තර්ගතය පෙරහන් කෙරේ
              </p>
            </div>

            {/* Grade Band Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "6-7" as GradeBandType, label: "6–7", desc: "ආරම්භක" },
                { id: "8-9" as GradeBandType, label: "8–9", desc: "මධ්‍යම" },
                { id: "10-11" as GradeBandType, label: "10–11", desc: "සා.පෙළ" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGrade(g.id)}
                  className={`px-4 py-2.5 rounded-xl border text-center transition-all ${
                    selectedGrade === g.id
                      ? "bg-primary text-white border-primary shadow-sm font-bold"
                      : "bg-surface-warm border-border hover:bg-white text-text font-medium"
                  }`}
                >
                  <span className="block text-sm leading-tight">{g.label}</span>
                  <span className={`text-[10px] ${selectedGrade === g.id ? "text-amber-200" : "text-text-muted"}`}>
                    {g.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Continue Learning / Quick Progress Card */}
          <div className="bg-surface-warm rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-border-light">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-accent flex items-center justify-center font-black text-lg shrink-0">
                {studentProgress.streak}🔥
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-text">
                  දින {studentProgress.streak} ක අඛණ්ඩ සංගීත පුහුණුවක්!
                </h3>
                <p className="text-xs text-text-muted">
                  ඔබ පාඩම් {studentProgress.completedCount} ක් සාර්ථකව සම්පූර්ණ කර ඇත.
                </p>
              </div>
            </div>

            {continueLesson ? (
              <Link
                href={`/lessons/${continueLesson.id}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <span>ඉගෙනීම ඉදිරියට ගෙන යන්න</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="w-full sm:w-auto text-center text-xs font-bold text-amber-900 bg-amber-100 border border-amber-200 px-5 py-2.5 rounded-xl">
                මූලාශ්‍ර සමාලෝචනය අවසන් වූ පසු පාඩම් ලබාගත හැක
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Goal-Oriented Learning Paths Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">
              ඉලක්ක පාදක ඉගෙනුම
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
              ඔබට අද ඉගෙනගැනීමට අවශ්‍ය කුමක්ද?
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              ඔබේ ඉලක්කය තෝරාගෙන පූර්වාවශ්‍යතා පිරික්සමින් පියවරෙන් පියවර ඉදිරියට යන්න
            </p>
          </div>

          <Link
            href="/learning-paths"
            className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>සියලු ඉගෙනුම් මාර්ග බලන්න</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Learning Paths Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningPaths.slice(0, 3).map((path) => (
            <div
              key={path.id}
              className="bg-white rounded-3xl p-6 border border-border shadow-warm-md hover:shadow-warm-lg hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary">
                    {path.difficulty}
                  </span>
                  <span className="text-xs text-text-muted font-medium">
                    පැය {path.estimatedHours} ක පාඨමාලාවකි
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-text mb-2">
                  “{path.goalStatement_si}”
                </h3>

                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {path.description_si}
                </p>
              </div>

              <div className="pt-4 border-t border-border-light flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">
                  පියවර {path.steps.length} ක් අඩංගුයි
                </span>
                <Link
                  href={`/learning-paths/${path.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent transition-colors"
                >
                  <span>මාර්ගය අරඹන්න</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {learningPaths.length === 0 && (
            <div className="md:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              මෙම ශ්‍රේණි කාණ්ඩයට අදාළ ඉගෙනුම් මාර්ග මූලාශ්‍ර සමාලෝචනය අවසන් වන තෙක් පොදු ප්‍රවේශයට ලබා නොදේ.
            </div>
          )}
        </div>
      </section>

      {/* Featured Interactive Practice Live Tool Section */}
      <section className="bg-surface-warm py-14 sm:py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">
              සජීවී බ්‍රවුසර් ශ්‍රව්‍ය මෙවලම්
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-2">
              ස්වර යතුරුපුවරුව සජීවීව අත්හදා බලන්න
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              කිසිදු බාහිර ඩවුන්ලෝඩ් එකක් හෝ ගාස්තුවක් නැත. ස්වර තාරතාව සහ ආරෝහණ/අවරෝහණ ක්ෂණිකව වාදනය කර බලන්න.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <SwaraKeyboard compact={false} />
          </div>
        </div>
      </section>

      {/* 10 Curriculum Strands Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">
            විෂය නිර්දේශ ව්‍යුහය
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-2">
            පෙරදිග සංගීතය ප්‍රධාන ධාරා 10
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            ජාතික අධ්‍යාපන ආයතනයේ (NIE) පෙරදිග සංගීත නිපුණතා ආවරණය වන සම්පූර්ණ විෂය පරාසය
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {strands.map((strand) => (
            <Link
              key={strand.id}
              href={`/strands/${strand.id}`}
              className="bg-white rounded-2xl p-5 border border-border shadow-warm-sm hover:shadow-warm-md hover:border-accent/60 transition-all flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary group-hover:bg-accent group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm sm:text-base text-text group-hover:text-primary transition-colors">
                  {strand.name_si}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mt-1">
                  {strand.description_si}
                </p>
              </div>
            </Link>
          ))}
          {strands.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              මූලාශ්‍ර සාක්ෂි සහ ප්‍රකාශන සමාලෝචනය අවසන් වූ පසු විෂය ධාරා සිතියම මෙහි පෙන්වනු ලැබේ.
            </div>
          )}
        </div>
      </section>

      {/* Quick Shortcuts: Exams & Teachers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exam Practice Card */}
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-7 text-white flex flex-col justify-between shadow-warm-lg">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-3">
                <Award className="w-3.5 h-3.5" />
                <span>විභාග පෙරහුරු මධ්‍යස්ථානය</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-2">
                සාමාන්‍ය පෙළ (10–11) විභාග අභ්‍යාසය
              </h3>
              <p className="text-xs sm:text-sm text-[#F7E6E8] leading-relaxed mb-6">
                විභාග දෙපාර්තමේන්තු ඇගයීම් වාර්තා පදනම් කරගත් බහුවරණ, ව්‍යුහගත සහ ප්‍රස්තාර ප්‍රශ්න රටා සඳහා ලකුණු දීමේ මාර්ගෝපදේශ සහිතව පුහුණු වන්න.
              </p>
            </div>
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl w-fit shadow-sm transition-all"
            >
              <span>විභාග අභ්‍යාස අරඹන්න</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Teacher Hub Card */}
          <div className="bg-white rounded-3xl p-7 border border-border shadow-warm-lg flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full text-xs font-bold text-teal-800 mb-3">
                <Users className="w-3.5 h-3.5" />
                <span>ගුරුවරුන් සඳහා විශේෂිතයි</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-text mb-2">
                ගුරු පියස (Teacher Workspace)
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                NIE නිපුණතා හා ශ්‍රේණි අනුව පාඩම් තෝරා ඔබේම පාඩම් එකතුවක් (Lesson Collection) සාදන්න. සිසුන් සමඟ බෙදාගත හැකි සරල පැවරුම් කේත සහ මුද්‍රණය කළ හැකි සටහන් ලබාගන්න.
              </p>
            </div>
            <Link
              href="/teachers"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl w-fit shadow-sm transition-all"
            >
              <span>ගුරු පියසට පිවිසෙන්න</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
