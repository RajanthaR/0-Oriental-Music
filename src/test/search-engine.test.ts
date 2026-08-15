import { describe, it, expect } from "vitest";
import { searchIndex, normalizeSinhalaText } from "@/lib/search/search-engine";

describe("Search Engine & Sinhala Normalizer Suite", () => {
  it("should normalize Sinhala characters and diacritics", () => {
    expect(normalizeSinhalaText("ශඩ්ජ")).toBe("සඩ්ජ");
    expect(normalizeSinhalaText("ලක්ෂණ")).toBe("ලක්සන");
  });

  it("should not discover quarantined Bhairav claims", () => {
    const results = searchIndex.search("bhairav");
    expect(results.some((result) => result.id === "raga-bhairav" || result.id === "les-raga-bhairav")).toBe(false);
  });

  it("should not discover quarantined Dadra claims", () => {
    const results = searchIndex.search("dadra");
    expect(results.some((result) => result.id === "tala-dadra" || result.id === "les-tala-dadra")).toBe(false);
  });

  it("should not discover additional quarantined terms (bilawal, roopak, lawani)", () => {
    expect(searchIndex.search("bilawal").some((result) => result.id === "raga-bilawal")).toBe(false);
    expect(searchIndex.search("roopak").some((result) => result.id === "tala-roopak")).toBe(false);
    expect(searchIndex.search("lawani").some((result) => result.id === "tala-lawani")).toBe(false);
  });

  it("should keep search results inside the publication boundary", () => {
    const results = searchIndex.search("ස්වර");
    expect(results.every((result) => !["les-intro-01", "les-exam-skills", "raga-bhairav", "tala-roopak"].includes(result.id))).toBe(true);
  });
});
