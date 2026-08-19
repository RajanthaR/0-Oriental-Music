"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Radio, Search, ArrowRight, Music, ShieldAlert } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function InstrumentsDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const instruments = repository.getInstruments(searchQuery).filter((i) => {
    if (selectedCategory === "all") return true;
    return i.category_si.startsWith(selectedCategory);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Radio className="w-4 h-4 text-accent" />
          <span>පෙරදිග හා දේශීය වාද්‍ය භාණ්ඩ</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          වාද්‍ය භාණ්ඩ නාමාවලිය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          තත (තත්), අවනද්ධ (බෙර), සුෂිර (සුළං) සහ ඝන භාණ්ඩවල ව්‍යුහය, නාද උත්පාදන විලාසය සහ වාදන ඉරියව් සවිස්තරව ගවේෂණය කරන්න.
        </p>
      </div>

      {/* Category filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-warm-sm mb-8 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="භාණ්ඩයේ නම, වර්ගය හෝ සම්ප්‍රදාය සෙවීම..."
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-light text-xs">
          <span className="font-bold text-text-secondary mr-2">වර්ගීකරණය:</span>
          {[
            { id: "all", label: "සියලු භාණ්ඩ" },
            { id: "තත් භාණ්ඩ", label: "තත් භාණ්ඩ (Chordophones)" },
            { id: "අවනද්ධ භාණ්ඩ", label: "අවනද්ධ භාණ්ඩ (Membranophones)" },
            { id: "සුෂිර භාණ්ඩ", label: "සුෂිර භාණ්ඩ (Aerophones)" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-warm text-text hover:bg-white border border-border-light"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Instruments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instruments.map((inst) => (
          <Link
            key={inst.id}
            href={`/instruments/${inst.id}`}
            className="bg-white rounded-3xl p-6 border border-border shadow-warm-md hover:shadow-warm-lg hover:border-accent/60 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
                  {inst.category_si.split(" ")[0]}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  {inst.origin_si}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-text group-hover:text-primary transition-colors mb-2">
                {inst.name_si}
              </h2>

              <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-3">
                {inst.construction_si}
              </p>

              <div className="bg-surface-warm p-3 rounded-xl border border-border-light text-xs text-text-secondary">
                <span className="font-bold text-text block mb-0.5">සංගීතමය කාර්යභාරය:</span>
                <p className="line-clamp-2">{inst.musicalRole_si}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border-light flex items-center justify-between text-xs mt-4">
              <span className="text-text-muted font-medium">
                ශ්‍රේණි: {inst.gradeBands.join(", ")}
              </span>
              <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>විස්තර බලන්න</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
