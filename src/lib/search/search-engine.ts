/**
 * Sinhala-aware Search Engine
 * Handles diacritic normalization, spelling variants (ස/ශ/ෂ, න/ණ, ල/ළ), and transliterations.
 *
 * This module is repository-free: it owns query classification and filtering
 * only. The default index bound to the content repository lives in
 * `public-search-index.ts`, the repository-facing composition layer, which
 * hands SearchIndex explicit per-operation inputs. Search must never import
 * the repository merely to obtain default data.
 */

import type {
  Lesson,
  Raga,
  Tala,
  Instrument,
  GlossaryTerm,
  CulturalTradition,
} from "@/types/content";
import { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";
export { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";

export interface SearchResultItem {
  id: string;
  type: "lesson" | "raga" | "tala" | "instrument" | "glossary" | "tradition" | "theatre";
  title_si: string;
  title_en?: string;
  snippet_si: string;
  url: string;
  gradeBand?: string;
}

/** One immutable public-catalog capture handed to the search engine per operation. */
export interface PublicSearchCatalogs {
  lessons: ReadonlyArray<Lesson>;
  ragas: ReadonlyArray<Raga>;
  talas: ReadonlyArray<Tala>;
  instruments: ReadonlyArray<Instrument>;
  glossary: ReadonlyArray<GlossaryTerm>;
  culturalTraditions: ReadonlyArray<CulturalTradition>;
}

/**
 * Explicit inputs for the search engine. Both accessors are invoked inside
 * every `search()` call, so each operation observes fresh repository state
 * without any cross-operation caching.
 */
export interface SearchDataSource {
  getFeaturedLessons(): readonly Lesson[];
  getPublicSearchCatalogs(): PublicSearchCatalogs;
}

// Transliteration map for English phonetic queries
const TRANSLITERATION_MAP: Record<string, string> = Object.assign(Object.create(null) as Record<string, string>, {
  swara: "ස්වර",
  shruti: "ශ්‍රැති",
  sruti: "ශ්‍රැති",
  raga: "රාග",
  raag: "රාග",
  tala: "තාල",
  taal: "තාල",
  laya: "ලය",
  nada: "නාද",
  pitch: "තාරතාව",
  timbre: "ධ්වනි",
  intensity: "විපුලතාව",
  bhairav: "භෛරව",
  bhairavi: "භෛරවී",
  yaman: "යමන්",
  bilawal: "බිලාවල්",
  khamaj: "ඛමාජ්",
  bhupali: "භූපාලි",
  kafi: "කාෆි",
  bhimpalasi: "භිම්පලාසි",
  teental: "ත්‍රීතාල",
  trital: "ත්‍රීතාල",
  dadra: "දාදරා",
  keherwa: "කෙහර්වා",
  roopak: "රූපක්",
  jhaptal: "ජප්තාල",
  deepchandi: "දීප්චන්ද්",
  dipchandi: "දීප්චන්ද්",
  lawani: "ලාවනී",
  khemta: "ඛෙම්ටෝ",
  khemto: "ඛෙම්ටෝ",
  sitar: "සිතාර",
  tabla: "තබ්ලා",
  flute: "බටනලා",
  harmonium: "හාමෝනියම්",
  violin: "වයලීන",
  esraj: "එස්රාජ",
  geta: "ගැට බෙර",
  yak: "යක් බෙර",
  dawula: "දවුල",
  nadagam: "නාඩගම්",
  nurthi: "නූර්ති",
  sokari: "සොකරි",
  kolam: "කෝලම්",
  goyam: "ගොයම්",
  karaththa: "කරත්ත",
  paruwa: "පාරු",
  raban: "රබන්",
});

// Retrieval-only source variant. The Grade 11 extraction uses දීප්චන්දි, but
// that document remains Review Required; keep the Grade 10 form canonical.
const SOURCE_QUERY_VARIANTS: Record<string, string> = Object.assign(Object.create(null) as Record<string, string>, {
  "දීප්චන්දි": "දීප්චන්ද්",
  "දීප්චන්දි තාලය": "දීප්චන්ද් තාලය",
});

type SearchQueryClassification =
  | { kind: "featured" }
  | { kind: "none" }
  | { kind: "search"; raw: string; normalized: string; transliterated: string };

function classifySearchQuery(query: unknown): SearchQueryClassification {
  // Repository/search callers may omit the optional query. Treat that same as
  // a genuine blank input; other non-string runtime values are hostile.
  if (query === undefined) return { kind: "featured" };
  if (typeof query !== "string") return { kind: "none" };
  if (!query.trim()) return { kind: "featured" };

  const raw = query.trim().toLowerCase();
  const variant = Object.prototype.hasOwnProperty.call(SOURCE_QUERY_VARIANTS, raw)
    ? SOURCE_QUERY_VARIANTS[raw]
    : undefined;
  const transliterated = Object.prototype.hasOwnProperty.call(TRANSLITERATION_MAP, raw)
    ? TRANSLITERATION_MAP[raw]
    : "";
  const normalized = normalizeSinhalaText(variant || raw);
  const normalizedTransliterated = normalizeSinhalaText(transliterated);

  // A non-empty string made only of bidi/zero-width controls must not become
  // `includes("")`, which would expose the entire public catalog.
  if (!normalized && !normalizedTransliterated) return { kind: "none" };

  return {
    kind: "search",
    raw,
    normalized,
    transliterated: normalizedTransliterated,
  };
}

export function searchFilter<T>(
  items: readonly T[],
  query: unknown,
  extractFields: (item: T) => string[]
): T[] {
  const classification = classifySearchQuery(query);
  if (classification.kind === "featured") return [...items];
  if (classification.kind === "none") return [];

  return items.filter((item) => {
    const fields = extractFields(item);
    return fields.some((field) => {
      if (!field) return false;
      const normField = normalizeSinhalaText(field);
      return (
        normField.includes(classification.normalized) ||
        (classification.transliterated && normField.includes(classification.transliterated)) ||
        field.toLowerCase().includes(classification.raw)
      );
    });
  });
}

class SearchIndex {
  constructor(private readonly data: SearchDataSource) {}

  public search(query?: unknown): SearchResultItem[] {
    const classification = classifySearchQuery(query);
    if (classification.kind === "featured") {
      // Return top featured
      const lessons = this.data.getFeaturedLessons().slice(0, 4);
      return lessons.map((l) => ({
        id: l.id,
        type: "lesson" as const,
        title_si: l.title_si,
        snippet_si: l.summary_si,
        url: `/lessons/${l.id}`,
        gradeBand: l.gradeBands.join(", "),
      }));
    }
    if (classification.kind === "none") return [];

    const results: SearchResultItem[] = [];
    const searchQuery = classification.raw;
    const catalogs = this.data.getPublicSearchCatalogs();

    // Search Lessons
    const lessons = searchFilter(catalogs.lessons, searchQuery, (lesson) => [
      lesson.title_si,
      lesson.title_en || "",
      lesson.summary_si,
      lesson.learningGoal_si,
    ]);
    lessons.forEach((l) => {
      results.push({
        id: l.id,
        type: "lesson",
        title_si: l.title_si,
        snippet_si: l.summary_si,
        url: `/lessons/${l.id}`,
        gradeBand: l.gradeBands.join(", "),
      });
    });

    // Search Ragas
    const ragas = searchFilter(catalogs.ragas, searchQuery, (raga) => [
      raga.name_si,
      raga.name_en,
      raga.thata_si,
      raga.vadi_si,
      raga.samvadi_si,
      raga.time_si,
    ]);
    ragas.forEach((r) => {
      results.push({
        id: r.id,
        type: "raga",
        title_si: `${r.name_si} (${r.thata_si})`,
        snippet_si: `ආරෝහණය: ${r.arohana_si} | වාදී: ${r.vadi_si}`,
        url: `/ragas/${r.id}`,
        gradeBand: r.gradeBands.join(", "),
      });
    });

    // Search Talas
    const talas = searchFilter(catalogs.talas, searchQuery, (tala) => [
      tala.name_si,
      tala.name_en,
      ...tala.aliases_si,
      tala.theka_si,
    ]);
    talas.forEach((t) => {
      results.push({
        id: t.id,
        type: "tala",
        title_si: `${t.name_si} (මාත්‍රා ${t.matras})`,
        title_en: t.name_en,
        snippet_si: `ථේකාව: ${t.theka_si}`,
        url: `/talas/${t.id}`,
        gradeBand: t.gradeBands.join(", "),
      });
    });

    // Search Instruments
    const instruments = searchFilter(catalogs.instruments, searchQuery, (instrument) => [
      instrument.name_si,
      instrument.name_en,
      instrument.category_si,
      instrument.origin_si,
      instrument.construction_si,
    ]);
    instruments.forEach((inst) => {
      results.push({
        id: inst.id,
        type: "instrument",
        title_si: inst.name_si,
        title_en: inst.name_en,
        snippet_si: inst.musicalRole_si,
        url: `/instruments/${inst.id}`,
        gradeBand: inst.gradeBands.join(", "),
      });
    });

    // Search Glossary
    const glossary = searchFilter(catalogs.glossary, searchQuery, (term) => [
      term.term_si,
      term.term_en,
      term.transliteration,
      term.definition_si,
      term.category_si,
    ]);
    glossary.forEach((g) => {
      results.push({
        id: g.id,
        type: "glossary",
        title_si: `${g.term_si} (${g.term_en})`,
        snippet_si: g.definition_si,
        url: `/glossary`,
      });
    });

    // Search Cultural Traditions
    const traditions = searchFilter(catalogs.culturalTraditions, searchQuery, (tradition) => [
      tradition.title_si,
      tradition.title_en,
      tradition.category_si,
      tradition.description_si,
    ]);
    traditions.forEach((tr) => {
      results.push({
        id: tr.id,
        type: "tradition",
        title_si: tr.title_si,
        snippet_si: tr.description_si,
        url: `/traditions`,
        gradeBand: tr.gradeBands.join(", "),
      });
    });

    return results;
  }
}

export { SearchIndex };
