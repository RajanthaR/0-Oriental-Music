"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { swaraSynth, type SwaraPlaybackHandle } from "@/lib/audio/synth";
import { tablaSynth, type TablaPlaybackHandle } from "@/lib/audio/tabla";
import { releaseHandleRef } from "@/lib/audio/cleanup";
import { Play, CheckCircle2, XCircle, RotateCcw, Sparkles, Volume2 } from "lucide-react";

export interface EarTrainingChallenge {
  id: string;
  title_si: string;
  type: "swara" | "tala" | "timbre";
  targetItem: string;
  options_si: { id: string; text_si: string; value: string }[];
  explanation_si: string;
}

const DEFAULT_CHALLENGES: EarTrainingChallenge[] = [
  {
    id: "ear-01",
    title_si: "ස්වර හඳුනාගැනීම (Swara Identification)",
    type: "swara",
    targetItem: "G",
    options_si: [
      { id: "o1", text_si: "ස (ෂඩ්ජ)", value: "S" },
      { id: "o2", text_si: "රි (රිෂභ)", value: "R" },
      { id: "o3", text_si: "ග (ගාන්ධාර)", value: "G" },
      { id: "o4", text_si: "ප (පඤ්චම)", value: "P" },
    ],
    explanation_si: "වාදනය වූයේ ශුද්ධ ගාන්ධාර (ග) ස්වරයයි.",
  },
  {
    id: "ear-02",
    title_si: "ස්වර හඳුනාගැනීම (Swara Identification)",
    type: "swara",
    targetItem: "P",
    options_si: [
      { id: "o1", text_si: "ස (ෂඩ්ජ)", value: "S" },
      { id: "o2", text_si: "ග (ගාන්ධාර)", value: "G" },
      { id: "o3", text_si: "ම (මධ්‍යම)", value: "M" },
      { id: "o4", text_si: "ප (පඤ්චම)", value: "P" },
    ],
    explanation_si: "වාදනය වූයේ පඤ්චම (ප) ස්වරයයි.",
  },
];

export const EarTrainingModule: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const playbackRef = useRef<SwaraPlaybackHandle | TablaPlaybackHandle | null>(null);

  const cancelPlayback = useCallback(() => {
    // Invalidate the generation and surrender ownership before cancelling, so a
    // throwing cancel can neither strand this handle nor abort Next, replacement,
    // reset, or unmount cleanup that still has to run after it.
    generationRef.current += 1;
    releaseHandleRef(playbackRef);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelPlayback();
    };
  }, [cancelPlayback]);

  const challenge = DEFAULT_CHALLENGES[currentIndex];

  const handlePlayMystery = () => {
    cancelPlayback();
    const generation = generationRef.current;
    setAudioUnavailable(false);
    if (challenge.type === "swara") {
      const handle = swaraSynth.playSwaraToneHandle(challenge.targetItem, 0.9, 261.63, "harmonium");
      playbackRef.current = handle;
      void handle.ready.then(
        (played) => {
          if (!mountedRef.current || generationRef.current !== generation || playbackRef.current !== handle) return;
          if (!played) setAudioUnavailable(true);
        },
        () => {
          if (mountedRef.current && generationRef.current === generation && playbackRef.current === handle) {
            setAudioUnavailable(true);
          }
        },
      );
      void (handle.finished ?? handle.ready.then(() => undefined, () => undefined)).then(
        () => {
          const isCurrentHandle = playbackRef.current === handle;
          if (isCurrentHandle) playbackRef.current = null;
        },
        () => {
          const isCurrentHandle = playbackRef.current === handle;
          if (isCurrentHandle) playbackRef.current = null;
          if (mountedRef.current && generationRef.current === generation && isCurrentHandle) {
            setAudioUnavailable(true);
          }
        },
      );
    } else if (challenge.type === "tala") {
      let handle: TablaPlaybackHandle;
      handle = tablaSynth.playBol(challenge.targetItem, 500, () => {
        if (mountedRef.current && generationRef.current === generation && playbackRef.current === handle) {
          setAudioUnavailable(true);
        }
      });
      playbackRef.current = handle;
      void handle.ready.then(
        (played) => {
          if (!mountedRef.current || generationRef.current !== generation || playbackRef.current !== handle) return;
          if (!played) setAudioUnavailable(true);
        },
        () => {
          if (mountedRef.current && generationRef.current === generation && playbackRef.current === handle) {
            setAudioUnavailable(true);
          }
        },
      );
      void (handle.finished ?? handle.ready.then(() => undefined, () => undefined)).then(
        () => {
          const isCurrentHandle = playbackRef.current === handle;
          if (isCurrentHandle) playbackRef.current = null;
        },
        () => {
          const isCurrentHandle = playbackRef.current === handle;
          if (isCurrentHandle) playbackRef.current = null;
          if (mountedRef.current && generationRef.current === generation && isCurrentHandle) {
            setAudioUnavailable(true);
          }
        },
      );
    }
  };

  const handleSelect = (val: string) => {
    if (isAnswered) return;
    setSelectedOption(val);
    setIsAnswered(true);

    if (val === challenge.targetItem) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    cancelPlayback();
    if (currentIndex < DEFAULT_CHALLENGES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Reset
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-warm-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
        <div>
          <h3 className="font-bold text-text text-base sm:text-lg">
            සවන්දීමේ හඳුනාගැනීම (Ear Training)
          </h3>
          <p className="text-xs text-text-muted">{challenge.title_si}</p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-full">
          ලකුණු: {score}
        </span>
      </div>

      {audioUnavailable && (
        <p role="alert" className="mb-3 text-xs font-semibold text-primary">
          මෙම උපාංගයේ නාදය ආරම්භ කළ නොහැක. පසුව නැවත උත්සාහ කරන්න.
        </p>
      )}

      {/* Mystery Sound Play Button Box */}
      <div className="bg-surface-warm rounded-2xl p-6 mb-5 border border-border-light flex flex-col items-center justify-center">
        <p className="text-xs text-text-secondary font-semibold mb-3">
          පහත බොත්තම ඔබා නාදයට හොඳින් සවන් දෙන්න:
        </p>
        <button
          type="button"
          onClick={handlePlayMystery}
          className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md hover:scale-105 transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          නාදය අසන්න (LISTEN)
        </button>
      </div>

      {/* Answer Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {challenge.options_si.map((opt) => {
          const isSelected = selectedOption === opt.value;
          const isCorrect = opt.value === challenge.targetItem;

          let btnStyle = "bg-white border-border hover:border-accent text-text";
          if (isAnswered) {
            if (isCorrect) {
              btnStyle = "bg-green-50 border-forest-green text-green-900 font-bold";
            } else if (isSelected) {
              btnStyle = "bg-red-50 border-red-400 text-red-900";
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={isAnswered}
              className={`p-3.5 rounded-xl border-2 text-left text-sm font-semibold transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>{opt.text_si}</span>
              {isAnswered && (
                isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-forest-green" />
                ) : isSelected ? (
                  <XCircle className="w-4 h-4 text-red-600" />
                ) : null
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback & Next Button */}
      {isAnswered && (
        <div className="bg-surface-warm p-4 rounded-xl border border-border-light flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold block mb-0.5">
              {selectedOption === challenge.targetItem
                ? "🎉 නිවැරදි පිළිතුරකි!"
                : "✨ තව වරක් සවන් දී බලමු!"}
            </span>
            <span className="text-text-secondary">{challenge.explanation_si}</span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shrink-0"
          >
            {currentIndex < DEFAULT_CHALLENGES.length - 1 ? "මීළඟ අභ්‍යාසය →" : "නැවත අරඹන්න"}
          </button>
        </div>
      )}
    </div>
  );
};
