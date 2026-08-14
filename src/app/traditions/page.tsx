"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Feather, BookOpen, Music, FileText, Search } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function TraditionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const traditions = repository.getCulturalTraditions(searchQuery);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Feather className="w-4 h-4 text-accent" />
          <span>ශ්‍රී ලාංකීය සංස්කෘතික උරුමය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          ජන හා දේශීය සංගීතය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ගොයම්, කරත්ත, පාරු, නෙළුම් කවි, රබන් පද, සහ උඩරට/පහතරට/සබරගමු ශාන්තිකර්ම නාද රටා ශ්‍රී ලාංකීය සංස්කෘතික ගෞරවය සුරකිමින් අධ්‍යයනය කරමු.
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
            placeholder="ගැමි කවි, ශාන්තිකර්ම හෝ රබන් පද සෙවීම..."
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Traditions List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {traditions.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 border border-border shadow-warm-md space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
                  {item.category_si}
                </span>
                <span className="text-xs text-text-muted">
                  ශ්‍රේණි: {item.gradeBands.join(", ")}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-text mb-2">
                {item.title_si}
              </h2>

              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {item.description_si}
              </p>

              {/* Sample Verses Card */}
              {item.verseExamples_si && item.verseExamples_si.length > 0 && (
                <div className="bg-surface-warm p-4 rounded-2xl border border-border-light space-y-2">
                  <span className="font-bold text-xs text-text block">
                    {item.verseExamples_si[0].verseTitle_si}:
                  </span>
                  <div className="font-serifSinhala text-xs sm:text-sm text-primary font-bold space-y-1 pl-2 border-l-2 border-accent">
                    {item.verseExamples_si[0].lyrics_si.map((line, lIdx) => (
                      <p key={lIdx} className="leading-tight">
                        {line}
                      </p>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted italic pt-1">
                    අර්ථය: {item.verseExamples_si[0].meaning_si}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border-light text-[11px] text-text-muted">
              සමාජීය පසුබිම: {item.socialContext_si}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
