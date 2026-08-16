import { describe, it, expect } from "vitest";
import { searchFilter, searchIndex, normalizeSinhalaText } from "@/lib/search/search-engine";
import { repository } from "@/lib/data/repository";

describe("Search Engine & Sinhala Normalizer Suite", () => {
  it("should normalize Sinhala characters, diacritics, and rakaransaya variations", () => {
    expect(normalizeSinhalaText("ශඩ්ජ")).toBe("සඩ්ජ");
    expect(normalizeSinhalaText("ලක්ෂණ")).toBe("ලක්සන");
    expect(normalizeSinhalaText("දාද්‍රා")).toBe("දාදරා");
    expect(normalizeSinhalaText("නා\u200Eදය")).toBe(normalizeSinhalaText("නාදය"));
    expect(normalizeSinhalaText("නා\u202Eදය")).toBe(normalizeSinhalaText("නාදය"));
    expect(normalizeSinhalaText("නා\u2066දය")).toBe(normalizeSinhalaText("නාදය"));
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

  it("should discover Bilawal while keeping Khemta in whole-entity quarantine", () => {
    const dadraResults = searchIndex.search("dadra");
    expect(dadraResults.some((result) => result.id === "tala-dadra" || result.id === "les-tala-dadra")).toBe(false);

    const bilawalResults = searchIndex.search("bilawal");
    expect(bilawalResults.some((result) => result.id === "raga-bilawal")).toBe(true);

    const lawaniResults = searchIndex.search("lawani");
    expect(lawaniResults.some((result) => result.id === "tala-lawani")).toBe(false);

    const khemtaResults = searchIndex.search("khemta");
    expect(khemtaResults.some((result) => result.id === "tala-khemta")).toBe(false);
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

  it("keeps featured results for raw empty input but rejects normalized-empty controls", () => {
    const fixture = [
      { id: "featured", title_si: "ස්වර පාඩම" },
    ];
    expect(searchFilter(fixture, "   ", (item) => [item.title_si])).toEqual(fixture);
    expect(searchFilter(fixture, "\u200B\u200E\u202E\u2066\uFEFF", (item) => [item.title_si])).toEqual([]);
    expect(searchFilter(fixture, "\u200B\u200Eස්වර", (item) => [item.title_si])).toEqual(fixture);
    expect(searchIndex.search("\u200B\u200E\u202E\u2066\uFEFF")).toEqual([]);
  });

  it("treats only string whitespace as featured input and rejects hostile non-string queries", () => {
    const fixture = [
      { id: "featured", title_si: "ස්වර පාඩම" },
    ];
    const featured = searchIndex.search("");
    expect(searchIndex.search()).toEqual(featured);
    expect(searchIndex.search(" \t\n")).toEqual(featured);
    expect(searchFilter(fixture, undefined, (item) => [item.title_si])).toEqual(fixture);
    expect(searchFilter(fixture, " \t\n", (item) => [item.title_si])).toEqual(fixture);

    const hostileQueries: unknown[] = [null, 42, {}, [], Symbol("query")];
    hostileQueries.forEach((query) => {
      expect(() => searchFilter(fixture, query, (item) => [item.title_si])).not.toThrow();
      expect(searchFilter(fixture, query, (item) => [item.title_si])).toEqual([]);
      expect(() => searchIndex.search(query)).not.toThrow();
      expect(searchIndex.search(query)).toEqual([]);
    });
  });

  it("applies the same hostile-query classification at every repository search getter", () => {
    const throwingQuery = new Proxy({}, {
      get() {
        throw new Error("query access must not occur");
      },
    });
    const hostile: unknown[] = [null, 42, {}, [], Symbol("query"), throwingQuery];
    const getters: Array<(query: unknown) => unknown[]> = [
      (query) => repository.getLessons({ query: query as string }),
      (query) => repository.getRagas(query as string),
      (query) => repository.getTalas(query as string),
      (query) => repository.getInstruments(query as string),
      (query) => repository.getCulturalTraditions(query as string),
      (query) => repository.getTheatreTraditions(query as string),
      (query) => repository.getGlossary(query as string),
    ];
    getters.forEach((getter) => hostile.forEach((query) => {
      expect(() => getter(query)).not.toThrow();
      expect(getter(query)).toEqual([]);
    }));

    const filters = new Proxy({}, {
      get() {
        throw new Error("hostile filters");
      },
    });
    expect(() => repository.getLessons(filters as { query?: string })).not.toThrow();
    expect(repository.getLessons(filters as { query?: string })).toEqual([]);
  });

  it("rejects nonblank strings that normalize to no searchable characters", () => {
    const fixture = [{ id: "featured", title_si: "ස්වර පාඩම" }];
    const controlsAndWhitespace = " \u200B\u200E\u202E\u2066\uFEFF ";
    expect(searchFilter(fixture, controlsAndWhitespace, (item) => [item.title_si])).toEqual([]);
    expect(searchIndex.search(controlsAndWhitespace)).toEqual([]);
  });

  it("should keep search results inside the publication boundary", () => {
    const results = searchIndex.search("ස්වර");
    expect(results.every((result) => !["les-exam-skills", "raga-bhairav", "tala-roopak"].includes(result.id))).toBe(true);
  });
});
