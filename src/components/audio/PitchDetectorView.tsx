"use client";

import React, { useState, useEffect, useRef } from "react";
import { PitchDetector, PitchMatchResult } from "@/lib/audio/pitch";
import { Mic, MicOff, ShieldCheck, Sparkles, Volume2, Keyboard } from "lucide-react";
import { SwaraKeyboard } from "./SwaraKeyboard";

export interface PitchDetectorViewProps {
  targetNotes?: string[];
  onTargetMatched?: (swara: string) => void;
}

export const PitchDetectorView: React.FC<PitchDetectorViewProps> = ({
  targetNotes = ["S", "R", "G"],
  onTargetMatched,
}) => {
  const [isMicActive, setIsMicActive] = useState(false);
  const [pitchResult, setPitchResult] = useState<PitchMatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"microphone" | "keyboard">("microphone");
  const [matchedNotes, setMatchedNotes] = useState<string[]>([]);

  const detectorRef = useRef<PitchDetector | null>(null);
  const mountedRef = useRef(false);
  const operationRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    detectorRef.current = new PitchDetector();
    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
      if (detectorRef.current) {
        detectorRef.current.stopListening();
      }
    };
  }, []);

  const handleStartMic = async () => {
    const operation = ++operationRef.current;
    setErrorMsg(null);
    if (!detectorRef.current) return;

    const success = await detectorRef.current.startListening((result) => {
      if (!mountedRef.current || operationRef.current !== operation) return;
      setPitchResult(result);
      if (result && result.isInTune) {
        // Check if matches target note
        const base = result.swara_en;
        if (targetNotes.includes(base) || targetNotes.some((n) => n.startsWith(base))) {
          setMatchedNotes((prev) => Array.from(new Set([...prev, result.swara_si])));
          if (onTargetMatched) onTargetMatched(result.swara_si);
        }
      }
    });

    if (!mountedRef.current || operationRef.current !== operation) {
      detectorRef.current?.stopListening();
      return;
    }

    if (success) {
      setIsMicActive(true);
    } else {
      setErrorMsg(
        "මයික්‍රෆෝනය වෙත ප්‍රවේශ වීමට නොහැකි විය. කරුණාකර බ්‍රවුසර අවසර පරීක්ෂා කරන්න හෝ යතුරුපුවරු මාදිලිය භාවිතා කරන්න."
      );
    }
  };

  const handleStopMic = () => {
    operationRef.current += 1;
    if (detectorRef.current) {
      detectorRef.current.stopListening();
    }
    setIsMicActive(false);
    setPitchResult(null);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-warm-md w-full">
      {/* Header with privacy badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light pb-3 mb-4">
        <div>
          <h3 className="font-bold text-text text-base sm:text-lg">
            ස්වර තාරතා පුහුණුව (Pitch & Swara Practice)
          </h3>
          <p className="text-xs text-text-muted">
            ඔබේ කටහඬේ තාරතාව නිවැරදි සප්ත ස්වර සමඟ සසඳා බලන්න
          </p>
        </div>

        {/* Mode Switch: Microphone vs Keyboard */}
        <div className="flex bg-surface-warm p-1 rounded-xl border border-border text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              handleStopMic();
              setMode("microphone");
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              mode === "microphone" ? "bg-primary text-white shadow-sm" : "text-text-secondary"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            මයික්‍රෆෝනය
          </button>
          <button
            type="button"
            onClick={() => {
              handleStopMic();
              setMode("keyboard");
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              mode === "keyboard" ? "bg-primary text-white shadow-sm" : "text-text-secondary"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            යතුරුපුවරුව
          </button>
        </div>
      </div>

      {mode === "microphone" ? (
        <div>
          {/* Privacy Guarantee Alert */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-green-900">
            <ShieldCheck className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">100% පෞද්ගලිකත්ව ආරක්ෂාව:</span> ඔබේ හඬ විශ්ලේෂණය වන්නේ ඔබේ
              දුරකථනය හෝ පරිගණකය තුළ පමණි. කිසිදු ශබ්ද පටයක් කිසිදු සේවාදායකයකට උඩුගත නොවේ.
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl mb-4">
              {errorMsg}
            </div>
          )}

          {/* Main Tuner Gauge Box */}
          <div className="bg-surface-warm rounded-2xl p-6 mb-4 border border-border-light flex flex-col items-center justify-center min-h-[200px]">
            {isMicActive ? (
              <div className="w-full flex flex-col items-center">
                {pitchResult ? (
                  <>
                    <span className="text-4xl sm:text-5xl font-extrabold text-primary mb-1">
                      {pitchResult.swara_si}
                    </span>
                    <span className="text-xs font-semibold text-text-secondary">
                      සංඛ්‍යාතය: {pitchResult.frequency} Hz ({pitchResult.swara_en})
                    </span>

                    {/* Cent Gauge Visualizer */}
                    <div className="w-full max-w-xs mt-4">
                      <div className="flex justify-between text-[10px] font-bold text-text-muted mb-1">
                        <span>-50 ශ්‍රැති (Flat)</span>
                        <span className="text-forest-green font-extrabold">නියම තාරතාව</span>
                        <span>+50 ශ්‍රැති (Sharp)</span>
                      </div>

                      <div className="relative h-4 bg-white rounded-full border border-border overflow-hidden">
                        {/* Center In-tune Sweet Spot */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-full bg-green-200 border-x border-green-400" />
                        {/* Cent Needle */}
                        <div
                          style={{
                            left: `${((pitchResult.centsOff + 50) / 100) * 100}%`,
                          }}
                          className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full transition-all duration-75 ${
                            pitchResult.isInTune ? "bg-forest-green shadow-md" : "bg-accent"
                          }`}
                        />
                      </div>

                      <p className="text-center text-xs font-bold mt-2">
                        {pitchResult.isInTune ? (
                          <span className="text-forest-green flex items-center justify-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> නියම තාරතාවේ පිහිටා ඇත! (In Tune)
                          </span>
                        ) : pitchResult.centsOff < 0 ? (
                          <span className="text-accent-dark">ස්වල්පයක් ඉහළට ගයන්න (Flat)</span>
                        ) : (
                          <span className="text-accent-dark">ස්වල්පයක් පහතට ගයන්න (Sharp)</span>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-text-muted py-6">
                    <Mic className="w-8 h-8 mx-auto mb-2 text-accent animate-pulse" />
                    <p className="text-sm font-semibold">හඬට සවන් දෙමින් පවතී...</p>
                    <p className="text-xs">කරුණාකර &apos;ස...&apos; ස්වරය දිගු කර ගායනා කරන්න</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <MicOff className="w-10 h-10 mx-auto mb-2 text-text-muted opacity-50" />
                <p className="text-sm font-bold text-text mb-1">
                  මයික්‍රෆෝනය සක්‍රිය කර ස්වර පුහුණුව අරඹන්න
                </p>
                <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                  ඔබේ කටහඬේ නාදය තථ්‍ය කාලීනව ස, රි, ග, ම ස්වර සමඟ සමපාත වන අයුරු බලන්න.
                </p>
                <button
                  type="button"
                  onClick={handleStartMic}
                  className="bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  මයික්‍රෆෝනය අරඹන්න
                </button>
              </div>
            )}
          </div>

          {isMicActive && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleStopMic}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                මයික්‍රෆෝනය නවත්වන්න
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Non-microphone Fallback: Swara Keyboard */
        <div>
          <div className="mb-3 text-xs text-text-muted">
            මයික්‍රෆෝනයක් නොමැති නම් ස්වර යතුරුපුවරුව මඟින් ස්වර අසමින් පුහුණු වන්න:
          </div>
          <SwaraKeyboard compact={false} />
        </div>
      )}
    </div>
  );
};
