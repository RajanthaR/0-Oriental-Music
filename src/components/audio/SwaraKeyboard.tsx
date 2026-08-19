"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { swaraSynth, type SwaraPlaybackHandle } from "@/lib/audio/synth";
import { releaseHandleRef, releaseTimerRef } from "@/lib/audio/cleanup";
import { Volume2, Play, Sparkles } from "lucide-react";

export interface SwaraKeyboardProps {
  onNotePlay?: (note: string) => void;
  highlightNotes?: string[];
  activeNote?: string;
  allowPlaybackControls?: boolean;
  selectedRagaName?: string;
  compact?: boolean;
}

const KEYS_CONFIG = [
  { key: "S", label_si: "ස", sub_si: "ෂඩ්ජ", type: "achala", isBlack: false, hotkey: "A" },
  { key: "r", label_si: "රි", sub_si: "කෝමල", type: "komal", isBlack: true, hotkey: "W" },
  { key: "R", label_si: "රි", sub_si: "ශුද්ධ", type: "shuddha", isBlack: false, hotkey: "S" },
  { key: "g", label_si: "ග", sub_si: "කෝමල", type: "komal", isBlack: true, hotkey: "E" },
  { key: "G", label_si: "ග", sub_si: "ශුද්ධ", type: "shuddha", isBlack: false, hotkey: "D" },
  { key: "M", label_si: "ම", sub_si: "ශුද්ධ", type: "shuddha", isBlack: false, hotkey: "F" },
  { key: "m", label_si: "ම", sub_si: "තීව්‍ර", type: "teevra", isBlack: true, hotkey: "T" },
  { key: "P", label_si: "ප", sub_si: "පඤ්චම", type: "achala", isBlack: false, hotkey: "G" },
  { key: "d", label_si: "ධ", sub_si: "කෝමල", type: "komal", isBlack: true, hotkey: "Y" },
  { key: "D", label_si: "ධ", sub_si: "ශුද්ධ", type: "shuddha", isBlack: false, hotkey: "H" },
  { key: "n", label_si: "නි", sub_si: "කෝමල", type: "komal", isBlack: true, hotkey: "U" },
  { key: "N", label_si: "නි", sub_si: "ශුද්ධ", type: "shuddha", isBlack: false, hotkey: "J" },
  { key: "S'", label_si: "ස̇", sub_si: "තාර", type: "achala", isBlack: false, hotkey: "K" },
];

const EMPTY_HIGHLIGHT_NOTES: string[] = [];

export const SwaraKeyboard: React.FC<SwaraKeyboardProps> = ({
  onNotePlay,
  highlightNotes = EMPTY_HIGHLIGHT_NOTES,
  activeNote,
  allowPlaybackControls = true,
  selectedRagaName,
  compact = false,
}) => {
  const [saptaka, setSaptaka] = useState<"mandra" | "madhya" | "tara">("madhya");
  const [timbre, setTimbre] = useState<"harmonium" | "flute" | "pure">("harmonium");
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [isPlayingScale, setIsPlayingScale] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const playbackRef = useRef<SwaraPlaybackHandle | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const highlightNotesSignature = highlightNotes.join("\u0000");

  const cancelPlayback = useCallback(() => {
    generationRef.current += 1;
    releaseHandleRef(playbackRef);
    releaseTimerRef(highlightTimerRef, (id) => window.clearTimeout(id));
    if (mountedRef.current) {
      setPlayingKey(null);
      setIsPlayingScale(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelPlayback();
    };
  }, [cancelPlayback]);

  // A changed target, timbre, or saptaka invalidates any in-flight operation.
  useEffect(() => {
    cancelPlayback();
  }, [cancelPlayback, highlightNotesSignature, saptaka, timbre]);

  const getFullNoteSymbol = useCallback((baseKey: string) => {
    if (saptaka === "mandra") {
      if (baseKey === "S'") return "S";
      return `.${baseKey}`;
    }
    if (saptaka === "tara") {
      if (baseKey.endsWith("'")) return baseKey;
      return `${baseKey}'`;
    }
    return baseKey;
  }, [saptaka]);

  const handlePlayNote = useCallback((baseKey: string) => {
    cancelPlayback();
    const fullNote = getFullNoteSymbol(baseKey);
    const generation = generationRef.current;
    setPlayingKey(baseKey);
    setAudioUnavailable(false);
    let handle: SwaraPlaybackHandle;
    try {
      handle = swaraSynth.playSwaraToneHandle(fullNote, 0.7, 261.63, timbre);
    } catch {
      if (mountedRef.current && generationRef.current === generation) {
        setAudioUnavailable(true);
        setPlayingKey(null);
      }
      return;
    }
    if (!mountedRef.current || generationRef.current !== generation) {
      try {
        handle();
      } catch {
        // The operation may already be in browser teardown.
      }
      return;
    }
    playbackRef.current = handle;
    void handle.ready.then(
      (played) => {
        if (!mountedRef.current || generationRef.current !== generation || playbackRef.current !== handle) return;
        if (!played) setAudioUnavailable(true);
      },
      () => {
        if (mountedRef.current && generationRef.current === generation && playbackRef.current === handle) {
          setAudioUnavailable(true);
          releaseTimerRef(highlightTimerRef, (id) => window.clearTimeout(id));
          setPlayingKey(null);
        }
      },
    );
    void (handle.finished ?? handle.ready.then(() => undefined, () => undefined)).then(
      () => {
        if (playbackRef.current === handle) playbackRef.current = null;
      },
      () => {
        const isCurrentHandle = playbackRef.current === handle;
        if (isCurrentHandle) playbackRef.current = null;
        if (!mountedRef.current || generationRef.current !== generation || !isCurrentHandle) return;
        releaseTimerRef(highlightTimerRef, (id) => window.clearTimeout(id));
        setAudioUnavailable(true);
        setPlayingKey(null);
      },
    );
    try {
      onNotePlay?.(fullNote);
    } catch {
      // Consumer callbacks cannot retain a voice after they fail.
      if (mountedRef.current && generationRef.current === generation && playbackRef.current === handle) {
        cancelPlayback();
      }
      return;
    }
    if (!mountedRef.current || generationRef.current !== generation || playbackRef.current !== handle) {
      return;
    }
    releaseTimerRef(highlightTimerRef, (id) => window.clearTimeout(id));
    highlightTimerRef.current = window.setTimeout(() => {
      highlightTimerRef.current = null;
      if (!mountedRef.current || generationRef.current !== generation) return;
      setPlayingKey((curr) => (curr === baseKey ? null : curr));
    }, 400) as unknown as number;
  }, [cancelPlayback, getFullNoteSymbol, onNotePlay, timbre]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const match = KEYS_CONFIG.find((k) => k.hotkey.toLowerCase() === e.key.toLowerCase());
      if (match) {
        handlePlayNote(match.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayNote]);

  const handlePlayScaleArohana = () => {
    if (isPlayingScale) return;
    cancelPlayback();
    const generation = generationRef.current;
    setIsPlayingScale(true);
    setAudioUnavailable(false);
    const scale = highlightNotes.length > 0
      ? highlightNotes
      : ["S", "R", "G", "M", "P", "D", "N", "S'"];
    let handle: SwaraPlaybackHandle;
    try {
      handle = swaraSynth.playSequenceHandle(scale, 0.5, (_index, note) => {
        if (!mountedRef.current || generationRef.current !== generation) return;
        setPlayingKey(note.replace(/[.̣'̇]/g, ""));
      }, 261.63, timbre);
    } catch {
      if (mountedRef.current && generationRef.current === generation) {
        setAudioUnavailable(true);
        setIsPlayingScale(false);
      }
      return;
    }
    if (!mountedRef.current || generationRef.current !== generation) {
      try {
        handle();
      } catch {
        // The operation may already be in browser teardown.
      }
      return;
    }
    playbackRef.current = handle;
    void handle.ready.then(
      (played) => {
        if (!mountedRef.current || generationRef.current !== generation || playbackRef.current !== handle) return;
        if (!played) setAudioUnavailable(true);
      },
      () => {
        if (mountedRef.current && generationRef.current === generation && playbackRef.current === handle) {
          setAudioUnavailable(true);
          setPlayingKey(null);
          setIsPlayingScale(false);
        }
      },
    );
    void (handle.finished ?? handle.ready.then(() => undefined, () => undefined)).then(
      () => {
        const isCurrentHandle = playbackRef.current === handle;
        if (isCurrentHandle) playbackRef.current = null;
        if (!mountedRef.current || generationRef.current !== generation || !isCurrentHandle) return;
        setPlayingKey(null);
        setIsPlayingScale(false);
      },
      () => {
        const isCurrentHandle = playbackRef.current === handle;
        if (isCurrentHandle) playbackRef.current = null;
        if (!mountedRef.current || generationRef.current !== generation || !isCurrentHandle) return;
        setAudioUnavailable(true);
        setPlayingKey(null);
        setIsPlayingScale(false);
      },
    );
  };

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 border border-border shadow-warm-md ${compact ? "max-w-md" : "w-full"}`}>
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border-light pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-primary-50 text-primary">
            <Volume2 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-text text-base sm:text-lg">
              ස්වර යතුරුපුවරුව (Swara Keyboard)
            </h3>
            {selectedRagaName && (
              <p className="text-xs text-accent font-medium">
                {selectedRagaName} ස්වර ඉස්මතු කර ඇත
              </p>
            )}
          </div>
        </div>

        {allowPlaybackControls && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Saptaka selector */}
            <div className="flex bg-surface-warm rounded-lg p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSaptaka("mandra")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  saptaka === "mandra" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text"
                }`}
              >
                මන්ද්‍ර (.)
              </button>
              <button
                type="button"
                onClick={() => setSaptaka("madhya")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  saptaka === "madhya" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text"
                }`}
              >
                මධ්‍ය
              </button>
              <button
                type="button"
                onClick={() => setSaptaka("tara")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  saptaka === "tara" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text"
                }`}
              >
                තාර (̇)
              </button>
            </div>

            {/* Timbre selector */}
            <select
              value={timbre}
              onChange={(e) => setTimbre(e.target.value as "harmonium" | "flute" | "pure")}
              className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-white text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="වාද්‍ය භාණ්ඩ නාදය තෝරන්න"
            >
              <option value="harmonium">හාමෝනියම් (Harmonium)</option>
              <option value="flute">බටනලාව (Flute)</option>
              <option value="pure">ස්වභාවික නාදය (Pure Tone)</option>
            </select>

            <button
              type="button"
              onClick={handlePlayScaleArohana}
              disabled={isPlayingScale}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPlayingScale ? "වාදනය වේ..." : "ආරෝහණය අසන්න"}
            </button>
          </div>
        )}
      </div>

      {audioUnavailable && (
        <p role="alert" className="mb-3 text-xs font-semibold text-primary">
          මෙම උපාංගයේ නාදය ආරම්භ කළ නොහැක. දෘශ්‍ය ස්වර සලකුණු අනුව පුහුණු වන්න.
        </p>
      )}

      {/* Keyboard Display */}
      <div className="relative overflow-x-auto pb-2 pt-1">
        <div className="flex justify-center min-w-[320px] max-w-full mx-auto select-none">
          {KEYS_CONFIG.map((keyItem) => {
            const isHighlighted =
              highlightNotes.length === 0 ||
              highlightNotes.some(
                (n) => n.replace(/[.̣'̇]/g, "") === keyItem.key.replace(/[.̣'̇]/g, "")
              );
            const isCurrentPlaying =
              playingKey === keyItem.key ||
              (activeNote && activeNote.replace(/[.̣'̇]/g, "") === keyItem.key.replace(/[.̣'̇]/g, ""));

            const isBlack = keyItem.isBlack;

            return (
              <button
                key={keyItem.key}
                type="button"
                onClick={() => handlePlayNote(keyItem.key)}
                className={`
                  relative flex flex-col justify-end items-center pb-2 transition-all rounded-b-lg border
                  ${
                    isBlack
                      ? "w-8 sm:w-10 h-28 sm:h-32 -mx-4 sm:-mx-5 z-10 bg-slate-900 border-slate-950 text-white shadow-md"
                      : "w-11 sm:w-14 h-40 sm:h-44 z-0 bg-white border-border text-text shadow-sm"
                  }
                  ${
                    isCurrentPlaying
                      ? isBlack
                        ? "!bg-accent !border-accent-dark scale-95"
                        : "!bg-amber-100 !border-accent scale-95"
                      : isBlack
                      ? "hover:bg-slate-800 active:bg-slate-950"
                      : "hover:bg-amber-50 active:bg-amber-100"
                  }
                  ${!isHighlighted ? "opacity-35" : "opacity-100"}
                `}
                aria-label={`${keyItem.label_si} (${keyItem.sub_si}) ස්වරය`}
              >
                {/* Visual badge indicator for raga swara */}
                {isHighlighted && highlightNotes.length > 0 && (
                  <span className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                )}

                {/* Sinhala Swara Text */}
                <span className={`font-bold leading-none ${isBlack ? "text-sm text-amber-300" : "text-base sm:text-lg text-primary"}`}>
                  {keyItem.label_si}
                  {saptaka === "tara" && "̇"}
                  {saptaka === "mandra" && "̣"}
                </span>

                <span className={`text-[10px] mt-0.5 leading-none ${isBlack ? "text-slate-400" : "text-text-muted"}`}>
                  {keyItem.sub_si}
                </span>

                {/* PC Hotkey clue */}
                <span className={`text-[9px] font-mono mt-1 opacity-40 leading-none ${isBlack ? "text-white" : "text-text"}`}>
                  [{keyItem.hotkey}]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer explanation */}
      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          යතුරුපුවරුවේ අකුරු (A, W, S, E, D, F...) ඔබාද වාදනය කළ හැක.
        </span>
        <span className="hidden sm:inline text-[11px]">
          100% කෘත්‍රිම Web Audio නාදයකි (කිසිදු බාහිර ගොනුවක් නැත)
        </span>
      </div>
    </div>
  );
};
