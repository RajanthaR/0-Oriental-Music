import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import runtimeSources from "@/data/sources.json";
import manifest from "../../data/source-manifest.json";
import sourceDocuments from "../../data/source-documents.json";
import {
  SELECTED_PHASE_2_SOURCE_IDS,
  validateSelectedSourceMetadata,
} from "@/lib/validation/content-validator";

const humanCatalog = readFileSync(resolve(process.cwd(), "SOURCES.md"), "utf8");

describe("selected Phase 2 source metadata", () => {
  it("keeps runtime, manifest, extracted-document, and human identities consistent", () => {
    const result = validateSelectedSourceMetadata(
      runtimeSources,
      manifest.sources,
      sourceDocuments,
      humanCatalog
    );
    expect(result).toEqual({ isValid: true, issues: [] });
  });

  it.each(["publisher", "year", "location", "license", "tier", "url", "topics"])(
    "rejects a fabricated %s claim",
    (field) => {
      const mutated = structuredClone(runtimeSources) as Array<Record<string, unknown>>;
      const selected = mutated.find((entry) => entry.id === SELECTED_PHASE_2_SOURCE_IDS[0]);
      expect(selected).toBeDefined();
      if (!selected) return;
      selected[field] = field === "topics" ? ["භෛරව්"] : "fabricated";
      const result = validateSelectedSourceMetadata(
        mutated,
        manifest.sources,
        sourceDocuments,
        humanCatalog
      );
      expect(result.isValid).toBe(false);
      expect(result.issues.some((issue) => issue.field === field)).toBe(true);
    }
  );

  it("rejects unsupported human-row topics and stale verified metadata", () => {
    const mutatedHumanCatalog = humanCatalog.replace(
      "සංගීතයේ මූලිකාංග සහ තාල; උපුටාගත් පිටු 1–7ට පමණක් සීමා වේ",
      "භෛරව්; Canonical School Source; 2019"
    );
    const result = validateSelectedSourceMetadata(
      runtimeSources,
      manifest.sources,
      sourceDocuments,
      mutatedHumanCatalog
    );
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "SOURCES.md")).toBe(true);
  });
});
