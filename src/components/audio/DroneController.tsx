"use client";

import React, { useState, useEffect } from "react";
import { tanpuraSynth, ROOT_PITCHES, TanpuraFirstString } from "@/lib/audio/tanpura";
import { Play, Square, Volume2, Music2 } from "lucide-react";

export const DroneController: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentString, setCurrentString] = useState<number | null>(null);
  const [stringName, setStringName] = useState<string>("");
  const [firstString, setFirstString] = useState<TanpuraFirstString>("Pa");
  const [selectedPitchIdx, setSelectedPitchIdx] = useState<number>(1); // C# default
  const [volume, setVolume] = useState<number>(0.7);

  useEffect(() => {
    tanpuraSynth.setOnPluck((idx, name) => {
      setCurrentString(idx);
      setStringName(name);
    });
    return () => {
      tanpuraSynth.stop();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      tanpuraSynth.stop();
      setIsPlaying(false);
      setCurrentString(null);
      setStringName("");
    } else {
      const pitch = ROOT_PITCHES[selectedPitchIdx];
      tanpuraSynth.setSettings({
        rootPitchName: pitch.name,
        rootFreq: pitch.freq,
        firstString,
        volume,
      });
      tanpuraSynth.start();
      setIsPlaying(true);
    }
  };

  const handlePitchChange = (idx: number) => {
    setSelectedPitchIdx(idx);
    const pitch = ROOT_PITCHES[idx];
    tanpuraSynth.setSettings({
      rootPitchName: pitch.name,
      rootFreq: pitch.freq,
    });
  };

  const handleFirstStringChange = (tuning: TanpuraFirstString) => {
    setFirstString(tuning);
    tanpuraSynth.setSettings({ firstString: tuning });
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    tanpuraSynth.setSettings({ volume: vol });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-warm-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-accent-50 text-accent-dark">
            <Music2 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-text text-base sm:text-lg">
              තාන්පුර ශ්‍රැති මෙවලම (Tanpura Drone)
            </h3>
            <p className="text-xs text-text-muted">
              ස්වර හා රාග ගායනා පුහුණුව සඳහා ස්වභාවික අනුනාදක ශ්‍රැතිය
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTogglePlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isPlaying
              ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
              : "bg-primary hover:bg-primary-dark text-white"
          }`}
          aria-label={isPlaying ? "තාන්පුරය නවත්වන්න" : "තාන්පුරය අරඹන්න"}
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              නවත්වන්න
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              අරඹන්න
            </>
          )}
        </button>
      </div>

      {/* String Visualizer Animation */}
      <div className="bg-surface-warm rounded-xl p-4 mb-4 border border-border-light">
        <div className="flex justify-around items-end h-24 sm:h-28 relative">
          {[0, 1, 2, 3].map((stringIdx) => {
            const isVibrating = isPlaying && currentString === stringIdx;
            const labels = [
              firstString === "Pa" ? "1 වන තන්තුව (ප)" : firstString === "Ma" ? "1 වන තන්තුව (ම)" : "1 වන තන්තුව (නි)",
              "2 වන තන්තුව (ජෝඩි ස̇)",
              "3 වන තන්තුව (ජෝඩි ස̇)",
              "4 වන තන්තුව (ඛරජ් ස̣)",
            ];

            return (
              <div key={stringIdx} className="flex flex-col items-center gap-2 h-full justify-between">
                <span className={`text-[11px] font-semibold ${isVibrating ? "text-accent font-bold" : "text-text-muted"}`}>
                  {stringIdx + 1}
                </span>

                {/* String wire with vibration effect */}
                <div
                  className={`w-1.5 rounded-full transition-all duration-300 ${
                    isVibrating
                      ? "bg-accent shadow-lg shadow-amber-300 h-full scale-x-150 animate-pulse"
                      : "bg-border-dark h-full opacity-60"
                  }`}
                />

                <span className="text-[10px] text-text-secondary text-center leading-tight">
                  {labels[stringIdx]}
                </span>
              </div>
            );
          })}
        </div>

        {isPlaying && stringName && (
          <p className="text-center text-xs font-semibold text-accent-dark mt-3">
            වයන තන්තුව: <span className="bg-amber-100 px-2 py-0.5 rounded">{stringName}</span>
          </p>
        )}
      </div>

      {/* Tuning Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* First string tuning mode */}
        <div>
          <label className="block text-text-secondary font-semibold mb-1">
            පළමු තන්තුවේ ශ්‍රැතිය (1st String):
          </label>
          <div className="grid grid-cols-3 gap-1 bg-surface-warm p-1 rounded-lg">
            {(["Pa", "Ma", "Ni"] as TanpuraFirstString[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleFirstStringChange(mode)}
                className={`py-1.5 font-bold rounded text-center transition-all ${
                  firstString === mode ? "bg-primary text-white shadow-sm" : "text-text hover:bg-white"
                }`}
              >
                {mode === "Pa" ? "ප (Pa)" : mode === "Ma" ? "ම (Ma)" : "නි (Ni)"}
              </button>
            ))}
          </div>
        </div>

        {/* Tonic Pitch Selector */}
        <div>
          <label className="block text-text-secondary font-semibold mb-1">
            මූලික තාරතාව (Root Pitch / ෂඩ්ජය):
          </label>
          <select
            value={selectedPitchIdx}
            onChange={(e) => handlePitchChange(Number(e.target.value))}
            className="w-full bg-white border border-border rounded-lg py-2 px-2.5 text-text font-medium focus:ring-1 focus:ring-primary"
            aria-label="මූලික තාරතාව තෝරන්න"
          >
            {ROOT_PITCHES.map((p, idx) => (
              <option key={p.name} value={idx}>
                {p.name} ({Math.round(p.freq)} Hz)
              </option>
            ))}
          </select>
        </div>

        {/* Volume Slider */}
        <div>
          <label className="block text-text-secondary font-semibold mb-1">
            ශබ්ද ප්‍රමාණය (Volume): {Math.round(volume * 100)}%
          </label>
          <div className="flex items-center gap-2 pt-1.5">
            <Volume2 className="w-4 h-4 text-text-muted" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-warm rounded-lg cursor-pointer"
              aria-label="තාන්පුර ශබ්ද පාලකය"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
