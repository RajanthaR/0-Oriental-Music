"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowRight, FileText } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { TalaVisualizer } from "@/components/audio/TalaVisualizer";
import { RhythmTapGame } from "@/components/audio/RhythmTapGame";

export default function TalaDetailPage() {
  const params = useParams();
  const talaId = params.id as string;

  const tala = repository.getTalaById(talaId);
  const source = tala ? repository.getSourceById(tala.sourceReference.sourceId) : undefined;

  if (!tala) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-4">තාලය හමු නොවීය.</h2>
        <Link href="/talas" className="text-primary underline text-sm">
          සියලු තාල වෙත ආපසු යන්න
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/talas" className="hover:underline">
          ලය හා තාල
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold">{tala.name_si}</span>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary">
            මාත්‍රා {tala.matras}
          </span>
          <span className="text-xs text-text-muted font-medium">
            විභාග {tala.vibhagCount} ({tala.vibhagStructure.join("+")})
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-3">
          {tala.name_si} ({tala.name_en})
        </h1>

        <div className="bg-surface-warm p-4 rounded-2xl border border-border-light text-xs sm:text-sm mb-6">
          <span className="font-bold text-text block mb-1">තාළි සහ ඛාලි ලකුණු:</span>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            {tala.taliKhali_si.map((tk, idx) => (
              <li key={idx}>{tk}</li>
            ))}
          </ul>
        </div>

        {/* Live Tala Visualizer Component */}
        <TalaVisualizer tala={tala} />
      </div>

      {/* Rhythm Tapping Practice for this Tala */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-md">
        <h2 className="text-lg sm:text-xl font-bold text-text mb-2">
          {tala.name_si} රිද්මයට තට්ටු කිරීමේ අභ්‍යාසය
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mb-5">
          තාලයේ ස්පන්දනයට අනුව අත්පුඩි ගසමින් හෝ තිරය මත තට්ටු කරමින් නිරවද්‍යතාව මැන බලන්න.
        </p>

        <RhythmTapGame bpm={tala.layaVariants?.thah_bpm || 80} totalBeats={tala.matras * 2} />
      </section>

      {/* Source Citation */}
      <footer className="bg-primary-50/40 p-4 rounded-2xl border border-primary-100/60 text-xs text-text-secondary flex items-start gap-2.5">
        <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-text block">මූලාශ්‍ර සටහන:</span>
          <p>
            {source?.title} ({source?.publisher}) — {tala.sourceReference.pageOrSection}
          </p>
        </div>
      </footer>
    </div>
  );
}
