import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/validation/content-validator";
import { repository } from "@/lib/data/repository";

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
});
