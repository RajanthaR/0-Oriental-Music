/**
 * Sinhala-aware Search Engine
 * Handles diacritic normalization, spelling variants (ස/ශ/ෂ, න/ණ, ල/ළ), and transliterations.
 */

import { repository } from "@/lib/data/repository";

export interface SearchResultItem {
  id: string;
  type: "lesson" | "raga" | "tala" | "instrument" | "glossary" | "tradition" | "theatre";
  title_si: string;
  title_en?: string;
  snippet_si: string;
  url: string;
  gradeBand?: string;
}

export function normalizeSinhalaText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    // Normalize interchangeable characters for fuzzy search
    .replace(/[ශෂ]/g, "ස")
    .replace(/ණ/g, "න")
    .replace(/ළ/g, "ල")
    .replace(/ඥ/g, "ඤ")
    // Remove zero-width joiners and spaces for matching
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

// Transliteration map for English phonetic queries
const TRANSLITERATION_MAP: Record<string, string> = {
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
  deepchandi: "දීප්චන්දි",
  dipchandi: "දීප්චන්දි",
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
};

export function searchFilter<T>(
  items: T[],
  query: string,
  extractFields: (item: T) => string[]
): T[] {
  if (!query || !query.trim()) return items;

  const rawQ = query.trim().toLowerCase();
  const normalizedQ = normalizeSinhalaText(rawQ);
  const transliterated = TRANSLITERATION_MAP[rawQ] || "";
  const normalizedTrans = normalizeSinhalaText(transliterated);

  return items.filter((item) => {
    const fields = extractFields(item);
    return fields.some((field) => {
      if (!field) return false;
      const normField = normalizeSinhalaText(field);
      return (
        normField.includes(normalizedQ) ||
        (normalizedTrans && normField.includes(normalizedTrans)) ||
        field.toLowerCase().includes(rawQ)
      );
    });
  });
}

class SearchIndex {
  public search(query: string): SearchResultItem[] {
    if (!query || !query.trim()) {
      // Return top featured
      const lessons = repository.getLessons().slice(0, 4);
      return lessons.map((l) => ({
        id: l.id,
        type: "lesson" as const,
        title_si: l.title_si,
        snippet_si: l.summary_si,
        url: `/lessons/${l.id}`,
        gradeBand: l.gradeBands.join(", "),
      }));
    }

    const results: SearchResultItem[] = [];

    // Search Lessons
    const lessons = repository.getLessons({ query });
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
    const ragas = repository.getRagas(query);
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
    const talas = repository.getTalas(query);
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
    const instruments = repository.getInstruments(query);
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
    const glossary = repository.getGlossary(query);
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
    const traditions = repository.getCulturalTraditions(query);
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

export const searchIndex = new SearchIndex();
