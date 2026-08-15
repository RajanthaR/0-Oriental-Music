import { describe, it, expect } from "vitest";
import { repository } from "@/lib/data/repository";
import { getSwaraFrequency, SWARA_SEMITONES } from "@/lib/audio/synth";
import { classifyTablaBol, tablaSynth } from "@/lib/audio/tabla";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import lessonsData from "@/data/lessons.json";
import glossaryData from "@/data/glossary.json";
import quizzesData from "@/data/quizzes.json";
import terminologyData from "../../data/terminology-si.json";
import instrumentsData from "@/data/instruments.json";
import culturalTraditionsData from "@/data/cultural-traditions.json";
import theatreTraditionsData from "@/data/theatre-traditions.json";
import learningPathsData from "@/data/learning-paths.json";
import examPapersData from "@/data/exam-papers.json";

const expectedRagas = {
  "raga-bilawal": { arohana: ["S", "R", "G", "M", "P", "D", "N", "S'"], avarohana: ["S'", "N", "D", "P", "M", "G", "R", "S"], vadi: "ධෛවත (ධ)", samvadi: "ගාන්ධාර (ග)", time: "දිවා ප්‍රථම ප්‍රහරය" },
  "raga-bhupali": { arohana: ["S", "R", "G", "P", "D", "S'"], avarohana: ["S'", "D", "P", "G", "R", "S"], vadi: "ගාන්ධාර (ග)", samvadi: "ධෛවත (ධ)", time: "රාත්‍රී ප්‍රථම ප්‍රහරය" },
  "raga-kafi": { arohana: ["S", "R", "g", "M", "P", "D", "n", "S'"], avarohana: ["S'", "n", "D", "P", "M", "g", "R", "S"], vadi: "පංචම (ප)", samvadi: "ෂඩ්ජ (ස)", time: "රාත්‍රී දෙවන ප්‍රහරය" },
  "raga-khamaj": { arohana: ["S", "G", "M", "P", "D", "N", "S'"], avarohana: ["S'", "n", "D", "P", "M", "G", "R", "S"], vadi: "ගාන්ධාර (ග)", samvadi: "නිෂාද (නි)", time: "රාත්‍රී දෙවන ප්‍රහරය" },
  "raga-bhimpalasi": { arohana: [".n", "S", "g", "M", "P", "n", "S'"], avarohana: ["S'", "n", "D", "P", "M", "g", "R", "S"], vadi: "මධ්‍යම (ම)", samvadi: "ෂඩ්ජ (ස)", time: "රාත්‍රී තෙවන ප්‍රහරය" },
  "raga-yaman": { arohana: ["S", "R", "G", "m", "P", "D", "N", "S'"], avarohana: ["S'", "N", "D", "P", "m", "G", "R", "S"], vadi: "ගාන්ධාර (ග)", samvadi: "නිෂාද (නි)", time: "රාත්‍රී ප්‍රථම ප්‍රහරය" },
  "raga-bhairavi": { arohana: ["S", "r", "g", "M", "P", "d", "n", "S'"], avarohana: ["S'", "n", "d", "P", "M", "g", "r", "S"], vadi: "මධ්‍යම (ම)", samvadi: "ෂඩ්ජ (ස)", time: "දිවා ප්‍රථම ප්‍රහරය" },
} as const;

const expectedTalas = {
  "tala-dadra": { matras: 6, vibhags: [3, 3], bols: ["ධා", "ධී", "නා", "ධා", "තී", "නා"], marks: [[1, "X"], [4, "0"]] },
  "tala-keherwa": { matras: 8, vibhags: [4, 4], bols: ["ධා", "ගේ", "න", "ත", "න", "ක", "ධ", "න"], marks: [[1, "X"], [5, "0"]] },
  "tala-teental": { matras: 16, vibhags: [4, 4, 4, 4], bols: ["ධා", "ධින්", "ධින්", "ධා", "ධා", "ධින්", "ධින්", "ධා", "ධා", "තින්", "තින්", "තා", "තා", "ධින්", "ධින්", "ධා"], marks: [[1, "X"], [5, "T"], [9, "0"], [13, "T"]] },
  "tala-jhaptal": { matras: 10, vibhags: [2, 3, 2, 3], bols: ["ධී", "නා", "ධී", "ධී", "නා", "තී", "නා", "ධී", "ධී", "නා"], marks: [[1, "X"], [3, "T"], [6, "0"], [8, "T"]] },
  "tala-deepchandi": { matras: 14, vibhags: [3, 4, 3, 4], bols: ["ධා", "ධින්", "-", "ධා", "ධා", "ධින්", "-", "තා", "තින්", "-", "ධා", "ධා", "ධින්", "-"], marks: [[1, "X"], [4, "T"], [8, "0"], [11, "T"]] },
  "tala-lawani": { matras: 8, vibhags: [2, 2, 2, 2], bols: ["ධා", "ගේ", "න", "ත", "න", "ක", "ධ", "න"], marks: [[1, "X"], [3, "T"], [5, "0"], [7, "T"]] },
  "tala-khemta": { matras: 4, vibhags: [2, 2], bols: ["ධන්න", "ධනක", "තන්න", "ධනක"], marks: [[1, "X"], [3, "0"]] },
} as const;

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

    it("locks every public raga to the source-established Grade 11 fields", () => {
      expect(repository.getRagas().map((raga) => raga.id).sort()).toEqual(Object.keys(expectedRagas).sort());
      repository.getRagas().forEach((raga) => {
        const expected = expectedRagas[raga.id as keyof typeof expectedRagas];
        expect(raga.arohana_swaras).toEqual(expected.arohana);
        expect(raga.avarohana_swaras).toEqual(expected.avarohana);
        expect(raga.vadi_si).toBe(expected.vadi);
        expect(raga.samvadi_si).toBe(expected.samvadi);
        expect(raga.time_si).toBe(expected.time);
        expect(raga.gradeBands).toEqual(["10-11"]);
        expect(raga.rasa_si).toBe("නොදනී / සනාථ වී නැත");
        expect(raga.samplePhrases).toHaveLength(1);
        expect(raga.sourceReference).toEqual({
          sourceId: "SRC-G11-RAGA-ID",
          pageOrSection: "sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2",
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

    it("locks every public tala to exact Grade 10 structures and bol cells", () => {
      expect(repository.getTalas().map((tala) => tala.id).sort()).toEqual(Object.keys(expectedTalas).sort());
      repository.getTalas().forEach((tala) => {
        const expected = expectedTalas[tala.id as keyof typeof expectedTalas];
        const marks = tala.bols
          .filter((bol) => bol.isSam || bol.isTali || bol.isKhali)
          .map((bol) => [bol.matra, bol.isSam ? "X" : bol.isKhali ? "0" : "T"]);
        expect(tala.matras).toBe(expected.matras);
        expect(tala.vibhagStructure).toEqual(expected.vibhags);
        expect(tala.bols.map((bol) => bol.bol_si)).toEqual(expected.bols);
        expect(marks).toEqual(expected.marks);
        expect(tala.gradeBands).toEqual(["10-11"]);
        expect(tala.sourceReference.sourceId).toBe("SRC-EPD-TB-G10");
        expect(tala.sourceReference.pageOrSection).not.toContain("s11tim173.pdf");
        expect(tala.practiceTempoBpm.thah_bpm).toBeGreaterThan(0);
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

    it("publishes only the five acoustics terms established by SRC-G10-NADA", () => {
      const supportedTerms = [
        "term-nada",
        "term-pitch",
        "term-intensity",
        "term-timbre",
        "term-frequency",
      ];
      const publicIds = repository.getGlossary().map((term) => term.id);

      expect(publicIds).toEqual(expect.arrayContaining(supportedTerms));
      expect(publicIds).not.toEqual(
        expect.arrayContaining(["term-sound", "term-ahata-nada", "term-anahata-nada"])
      );

      supportedTerms.forEach((id) => {
        const term = glossaryData.find((g) => g.id === id);
        expect(term).toBeDefined();
        expect(term?.sourceReference.sourceId).toBe("SRC-G10-NADA");
      });
    });

    it("keeps unsupported ahata/anahata claims out of the public lesson", () => {
      const introLesson = repository.getLessonById("les-intro-01");
      const serializedLesson = JSON.stringify(introLesson);

      expect(serializedLesson).not.toContain("ආහත");
      expect(serializedLesson).not.toContain("අනාහත");
    });

    it("aligns public acoustics and Dadra quizzes with their remediated source evidence", () => {
      const acousticsQuiz = repository.getQuizById("quiz-les-intro-01");
      const dadraQuiz = repository.getQuizById("quiz-les-tala-dadra");

      expect(acousticsQuiz).toBeDefined();
      expect(dadraQuiz).toBeDefined();

      acousticsQuiz?.questions.forEach((question) => {
        expect(question.gradeBands).toEqual(["10-11"]);
        expect(question.sourceReference.sourceId).toBe("SRC-G10-NADA");
        expect(question.sourceReference.sourceId).not.toBe("SRC-NIE-G06-TG");
      });
      expect(JSON.stringify(acousticsQuiz)).not.toMatch(/ආහත|අනාහත/);

      dadraQuiz?.questions.forEach((question) => {
        expect(question.sourceReference.sourceId).toBe("SRC-EPD-TB-G10");
        expect(question.sourceReference.pageOrSection).toContain("පිටුව 6");
        expect(question.sourceReference.sourceId).not.toBe("SRC-NIE-G07-TG");
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

    it("classifies representative tabla bols into observable synthesis paths", () => {
      expect(classifyTablaBol("ධා")).toBe("combined");
      expect(classifyTablaBol("ධින්")).toBe("combined");
      expect(classifyTablaBol("ධනක")).toBe("combined");
      expect(classifyTablaBol("ගේ")).toBe("bass");
      expect(classifyTablaBol("නා")).toBe("open");
      expect(classifyTablaBol("තින්")).toBe("closed");
      expect(classifyTablaBol("-")).toBe("rest");
    });
  });

  describe("Review Metadata & Provenance Safety Invariants", () => {
    it("strictly maintains explicit unverified metadata across all raw datasets", () => {
      const allRawRecords = [
        ...ragasData,
        ...talasData,
        ...lessonsData,
        ...instrumentsData,
        ...culturalTraditionsData,
        ...theatreTraditionsData,
        ...learningPathsData,
        ...examPapersData,
      ];

      allRawRecords.forEach((record) => {
        if ("published" in record && record.published !== undefined) {
          expect(record.published).toBe(false);
        }
        expect(record.reviewMetadata.status).toBe("Needs Revision");
        expect(record.reviewMetadata.reviewer).toBe("නොදනී / සනාථ වී නැත");
        expect(record.reviewMetadata.reviewDate).toBe("නොදනී / සනාථ වී නැත");
        expect(record.reviewMetadata.lastVerifiedDate).toBe("නොදනී / සනාථ වී නැත");
        expect(record.reviewMetadata.license).toBe("නොදනී / සනාථ වී නැත");
        expect(record.reviewMetadata.reuseStatus).toBe("Unknown / Unverified");
      });
    });

    it("does not represent the terminology catalog as an SME publication event", () => {
      terminologyData.forEach((term) => {
        expect(term.confidence).toBe("Unverified");
        expect(term.reviewStatus).toBe("Needs Review");
      });
    });

    it("verifies bounded quarantine status for out-of-scope entities (Bhairav & Roopak)", () => {
      const bhairav = ragasData.find((r) => r.id === "raga-bhairav");
      expect(bhairav).toBeDefined();
      expect(repository.getRagaById("raga-bhairav")).toBeUndefined();

      const roopak = talasData.find((t) => t.id === "tala-roopak");
      expect(roopak).toBeDefined();
      expect(repository.getTalaById("tala-roopak")).toBeUndefined();
    });
  });
});
