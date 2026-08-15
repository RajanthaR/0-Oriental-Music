import React from "react";
import Link from "next/link";
import { FileText, ShieldCheck, ExternalLink } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { getSourceCorpusInventory } from "@/lib/data/publication-policy";

export default function SourcesCatalogPage() {
  const sources = repository.getSources();
  const inventory = getSourceCorpusInventory();
  const publication = repository.getPublicationSummary();
  const publicRecords = Object.values(publication).reduce((sum, item) => sum + item.public, 0);

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
          මෙය මූලාශ්‍ර නාමාවලියක් පමණි. ප්‍රකාශන හිමිකම්, ප්‍රකාශක, වර්ෂය, ස්ථානය සහ සමාලෝචන තොරතුරු සනාථ වී නොමැති අගයන් ලෙස පෙන්වනු ලැබේ. පොදු අන්තර්ගතය සඳහා මූලාශ්‍ර ලේඛනය, නිශ්චිත පිටුව සහ පිටු-ගුණාත්මකභාවය එකට පරීක්ෂා කළ යුතුය.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-text-secondary">
          <div className="rounded-xl bg-surface-warm border border-border-light p-3"><span className="font-bold block text-text">මූලාශ්‍ර වාර්තා</span>{inventory.sourceRecords}</div>
          <div className="rounded-xl bg-surface-warm border border-border-light p-3"><span className="font-bold block text-text">උපුටාගත් ලේඛන</span>{inventory.sourceDocuments}</div>
          <div className="rounded-xl bg-surface-warm border border-border-light p-3"><span className="font-bold block text-text">පිටු</span>{inventory.sourcePages}</div>
          <div className="rounded-xl bg-surface-warm border border-border-light p-3"><span className="font-bold block text-text">පොදු වාර්තා</span>{publicRecords}</div>
        </div>
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

            <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              සාක්ෂි තත්ත්වය: {src.evidenceState} / {src.evidenceQuality} · {src.status}
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
