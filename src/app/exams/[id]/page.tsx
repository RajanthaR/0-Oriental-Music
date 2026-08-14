"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Award, Clock, CheckCircle2, FileText, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export default function ExamPaperTakePage() {
  const params = useParams();
  const examId = params.id as string;

  const paper = repository.getExamPaperById(examId);
  const [activeTab, setActiveTab] = useState<"partA" | "partB">("partA");
  const [revealedMarkingIdx, setRevealedMarkingIdx] = useState<number | null>(null);

  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-4">ප්‍රශ්න පත්‍රය හමු නොවීය.</h2>
        <Link href="/exams" className="text-primary underline text-sm">
          විභාග මධ්‍යස්ථානය වෙත ආපසු යන්න
        </Link>
      </div>
    );
  }

  const mcqQuiz = {
    id: `quiz-${paper.id}`,
    title_si: `${paper.title_si} - I කොටස (බහුවරණ)`,
    questions: paper.partA_MCQ,
    passingScorePercent: 60,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/exams" className="hover:underline">
          විභාග පුහුණුව
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold truncate">{paper.title_si}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            {paper.gradeBand === "10-11" ? "සාමාන්‍ය පෙළ (O/L)" : "උසස් පෙළ (A/L)"}
          </span>
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> කාලය: මිනිත්තු {paper.timeLimitMinutes}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-primary mb-3">
          {paper.title_si}
        </h1>

        {/* Part Tabs (Part A MCQ vs Part B Structured) */}
        <div className="flex bg-surface-warm p-1.5 rounded-2xl border border-border mt-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("partA")}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === "partA"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            I කොටස: බහුවරණ ප්‍රශ්න ({paper.partA_MCQ.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("partB")}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === "partB"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            II කොටස: ව්‍යුහගත ප්‍රශ්න ({paper.partB_Structured.length})
          </button>
        </div>
      </div>

      {/* Part Content Area */}
      {activeTab === "partA" ? (
        <div>
          <QuizRunner quiz={mcqQuiz} />
        </div>
      ) : (
        /* Part B Structured Questions with Marking Scheme Guidance */
        <div className="space-y-6">
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-accent/40 text-xs text-amber-950">
            <span className="font-bold block mb-1">මාදිලි පිළිතුරු සහ ලකුණු දීමේ පටිපාටිය:</span>
            පහත ව්‍යුහගත ප්‍රශ්නවලට ඔබේ පිළිතුරු සිතා බලා, 'ලකුණු දීමේ පටිපාටිය' මත ක්ලික් කර නිවැරදි කරුණු පරික්ෂා කරගන්න.
          </div>

          {paper.partB_Structured.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-border shadow-warm-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-full">
                  ප්‍රශ්න අංක {idx + 1}
                </span>
                <span className="text-xs text-text-muted">{q.difficulty} මට්ටම</span>
              </div>

              <h3 className="text-base font-bold text-text leading-snug">{q.prompt_si}</h3>

              {/* Toggle Marking Scheme Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setRevealedMarkingIdx(revealedMarkingIdx === idx ? null : idx)
                  }
                  className="flex items-center justify-between w-full p-3.5 rounded-xl bg-surface-warm hover:bg-amber-50 text-xs font-bold text-text-secondary transition-all border border-border-light"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>මාදිලි පිළිතුර සහ ලකුණු ලබාදීමේ නිර්ණායක බලන්න</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      revealedMarkingIdx === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {revealedMarkingIdx === idx && (
                  <div className="bg-surface-warm p-4 rounded-xl border border-border-light mt-2 space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-text block mb-1">මාදිලි පිළිතුර:</span>
                      <p className="text-forest-green font-bold text-sm">
                        {q.correctShortAnswer_si?.join(" / ")}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-text block mb-1">විවරණය (Explanation):</span>
                      <p className="text-text-secondary leading-relaxed">{q.explanation_si}</p>
                    </div>

                    {q.markingPoints_si && (
                      <div>
                        <span className="font-bold text-text block mb-1">
                          ලකුණු ලබාදෙන ආකාරය (Marking Scheme):
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-text-secondary">
                          {q.markingPoints_si.map((pt, pIdx) => (
                            <li key={pIdx}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
