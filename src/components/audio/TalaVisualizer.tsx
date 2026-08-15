"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Tala } from "@/types/content";
import { tablaSynth } from "@/lib/audio/tabla";
import { normalizePracticeBpm } from "@/lib/audio/tempo";
import { Play, Square, RotateCcw, Volume2, VolumeX, Hand, Waves } from "lucide-react";

export interface TalaVisualizerProps {
  tala: Tala;
  initialBpm?: number;
  showTablaAudioToggle?: boolean;
}

export function getCircularBeatStyle(index: number, matras: number, radius = 80): { transform: string } {
  const angle = (index / matras) * 2 * Math.PI - Math.PI / 2;
  const round = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
  return {
    transform: `translate(${round(Math.cos(angle) * radius)}px, ${round(Math.sin(angle) * radius)}px)`,
  };
}

export const TalaVisualizer: React.FC<TalaVisualizerProps> = ({
  tala,
  initialBpm,
  showTablaAudioToggle = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMatra, setCurrentMatra] = useState<number>(1);
  const [bpm, setBpm] = useState<number>(() => normalizePracticeBpm(initialBpm, tala.practiceTempoBpm?.thah_bpm));
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [visualMode, setVisualMode] = useState<"circular" | "linear">("circular");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackCancelRef = useRef<(() => void) | null>(null);
  const currentMatraRef = useRef(1);
  const audioEnabledRef = useRef(audioEnabled);
  const playbackSignature = JSON.stringify({
    id: tala.id,
    matras: tala.matras,
    theka: tala.theka_si,
    bols: tala.bols.map((bol) => [bol.matra, bol.bol_si]),
    tempo: tala.practiceTempoBpm?.thah_bpm ?? null,
  });
  const activeTalaSignatureRef = useRef(playbackSignature);
  const previousBpmRef = useRef(bpm);

  const currentBol = tala.bols.find((b) => b.matra === currentMatra) || tala.bols[0];
  const matraDurationMs = (60 / bpm) * 1000;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelPlayback = useCallback(() => {
    const cancel = playbackCancelRef.current;
    playbackCancelRef.current = null;
    cancel?.();
  }, []);

  const selectMatra = useCallback((matra: number) => {
    currentMatraRef.current = matra;
    setCurrentMatra(matra);
  }, []);

  const playMatra = useCallback((matra: number) => {
    cancelPlayback();
    if (!audioEnabledRef.current) return;
    const bol = tala.bols.find((candidate) => candidate.matra === matra);
    if (bol) {
      const handle = tablaSynth.playBol(bol.bol_si, matraDurationMs, () => setAudioError(true));
      playbackCancelRef.current = handle;
      void handle.ready;
    }
  }, [cancelPlayback, matraDurationMs, tala.bols]);

  const stepNextMatra = useCallback(() => {
    const next = currentMatraRef.current >= tala.matras ? 1 : currentMatraRef.current + 1;
    selectMatra(next);
    playMatra(next);
  }, [playMatra, selectMatra, tala.matras]);

  useEffect(() => {
    if (!isPlaying) {
      stopTimer();
      return;
    }
    const timer = setInterval(stepNextMatra, matraDurationMs);
    timerRef.current = timer;
    return () => {
      clearInterval(timer);
      if (timerRef.current === timer) timerRef.current = null;
    };
  }, [isPlaying, matraDurationMs, stepNextMatra, stopTimer]);

  useEffect(() => {
    if (previousBpmRef.current !== bpm) {
      if (isPlaying) cancelPlayback();
      previousBpmRef.current = bpm;
    }
  }, [bpm, cancelPlayback, isPlaying]);

  useEffect(() => {
    if (activeTalaSignatureRef.current === playbackSignature) return;
    activeTalaSignatureRef.current = playbackSignature;
    setIsPlaying(false);
    stopTimer();
    cancelPlayback();
    selectMatra(1);
    setBpm(normalizePracticeBpm(initialBpm, tala.practiceTempoBpm?.thah_bpm));
  }, [cancelPlayback, initialBpm, playbackSignature, selectMatra, stopTimer, tala.practiceTempoBpm?.thah_bpm]);

  useEffect(() => () => {
    stopTimer();
    cancelPlayback();
  }, [cancelPlayback, stopTimer]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopTimer();
      cancelPlayback();
      return;
    }
    setAudioError(false);
    playMatra(currentMatraRef.current);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    stopTimer();
    cancelPlayback();
    selectMatra(1);
  };

  const handleAudioToggle = () => {
    if (audioEnabled) cancelPlayback();
    const next = !audioEnabled;
    audioEnabledRef.current = next;
    setAudioEnabled(next);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-warm-md w-full">
      {/* Title & Playback Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light pb-3 mb-4">
        <div>
          <h3 className="font-bold text-text text-base sm:text-lg">
            {tala.name_si} ({tala.name_en})
          </h3>
          <p className="text-xs text-text-muted">
            මාත්‍රා {tala.matras} | විභාග {tala.vibhagCount} ({tala.vibhagStructure.join("+")})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showTablaAudioToggle && (
            <button
              type="button"
              onClick={handleAudioToggle}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                audioEnabled
                  ? "bg-primary-50 text-primary border-primary-200"
                  : "bg-surface-warm text-text-muted border-border"
              }`}
              title={audioEnabled ? "තබ්ලා නාදය නිහඬ කරන්න" : "තබ්ලා නාදය සක්‍රිය කරන්න"}
              aria-label="තබ්ලා නාදය පාලනය"
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg border border-border bg-surface-warm text-text hover:bg-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            title="නැවත මුලට"
            aria-label="නැවත මුලට"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex min-h-[44px] items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                නවත්වන්න
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                තාලය අරඹන්න
              </>
            )}
          </button>
        </div>
      </div>

      {audioError && (
        <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          මෙම උපාංගයේ තබ්ලා නාදය ආරම්භ කළ නොහැක. දෘශ්‍ය තාල ගණනය දිගටම භාවිත කළ හැක.
        </p>
      )}

      {/* Main Beat Display: Circular or Linear */}
      <div className="bg-surface-warm rounded-2xl p-6 mb-4 border border-border-light flex flex-col items-center justify-center min-h-[220px]">
        {visualMode === "circular" ? (
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Center Bol Display */}
            <div className="absolute flex flex-col items-center justify-center text-center z-10">
              <span className="text-3xl sm:text-4xl font-extrabold text-primary transition-all scale-110">
                {currentBol.bol_si}
              </span>
              <span className="text-xs font-semibold text-text-secondary mt-1">
                මාත්‍රා {currentMatra} / {tala.matras}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 mt-1 rounded-full ${
                  currentBol.isSam
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : currentBol.isKhali
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {currentBol.isSam ? "සම (X)" : currentBol.isKhali ? "ඛාලි (0)" : "තාළි"}
              </span>
            </div>

            {/* Circular Beat Dots */}
            {tala.bols.map((bol, idx) => {
              const isCurrent = bol.matra === currentMatra;

              return (
                <div
                  key={bol.matra}
                  style={getCircularBeatStyle(idx, tala.matras)}
                  className={`
                    absolute w-8 h-8 rounded-full flex flex-col items-center justify-center text-[10px] font-bold transition-all
                    ${
                      isCurrent
                        ? "bg-accent text-white scale-125 shadow-lg shadow-amber-300 z-20"
                        : bol.isSam
                        ? "bg-red-50 text-red-700 border-2 border-red-400"
                        : bol.isKhali
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-400"
                        : "bg-white text-text-secondary border border-border"
                    }
                  `}
                >
                  <span>{bol.matra}</span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Linear Mode */
          <div className="w-full">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {tala.bols.map((bol) => {
                const isCurrent = bol.matra === currentMatra;
                return (
                  <div
                    key={bol.matra}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? "bg-accent text-white border-accent-dark scale-105 shadow-md"
                        : bol.isSam
                        ? "bg-red-50 border-red-300 text-red-800"
                        : bol.isKhali
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "bg-white border-border text-text"
                    }`}
                  >
                    <span className="block text-[10px] font-bold opacity-75">
                      {bol.matra} {bol.isSam ? "(X)" : bol.isKhali ? "(0)" : ""}
                    </span>
                    <span className="block text-base font-extrabold mt-0.5">
                      {bol.bol_si}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hand Action Indicator */}
        <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-text-secondary bg-white px-3 py-1.5 rounded-xl border border-border-light shadow-sm">
          {currentBol.isKhali ? (
            <>
              <Waves className="w-4 h-4 text-blue-600" />
              <span>අත පැත්තට වැනීම (ඛාලි - 0)</span>
            </>
          ) : (
            <>
              <Hand className="w-4 h-4 text-primary" />
              <span>
                {currentBol.isSam
                  ? "පළමු අත්පුඩිය (සම - X)"
                  : currentBol.isTali
                  ? "අත්පුඩි ගැසීම (තාළි)"
                  : "ඇඟිලි ගැසීම / ගණන් කිරීම"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tempo & View Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Tempo Slider */}
        <div className="bg-surface-warm p-3 rounded-xl border border-border-light">
          <div className="flex items-center justify-between mb-1.5 font-semibold text-text-secondary">
            <span>යෙදුමේ පුහුණු වේගය: {bpm} BPM</span>
            <span className="text-[11px] text-primary">වෙනස් කළ හැකි අගයකි</span>
          </div>
          <input
            type="range"
            min="40"
            max="240"
            step="5"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-white rounded-lg cursor-pointer"
            aria-label="තාලයේ වේගය (BPM)"
          />
          <p className="mt-1.5 text-[11px] text-text-muted">
            මෙය අභ්‍යාසයට පමණක් යොදාගන්නා යෙදුම් පෙරනිමියකි; මූලාශ්‍රයෙන් සනාථ කළ ලය වර්ගීකරණයක් නොවේ.
          </p>
        </div>

        {/* Visual Mode Toggle */}
        <div className="bg-surface-warm p-3 rounded-xl border border-border-light flex items-center justify-between">
          <span className="font-semibold text-text-secondary">දර්ශන මාදිලිය:</span>
          <div className="flex bg-white rounded-lg p-1 border border-border" role="group" aria-label="තාල දර්ශන මාදිලිය">
            <button
              type="button"
              onClick={() => setVisualMode("circular")}
              aria-pressed={visualMode === "circular"}
              className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-md font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                visualMode === "circular" ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              චක්‍රාකාර
            </button>
            <button
              type="button"
              onClick={() => setVisualMode("linear")}
              aria-pressed={visualMode === "linear"}
              className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-md font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                visualMode === "linear" ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              සරල රේඛීය
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
