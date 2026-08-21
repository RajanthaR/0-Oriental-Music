import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SourcesCatalogPage from "@/app/sources/page";
import { repository } from "@/lib/data/repository";
import sourceDocumentsData from "../../data/source-documents.json";
import sourcePageQualityData from "../../data/source-page-quality.json";

type RawRecord = Record<string, unknown>;

const sourceDocuments = sourceDocumentsData as unknown as RawRecord[];
const sourcePageQuality = sourcePageQualityData as unknown as RawRecord[];

function restoreCatalog(target: RawRecord[], snapshot: RawRecord[]): void {
  target.splice(0, target.length, ...structuredClone(snapshot));
}

const UNAVAILABLE_HEADING = "මූලාශ්‍ර ගණන් ලබා ගත නොහැක";

afterEach(() => {
  // Each case restores its own mutation, but a failed assertion must not leak a
  // corrupted corpus into the next test.
  expect(sourceDocuments.length).toBeGreaterThan(0);
});

describe("Sources transparency inventory rendering", () => {
  it("renders the extracted-corpus counts while the corpus is certifiable", () => {
    const view = render(<SourcesCatalogPage />);

    expect(screen.queryByText(UNAVAILABLE_HEADING)).not.toBeInTheDocument();
    expect(screen.getByText("උපුටාගත් ලේඛන")).toBeInTheDocument();
    expect(screen.getByText("පිටු")).toBeInTheDocument();
    expect(screen.getByText(String(sourceDocuments.length))).toBeInTheDocument();
    view.unmount();
  });

  it.each([
    [
      "a malformed source-document page count",
      () => { sourceDocuments[0].pageCount = "17"; },
    ],
    [
      "an unreadable page-quality confidence",
      () => { sourcePageQuality[0].confidence = "E"; },
    ],
  ])("renders an honest unavailable state for %s", (_label, corrupt) => {
    const documentSnapshot = structuredClone(sourceDocuments);
    const pageSnapshot = structuredClone(sourcePageQuality);
    try {
      corrupt();
      const view = render(<SourcesCatalogPage />);

      // The page must state that counts are withheld rather than render numbers
      // derived from an evaluation context that can no longer certify them.
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(UNAVAILABLE_HEADING);
      expect(screen.queryByText("උපුටාගත් ලේඛන")).not.toBeInTheDocument();
      expect(screen.queryByText("පිටු")).not.toBeInTheDocument();
      expect(screen.queryByText("පොදු වාර්තා")).not.toBeInTheDocument();
      // The transparency directory itself stays readable.
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("මූලාශ්‍ර නාමාවලිය");
      view.unmount();
    } finally {
      restoreCatalog(sourceDocuments, documentSnapshot);
      restoreCatalog(sourcePageQuality, pageSnapshot);
    }
  });
});

describe("Sources empty-catalog state", () => {
  it("renders the pinned Sinhala unavailable copy when no sources are public", () => {
    const mutableRepository = repository as unknown as { sources: unknown[] };
    const original = [...mutableRepository.sources];
    mutableRepository.sources = [];
    try {
      const view = render(<SourcesCatalogPage />);

      // The empty state is pinned verbatim so copy regressions (including
      // foreign-script leakage like a stray non-Sinhala word) fail loudly.
      expect(screen.getByRole("status")).toHaveTextContent("මූලාශ්‍ර තොරතුරු දැනට ලබා ගත නොහැක.");
      expect(screen.getByRole("status")).toHaveTextContent("මූලාශ්‍ර ලේඛන සනාථ කළ නොහැකි බැවින් ලැයිස්තුව තාවකාලිකව වසා ඇත.");
      // No source rows render alongside the empty state.
      expect(screen.queryByText("සාක්ෂි තත්ත්වය:")).not.toBeInTheDocument();
      view.unmount();
    } finally {
      mutableRepository.sources.splice(0, mutableRepository.sources.length, ...original);
    }
  });
});
