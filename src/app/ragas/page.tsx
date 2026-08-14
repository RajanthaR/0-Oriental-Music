"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Clock, ArrowRight, Music, Search } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function RagasDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const ragas = repository.getRagas(searchQuery);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>උත්තර භාරතීය රාග ශාස්ත්‍රය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          රාග ලෝකය (World of Ragas)
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ශ්‍රී ලංකා පාසල් විෂය නිර්දේශයේ අඩංගු ප්‍රමුඛ ථාට හා රාගවල ආරෝහණ, අවරෝහණ, වාදී/සංවාදී ස්වර සහ පකඩ් ඛණ්ඩ සජීවී ශ්‍රව්‍ය ආදර්ශන සමඟ ගවේෂණය කරන්න.
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
            placeholder="රාගයේ නම, ථාටය හෝ ගායන වේලාව සෙවීම..."
            className="w-full bg-surface-warm border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Raga Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ragas.map((raga) => (
          <Link
            key={raga.id}
            href={`/ragas/${raga.id}`}
            className="bg-white rounded-3xl p-6 border border-border shadow-warm-md hover:shadow-warm-lg hover:border-accent/60 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800">
                  {raga.thata_si}
                </span>
                <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {raga.time_si}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-text group-hover:text-primary transition-colors mb-2">
                {raga.name_si}
              </h2>

              <div className="space-y-1.5 text-xs text-text-secondary mb-4 bg-surface-warm p-3.5 rounded-2xl border border-border-light">
                <div>
                  <span className="font-bold text-text">ආරෝහණය: </span>
                  <span>{raga.arohana_si}</span>
                </div>
                <div>
                  <span className="font-bold text-text">වාදී / සංවාදී: </span>
                  <span>{raga.vadi_si} / {raga.samvadi_si}</span>
                </div>
                <div>
                  <span className="font-bold text-text">ජාතිය: </span>
                  <span>{raga.jati_si}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs">
              <span className="text-text-muted font-medium">
                ශ්‍රේණි: {raga.gradeBands.join(", ")}
              </span>
              <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>රාගය හදාරන්න</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
