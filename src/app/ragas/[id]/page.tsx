"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Clock, Play, ArrowRight, Music, FileText, CheckCircle2 } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { formatPublicSourceReference } from "@/lib/data/publication-policy";
import { swaraSynth, type SwaraPlaybackHandle } from "@/lib/audio/synth";
import { releaseHandleRef } from "@/lib/audio/cleanup";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";

export default function RagaDetailPage() {
  const params = useParams();
  const ragaId = params.id as string;

  const raga = repository.getRagaById(ragaId);
  const source = raga ? repository.getSourceById(raga.sourceReference.sourceId) : undefined;
  const [playingPhraseIdx, setPlayingPhraseIdx] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const mountedRef = useRef(false);
  const audioGenerationRef = useRef(0);
  const sequenceHandleRef = useRef<SwaraPlaybackHandle | null>(null);

  // Invalidate the generation and surrender ownership before cancelling, so a
  // throwing sequence cancellation cannot leave a stale handle owned.
  const cancelOwnedAudio = useCallback(() => {
    audioGenerationRef.current += 1;
    releaseHandleRef(sequenceHandleRef);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setPlayingPhraseIdx(null);
    setAudioError(false);
    return () => {
      mountedRef.current = false;
      cancelOwnedAudio();
    };
  }, [cancelOwnedAudio, ragaId]);

  if (!raga) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-4">රාගය හමු නොවීය.</h2>
        <Link href="/ragas" className="text-primary underline text-sm">
          සියලු රාග වෙත ආපසු යන්න
        </Link>
      </div>
    );
  }

  const playSequence = async (phraseSwaras: string[], idx: number) => {
    if (playingPhraseIdx !== null) return;
    cancelOwnedAudio();
    const generation = audioGenerationRef.current;
    setPlayingPhraseIdx(idx);
    setAudioError(false);
    const handle = swaraSynth.playSequenceHandle(phraseSwaras, 0.6, undefined, 261.63, "harmonium");
    sequenceHandleRef.current = handle;
    void handle.ready.then(
      (played) => {
        if (!mountedRef.current || audioGenerationRef.current !== generation || sequenceHandleRef.current !== handle) return;
        if (!played) setAudioError(true);
      },
      () => {
        if (mountedRef.current && audioGenerationRef.current === generation && sequenceHandleRef.current === handle) {
          setAudioError(true);
          setPlayingPhraseIdx(null);
        }
      },
    );
    let finishedWithError = false;
    try {
      await (handle.finished ?? handle.ready.then(() => undefined, () => undefined));
    } catch {
      finishedWithError = true;
    } finally {
      const isCurrentHandle = sequenceHandleRef.current === handle;
      if (isCurrentHandle) sequenceHandleRef.current = null;
      if (!mountedRef.current || audioGenerationRef.current !== generation || !isCurrentHandle) return;
      if (finishedWithError) setAudioError(true);
      setPlayingPhraseIdx(null);
    }
  };

  const handlePlayPhrase = (phraseSwaras: string[], idx: number) => playSequence(phraseSwaras, idx);

  const handlePlayArohana = async () => {
    await playSequence(raga.arohana_swaras, 99);
  };

  const handlePlayAvarohana = async () => {
    await playSequence(raga.avarohana_swaras, 98);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Link href="/ragas" className="hover:underline">
          රාග ලෝකය
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold">{raga.name_si}</span>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-lg mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            {raga.thata_si}
          </span>
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ගායන වේලාව: {raga.time_si}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-3">
          {raga.name_si}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
          ජාතිය:{" "}
          <span className="font-bold text-text">{raga.jati_si}</span>
        </p>

        {/* Essential Properties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-warm p-5 rounded-2xl border border-border-light text-xs sm:text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-bold text-text">ආරෝහණය: </span>
              <span className="font-medium text-primary">{raga.arohana_si}</span>
            </div>
            <div>
              <span className="font-bold text-text">අවරෝහණය: </span>
              <span className="font-medium text-primary">{raga.avarohana_si}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="font-bold text-text">වාදී ස්වරය (රජු): </span>
              <span className="font-medium">{raga.vadi_si}</span>
            </div>
            <div>
              <span className="font-bold text-text">සංවාදී ස්වරය (ඇමති): </span>
              <span className="font-medium">{raga.samvadi_si}</span>
            </div>
            <div>
              <span className="font-bold text-text">පකඩ් (මුඛ්‍යාංගය): </span>
              <span className="font-semibold text-accent-dark">{raga.pakad_si}</span>
            </div>
          </div>
        </div>

        {/* Audio scale buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            type="button"
            onClick={handlePlayArohana}
            disabled={playingPhraseIdx !== null}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {playingPhraseIdx === 99 ? "වාදනය වේ..." : "ආරෝහණය අසන්න"}
          </button>
          <button
            type="button"
            onClick={handlePlayAvarohana}
            disabled={playingPhraseIdx !== null}
            className="flex items-center gap-2 bg-white hover:bg-surface-warm text-text font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-border shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {playingPhraseIdx === 98 ? "වාදනය වේ..." : "අවරෝහණය අසන්න"}
          </button>
        </div>
        {audioError && (
          <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            මෙම උපාංගයේ රාග නාදය ආරම්භ කළ නොහැක. ස්වර සටහන් සහ යතුරුපුවරුව දිගටම භාවිත කළ හැක.
          </p>
        )}
      </div>

      {/* Interactive Swara Keyboard for this Raga */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-text mb-4">
          රාගයේ ස්වර යතුරුපුවරුව (Interactive Scale)
        </h2>
        <SwaraKeyboard
          highlightNotes={raga.arohana_swaras}
          selectedRagaName={raga.name_si}
          compact={false}
        />
      </section>

      {/* Characteristic Features & Phrases */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-md mb-8 space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-text mb-3">
            රාගයේ ප්‍රධාන ලක්ෂණ (Key Characteristics)
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-text-secondary list-disc list-inside">
            {raga.characteristics_si.map((char, idx) => (
              <li key={idx} className="leading-relaxed">
                {char}
              </li>
            ))}
          </ul>
        </div>

        {/* Sample Melodic Phrases / Pakad */}
        {raga.samplePhrases && raga.samplePhrases.length > 0 && (
          <div className="pt-4 border-t border-border-light">
            <h3 className="text-base font-bold text-text mb-3">
              ආදර්ශ තනු ඛණ්ඩ සහ පකඩ් රටා (Sample Phrases)
            </h3>
            <div className="space-y-2.5">
              {raga.samplePhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="bg-surface-warm p-4 rounded-2xl border border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-text block">
                      {phrase.name_si}
                    </span>
                    <span className="font-mono text-xs text-primary font-semibold">
                      {phrase.swaras.join(" - ")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayPhrase(phrase.swaras, idx)}
                    disabled={playingPhraseIdx !== null}
                    className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-dark text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {playingPhraseIdx === idx ? "වාදනය වේ..." : "ඛණ්ඩය අසන්න"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Source Citation */}
      <footer className="bg-primary-50/40 p-4 rounded-2xl border border-primary-100/60 text-xs text-text-secondary flex items-start gap-2.5">
        <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-text block">මූලාශ්‍ර සටහන:</span>
          <p>
            {source?.title} — {formatPublicSourceReference(raga.sourceReference)}
          </p>
        </div>
      </footer>
    </div>
  );
}
