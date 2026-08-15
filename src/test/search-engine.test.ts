import { describe, it, expect } from "vitest";
import { searchFilter, searchIndex, normalizeSinhalaText } from "@/lib/search/search-engine";

describe("Search Engine & Sinhala Normalizer Suite", () => {
  it("should normalize Sinhala characters, diacritics, and rakaransaya variations", () => {
    expect(normalizeSinhalaText("ශඩ්ජ")).toBe("සඩ්ජ");
    expect(normalizeSinhalaText("ලක්ෂණ")).toBe("ලක්සන");
    expect(normalizeSinhalaText("දාද්‍රා")).toBe("දාදරා");
  });

  it("keeps the Dadra retrieval spelling contained when the tala is quarantined", () => {
    const rakaransayaResults = searchIndex.search("දාද්‍රා");
    expect(rakaransayaResults.some((result) => result.id === "tala-dadra")).toBe(false);
  });

  it("should not discover quarantined Bhairav or Roopak claims", () => {
    const bhairavResults = searchIndex.search("bhairav");
    expect(bhairavResults.some((result) => result.id === "raga-bhairav" || result.id === "les-raga-bhairav")).toBe(false);

    const roopakResults = searchIndex.search("roopak");
    expect(roopakResults.some((result) => result.id === "tala-roopak")).toBe(false);
  });

  it("should discover the evidence-supported Khemta and Bilawal entities", () => {
    const dadraResults = searchIndex.search("dadra");
    expect(dadraResults.some((result) => result.id === "tala-dadra" || result.id === "les-tala-dadra")).toBe(false);

    const bilawalResults = searchIndex.search("bilawal");
    expect(bilawalResults.some((result) => result.id === "raga-bilawal")).toBe(true);

    const lawaniResults = searchIndex.search("lawani");
    expect(lawaniResults.some((result) => result.id === "tala-lawani")).toBe(false);

    const khemtaResults = searchIndex.search("khemta");
    expect(khemtaResults.some((result) => result.id === "tala-khemta")).toBe(true);
  });

  it("should discover canonical musical entities and acoustics terms via English transliterations", () => {
    const acousticsNada = searchIndex.search("nada");
    expect(acousticsNada.length).toBeGreaterThan(0);

    const acousticsPitch = searchIndex.search("pitch");
    expect(acousticsPitch.length).toBeGreaterThan(0);

    const kafiResults = searchIndex.search("kafi");
    expect(kafiResults.some((result) => result.id === "raga-kafi")).toBe(true);

    const bhimpalasiResults = searchIndex.search("bhimpalasi");
    expect(bhimpalasiResults.some((result) => result.id === "raga-bhimpalasi")).toBe(true);

    const deepchandiResults = searchIndex.search("deepchandi");
    expect(deepchandiResults.some((result) => result.id === "tala-deepchandi")).toBe(false);
    const gradeElevenSpellingResults = searchIndex.search("දීප්චන්දි");
    expect(gradeElevenSpellingResults.some((result) => result.id === "tala-deepchandi")).toBe(false);

  });

  it("preserves the Grade 11 Deepchandi spelling as retrieval-only behavior", () => {
    const syntheticPublicFixture = [{ id: "tala-deepchandi", name_si: "දීප්චන්ද් තාලය" }];
    const results = searchFilter(
      syntheticPublicFixture,
      "දීප්චන්දි",
      (item) => [item.name_si]
    );
    expect(results).toEqual(syntheticPublicFixture);
    expect(searchIndex.search("දීප්චන්දි").some((result) => result.id === "tala-deepchandi")).toBe(false);
  });

  it("does not throw or expose inherited object properties for hostile lookup keys", () => {
    expect(() => searchIndex.search("__proto__")).not.toThrow();
    expect(() => searchIndex.search("constructor")).not.toThrow();
    expect(searchIndex.search("__proto__")).toEqual([]);
    expect(searchIndex.search("constructor")).toEqual([]);
  });

  it("should keep search results inside the publication boundary", () => {
    const results = searchIndex.search("ස්වර");
    expect(results.every((result) => !["les-exam-skills", "raga-bhairav", "tala-roopak"].includes(result.id))).toBe(true);
  });
});
