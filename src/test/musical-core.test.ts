import { describe, it, expect } from "vitest";
import { repository } from "@/lib/data/repository";
import { getSwaraFrequency, SWARA_SEMITONES } from "@/lib/audio/synth";
import { tablaSynth } from "@/lib/audio/tabla";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import lessonsData from "@/data/lessons.json";
import glossaryData from "@/data/glossary.json";

describe("Canonical Musical Core (Phase 2 Forensic Remediation)", () => {
  describe("Ragas Core Validation", () => {
    it("correctly models school Bilawal as all-7-Shuddha Sampurna raga", () => {
      const bilawal = repository.getRagas().find((r) => r.id === "raga-bilawal");
      expect(bilawal).toBeDefined();
      expect(bilawal?.name_si).toBe("බිලාවල් රාගය");
      expect(bilawal?.name_en).toBe("Raga Bilawal");
      expect(bilawal?.arohana_swaras).toEqual(["S", "R", "G", "M", "P", "D", "N", "S'"]);
      expect(bilawal?.avarohana_swaras).toEqual(["S'", "N", "D", "P", "M", "G", "R", "S"]);
      expect(bilawal?.arohana_si).toContain("ම");
      expect(bilawal?.jati_si).toContain("සම්පූර්ණ");
      expect(bilawal?.vadi_si).toContain("ධ");
      expect(bilawal?.samvadi_si).toContain("ග");
      expect(bilawal?.sourceReference.sourceId).toBe("SRC-G11-RAGA-ID");
      expect(bilawal?.sourceReference.pageOrSection).toContain("පිටු 1-2");
    });

    it("publishes exactly the 7 prescribed school ragas and quarantines Bhairav", () => {
      const publicRagas = repository.getRagas();
      expect(publicRagas.length).toBe(7);

      const publicIds = publicRagas.map((r) => r.id);
      expect(publicIds).toEqual(
        expect.arrayContaining([
          "raga-bilawal",
          "raga-bhupali",
          "raga-kafi",
          "raga-khamaj",
          "raga-bhimpalasi",
          "raga-yaman",
          "raga-bhairavi",
        ])
      );
      expect(publicIds).not.toContain("raga-bhairav");
      expect(repository.getRagaById("raga-bhairav")).toBeUndefined();
    });

    it("verifies swara sequence integrity across all public ragas", () => {
      repository.getRagas().forEach((raga) => {
        expect(raga.arohana_swaras.length).toBeGreaterThanOrEqual(5);
        expect(raga.avarohana_swaras.length).toBeGreaterThanOrEqual(5);
        expect(raga.sourceReference.sourceId).toBe("SRC-G11-RAGA-ID");

        // Verify every swara has a valid semitone mapping
        [...raga.arohana_swaras, ...raga.avarohana_swaras].forEach((swara) => {
          const freq = getSwaraFrequency(swara);
          expect(freq).toBeGreaterThan(100);
          expect(freq).toBeLessThan(1000);
        });
      });
    });
  });

  describe("Talas Core Validation", () => {
    it("models Lawani with 2-matra vibhags (8 matras: 2+2+2+2, X 2 0 3)", () => {
      const lawani = repository.getTalas().find((t) => t.id === "tala-lawani");
      expect(lawani).toBeDefined();
      expect(lawani?.matras).toBe(8);
      expect(lawani?.vibhagCount).toBe(4);
      expect(lawani?.vibhagStructure).toEqual([2, 2, 2, 2]);
      expect(lawani?.bols.length).toBe(8);
      expect(lawani?.sourceReference.sourceId).toBe("SRC-EPD-TB-G10");
    });

    it("models Dadra with 6 matras, 2 vibhags (3+3), X and 0 with Grade 10 citation", () => {
      const dadra = repository.getTalas().find((t) => t.id === "tala-dadra");
      expect(dadra).toBeDefined();
      expect(dadra?.matras).toBe(6);
      expect(dadra?.vibhagCount).toBe(2);
      expect(dadra?.vibhagStructure).toEqual([3, 3]);
      expect(dadra?.bols.length).toBe(6);
      expect(dadra?.sourceReference.sourceId).toBe("SRC-EPD-TB-G10");
      expect(dadra?.sourceReference.pageOrSection).toContain("පිටුව 6");
    });

    it("publishes exactly the 7 prescribed school talas and quarantines Roopak", () => {
      const publicTalas = repository.getTalas();
      expect(publicTalas.length).toBe(7);

      const publicIds = publicTalas.map((t) => t.id);
      expect(publicIds).toEqual(
        expect.arrayContaining([
          "tala-dadra",
          "tala-keherwa",
          "tala-teental",
          "tala-jhaptal",
          "tala-deepchandi",
          "tala-lawani",
          "tala-khemta",
        ])
      );
      expect(publicIds).not.toContain("tala-roopak");
      expect(repository.getTalaById("tala-roopak")).toBeUndefined();
    });

    it("enforces vibhag and bol length consistency across all public talas", () => {
      repository.getTalas().forEach((tala) => {
        const sumVibhags = tala.vibhagStructure.reduce((a, b) => a + b, 0);
        expect(sumVibhags).toBe(tala.matras);
        expect(tala.bols.length).toBe(tala.matras);
        expect(tala.vibhagCount).toBe(tala.vibhagStructure.length);
        expect(tala.sourceReference.sourceId).toBe("SRC-EPD-TB-G10");
      });
    });
  });

  describe("Acoustics & Sound Terminology (Grade 10 Nada Properties)", () => {
    it("verifies les-intro-01 is assigned to Grade 10-11 and cites SRC-G10-NADA pages 2-12", () => {
      const introLesson = repository.getLessons().find((l) => l.id === "les-intro-01");
      expect(introLesson).toBeDefined();
      expect(introLesson?.gradeBands).toContain("10-11");
      expect(introLesson?.title_si).toContain("ත්‍රිවිධ ගුණ");
      expect(introLesson?.learningGoal_si).toContain("මෙම පාඩම අවසානයේ ඔබට");
      expect(introLesson?.learningGoal_si).toContain("තාරතාවය");
      expect(introLesson?.learningGoal_si).toContain("විපුලතාවය");
      expect(introLesson?.learningGoal_si).toContain("ධ්වනි ගුණය");
      expect(introLesson?.sourceReference.sourceId).toBe("SRC-G10-NADA");
      expect(introLesson?.sourceReference.pageOrSection).toContain("පිටු 2-12");
    });

    it("verifies glossary acoustics terms cite SRC-G10-NADA with accurate terminology", () => {
      const nadaTerms = [
        "term-nada",
        "term-sound",
        "term-ahata-nada",
        "term-anahata-nada",
        "term-pitch",
        "term-intensity",
        "term-timbre",
        "term-frequency",
      ];

      nadaTerms.forEach((id) => {
        const term = glossaryData.find((g) => g.id === id);
        expect(term).toBeDefined();
        expect(term?.sourceReference.sourceId).toBe("SRC-G10-NADA");
      });
    });
  });

  describe("Web Audio Synthesis Engine", () => {
    it("calculates exact semitone frequencies from standard middle C (261.63Hz)", () => {
      const rootC = 261.63;
      expect(getSwaraFrequency("S", rootC)).toBeCloseTo(261.63, 1);
      expect(getSwaraFrequency("P", rootC)).toBeCloseTo(261.63 * Math.pow(2, 7 / 12), 1);
      expect(getSwaraFrequency("S'", rootC)).toBeCloseTo(523.26, 1);
      expect(getSwaraFrequency("r", rootC)).toBeCloseTo(261.63 * Math.pow(2, 1 / 12), 1);
      expect(getSwaraFrequency("R", rootC)).toBeCloseTo(261.63 * Math.pow(2, 2 / 12), 1);
      expect(getSwaraFrequency("m", rootC)).toBeCloseTo(261.63 * Math.pow(2, 6 / 12), 1);
    });

    it("safely handles all standard and rest bols in tabla synth", () => {
      const testBols = ["ධා", "ධින්", "ධී", "ගේ", "ගෙ", "නා", "තින්", "තී", "තෙ", "කේ", "තූ", "ධන්න", "තන්න", "-", " "];
      testBols.forEach((bol) => {
        expect(() => tablaSynth.playBol(bol)).not.toThrow();
      });
    });
  });
});
