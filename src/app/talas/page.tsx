"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Feather, Activity, ArrowRight, Play, Search } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function TalasDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
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
          මාත්‍රා, විභාග, තාළි/ඛාලි සහ ථේකාවන් සහිත උත්තර භාරතීය ප්‍රමුඛ තාල සජීවී දෘශ්‍යකාරකය සහ තබ්ලා නාද සමඟ ප්‍රගුණ කරන්න.
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
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Talas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {talas.map((tala) => (
          <Link
            key={tala.id}
            href={`/talas/${tala.id}`}
            className="bg-white rounded-3xl p-6 border border-border shadow-warm-md hover:shadow-warm-lg hover:border-accent/60 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary">
                  මාත්‍රා {tala.matras}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  විභාග {tala.vibhagCount} ({tala.vibhagStructure.join("+")})
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-text group-hover:text-primary transition-colors mb-2">
                {tala.name_si}
              </h2>

              <div className="space-y-1 text-xs text-text-secondary mb-4 bg-surface-warm p-3.5 rounded-2xl border border-border-light">
                <span className="font-bold text-text block mb-1">ථේකාව (Theka):</span>
                <p className="font-mono text-xs text-primary font-semibold">
                  {tala.theka_si}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs">
              <span className="text-text-muted font-medium">
                ශ්‍රේණි කාණ්ඩය: {tala.gradeBands.join(", ")}
              </span>
              <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>දෘශ්‍යකාරකය බලන්න</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
