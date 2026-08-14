import React from "react";
import Link from "next/link";
import { BookOpen, Compass, ArrowRight, Layers } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function CurriculumMapPage() {
  const strands = repository.getStrands();
  const lessons = repository.getLessons();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Layers className="w-4 h-4 text-accent" />
          <span>විෂය නිර්දේශ සිතියම</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          නිපුණතා හා විෂය ධාරා සිතියම
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ශ්‍රී ලංකා ජාතික අධ්‍යාපන ආයතනයේ (NIE) පෙරදිග සංගීතය නිපුණතා ධාරා 10 සහ ඊට අනුරූප පාඩම් පූර්වාවශ්‍යතා ජාලය.
        </p>
      </div>

      {/* Strands & Competency Matrix */}
      <div className="space-y-6">
        {strands.map((strand) => {
          const strandLessons = lessons.filter((l) => l.strandId === strand.id);

          return (
            <div
              key={strand.id}
              className="bg-white rounded-3xl p-6 border border-border shadow-warm-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">
                    {strand.id}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-text mt-1">
                    {strand.name_si}
                  </h2>
                  <span className="text-xs text-text-muted">{strand.name_en}</span>
                </div>
                <span className="text-xs font-bold text-text-secondary">
                  පාඩම් {strandLessons.length}
                </span>
              </div>

              <p className="text-xs text-text-secondary">{strand.description_si}</p>

              {/* Lessons under this strand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {strandLessons.map((les) => (
                  <Link
                    key={les.id}
                    href={`/lessons/${les.id}`}
                    className="p-3 bg-surface-warm rounded-xl border border-border-light hover:border-accent transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-text block">{les.title_si}</span>
                      <span className="text-[11px] text-text-muted">
                        ශ්‍රේණි: {les.gradeBands.join(", ")} | මිනිත්තු {les.estimatedMinutes}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
