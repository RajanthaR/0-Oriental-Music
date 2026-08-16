"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Radio, Play, ShieldAlert, FileText, ArrowRight, Wrench, Volume2 } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { formatPublicSourceReference } from "@/lib/data/publication-policy";
import { swaraSynth, type SwaraPlaybackHandle } from "@/lib/audio/synth";
import { tablaSynth, type TablaPlaybackHandle } from "@/lib/audio/tabla";

export default function InstrumentDetailPage() {
  const params = useParams();
  const instId = params.id as string;

  const instrument = repository.getInstrumentById(instId);
  const source = instrument ? repository.getSourceById(instrument.sourceReference.sourceId) : undefined;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const mountedRef = useRef(false);
  const audioGenerationRef = useRef(0);
  const sequenceHandleRef = useRef<SwaraPlaybackHandle | null>(null);
  const tablaHandlesRef = useRef<Set<TablaPlaybackHandle>>(new Set());
  const audioTimersRef = useRef<Set<number>>(new Set());
  const completionTimerRef = useRef<number | null>(null);

  const cancelOwnedAudio = useCallback(() => {
    audioGenerationRef.current += 1;
    sequenceHandleRef.current?.();
    tablaHandlesRef.current.forEach((handle) => handle());
    audioTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    audioTimersRef.current.clear();
    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    if (mountedRef.current) setIsPlayingAudio(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setIsPlayingAudio(false);
    setAudioError(false);
    return () => {
      mountedRef.current = false;
      cancelOwnedAudio();
    };
  }, [cancelOwnedAudio, instId]);

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
    cancelOwnedAudio();
    const generation = audioGenerationRef.current;
    setIsPlayingAudio(true);
    setAudioError(false);

    if (instrument.id === "inst-tabla" || instrument.category_si.includes("අවනද්ධ")) {
      ["ධා", "ධින්", "ධින්", "ධා"].forEach((bol, i) => {
        const timerId = window.setTimeout(() => {
          audioTimersRef.current.delete(timerId);
          if (!mountedRef.current || audioGenerationRef.current !== generation) return;
          let handle: TablaPlaybackHandle;
          handle = tablaSynth.playBol(bol, 400, () => {
            if (mountedRef.current && audioGenerationRef.current === generation && tablaHandlesRef.current.has(handle)) {
              setAudioError(true);
            }
          });
          tablaHandlesRef.current.add(handle);
          void handle.ready.then((played) => {
            if (!mountedRef.current || audioGenerationRef.current !== generation || !tablaHandlesRef.current.has(handle)) return;
            if (!played) setAudioError(true);
          });
          void (handle.finished ?? handle.ready.then(() => undefined)).then(() => {
            tablaHandlesRef.current.delete(handle);
          });
        }, i * 400);
        audioTimersRef.current.add(timerId);
      });
      completionTimerRef.current = window.setTimeout(() => {
        completionTimerRef.current = null;
        if (!mountedRef.current || audioGenerationRef.current !== generation) return;
        audioGenerationRef.current += 1;
        tablaHandlesRef.current.forEach((handle) => handle());
        setIsPlayingAudio(false);
      }, 2000);
    } else if (instrument.id === "inst-flute") {
      const handle = swaraSynth.playSequenceHandle(["S", "G", "M", "P", "N", "S'"], 0.5, undefined, 261.63, "flute");
      sequenceHandleRef.current = handle;
      void handle.ready.then((played) => {
        if (!mountedRef.current || audioGenerationRef.current !== generation || sequenceHandleRef.current !== handle) return;
        if (!played) setAudioError(true);
      });
      void (handle.finished ?? handle.ready.then(() => undefined)).then(() => {
        const isCurrentHandle = sequenceHandleRef.current === handle;
        if (isCurrentHandle) sequenceHandleRef.current = null;
        if (!mountedRef.current || audioGenerationRef.current !== generation || !isCurrentHandle) return;
        setIsPlayingAudio(false);
      });
    } else {
      const handle = swaraSynth.playSequenceHandle(["S", "R", "G", "M", "P", "D", "N", "S'"], 0.45, undefined, 261.63, "harmonium");
      sequenceHandleRef.current = handle;
      void handle.ready.then((played) => {
        if (!mountedRef.current || audioGenerationRef.current !== generation || sequenceHandleRef.current !== handle) return;
        if (!played) setAudioError(true);
      });
      void (handle.finished ?? handle.ready.then(() => undefined)).then(() => {
        const isCurrentHandle = sequenceHandleRef.current === handle;
        if (isCurrentHandle) sequenceHandleRef.current = null;
        if (!mountedRef.current || audioGenerationRef.current !== generation || !isCurrentHandle) return;
        setIsPlayingAudio(false);
      });
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
        {audioError && (
          <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            මෙම උපාංගයේ ආදර්ශ නාදය ආරම්භ කළ නොහැක. වාද්‍ය භාණ්ඩ විස්තරය දිගටම කියවිය හැක.
          </p>
        )}
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
            {source?.title} — {formatPublicSourceReference(instrument.sourceReference)}
          </p>
        </div>
      </footer>
    </div>
  );
}
