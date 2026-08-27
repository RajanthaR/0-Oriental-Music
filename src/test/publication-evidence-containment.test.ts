import { describe, expect, it } from "vitest";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import sourcesData from "@/data/sources.json";
import musicalCoreFieldDispositions from "../../data/musical-core-field-dispositions.json";
import { repository } from "@/lib/data/repository";
import {
  createPublicationEvaluationContext,
  evaluateSourceReference,
  formatPublicSourceReference,
  getContextClaimPublicationDecision,
  getRecordPublicationDecision,
  getSourceDocumentSummary,
  getTalaFieldDisposition,
} from "@/lib/data/publication-policy";
import { validateMusicalCoreFieldDispositions } from "@/lib/validation/content-validator";

describe("source evidence and Tala disposition containment", () => {
  it("fails every evidence helper closed for unsafe or forged evaluation contexts", () => {
    const reference = ragasData[0].sourceReference;
    const unsafe = createPublicationEvaluationContext({ lessons: undefined });
    expect(evaluateSourceReference(reference, unsafe)).toMatchObject({
      supportable: false,
      reasonCode: "unsafe-evaluation-context",
    });
    expect(getContextClaimPublicationDecision(talasData[0], unsafe)).toMatchObject({
      isPublic: false,
      reasonCode: "unsafe-evaluation-context",
    });
    expect(getSourceDocumentSummary(reference.sourceId, unsafe)).toMatchObject({
      pageCount: 0,
      evidenceQuality: "missing",
    });

    const valid = createPublicationEvaluationContext();
    const forged = Object.freeze({ safe: true, catalogs: valid.catalogs }) as never;
    expect(() => getSourceDocumentSummary(reference.sourceId, forged)).not.toThrow();
    expect(getSourceDocumentSummary(reference.sourceId, forged)).toMatchObject({
      pageCount: 0,
      evidenceQuality: "missing",
    });
  });

  it("snapshots source references before evidence fields are read", () => {
    const canonical = ragasData[0].sourceReference;
    let getterReads = 0;
    const stateful = new Proxy(structuredClone(canonical) as Record<string, unknown>, {
      get(target, property, receiver) {
        getterReads += 1;
        if (property === "sourceId") return "SRC-COUNTERFEIT";
        return Reflect.get(target, property, receiver);
      },
    });
    expect(evaluateSourceReference(stateful as unknown as typeof canonical))
      .toMatchObject({ supportable: true, reasonCode: "supportable" });
    expect(getterReads).toBe(0);
  });

  it("quarantines dependent claims when a source ID becomes ambiguous", () => {
    const sourceCatalog = sourcesData as unknown as Array<Record<string, unknown>>;
    const originalLength = sourceCatalog.length;
    try {
      const bilawal = ragasData.find((raga) => raga.id === "raga-bilawal");
      expect(bilawal).toBeDefined();
      if (!bilawal) return;
      const sourceId = bilawal.sourceReference.sourceId;
      const source = sourceCatalog.find((candidate) => candidate.id === sourceId);
      expect(source).toBeDefined();
      if (!source) return;
      const duplicate = structuredClone(source);
      sourceCatalog.push(duplicate);
      expect(getRecordPublicationDecision(bilawal)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["ambiguous-source-record"]),
      });
    } finally {
      sourceCatalog.splice(originalLength);
    }
  });

  it("uses the repository source snapshot for both source rows and source summaries", () => {
    const mutableRepository = repository as unknown as { sources: unknown[] };
    const original = mutableRepository.sources;
    const changed = structuredClone(sourcesData) as unknown as Array<Record<string, unknown>>;
    const target = changed[0];
    target.originalFilename = `missing-${String(target.originalFilename)}`;
    try {
      mutableRepository.sources = changed;
      const source = repository.getSourceById(String(target.id));
      const summary = repository.getSourceDocumentSummary(String(target.id));
      expect(source?.evidenceState).toBe(summary.reviewStatus);
      expect(source?.evidenceQuality).toBe(summary.evidenceQuality);
      expect(summary).toMatchObject({
        pageCount: 0,
        evidenceQuality: "missing",
        reviewStatus: "No matching extracted document",
      });
    } finally {
      mutableRepository.sources = original;
    }
  });

  it("withholds Tala dispositions from unsafe registered evaluation contexts", () => {
    const unsafe = createPublicationEvaluationContext({ lessons: undefined });
    expect(unsafe.safe).toBe(false);
    expect(getTalaFieldDisposition("tala-khemta", unsafe)).toBeUndefined();
  });

  it("rejects filename digits, out-of-range pages, and mismatched PDF locators", () => {
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf",
    }).reasonCode).toBe("missing-page-evidence");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 2-999",
    }).reasonCode).toBe("page-out-of-range");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටුව 2; s11tim173.pdf පිටුව 1",
    }).reasonCode).toBe("mismatched-source-document");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "evil-sg10_emus_chap8_nadaya.pdf පිටුව 2",
    }).reasonCode).toBe("mismatched-source-document");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "SG10_EMUS_CHAP8_NADAYA.PDF පිටුව 2",
    }).supportable).toBe(true);

    const excessiveTerms = Array.from({ length: 257 }, () => "2").join(",");
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: `sg10_emus_chap8_nadaya.pdf පිටු ${excessiveTerms}`,
    })).toMatchObject({ supportable: false, reasonCode: "missing-page-evidence" });
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 1-1000,1-1000",
    })).toMatchObject({ supportable: false, reasonCode: "missing-page-evidence" });

    [
      "sg10_emus_chap8_nadaya.pdf wrong.pdf පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf,wrong.pdf, පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf/wrong.pdf/ පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf(wrong.pdf) පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf/(wrong.pdf) පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf\nwrong.pdf පිටුව 2",
    ].forEach((pageOrSection) => {
      expect(evaluateSourceReference({
        sourceId: "SRC-G10-NADA",
        pageOrSection,
      })).toMatchObject({ supportable: false, reasonCode: "mismatched-source-document" });
    });
  });

  it("quarantines Lawani as a whole entity while its required context is unresolved", () => {
    const rawLawani = talasData.find((tala) => tala.id === "tala-lawani");
    expect(rawLawani).toBeDefined();
    expect(getContextClaimPublicationDecision(rawLawani)).toMatchObject({
      present: true,
      isPublic: false,
      reasonCode: "source-document-needs-review",
    });

    expect(repository.getTalaById("tala-lawani")).toBeUndefined();
    expect(getRecordPublicationDecision(rawLawani)).toMatchObject({
      isPublic: false,
      state: "quarantined",
    });

    expect(repository.getTalaById("tala-khemta")).toBeUndefined();
  });

  it("requires every cited page to contain readable A/B Sinhala evidence", () => {
    expect(evaluateSourceReference({
      sourceId: "SRC-G07-VIOLIN",
      pageOrSection: "sg7_emus_chap2.1.2_violin.pdf පිටු 1, 2",
    })).toMatchObject({
      supportable: false,
      reasonCode: "low-quality-page-evidence",
      quality: "mixed",
    });
  });

  it("composes malformed, wrong-grade, and review-required context into parent publication", () => {
    const khemta = talasData.find((tala) => tala.id === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;

    const malformed = structuredClone(khemta) as Record<string, unknown>;
    malformed.context_si = { text: "not learner text" };
    expect(getRecordPublicationDecision(malformed).isPublic).toBe(false);
    expect(getRecordPublicationDecision(malformed).reasonCodes).toContain("unpaired-context-claim");

    const wrongGrade = structuredClone(khemta) as Record<string, unknown>;
    wrongGrade.context_si = "සන්දර්භය";
    wrongGrade.contextSourceReference = {
      sourceId: "SRC-G07-VIOLIN",
      pageOrSection: "sg7_emus_chap2.1.2_violin.pdf පිටුව 1",
    };
    expect(getRecordPublicationDecision(wrongGrade).isPublic).toBe(false);
    expect(getRecordPublicationDecision(wrongGrade).reasonCodes).toContain("source-grade-mismatch");

    const referenceOnly = structuredClone(khemta) as Record<string, unknown>;
    delete referenceOnly.context_si;
    expect(getRecordPublicationDecision(referenceOnly).reasonCodes).toContain("unpaired-context-claim");
  });

  it("requires every tala disposition row and quarantines any incomplete playable evidence", () => {
    const registry = musicalCoreFieldDispositions.talas;
    expect(registry).toHaveLength(talasData.length);
    talasData.forEach((tala) => {
      const disposition = getTalaFieldDisposition(tala.id);
      expect(disposition).toBeDefined();
      expect(disposition?.context).toBeDefined();
      expect(disposition?.theka).toBeDefined();
      expect(disposition?.bols).toHaveLength(tala.bols.length);
    });
    expect(getTalaFieldDisposition("tala-khemta")?.allRequiredFieldsVerified).toBe(false);
    ["tala-dadra", "tala-keherwa", "tala-teental", "tala-jhaptal", "tala-deepchandi", "tala-lawani", "tala-roopak", "tala-khemta"]
      .forEach((id) => {
        expect(getTalaFieldDisposition(id)?.allRequiredFieldsVerified).toBe(false);
        expect(repository.getTalaById(id)).toBeUndefined();
      });
    expect(repository.getPublicationSummary().talas.public).toBe(0);
    expect(validateMusicalCoreFieldDispositions()).toEqual({ isValid: true, issues: [] });
  });

  it("rejects missing field evidence and registry values that drift from raw audit data", () => {
    const mutated = structuredClone(musicalCoreFieldDispositions) as typeof musicalCoreFieldDispositions;
    const khemta = mutated.talas.find((entry) => entry.talaId === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    delete (khemta.bols[0] as { sourceReference?: unknown }).sourceReference;
    (khemta.bols[1] as { value?: string }).value = "invented";
    const result = validateMusicalCoreFieldDispositions(talasData, mutated);
    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      "bols[0].sourceReference",
      "bols[1].value",
    ]));
  });

  it("returns structured Tala disposition errors for malformed bol rows", () => {
    const malformed = structuredClone(musicalCoreFieldDispositions) as unknown as Record<string, unknown>;
    const entries = malformed.talas as Array<Record<string, unknown>>;
    const khemta = entries.find((entry) => entry.talaId === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    const bols = khemta.bols as unknown[];
    bols[0] = null;
    expect(() => validateMusicalCoreFieldDispositions(talasData, malformed)).not.toThrow();
    const result = validateMusicalCoreFieldDispositions(talasData, malformed);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "bols[0]")).toBe(true);
  });

  it("fails the runtime Tala projection closed when a verified registry value drifts", () => {
    const khemta = musicalCoreFieldDispositions.talas.find((entry) => entry.talaId === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    const firstBol = khemta.bols[0] as { value?: string };
    const originalValue = firstBol.value;
    try {
      firstBol.value = "invented";
      expect(getTalaFieldDisposition("tala-khemta")?.allRequiredFieldsVerified).toBe(false);
      expect(getRecordPublicationDecision(talasData.find((tala) => tala.id === "tala-khemta"))).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["field-disposition-needs-review"]),
      });
    } finally {
      firstBol.value = originalValue;
    }
  });

  it("rejects strict locator confusables, malformed numbers, and unconsumed clauses", () => {
    const locators = [
      "පිටුව 2",
      "අසත්‍ය sg10_emus_chap8_nadaya.pdf පිටුව 2",
      "sg10_emus_chap8_nadaya.pdfx පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2 අසත්‍ය",
      "sg10_emus_chap8_nadaya.wrong\u200Bpdf පිටුව 2",
      "sg10_emus_chap8_nadaya\uFF0Epdf පිටුව 2",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2.5",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2abc",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2; පිටුව -999",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2; page II",
      "sg10_emus_chap8_nadaya.pdf පිටුව 2 trailing page 3",
    ];
    locators.forEach((pageOrSection) => {
      expect(evaluateSourceReference({ sourceId: "SRC-G10-NADA", pageOrSection })).toMatchObject({
        supportable: false,
      });
    });
    expect(evaluateSourceReference({
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටු 2-4",
    }).supportable).toBe(true);
    expect(evaluateSourceReference({
      sourceId: "SRC-EPD-TB-G11",
      pageOrSection: "s11tim173.pdf පිටුව 24 trailing page 99",
    }).reasonCode).toBe("missing-page-evidence");
  });

  it("treats every defined malformed context value as a blocking claim", () => {
    const khemta = talasData.find((tala) => tala.id === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    for (const context_si of [{}, null, ""]) {
      const candidate = structuredClone(khemta) as unknown as Record<string, unknown>;
      candidate.context_si = context_si;
      delete candidate.contextSourceReference;
      expect(getRecordPublicationDecision(candidate)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["unpaired-context-claim"]),
      });
    }
  });

  it("binds verified tala dispositions to the supplied candidate values", () => {
    const khemta = talasData.find((tala) => tala.id === "tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    const changedContext = { ...structuredClone(khemta), context_si: "invented context" };
    const changedTheka = { ...structuredClone(khemta), theka_si: "invented theka" };
    [changedContext, changedTheka].forEach((candidate) => {
      expect(getRecordPublicationDecision(candidate)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["field-disposition-needs-review"]),
      });
    });
  });

  it("formats public citations without leaking repository filenames", () => {
    const bilawal = ragasData.find((raga) => raga.id === "raga-bilawal");
    expect(bilawal).toBeDefined();
    if (!bilawal) return;
    const label = formatPublicSourceReference(bilawal.sourceReference);
    expect(label).toBe("පිටු 1, 2");
    expect(label).not.toMatch(/\.pdf/i);
  });

  it("requires every disposition issue ID to resolve to the forensic ledger", () => {
    const mutated = structuredClone(musicalCoreFieldDispositions) as typeof musicalCoreFieldDispositions;
    mutated.talas[0].context.issueId = "P02-DANGLING-ISSUE";
    const result = validateMusicalCoreFieldDispositions(talasData, mutated);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "context.issueId")).toBe(true);
  });

  it("rejects malformed and duplicate field-disposition registry rows", () => {
    const malformed = structuredClone(musicalCoreFieldDispositions) as unknown as Record<string, unknown>;
    (malformed.talas as unknown[]).push(null);
    (malformed.issueCatalog as unknown[]).push(structuredClone((malformed.issueCatalog as unknown[])[0]));
    const result = validateMusicalCoreFieldDispositions(talasData, malformed);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "talas")).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes("IDs must be unique"))).toBe(true);

    const duplicateRaw = structuredClone(talasData);
    duplicateRaw.push(structuredClone(duplicateRaw[0]));
    const duplicateResult = validateMusicalCoreFieldDispositions(duplicateRaw, musicalCoreFieldDispositions);
    expect(duplicateResult.isValid).toBe(false);
    expect(duplicateResult.issues.some((issue) => issue.field === "talaId" && issue.message.includes("unique"))).toBe(true);
  });
});
