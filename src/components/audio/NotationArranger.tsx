"use client";

import React, { useEffect, useRef, useState } from "react";
import { swaraSynth, type SwaraPlaybackHandle } from "@/lib/audio/synth";
import { CheckCircle2, RotateCcw, Sparkles, Volume2 } from "lucide-react";

export interface NotationArrangerProps {
  prompt_si?: string;
  shuffledItems?: string[];
  correctOrder?: string[];
  onSolved?: () => void;
}

export const NotationArranger: React.FC<NotationArrangerProps> = ({
  prompt_si = "පහත ස්වර ආරෝහණ පිළිවෙළට සකසන්න:",
  shuffledItems = ["ග", "ස", "ප", "රි", "ම"],
  correctOrder = ["ස", "රි", "ග", "ම", "ප"],
  onSolved,
}) => {
  const [availableItems, setAvailableItems] = useState<string[]>(shuffledItems);
  const [arrangedItems, setArrangedItems] = useState<string[]>([]);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const playbackRef = useRef<SwaraPlaybackHandle | null>(null);

  useEffect(() => {
    return () => {
      playbackRef.current?.();
      playbackRef.current = null;
    };
  }, []);

  const handleSelectItem = (item: string, idx: number) => {
    // Play tone if it's a swara
    const clean = item.trim();
    if (["ස", "රි", "ග", "ම", "ප", "ධ", "නි"].includes(clean)) {
      const swaraMap: Record<string, string> = { "ස": "S", "රි": "R", "ග": "G", "ම": "M", "ප": "P", "ධ": "D", "නි": "N" };
      if (swaraMap[clean]) {
        playbackRef.current?.();
        const handle = swaraSynth.playSwaraToneHandle(swaraMap[clean]);
        playbackRef.current = handle;
        void handle.ready.then((played) => {
          if (playbackRef.current !== handle) return;
          playbackRef.current = null;
          if (!played) setAudioUnavailable(true);
        });
      }
    }

    setArrangedItems((prev) => [...prev, item]);
    setAvailableItems((prev) => prev.filter((_, i) => i !== idx));
    setIsEvaluated(false);
  };

  const handleRemoveItem = (item: string, idx: number) => {
    setAvailableItems((prev) => [...prev, item]);
    setArrangedItems((prev) => prev.filter((_, i) => i !== idx));
    setIsEvaluated(false);
  };

  const handleCheck = () => {
    const isMatch =
      arrangedItems.length === correctOrder.length &&
      arrangedItems.every((item, i) => item === correctOrder[i]);

    setIsCorrect(isMatch);
    setIsEvaluated(true);
    if (isMatch && onSolved) {
      onSolved();
    }
  };

  const handleReset = () => {
    playbackRef.current?.();
    playbackRef.current = null;
    setAvailableItems(shuffledItems);
    setArrangedItems([]);
    setIsEvaluated(false);
    setIsCorrect(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-warm-md w-full">
      <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
        <div>
          <h3 className="font-bold text-text text-base sm:text-lg">
            ස්වර හා ප්‍රස්තාර සකසනය (Arranger Puzzle)
          </h3>
          <p className="text-xs text-text-muted">{prompt_si}</p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-lg border border-border bg-surface-warm text-text hover:bg-white transition-all text-xs flex items-center gap-1"
          title="නැවත මුලට"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          නැවත
        </button>
      </div>

      {audioUnavailable && (
        <p role="alert" className="mb-3 text-xs font-semibold text-primary">
          මෙම උපාංගයේ නාදය ආරම්භ කළ නොහැක. සලකුණු අනුව අභ්‍යාසය දිගටම කරන්න.
        </p>
      )}

      {/* Drop / Arranged Sequence Area */}
      <div className="min-h-[70px] bg-surface-warm border-2 border-dashed border-border rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
        {arrangedItems.length === 0 ? (
          <span className="text-xs text-text-muted italic mx-auto">
            පහත ඇති කොටස් මත ක්ලික් කර පිළිවෙළට මෙතැනට එක් කරන්න...
          </span>
        ) : (
          arrangedItems.map((item, idx) => (
            <button
              key={`${item}-${idx}`}
              type="button"
              onClick={() => handleRemoveItem(item, idx)}
              className="bg-primary text-white font-bold text-sm px-3.5 py-2 rounded-xl shadow-sm hover:bg-red-700 transition-all flex items-center gap-1.5"
              title="ඉවත් කිරීමට ක්ලික් කරන්න"
            >
              <span>{item}</span>
              <span className="text-[10px] opacity-75">✕</span>
            </button>
          ))
        )}
      </div>

      {/* Available Items Pool */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {availableItems.map((item, idx) => (
          <button
            key={`${item}-${idx}`}
            type="button"
            onClick={() => handleSelectItem(item, idx)}
            className="bg-white border-2 border-border hover:border-accent text-text font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:scale-105 transition-all"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Actions & Feedback */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border-light">
        <div className="text-xs font-semibold">
          {isEvaluated && (
            isCorrect ? (
              <span className="text-forest-green flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> විශිෂ්ටයි! ඔබ නිවැරදි පිළිවෙළට සකස් කළා. 🎉
              </span>
            ) : (
              <span className="text-primary">
                පිළිවෙළ නිවැරදි නැත. නැවත වරක් උත්සාහ කරමු! ✨
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={handleCheck}
          disabled={arrangedItems.length === 0}
          className="w-full sm:w-auto bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          පරීක්ෂා කරන්න
        </button>
      </div>
    </div>
  );
};
