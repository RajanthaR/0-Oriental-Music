"use client";

import React, { useState } from "react";
import {
  Volume2,
  Music2,
  Activity,
  Mic,
  Touchpad,
  FileText,
  Radio,
  Sparkles,
  Headphones,
} from "lucide-react";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { DroneController } from "@/components/audio/DroneController";
import { TalaVisualizer } from "@/components/audio/TalaVisualizer";
import { RhythmTapGame } from "@/components/audio/RhythmTapGame";
import { PitchDetectorView } from "@/components/audio/PitchDetectorView";
import { NotationArranger } from "@/components/audio/NotationArranger";
import { EarTrainingModule } from "@/components/audio/EarTrainingModule";
import { repository } from "@/lib/data/repository";

export default function PracticeHubPage() {
  const [activeTab, setActiveTab] = useState<
    "keyboard" | "tanpura" | "tala" | "rhythm-tap" | "pitch" | "notation" | "ear-training"
  >("keyboard");

  const talas = repository.getTalas();

  const toolTabs = [
    { id: "keyboard", label_si: "ස්වර යතුරුපුවරුව", icon: Volume2 },
    { id: "tanpura", label_si: "තාන්පුර ශ්‍රැතිය", icon: Music2 },
    { id: "tala", label_si: "තාල දෘශ්‍යකාරකය", icon: Activity },
    { id: "rhythm-tap", label_si: "රිද්ම තට්ටු කිරීම", icon: Touchpad },
    { id: "pitch", label_si: "ස්වර තාරතා පුහුණුව", icon: Mic },
    { id: "notation", label_si: "ප්‍රස්තාර සකසනය", icon: FileText },
    { id: "ear-training", label_si: "සවන්දීමේ හඳුනාගැනීම", icon: Headphones },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>සජීවී බ්‍රවුසර් ශ්‍රව්‍ය මෙවලම්</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          ප්‍රායෝගික පුහුණු මධ්‍යස්ථානය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          Web Audio API තාක්ෂණයෙන් ක්‍රියාත්මක වන, 100% ප්‍රකාශන හිමිකම් රහිත, ශිෂ්‍ය හිතකාමී සංගීත පුහුණු මෙවලම් කට්ටලය.
        </p>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-white border border-border rounded-2xl shadow-warm-sm">
        {toolTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text hover:bg-surface-warm"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label_si}</span>
            </button>
          );
        })}
      </div>

      {/* Active Interactive Tool Content Area */}
      <div className="transition-all">
        {activeTab === "keyboard" && (
          <div className="space-y-4">
            <SwaraKeyboard compact={false} />
          </div>
        )}

        {activeTab === "tanpura" && (
          <div className="space-y-4">
            <DroneController />
          </div>
        )}

        {activeTab === "tala" && (
          <div className="space-y-4">
            <TalaVisualizer tala={talas[0]} />
          </div>
        )}

        {activeTab === "rhythm-tap" && (
          <div className="space-y-4">
            <RhythmTapGame bpm={80} totalBeats={16} />
          </div>
        )}

        {activeTab === "pitch" && (
          <div className="space-y-4">
            <PitchDetectorView targetNotes={["S", "R", "G", "M", "P"]} />
          </div>
        )}

        {activeTab === "notation" && (
          <div className="space-y-4">
            <NotationArranger
              prompt_si="සප්ත ස්වර ආරෝහණ පිළිවෙළට සකසන්න:"
              shuffledItems={["ග", "ස", "ප", "රි", "ම", "නි", "ධ"]}
              correctOrder={["ස", "රි", "ග", "ම", "ප", "ධ", "නි"]}
            />
          </div>
        )}

        {activeTab === "ear-training" && (
          <div className="space-y-4">
            <EarTrainingModule />
          </div>
        )}
      </div>
    </div>
  );
}
