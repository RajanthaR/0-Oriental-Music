import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Tala } from "@/types/content";

interface TalaDirectoryResultsProps {
  allTalas: Tala[];
  talas: Tala[];
  onClearSearch: () => void;
}

export function TalaDirectoryResults({ allTalas, talas, onClearSearch }: TalaDirectoryResultsProps) {
  if (allTalas.length === 0) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-950">
        <p className="font-bold">දැනට ප්‍රසිද්ධ භාවිතයට සනාථ වූ තාල නොමැත.</p>
        <p className="mt-2 text-xs">මූලාශ්‍ර සමාලෝචනය අවසන් වන තෙක් අසනාථ තාල සහ ථේකා ප්‍රදර්ශනය නොකෙරේ.</p>
        <Link href="/sources" className="mt-4 inline-flex items-center min-h-[44px] px-4 font-bold text-primary underline">
          මූලාශ්‍ර සටහන් බලන්න
        </Link>
      </div>
    );
  }

  if (talas.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center text-sm text-text-secondary">
        <p>මෙම සෙවුමට ගැළපෙන සනාථ වූ තාලයක් හමු නොවීය.</p>
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-4 rounded-xl bg-primary px-4 py-2.5 min-h-[44px] font-bold text-white"
        >
          සෙවුම හිස් කරන්න
        </button>
      </div>
    );
  }

  return (
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
              <p className="font-mono text-xs text-primary font-semibold">{tala.theka_si}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs">
            <span className="text-text-muted font-medium">ශ්‍රේණි කාණ්ඩය: {tala.gradeBands.join(", ")}</span>
            <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>දෘශ්‍යකාරකය බලන්න</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
