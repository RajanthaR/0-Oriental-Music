"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Radio, Play, ShieldAlert, FileText, ArrowRight, Wrench, Volume2 } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { swaraSynth } from "@/lib/audio/synth";
import { tablaSynth } from "@/lib/audio/tabla";

export default function InstrumentDetailPage() {
  const params = useParams();
  const instId = params.id as string;

  const instrument = repository.getInstrumentById(instId);
  const source = instrument ? repository.getSourceById(instrument.sourceReference.sourceId) : undefined;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!instrument) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-4">වාද්‍ය භාණ්ඩය හමු නොවීය.</h2>
        <Link href="/instruments" className="text-primary underline text-sm">
          සියලු වාද්‍ය භාණ්ඩ වෙත ආපසු යන්න
        </Link>
      </div>
    );
  }

  const handlePlaySample = () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    if (instrument.id === "inst-tabla" || instrument.category_si.includes("අවනද්ධ")) {
      ["ධා", "ධින්", "ධින්", "ධා"].forEach((bol, i) => {
        setTimeout(() => tablaSynth.playBol(bol), i * 400);
      });
      setTimeout(() => setIsPlayingAudio(false), 2000);
    } else if (instrument.id === "inst-flute") {
      swaraSynth.playSequence(["S", "G", "M", "P", "N", "S'"], 0.5, undefined, 261.63, "flute")
        .then(() => setIsPlayingAudio(false));
    } else {
      swaraSynth.playSequence(["S", "R", "G", "M", "P", "D", "N", "S'"], 0.45, undefined, 261.63, "harmonium")
        .then(() => setIsPlayingAudio(false));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/instruments" className="hover:underline">
          වාද්‍ය භාණ්ඩ
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold">{instrument.name_si}</span>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary">
            {instrument.category_si}
          </span>
          <span className="text-xs text-text-muted font-medium">
            සම්භවය: {instrument.origin_si}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-3">
          {instrument.name_si} ({instrument.name_en})
        </h1>

        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
          {instrument.musicalRole_si}
        </p>

        {/* Audio Demo Button */}
        <button
          type="button"
          onClick={handlePlaySample}
          disabled={isPlayingAudio}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          <Volume2 className="w-4 h-4" />
          {isPlayingAudio ? "නාද රටාව වාදනය වේ..." : "ආදර්ශ නාද රටාව අසන්න"}
        </button>
      </div>

      {/* Structure & Sound Production Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-primary">
            1. ව්‍යුහය සහ නිර්මාණය (Construction)
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {instrument.construction_si}
          </p>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-primary">
            2. නාද නිෂ්පාදන ක්‍රමවේදය (Sound Production)
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {instrument.soundProduction_si}
          </p>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-primary">
            3. වාදන ඉරියව්ව (Playing Position)
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {instrument.playingPosition_si}
          </p>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-primary">
            4. සුසර කිරීම (Tuning & Swaras)
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {instrument.tuningAndSwaras_si}
          </p>
        </section>
      </div>

      {/* Maintenance & Safety Note */}
      <section className="bg-amber-50/70 rounded-3xl p-6 border border-accent/40 flex items-start gap-3.5">
        <Wrench className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-text mb-1">
            නඩත්තුව සහ ආරක්ෂිත පරිහරණය (Maintenance & Safety):
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            {instrument.maintenanceAndSafety_si}
          </p>
        </div>
      </section>

      {/* Source Citation */}
      <footer className="bg-primary-50/40 p-4 rounded-2xl border border-primary-100/60 text-xs text-text-secondary flex items-start gap-2.5">
        <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-text block">මූලාශ්‍ර සටහන:</span>
          <p>
            {source?.title} ({source?.publisher}) — {instrument.sourceReference.pageOrSection}
          </p>
        </div>
      </footer>
    </div>
  );
}
