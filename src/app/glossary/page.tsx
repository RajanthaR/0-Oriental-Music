"use client";

import React, { useState } from "react";
import { BookOpen, Search, Sparkles, Volume2 } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { swaraSynth } from "@/lib/audio/synth";

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const terms = repository.getGlossary(
    searchQuery,
    selectedCategory === "all" ? undefined : selectedCategory
  );

  const categories = [
    { id: "all", label: "සියලු වදන්" },
    { id: "ස්වර හා ශ්‍රැති", label: "ස්වර හා ශ්‍රැති" },
    { id: "ලය හා තාල", label: "ලය හා තාල" },
    { id: "රාග ශාස්ත්‍රය", label: "රාග ශාස්ත්‍රය" },
    { id: "වාද්‍ය භාණ්ඩ", label: "වාද්‍ය භාණ්ඩ" },
    { id: "දේශීය සංගීතය", label: "දේශීය සංගීතය" },
    { id: "නාට්‍ය සංගීතය", label: "නාට්‍ය සංගීතය" },
  ];

  const handlePlayAudio = (term: string) => {
    if (term === "ස" || term.includes("ස්වර")) {
      swaraSynth.playSwaraTone("S");
    } else {
      swaraSynth.playSequence(["S", "R", "G", "M", "P"], 0.4);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <BookOpen className="w-4 h-4 text-accent" />
          <span>පාරිභාෂික ශබ්දකෝෂය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          සිංහල සංගීත ශබ්දකෝෂය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ශ්‍රී ලංකා විෂය නිර්දේශයේ පිළිගත් සංගීත පාරිභාෂික වදන්, අර්ථ නිරූපණ, ඉංග්‍රීසි සමාන පද සහ ශ්‍රව්‍ය ආදර්ශන.
        </p>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-warm-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="සංගීත පදය, ඉංග්‍රීසි වචනය හෝ අර්ථය සෙවීම..."
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-light text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
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

      {/* Glossary Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {terms.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-border shadow-warm-sm hover:shadow-warm-md transition-all space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
                {item.category_si}
              </span>
              <span className="text-xs text-text-muted italic">{item.transliteration}</span>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-text">
                {item.term_si}
              </h2>
              <span className="text-xs text-accent font-semibold">{item.term_en}</span>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pt-1">
              {item.definition_si}
            </p>

            {item.detailedNotes_si && (
              <p className="text-[11px] text-text-muted bg-surface-warm p-2.5 rounded-xl border border-border-light leading-snug">
                💡 {item.detailedNotes_si}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
