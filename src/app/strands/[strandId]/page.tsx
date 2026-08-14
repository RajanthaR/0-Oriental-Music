"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Music, BookOpen, Clock, ArrowRight } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function StrandDetailPage() {
  const params = useParams();
  const strandId = params.strandId as string;

  const strand = repository.getStrandById(strandId);
  const lessons = repository.getLessons({ strandId });

  if (!strand) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-4">විෂය ධාරාව හමු නොවීය.</h2>
        <Link href="/" className="text-primary underline text-sm">
          මුල් පිටුව වෙත ආපසු යන්න
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="hover:underline">
          මුල් පිටුව
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold">{strand.name_si}</span>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center font-bold">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              {strand.name_si}
            </h1>
            <span className="text-xs text-text-muted">{strand.name_en}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
          {strand.description_si}
        </p>
      </div>

      {/* Lessons under this Strand */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>මෙම ධාරාවට අයත් පාඩම් ({lessons.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((les) => (
            <Link
              key={les.id}
              href={`/lessons/${les.id}`}
              className="bg-white rounded-3xl p-5 border border-border shadow-warm-sm hover:shadow-warm-md hover:border-accent/60 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
                    {les.difficulty}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> මිනිත්තු {les.estimatedMinutes}
                  </span>
                </div>

                <h3 className="text-base font-bold text-text group-hover:text-primary transition-colors mb-2">
                  {les.title_si}
                </h3>

                <p className="text-xs text-text-secondary line-clamp-2 mb-4">
                  {les.summary_si}
                </p>
              </div>

              <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs font-bold text-primary">
                <span>පාඩම හදාරන්න</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
