"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Volume2,
  Sparkles,
  HelpCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { repository } from "@/lib/data/repository";
import { ProgressStorage } from "@/lib/storage/progress-storage";
import { swaraSynth } from "@/lib/audio/synth";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { TalaVisualizer } from "@/components/audio/TalaVisualizer";
import { RhythmTapGame } from "@/components/audio/RhythmTapGame";
import { PitchDetectorView } from "@/components/audio/PitchDetectorView";
import { NotationArranger } from "@/components/audio/NotationArranger";
import { EarTrainingModule } from "@/components/audio/EarTrainingModule";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params.id as string;

  const lesson = repository.getLessonById(lessonId);
  const quiz = lesson ? repository.getQuizById(lesson.quizId) : undefined;
  const source = lesson ? repository.getSourceById(lesson.sourceReference.sourceId) : undefined;

  const [isSaved, setIsSaved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [diagnosticSelected, setDiagnosticSelected] = useState<number | null>(null);
  const [showDiagnosticResult, setShowDiagnosticResult] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    const p = ProgressStorage.getProgress();
    setIsSaved(p.savedLessonIds.includes(lesson.id));
    setIsCompleted(p.completedLessonIds.includes(lesson.id));
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-4">පාඩම හමු නොවීය.</h2>
        <Link href="/lessons" className="text-primary underline text-sm">
          සියලු පාඩම් වෙත ආපසු යන්න
        </Link>
      </div>
    );
  }

  const handleToggleSave = () => {
    const saved = ProgressStorage.toggleSaveLesson(lesson.id);
    setIsSaved(saved);
  };

  const handlePlayLessonAudio = () => {
    if (audioPlaying) return;
    setAudioPlaying(true);
    if (lesson.listenActivity.notes) {
      swaraSynth.playSequence(lesson.listenActivity.notes, 0.6, undefined, 261.63, "harmonium")
        .then(() => setAudioPlaying(false));
    } else {
      setTimeout(() => setAudioPlaying(false), 2000);
    }
  };

  const handleQuizComplete = (score: number, maxScore: number, passed: boolean) => {
    if (passed) {
      ProgressStorage.markLessonComplete(lesson.id, lesson.competencyIds);
      setIsCompleted(true);
    }
  };

  const strand = repository.getStrandById(lesson.strandId);
  const practiceTala = lesson.guidedPractice.interactiveTool === "tala-visualizer" && lesson.guidedPractice.targetTalaId
    ? repository.getTalaById(lesson.guidedPractice.targetTalaId)
    : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 1. Breadcrumb & Grade Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <Link href="/lessons" className="hover:underline">
            පාඩම් මාලාව
          </Link>
          <span>/</span>
          <span className="text-primary font-semibold">{strand?.name_si}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isSaved
                ? "bg-amber-50 text-accent border-accent"
                : "bg-surface-warm border-border text-text hover:bg-white"
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 fill-accent" />
                <span>සුරකින ලදි</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>සුරකින්න</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Lesson Card Container */}
      <article className="bg-white rounded-3xl p-6 sm:p-10 border border-border shadow-warm-lg space-y-8">
        {/* 1. Title & Meta */}
        <header className="border-b border-border-light pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
              {lesson.difficulty} මට්ටම
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800">
              ශ්‍රේණි කාණ්ඩය: {lesson.gradeBands.join(", ")}
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5" /> විනාඩි {lesson.estimatedMinutes}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-primary tracking-tight mb-3">
            {lesson.title_si}
          </h1>

          {/* 2. One-sentence Learning Goal */}
          <div className="bg-surface-warm p-4 rounded-2xl border border-border-light flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-text block mb-0.5">ඉගෙනුම් අරමුණ:</span>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
                {lesson.learningGoal_si}
              </p>
            </div>
          </div>
        </header>

        {/* 4. Prior Knowledge / Prerequisites */}
        {lesson.prerequisites && lesson.prerequisites.length > 0 && (
          <section className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100 text-xs">
            <span className="font-bold text-primary block mb-1">අවශ්‍ය පූර්ව දැනුම:</span>
            <div className="flex flex-wrap gap-2">
              {lesson.prerequisites.map((pId) => {
                const pLes = repository.getLessonById(pId);
                return (
                  <Link
                    key={pId}
                    href={`/lessons/${pId}`}
                    className="bg-white px-2.5 py-1 rounded-lg border border-primary-200 text-primary font-semibold hover:underline"
                  >
                    {pLes?.title_si || pId} →
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Short Diagnostic Question */}
        {lesson.diagnosticQuestion && (
          <section className="bg-amber-50/70 p-5 rounded-2xl border border-accent/40">
            <div className="flex items-center gap-1.5 text-accent-dark font-bold text-xs mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>මූලික ඇගයීම් ප්‍රශ්නය (Diagnostic):</span>
            </div>
            <p className="text-sm font-bold text-text mb-3">
              {lesson.diagnosticQuestion.question_si}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {lesson.diagnosticQuestion.options_si.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDiagnosticSelected(idx);
                    setShowDiagnosticResult(true);
                  }}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    diagnosticSelected === idx
                      ? "bg-amber-200/80 border-accent font-bold text-text"
                      : "bg-white border-border hover:bg-amber-100/40 text-text"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {showDiagnosticResult && (
              <div className="text-xs text-text-secondary bg-white p-3 rounded-xl border border-border-light">
                <span className="font-bold block mb-0.5">
                  {diagnosticSelected === lesson.diagnosticQuestion.correctIndex
                    ? "🎉 නිවැරදි පිළිතුරකි!"
                    : "💡 පැහැදිලි කිරීම:"}
                </span>
                {lesson.diagnosticQuestion.explanation_si}
              </div>
            )}
          </section>
        )}

        {/* 6 & 7. Simple Sinhala Explanation & Key Terms */}
        <section className="space-y-6">
          {lesson.contentSections.map((sec, idx) => (
            <div key={idx} className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-primary border-l-4 border-accent pl-3">
                {sec.heading_si}
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {sec.content_si}
              </p>

              {/* Key Terms in this section */}
              {sec.keyTerms && sec.keyTerms.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {sec.keyTerms.map((kt, kIdx) => (
                    <div
                      key={kIdx}
                      className="bg-surface-warm p-3 rounded-xl border border-border-light text-xs"
                    >
                      <div className="font-bold text-primary flex items-center justify-between">
                        <span>{kt.term_si}</span>
                        {kt.term_en && (
                          <span className="text-[10px] text-text-muted font-normal">
                            ({kt.term_en})
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary mt-0.5 leading-snug">{kt.meaning_si}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 8. Notation Table if present */}
              {sec.notationTable && sec.notationTable.length > 0 && (
                <div className="overflow-x-auto my-3">
                  <table className="w-full text-xs text-center border-collapse border border-border">
                    <tbody>
                      {sec.notationTable.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx === 0 ? "bg-surface-warm font-bold" : ""}>
                          <td className="p-2 border border-border font-semibold bg-surface-warm/60">
                            {row.rowLabel_si}
                          </td>
                          {row.notes.map((n, nIdx) => (
                            <td key={nIdx} className="p-2 border border-border">
                              {n}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* 9. “සවන් දෙමු” (Listen) Audio Activity */}
        <section className="bg-surface-warm p-5 sm:p-6 rounded-3xl border border-border space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Volume2 className="w-5 h-5 text-accent" />
            <span>සවන් දෙමු: {lesson.listenActivity.title_si}</span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {lesson.listenActivity.instruction_si}
          </p>

          <button
            type="button"
            onClick={handlePlayLessonAudio}
            disabled={audioPlaying}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-60"
          >
            <Play className="w-4 h-4 fill-current" />
            {audioPlaying ? "ශ්‍රවණය වෙමින් පවතී..." : "ආදර්ශනයට සවන් දෙන්න"}
          </button>
        </section>

        {/* 11 & 12. Interactive Practice Activity */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>ප්‍රායෝගික පුහුණුව: {lesson.guidedPractice.title_si}</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            {lesson.guidedPractice.instruction_si}
          </p>

          {/* Render selected tool based on lesson.guidedPractice.interactiveTool */}
          {lesson.guidedPractice.interactiveTool === "swara-keyboard" && (
            <SwaraKeyboard
              highlightNotes={lesson.guidedPractice.targetSequence}
              compact={false}
            />
          )}

          {lesson.guidedPractice.interactiveTool === "tala-visualizer" && (
            practiceTala ? (
              <TalaVisualizer tala={practiceTala} />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
                මෙම අභ්‍යාසයට අවශ්‍ය තාලය මූලාශ්‍ර සමාලෝචනය අවසන් වන තෙක් ප්‍රසිද්ධ භාවිතයට නොමැත.
              </div>
            )
          )}

          {lesson.guidedPractice.interactiveTool === "rhythm-tap" && (
            <RhythmTapGame bpm={lesson.guidedPractice.targetBpm || 80} />
          )}

          {lesson.guidedPractice.interactiveTool === "pitch-detector" && (
            <PitchDetectorView targetNotes={lesson.guidedPractice.targetNotes || ["S", "R", "G"]} />
          )}

          {lesson.guidedPractice.interactiveTool === "notation-arranger" && (
            <NotationArranger
              prompt_si={lesson.independentPractice.puzzleData?.prompt_si}
              shuffledItems={lesson.independentPractice.puzzleData?.shuffledItems}
              correctOrder={lesson.independentPractice.puzzleData?.correctOrder}
            />
          )}

          {lesson.guidedPractice.interactiveTool === "ear-training" && (
            <EarTrainingModule />
          )}
        </section>

        {/* 13 & 14. Mini Quiz Engine */}
        {quiz && (
          <section className="pt-6 border-t border-border-light space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-text">
              මිනි ප්‍රශ්නාවලිය (Mini Quiz)
            </h2>
            <QuizRunner quiz={quiz} onComplete={handleQuizComplete} />
          </section>
        )}

        {/* 15. Lesson Recap */}
        <section className="bg-surface-warm p-5 rounded-2xl border border-border-light space-y-2">
          <span className="font-bold text-xs text-text block mb-1">
            පාඩමේ සාරාංශය (Recap):
          </span>
          <ul className="space-y-1.5 text-xs text-text-secondary list-disc list-inside">
            {lesson.recap_si.map((r, idx) => (
              <li key={idx} className="leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        </section>

        {/* 16. Traceable Source Note */}
        <footer className="bg-primary-50/40 p-4 rounded-2xl border border-primary-100/60 text-xs text-text-secondary flex items-start gap-2.5">
          <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-text block">මූලාශ්‍ර සටහන (Source Reference):</span>
            <p>
              {source?.title} ({source?.publisher}, {source?.year}) — {lesson.sourceReference.pageOrSection}
            </p>
            <p className="text-[11px] text-text-muted">
              සමාලෝචනය: {lesson.reviewMetadata.reviewer} ({lesson.reviewMetadata.lastVerifiedDate}) | බලපත්‍රය: {lesson.reviewMetadata.license}
            </p>
          </div>
        </footer>

        {/* 17. Next Recommended Lesson */}
        {lesson.nextRecommendedLessonId && (
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Link
              href="/lessons"
              className="text-xs font-bold text-text-secondary hover:text-text"
            >
              ← සියලු පාඩම්
            </Link>

            <Link
              href={`/lessons/${lesson.nextRecommendedLessonId}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-sm transition-all"
            >
              <span>මීළඟ නිර්දේශිත පාඩම</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
