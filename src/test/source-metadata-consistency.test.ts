import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import runtimeSources from "@/data/sources.json";
import manifest from "../../data/source-manifest.json";
import sourceDocuments from "../../data/source-documents.json";
import { repository } from "@/lib/data/repository";
import { projectPublicRecord } from "@/lib/validation/content-contracts";
import {
  SELECTED_PHASE_2_SOURCE_IDS,
  validateMusicalCoreFieldDispositions,
  validatePublicCollection,
  validateSelectedSourceMetadata,
} from "@/lib/validation/content-validator";

const humanCatalog = readFileSync(resolve(process.cwd(), "SOURCES.md"), "utf8");

describe("selected Phase 2 source metadata", () => {
  it("validates raw and repository source collections through the transparency boundary", () => {
    expect(validatePublicCollection("Source", runtimeSources)).toEqual({ isValid: true, issues: [] });
    expect(validatePublicCollection("sources", repository.getSources())).toEqual({ isValid: true, issues: [] });
  });

  it("rejects forged fields on an already-sanitized repository source row", () => {
    const sanitized = structuredClone(repository.getSources()[0]) as unknown as Record<string, unknown>;
    sanitized.publisher = "fabricated";
    const result = validatePublicCollection("sources", [sanitized]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "publisher")).toBe(true);
  });

  it("fails closed for hostile source collection containers", () => {
    const hostile = new Proxy([], {
      ownKeys() {
        throw new Error("hostile source collection");
      },
    });
    expect(() => validatePublicCollection("Source", hostile)).not.toThrow();
    expect(validatePublicCollection("Source", hostile)).toMatchObject({ isValid: false });
  });

  it("uses the same unknown provenance representation in direct and repository source projections", () => {
    const repositorySources = repository.getSources();
    for (const rawSource of runtimeSources) {
      const projected = projectPublicRecord(rawSource, "source") as Record<string, unknown>;
      const repositorySource = repositorySources.find((source) => source.id === rawSource.id);
      expect(repositorySource).toBeDefined();
      expect(projected).toMatchObject({
        publisher: repositorySource?.publisher,
        year: repositorySource?.year,
        location: repositorySource?.location,
        license: repositorySource?.license,
        tier: repositorySource?.tier,
        status: repositorySource?.status,
      });
    }
  });

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

  it("rejects ambiguous extracted-document mappings", () => {
    const duplicatedDocuments = structuredClone(sourceDocuments) as Array<Record<string, unknown>>;
    const selected = (runtimeSources as Array<Record<string, unknown>>).find(
      (entry) => entry.id === SELECTED_PHASE_2_SOURCE_IDS[0]
    );
    expect(selected).toBeDefined();
    if (!selected) return;
    const matchingDocument = duplicatedDocuments.find(
      (document) => document.originalFilename === selected.originalFilename
    );
    expect(matchingDocument).toBeDefined();
    if (!matchingDocument) return;
    duplicatedDocuments.push(structuredClone(matchingDocument));
    const result = validateSelectedSourceMetadata(
      runtimeSources,
      manifest.sources,
      duplicatedDocuments,
      humanCatalog
    );
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "originalFilename")).toBe(true);
  });

  it.each([
    ["zero extracted documents", []],
    [
      "a missing selected-source mapping",
      sourceDocuments.filter((document) => document.originalFilename !== "sg10_emus_chap1_mulikanga.pdf"),
    ],
  ])("rejects %s", (_label, documents) => {
    const result = validateSelectedSourceMetadata(
      runtimeSources,
      manifest.sources,
      documents,
      humanCatalog
    );
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) =>
      issue.entityId === SELECTED_PHASE_2_SOURCE_IDS[0] && issue.field === "originalFilename"
    )).toBe(true);
  });

  it.each([
    ["null registry", null],
    ["sparse registry", (() => {
      const sparse: unknown[] = [];
      sparse.length = 1;
      return sparse;
    })()],
    ["malformed disposition row", {
      policy: "whole-entity-quarantine",
      requiredFields: ["context", "structure", "theka", "bols"],
      unclosedRequiredFields: ["structure"],
      issueCatalog: [],
      talas: [null],
    }],
    ["accessor-backed disposition row", (() => {
      const row: Record<string, unknown> = {};
      Object.defineProperty(row, "talaId", {
        configurable: true,
        enumerable: true,
        get() {
          throw new Error("hostile disposition accessor");
        },
      });
      return {
        policy: "whole-entity-quarantine",
        requiredFields: ["context", "structure", "theka", "bols"],
        unclosedRequiredFields: ["structure"],
        issueCatalog: [],
        talas: [row],
      };
    })()],
    ["throwing disposition proxy", new Proxy({}, {
      ownKeys() {
        throw new Error("hostile disposition proxy");
      },
    })],
  ])("returns deterministic issues for %s without throwing", (_label, registry) => {
    const run = () => validateMusicalCoreFieldDispositions([], registry);
    expect(run).not.toThrow();
    const first = run();
    const second = run();
    expect(first.isValid).toBe(false);
    expect(first.issues.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });

  it("returns issues instead of invoking hostile selected-source accessors", () => {
    const hostileRuntime = structuredClone(runtimeSources) as Array<Record<string, unknown>>;
    const index = hostileRuntime.findIndex((entry) => entry.id === SELECTED_PHASE_2_SOURCE_IDS[0]);
    expect(index).toBeGreaterThanOrEqual(0);
    if (index < 0) return;
    hostileRuntime[index] = new Proxy(hostileRuntime[index], {
      ownKeys() {
        throw new Error("hostile source ownKeys");
      },
    });
    expect(() => validateSelectedSourceMetadata(
      hostileRuntime,
      manifest.sources,
      sourceDocuments,
      humanCatalog
    )).not.toThrow();
    expect(validateSelectedSourceMetadata(
      hostileRuntime,
      manifest.sources,
      sourceDocuments,
      humanCatalog
    ).isValid).toBe(false);
  });
});
