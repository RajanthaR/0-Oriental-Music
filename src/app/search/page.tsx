"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Music, ArrowRight, Sparkles, BookOpen, Activity, Radio, Feather } from "lucide-react";
import { searchIndex } from "@/lib/search/public-search-index";
import type { SearchResultItem } from "@/lib/search/search-engine";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  // Results are a pure derivation of the query over the static index
  // (react-hooks v6 adoption): useMemo replaces the setState-in-effect pass.
  const results = useMemo(() => searchIndex.search(query), [query]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "lesson":
        return { label: "පාඩම", color: "bg-primary-50 text-primary", icon: BookOpen };
      case "raga":
        return { label: "රාගය", color: "bg-amber-50 text-amber-900", icon: Sparkles };
      case "tala":
        return { label: "තාලය", color: "bg-teal-50 text-teal-800", icon: Activity };
      case "instrument":
        return { label: "වාද්‍ය භාණ්ඩය", color: "bg-purple-50 text-purple-900", icon: Radio };
      case "glossary":
        return { label: "ශබ්දකෝෂය", color: "bg-blue-50 text-blue-900", icon: BookOpen };
      case "tradition":
        return { label: "ජන සංගීතය", color: "bg-rose-50 text-rose-900", icon: Feather };
      default:
        return { label: "අන්තර්ගතය", color: "bg-slate-100 text-slate-800", icon: Music };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Search className="w-4 h-4 text-accent" />
          <span>සමස්ත වේදිකා සෙවුම</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          ස්වර මඟ සිංහල සෙවුම් යන්ත්‍රය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          සිංහල යුනිකෝඩ්, සිංග්ලිෂ් (Singlish / Transliteration) හෝ ඉංග්‍රීසි වචන මඟින් ඕනෑම පාඩමක්, රාගයක්, තාලයක් හෝ සංකල්පයක් ක්ෂණිකව සොයන්න.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-warm-md">
        <div className="relative">
          <Search className="w-5 h-5 text-accent absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="උදා: බිලාවල්, Yaman, කාෆි, තාරතාවය..."
            className="w-full bg-surface-warm border-2 border-border focus:border-accent rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base text-text focus:outline-none"
          />
        </div>

        {/* Quick Sample Queries */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="text-text-muted font-bold">ඉක්මන් සෙවුම්:</span>
          {["බිලාවල්", "යමන්", "කාෆි", "තාරතාවය", "නාදය", "ස්වර"].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setQuery(sample)}
              className="bg-surface-warm hover:bg-amber-100 text-text min-h-[44px] px-3 py-2 rounded-lg border border-border-light transition-all"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-text-muted font-bold">
          <span>සොයාගත් ප්‍රතිඵල ({results.length}):</span>
          {query && <span>සෙවුම් පදය: “{query}”</span>}
        </div>

        {results.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-border shadow-warm-sm text-center text-xs text-text-muted">
            <p>කිසිදු ප්‍රතිඵලයක් හමු නොවීය. කරුණාකර වෙනත් වචනයක් යොදා බලන්න.</p>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 min-h-[44px] font-bold text-white"
              >
                සෙවුම හිස් කරන්න
              </button>
            )}
          </div>
        ) : (
          results.map((item) => {
            const badge = getTypeBadge(item.type);
            const Icon = badge.icon;

            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.url}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-warm-sm hover:shadow-warm-md hover:border-accent/60 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${badge.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                    {item.gradeBand && (
                      <span className="text-[10px] text-text-muted font-medium">
                        ශ්‍රේණි: {item.gradeBand}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-text group-hover:text-primary transition-colors">
                    {item.title_si}
                  </h3>

                  <p className="text-xs text-text-secondary line-clamp-1">
                    {item.snippet_si}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
