import { describe, it, expect } from "vitest";
import { searchIndex, normalizeSinhalaText } from "@/lib/search/search-engine";

describe("Search Engine & Sinhala Normalizer Suite", () => {
  it("should normalize Sinhala characters and diacritics", () => {
    expect(normalizeSinhalaText("ශඩ්ජ")).toBe("සඩ්ජ");
    expect(normalizeSinhalaText("ලක්ෂණ")).toBe("ලක්සන");
  });

  it("should find Ragas by Sinhala name", () => {
    const results = searchIndex.search("භෛරව");
    expect(results.length).toBeGreaterThan(0);
    const bhairavMatch = results.find((r) => r.title_si.includes("භෛරව"));
    expect(bhairavMatch).toBeDefined();
  });

  it("should find Talas by transliterated English queries", () => {
    const results = searchIndex.search("dadra");
    expect(results.length).toBeGreaterThan(0);
    const dadraMatch = results.find((r) => r.title_si.includes("දාද්‍රා"));
    expect(dadraMatch).toBeDefined();
  });

  it("should find lessons by topic keyword", () => {
    const results = searchIndex.search("ස්වර");
    expect(results.length).toBeGreaterThan(0);
  });
});
