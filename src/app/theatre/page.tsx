"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Drama, Search, Music, ArrowRight, UserCheck } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function TheatrePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const theatreList = repository.getTheatreTraditions(searchQuery);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Drama className="w-4 h-4 text-accent" />
          <span>දේශීය නාට්‍ය සංගීත සම්ප්‍රදාය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          නාට්‍ය හා රංග සංගීතය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          නාඩගම්, නූර්ති, සොකරි සහ කෝලම් නාට්‍යවල ඓතිහාසික පසුබිම, සංගීතමය ලක්ෂණ, ප්‍රධාන වාද්‍ය භාණ්ඩ සහ පුරෝගාමීන්ගේ කාර්යභාරය හදාරමු.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-warm-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="නාඩගම්, නූර්ති, සොකරි හෝ කෝලම් සෙවීම..."
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Theatre Traditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {theatreList.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
                  {item.type_si}
                </span>
                <span className="text-xs text-text-muted">
                  ශ්‍රේණි: {item.gradeBands.join(", ")}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-text mb-2">
                {item.title_si}
              </h2>

              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {item.historicalBackground_si}
              </p>

              {/* Musical characteristics */}
              <div className="bg-surface-warm p-4 rounded-2xl border border-border-light space-y-2 text-xs">
                <div>
                  <span className="font-bold text-text block mb-0.5">සංගීතමය ලක්ෂණ:</span>
                  <p className="text-text-secondary leading-relaxed">
                    {item.musicalCharacteristics_si}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-light">
                  <span className="font-bold text-text block mb-0.5">ප්‍රධාන වාද්‍ය භාණ්ඩ:</span>
                  <span className="text-primary font-semibold">{item.instruments_si.join(", ")}</span>
                </div>

                <div>
                  <span className="font-bold text-text block mb-0.5">පුරෝගාමීන් / ප්‍රධාන චරිත:</span>
                  <span className="text-text-secondary">{item.keyPersonalities_si.join(", ")}</span>
                </div>
              </div>
            </div>

            {/* Featured Song Snippet */}
            {item.featuredSongs_si && item.featuredSongs_si.length > 0 && (
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-accent/30 text-xs">
                <span className="font-bold text-accent-dark block mb-1">
                  ප්‍රකට ගීතය: {item.featuredSongs_si[0].songTitle_si}
                </span>
                <p className="italic font-serifSinhala text-text mb-1">
                  “{item.featuredSongs_si[0].lyricsSnippet_si}”
                </p>
                <p className="text-[11px] text-text-muted">
                  සන්දර්භය: {item.featuredSongs_si[0].context_si}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
