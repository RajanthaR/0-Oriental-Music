"use client";

import React, { useState } from "react";
import { Activity, Search } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { TalaDirectoryResults } from "@/components/tala/TalaDirectoryResults";

export default function TalasDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const allTalas = repository.getTalas();
  const talas = repository.getTalas(searchQuery);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Activity className="w-4 h-4 text-accent" />
          <span>ලය හා තාල ශාස්ත්‍රය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          ලය හා තාල නාමාවලිය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          මූලාශ්‍ර සාක්ෂියෙන් සනාථ වූ මාත්‍රා, විභාග, තාළි/ඛාලි සහ ථේකා පමණක් සජීවී දෘශ්‍යකාරකය සහ තබ්ලා නාද සමඟ පුහුණු වන්න.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-warm-sm mb-8">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="තාලයේ නම හෝ මාත්‍රා ප්‍රමාණය සෙවීම..."
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-3 min-h-[44px] text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <TalaDirectoryResults allTalas={allTalas} talas={talas} onClearSearch={() => setSearchQuery("")} />
    </div>
  );
}
