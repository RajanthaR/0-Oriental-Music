"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { tablaSynth } from "@/lib/audio/tabla";
import { Play, Square, RotateCcw, Award, Sparkles, Touchpad } from "lucide-react";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [accuracyList, setAccuracyList] = useState<number[]>([]);
  const [feedbackText, setFeedbackText] = useState("ආරම්භ කිරීමට 'අරඹන්න' ඔබන්න");
  const [feedbackColor, setFeedbackColor] = useState("text-text-muted");
  const [isFinished, setIsFinished] = useState(false);

  const beatIntervalMs = (60 / bpm) * 1000;
  const expectedBeatTimesRef = useRef<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  const accuracyListRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);

  const handleFinish = useCallback(() => {
    setIsPlaying(false);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current as number);

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

    const scorePercent = Math.round((accurateCount / Math.max(totalTaps, totalBeats / 2)) * 100);

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

    if (onComplete) onComplete(scorePercent);
  }, [onComplete, totalBeats]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now();
      expectedBeatTimesRef.current = [];
      tapTimesRef.current = [];
      accuracyListRef.current = [];
      setAccuracyList([]);
      setCurrentBeat(0);
      setIsFinished(false);

      let beatCount = 0;
      timerRef.current = setInterval(() => {
        beatCount++;
        setCurrentBeat(beatCount);
        expectedBeatTimesRef.current.push(Date.now());
        tablaSynth.playBol("ධා");

        if (beatCount >= totalBeats) {
          setTimeout(() => {
            handleFinish();
          }, 1000);
        }
      }, beatIntervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current as number);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as number);
    };
  }, [isPlaying, bpm, totalBeats, beatIntervalMs, handleFinish]);

  const handleTap = () => {
    if (!isPlaying) return;
    const now = Date.now();
    tapTimesRef.current.push(now);
    tablaSynth.playBol("තින්");

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
    setIsPlaying(true);
    setFeedbackText("තාලයට අනුව තට්ටු කරන්න...");
    setFeedbackColor("text-text");
  };

  const handleReset = () => {
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
          ස්පන්දනය: {currentBeat} / {totalBeats}
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
