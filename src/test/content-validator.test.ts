import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/validation/content-validator";
import { repository } from "@/lib/data/repository";
import type { Raga, Tala } from "@/types/content";

describe("Content Validation Suite", () => {
  const lessons = repository.getLessons();
  const ragas = repository.getRagas();
  const talas = repository.getTalas();
  const instruments = repository.getInstruments();
  const culturalTraditions = repository.getCulturalTraditions();
  const theatreTraditions = repository.getTheatreTraditions();

  it("should validate that all canonical lessons pass the validation engine", () => {
    const report = validateContent(
      lessons,
      ragas,
      talas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );

    const errors = report.issues.filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(report.isValid).toBe(true);
  });

  it("should ensure every lesson has a standard Sinhala learning goal starting with 'මෙම පාඩම අවසානයේ ඔබට'", () => {
    lessons.forEach((l) => {
      expect(l.learningGoal_si.startsWith("මෙම පාඩම අවසානයේ ඔබට")).toBe(true);
    });
  });

  it("should ensure all ragas have valid arohana and avarohana swaras arrays", () => {
    ragas.forEach((r) => {
      expect(r.arohana_swaras.length).toBeGreaterThan(0);
      expect(r.avarohana_swaras.length).toBeGreaterThan(0);
    });
  });

  it("should ensure all talas have bols matching their matra count", () => {
    talas.forEach((t) => {
      expect(t.bols.length).toBe(t.matras);
    });
  });

  it("rejects duplicate canonical IDs", () => {
    const duplicateRagas = [...ragas, { ...ragas[0] }] as Raga[];
    const report = validateContent(
      lessons,
      duplicateRagas,
      talas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.field === "id" && issue.message.includes("Duplicate"))).toBe(true);
  });

  it("rejects invalid tala structure and normalized alias collisions", () => {
    const invalidStructure = {
      ...talas[0],
      vibhagStructure: [2, 2],
    } as Tala;
    const aliasCollision = {
      ...talas[1],
      aliases_si: [talas[0].name_si],
    } as Tala;
    const report = validateContent(
      lessons,
      ragas,
      [invalidStructure, aliasCollision, ...talas.slice(2)],
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.field === "vibhagStructure")).toBe(true);
    expect(report.issues.some((issue) => issue.field === "aliases_si" && issue.message.includes("collides"))).toBe(true);
  });

  it("rejects unknown raga swara tokens", () => {
    const invalidRaga = {
      ...ragas[0],
      arohana_swaras: [...ragas[0].arohana_swaras, "X"],
    } as Raga;
    const report = validateContent(
      lessons,
      [invalidRaga, ...ragas.slice(1)],
      talas,
      instruments,
      culturalTraditions,
      theatreTraditions
    );
    expect(report.issues.some((issue) => issue.message.includes("Unknown swara token"))).toBe(true);
  });
});
