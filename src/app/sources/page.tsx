import React from "react";
import Link from "next/link";
import { FileText, ShieldCheck, ExternalLink } from "lucide-react";
import { repository } from "@/lib/data/repository";

export default function SourcesCatalogPage() {
  const sources = repository.getSources();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <FileText className="w-4 h-4 text-accent" />
          <span>නිල මූලාශ්‍ර නාමාවලිය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          විෂය නිර්දේශ මූලාශ්‍ර නාමාවලිය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          “ස්වර මඟ” වේදිකාවේ සෑම පාඩමක්, රාගයක් සහ තාලයක්ම සත්‍යාපනය කර ඇත්තේ ජාතික අධ්‍යාපන ආයතනය (NIE), අධ්‍යාපන ප්‍රකාශන දෙපාර්තමේන්තුව සහ ශ්‍රී ලංකා විභාග දෙපාර්තමේන්තුවේ නිල ප්‍රකාශන මඟිනි.
        </p>
      </div>

      {/* Sources List */}
      <div className="space-y-4">
        {sources.map((src) => (
          <div
            key={src.id}
            className="bg-white rounded-3xl p-6 border border-border shadow-warm-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold bg-primary-50 text-primary px-2.5 py-0.5 rounded-full">
                {src.id}
              </span>
              <span className="text-xs text-text-muted">{src.tier}</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-text">
              {src.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-text-secondary pt-1">
              <div>
                <span className="font-bold text-text">කර්තෘ/ආයතනය: </span>
                <span>{src.publisher}</span>
              </div>
              <div>
                <span className="font-bold text-text">වර්ෂය: </span>
                <span>{src.year}</span>
              </div>
              <div>
                <span className="font-bold text-text">ස්ථානය: </span>
                <span>{src.location}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border-light text-xs text-text-muted flex items-center justify-between">
              <span>අදාළ ශ්‍රේණි: {src.grades.join(", ")}</span>
              <span>බලපත්‍රය: {src.license}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
