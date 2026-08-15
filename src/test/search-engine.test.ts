import { describe, it, expect } from "vitest";
import { searchIndex, normalizeSinhalaText } from "@/lib/search/search-engine";

describe("Search Engine & Sinhala Normalizer Suite", () => {
  it("should normalize Sinhala characters and diacritics", () => {
    expect(normalizeSinhalaText("ශඩ්ජ")).toBe("සඩ්ජ");
    expect(normalizeSinhalaText("ලක්ෂණ")).toBe("ලක්සන");
  });

  it("should not discover quarantined Bhairav or Roopak claims", () => {
    const bhairavResults = searchIndex.search("bhairav");
    expect(bhairavResults.some((result) => result.id === "raga-bhairav" || result.id === "les-raga-bhairav")).toBe(false);

    const roopakResults = searchIndex.search("roopak");
    expect(roopakResults.some((result) => result.id === "tala-roopak")).toBe(false);
  });

  it("should discover remediated Dadra, Bilawal, and Lawani entities", () => {
    const dadraResults = searchIndex.search("dadra");
    expect(dadraResults.some((result) => result.id === "tala-dadra")).toBe(true);
    expect(dadraResults.some((result) => result.id === "les-tala-dadra")).toBe(true);

    const bilawalResults = searchIndex.search("bilawal");
    expect(bilawalResults.some((result) => result.id === "raga-bilawal")).toBe(true);

    const lawaniResults = searchIndex.search("lawani");
    expect(lawaniResults.some((result) => result.id === "tala-lawani")).toBe(true);
  });

  it("should keep search results inside the publication boundary", () => {
    const results = searchIndex.search("ස්වර");
    expect(results.every((result) => !["les-exam-skills", "raga-bhairav", "tala-roopak"].includes(result.id))).toBe(true);
  });
});
