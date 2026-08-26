"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { tablaSynth, type TablaPlaybackHandle } from "@/lib/audio/tabla";
import { normalizePracticeBpm } from "@/lib/audio/tempo";
import { Play, Square, RotateCcw, Award, Sparkles, Touchpad } from "lucide-react";

// Latest-callback ref sync happens in an effect (react-hooks v6 adoption):
// writing a ref during render was flagged by react-hooks/refs, and effects
// flush within the same act() window as the rerender that changed the prop,
// so the finish path still observes the newest callback.
function useLatestRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export interface RhythmTapGameProps {
  bpm?: number;
  totalBeats?: number;
  onComplete?: (scorePercent: number) => void;
}

export const RhythmTapGame: React.FC<RhythmTapGameProps> = ({
  bpm = 80,
  totalBeats = 16,
  onComplete,
}) => {
  const safeBpm = normalizePracticeBpm(bpm, 80);
  const safeTotalBeats = Number.isInteger(totalBeats) && totalBeats >= 1 && totalBeats <= 128 ? totalBeats : 16;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [accuracyList, setAccuracyList] = useState<number[]>([]);
  const [feedbackText, setFeedbackText] = useState("ආරම්භ කිරීමට 'අරඹන්න' ඔබන්න");
  const [feedbackColor, setFeedbackColor] = useState("text-text-muted");
  const [isFinished, setIsFinished] = useState(false);

  const beatIntervalMs = (60 / safeBpm) * 1000;
  const expectedBeatTimesRef = useRef<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  const accuracyListRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const playbackHandlesRef = useRef<Set<TablaPlaybackHandle>>(new Set());
  const mountedRef = useRef(true);
  const sessionGenerationRef = useRef(0);
  const onCompleteRef = useLatestRef(onComplete);

  const trackPlayback = useCallback((handle: TablaPlaybackHandle) => {
    playbackHandlesRef.current.add(handle);
    let malformed = false;
    try {
      void Promise.resolve(handle.ready).catch(() => undefined);
    } catch {
      malformed = true;
    }
    try {
      void Promise.resolve(handle.finished).then(
        () => playbackHandlesRef.current.delete(handle),
        () => playbackHandlesRef.current.delete(handle),
      );
    } catch {
      malformed = true;
    }
    if (malformed) {
      playbackHandlesRef.current.delete(handle);
      try {
        handle();
      } catch {
        // A malformed/partially torn-down handle must not block other cleanup.
      }
    }
  }, []);

  const clearPlayback = useCallback(() => {
    const handles = Array.from(playbackHandlesRef.current);
    playbackHandlesRef.current.clear();
    handles.forEach((cancel) => {
      try {
        cancel();
      } catch {
        // One failed cancellation must not strand the remaining session work.
      }
    });
  }, []);

  const clearTimers = useCallback(() => {
    sessionGenerationRef.current += 1;
    const timer = timerRef.current;
    timerRef.current = null;
    if (timer !== null) {
      try {
        clearInterval(timer as number);
      } catch {
        // Timer cancellation is best-effort during browser teardown.
      }
    }
    const finishTimer = finishTimerRef.current;
    finishTimerRef.current = null;
    if (finishTimer !== null) {
      try {
        clearTimeout(finishTimer as number);
      } catch {
        // Timer cancellation is best-effort during browser teardown.
      }
    }
    clearPlayback();
  }, [clearPlayback]);

  const reportAudioUnavailable = useCallback((generation: number) => {
    if (!mountedRef.current || sessionGenerationRef.current !== generation) return;
    setFeedbackText("මෙම උපාංගයේ තබ්ලා නාදය ආරම්භ කළ නොහැක. දෘශ්‍ය ස්පන්දනයට අනුව පුහුණු වන්න.");
    setFeedbackColor("text-primary");
  }, []);

  const playTablaStroke = useCallback((bol: string, generation: number) => {
    let ownedHandle: TablaPlaybackHandle | undefined;
    const reportUnavailable = () => {
      if (ownedHandle !== undefined && !playbackHandlesRef.current.has(ownedHandle)) return;
      reportAudioUnavailable(generation);
    };
    try {
      const handle = tablaSynth.playBol(bol, beatIntervalMs, reportUnavailable);
      ownedHandle = handle;
      trackPlayback(handle);
    } catch {
      reportUnavailable();
    }
  }, [beatIntervalMs, reportAudioUnavailable, trackPlayback]);

  const handleFinish = useCallback(() => {
    if (!mountedRef.current) return;
    setIsPlaying(false);
    setIsFinished(true);
    clearTimers();

    // Calculate score
    const totalTaps = tapTimesRef.current.length;
    if (totalTaps === 0) {
      setFeedbackText("ඔබ කිසිදු තට්ටු කිරීමක් සිදු කළේ නැත. නැවත උත්සාහ කරමු!");
      setFeedbackColor("text-red-600");
      return;
    }

    let accurateCount = 0;
    accuracyListRef.current.forEach((diff) => {
      if (Math.abs(diff) < 180) accurateCount++;
    });

    const scorePercent = Math.round((accurateCount / Math.max(totalTaps, safeTotalBeats / 2)) * 100);

    if (scorePercent >= 80) {
      setFeedbackText("විශිෂ්ටයි! ඔබේ රිද්ම නිරවද්‍යතාව ඉතා ඉහළයි! 🎉");
      setFeedbackColor("text-forest-green");
    } else if (scorePercent >= 50) {
      setFeedbackText("හොඳ උත්සාහයක්! තව වරක් තාලයට සවන් දී පුහුණු වෙමු. 👍");
      setFeedbackColor("text-accent-dark");
    } else {
      setFeedbackText("මෙම කොටස නැවත පුහුණු වෙමු. තාල ස්පන්දනයට කන් දෙන්න! ✨");
      setFeedbackColor("text-primary");
    }

    onCompleteRef.current?.(scorePercent);
    // onCompleteRef comes from useLatestRef: stable identity, listed for the
    // exhaustive-deps contract.
  }, [clearTimers, safeTotalBeats, onCompleteRef]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (isPlaying) {
      // Session-start resets live in handleStart (the event that flips
      // isPlaying), not here: a synchronous setState in this effect body was
      // the react-hooks/set-state-in-effect finding, and races-F3 moved the
      // ref resets alongside them for tick coherence.

      const sessionGeneration = sessionGenerationRef.current;
      let beatCount = 0;
      timerRef.current = setInterval(() => {
        if (!mountedRef.current || sessionGenerationRef.current !== sessionGeneration) return;
        beatCount++;
        setCurrentBeat(beatCount);
        expectedBeatTimesRef.current.push(Date.now());
        playTablaStroke("ධා", sessionGeneration);

        if (beatCount >= safeTotalBeats) {
          const activeTimer = timerRef.current;
          timerRef.current = null;
          if (activeTimer !== null) {
            try {
              clearInterval(activeTimer as number);
            } catch {
              // Timer cancellation is best-effort; completion still settles.
            }
          }
          finishTimerRef.current = setTimeout(() => {
            if (mountedRef.current && sessionGenerationRef.current === sessionGeneration) {
              handleFinish();
            }
          }, 1000);
        }
      }, beatIntervalMs);
    } else {
      clearTimers();
    }
    return clearTimers;
  }, [isPlaying, safeTotalBeats, beatIntervalMs, clearTimers, handleFinish, playTablaStroke]);

  const handleTap = () => {
    if (!isPlaying) return;
    const now = Date.now();
    tapTimesRef.current.push(now);
    const sessionGeneration = sessionGenerationRef.current;
    playTablaStroke("තින්", sessionGeneration);

    // Find closest expected beat
    const expected = expectedBeatTimesRef.current[expectedBeatTimesRef.current.length - 1];
    if (expected) {
      const diff = now - expected;
      setAccuracyList((prev) => {
        const next = [...prev, diff];
        accuracyListRef.current = next;
        return next;
      });

      if (Math.abs(diff) < 90) {
        setFeedbackText("නියමයි! පරිපූර්ණ ස්පන්දනයක්! 🎯");
        setFeedbackColor("text-forest-green");
      } else if (Math.abs(diff) < 200) {
        setFeedbackText("හොඳයි! තාලයට සමීපයි.");
        setFeedbackColor("text-accent-dark");
      } else if (diff < 0) {
        setFeedbackText("ස්වල්පයක් වේගවත් වැඩියි.");
        setFeedbackColor("text-primary");
      } else {
        setFeedbackText("ස්වල්පයක් ප්‍රමාදයි.");
        setFeedbackColor("text-primary");
      }
    }
  };

  const handleStart = () => {
    sessionGenerationRef.current += 1;
    // Session-start resets belong to this event (react-hooks v6 adoption +
    // review finding races-F3): ref and state resets in one place keep
    // accuracyListRef coherent with accuracyList within the same tick,
    // closing the commit-to-effects window where a tap could score stale
    // refs. The previous arrangement reset refs in the isPlaying effect.
    startTimeRef.current = Date.now();
    expectedBeatTimesRef.current = [];
    tapTimesRef.current = [];
    accuracyListRef.current = [];
    setAccuracyList([]);
    setCurrentBeat(0);
    setIsFinished(false);
    setIsPlaying(true);
    setFeedbackText("තාලයට අනුව තට්ටු කරන්න...");
    setFeedbackColor("text-text");
  };

  const handleReset = () => {
    clearTimers();
    setIsPlaying(false);
    setCurrentBeat(0);
    accuracyListRef.current = [];
    setAccuracyList([]);
    setIsFinished(false);
    setFeedbackText("ආරම්භ කිරීමට 'අරඹන්න' ඔබන්න");
    setFeedbackColor("text-text-muted");
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-warm-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
        <div>
          <h3 className="font-bold text-text text-base sm:text-lg">
            ලය හා තාල තට්ටු කිරීමේ පුහුණුව (Rhythm Tapping)
          </h3>
          <p className="text-xs text-text-muted">
            නියත ස්පන්දනයට (Pulse) සමගාමීව තිරය මත තට්ටු කරන්න
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-lg border border-border bg-surface-warm text-text hover:bg-white transition-all"
            title="නැවත මුලට"
            aria-label="නැවත මුලට"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {!isPlaying ? (
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              අරඹන්න
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              අවසන් කරන්න
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Tap Area */}
      <button
        type="button"
        onClick={handleTap}
        disabled={!isPlaying}
        className={`w-full rounded-2xl p-8 sm:p-12 mb-4 border-2 transition-all flex flex-col items-center justify-center select-none active:scale-95 touch-target ${
          isPlaying
            ? "bg-amber-50 hover:bg-amber-100 border-accent cursor-pointer shadow-md"
            : "bg-surface-warm border-border opacity-70 cursor-not-allowed"
        }`}
        aria-label="තාල පහරට තට්ටු කරන්න"
      >
        <Touchpad className={`w-12 h-12 mb-3 ${isPlaying ? "text-accent animate-bounce" : "text-text-muted"}`} />
        <span className="text-lg sm:text-xl font-extrabold text-text">
          {isPlaying ? "මෙතැන තට්ටු කරන්න (TAP)" : "ආරම්භ කළ පසු මෙතැන තට්ටු කරන්න"}
        </span>
        <span className="text-xs text-text-muted mt-1">
          ස්පන්දනය: {currentBeat} / {safeTotalBeats}
        </span>
      </button>

      {/* Supportive Feedback Box */}
      <div className="bg-surface-warm p-4 rounded-xl border border-border-light text-center">
        <p className={`font-bold text-sm sm:text-base transition-all ${feedbackColor}`}>
          {feedbackText}
        </p>

        {isFinished && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-text-secondary">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>තට්ටු කළ වාර ගණන: {accuracyList.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};
