import type { Lesson, Raga, Tala, Instrument, CulturalTradition, TheatreTradition, SourceReference } from "@/types/content";
import sourcesData from "@/data/sources.json";
import glossaryData from "@/data/glossary.json";
import learningPathsData from "@/data/learning-paths.json";
import examPapersData from "@/data/exam-papers.json";
import quizzesData from "@/data/quizzes.json";
import terminologyData from "../../../data/terminology-si.json";
import {
  evaluatePublicationBatch,
  createPublicationEvaluationContext,
  getRecordPublicationDecision,
} from "@/lib/data/publication-policy";
import { planTablaBol } from "@/lib/audio/tabla";
import { isSafePracticeBpm } from "@/lib/audio/tempo";
import {
  cloneBoundedRecord,
  isMappedTalaBolToken,
  isRecord,
  isValidSwaraToken,
  readOwnDataField,
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";
import {
  identityKey,
  baselineIssue,
  type PublicationValidationResult,
  type ValidationIssue,
} from "@/lib/validation/validation-issues";
import { validateCatalogIdentityContracts } from "@/lib/validation/identity-contracts";
import forensicLedgerData from "../../../data/forensic-ledger.json";

function localEntityId(value: unknown, index: number): string {
  const id = readOwnDataField(value, "id");
  return typeof id === "string" ? id : String(index);
}

export function validateContent(
  lessons: unknown,
  ragas: unknown,
  talas: unknown,
  instruments: unknown,
  culturalTraditions: unknown,
  theatreTraditions: unknown
): { isValid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const validSourceIds = new Set((sourcesData as unknown[]).flatMap((candidate) =>
    validateContentRecord(candidate, "source").isValid && isRecord(candidate) && typeof candidate.id === "string"
      ? [candidate.id]
      : []
  ));
  const structuralRecords = (type: string, value: unknown): Record<string, unknown>[] => {
    const catalogSnapshot = cloneBoundedRecord(value);
    if (!Array.isArray(catalogSnapshot)) {
      issues.push({ entityType: type, entityId: "catalog", field: "catalog", message: `${type} catalog must be a bounded dense plain-data array`, severity: "error" });
      return [];
    }
    const kindByType: Record<string, ContentEntityKind | undefined> = {
      Lesson: "lesson",
      Raga: "raga",
      Tala: "tala",
      Instrument: "instrument",
      CulturalTradition: "cultural-tradition",
      TheatreTradition: "theatre-tradition",
    };
    return catalogSnapshot.flatMap((candidate, index) => {
      if (!isRecord(candidate)) {
        issues.push({
          entityType: type,
          entityId: String(index),
          field: "record",
          message: `${type} record must be a non-null object`,
          severity: "error",
        });
        return [];
      }
      const safe = cloneBoundedRecord(candidate);
      if (!safe || !isRecord(safe)) {
        issues.push({
          entityType: type,
          entityId: String(index),
          field: "record",
          message: `${type} record must be a safe plain-data object`,
          severity: "error",
        });
        return [];
      }
      const contract = validateContentRecord(safe, kindByType[type]);
      if (!contract.isValid) {
        contract.issues.forEach((issue) => issues.push({
          entityType: type,
          entityId: localEntityId(safe, index),
          field: issue.field,
          message: issue.message,
          severity: "error",
        }));
      }
      return [safe];
    });
  };
  const lessonRecords = structuralRecords("Lesson", lessons) as unknown as Lesson[];
  const ragaRecords = structuralRecords("Raga", ragas) as unknown as Raga[];
  const talaRecords = structuralRecords("Tala", talas) as unknown as Tala[];
  const instrumentRecords = structuralRecords("Instrument", instruments) as unknown as Instrument[];
  const culturalRecords = structuralRecords("CulturalTradition", culturalTraditions) as unknown as CulturalTradition[];
  const theatreRecords = structuralRecords("TheatreTradition", theatreTraditions) as unknown as TheatreTradition[];
  const evaluationContext = createPublicationEvaluationContext({
    lessons: lessonRecords,
    ragas: ragaRecords,
    talas: talaRecords,
    instruments: instrumentRecords,
    culturalTraditions: culturalRecords,
    theatreTraditions: theatreRecords,
  });
  const allEntities = [
    ...lessonRecords.map((item) => ({ type: "Lesson", item })),
    ...ragaRecords.map((item) => ({ type: "Raga", item })),
    ...talaRecords.map((item) => ({ type: "Tala", item })),
    ...instrumentRecords.map((item) => ({ type: "Instrument", item })),
    ...culturalRecords.map((item) => ({ type: "CulturalTradition", item })),
    ...theatreRecords.map((item) => ({ type: "TheatreTradition", item })),
  ];
  const seenIds = new Set<string>();
  allEntities.forEach(({ type, item }) => {
    const id = typeof item.id === "string" ? item.id : "";
    if (!id) {
      issues.push({ entityType: type, entityId: "", field: "id", message: `${type} ID is missing`, severity: "error" });
      return;
    }
    if (seenIds.has(id)) {
      issues.push({
        entityType: type,
        entityId: id,
        field: "id",
        message: `Duplicate canonical content ID '${id}'`,
        severity: "error",
      });
    }
    seenIds.add(id);
  });

  // Validate Lessons
  lessonRecords.forEach((l) => {
    if (typeof l.title_si !== "string" || !l.title_si.trim()) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "title_si",
        message: "Title in Sinhala is missing or empty",
        severity: "error",
      });
    }

    if (typeof l.learningGoal_si !== "string" || !l.learningGoal_si.startsWith("මෙම පාඩම අවසානයේ ඔබට")) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "learningGoal_si",
        message: "Learning goal must start with 'මෙම පාඩම අවසානයේ ඔබට...'",
        severity: "error",
      });
    }

    if (!l.sourceReference || typeof l.sourceReference.sourceId !== "string" || !l.sourceReference.sourceId) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "sourceReference",
        message: "Source reference is missing",
        severity: "error",
      });
    } else if (!validSourceIds.has(l.sourceReference.sourceId)) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "sourceReference.sourceId",
        message: `Referenced sourceId '${l.sourceReference.sourceId}' does not exist in sources.json`,
        severity: "error",
      });
    }

    if (!l.reviewMetadata || typeof l.reviewMetadata.reviewer !== "string" || !l.reviewMetadata.reviewer) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "reviewMetadata.reviewer",
        message: "Reviewer name is required",
        severity: "error",
      });
    }

    if (l.published && (!l.reviewMetadata || typeof l.reviewMetadata !== "object" || l.reviewMetadata.status !== "Published")) {
      issues.push({
        entityType: "Lesson",
        entityId: l.id,
        field: "reviewMetadata.status",
        message: "Published lesson must have 'Published' status in reviewMetadata",
        severity: "error",
      });
    }
  });

  // Validate Ragas
  ragaRecords.forEach((r) => {
    if (!Array.isArray(r.arohana_swaras) || r.arohana_swaras.length === 0) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "arohana_swaras",
        message: "Raga must have non-empty arohana_swaras array",
        severity: "error",
      });
    }
    const arohana = Array.isArray(r.arohana_swaras) ? r.arohana_swaras : [];
    const avarohana = Array.isArray(r.avarohana_swaras) ? r.avarohana_swaras : [];
    if (!Array.isArray(r.avarohana_swaras) || r.avarohana_swaras.length === 0) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "avarohana_swaras",
        message: "Raga must have non-empty avarohana_swaras array",
        severity: "error",
      });
    }
    [...arohana, ...avarohana].forEach((swara) => {
      if (!isValidSwaraToken(swara)) {
        issues.push({
          entityType: "Raga",
          entityId: r.id,
          field: "arohana_swaras/avarohana_swaras",
          message: `Unknown swara token '${swara}'`,
          severity: "error",
        });
      }
    });
    if (
      typeof r.arohana_si !== "string" || !r.arohana_si.trim() ||
      typeof r.avarohana_si !== "string" || !r.avarohana_si.trim() ||
      typeof r.pakad_si !== "string" || !r.pakad_si.trim()
    ) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "notation",
        message: "Public raga display notation must include arohana, avarohana, and pakad",
        severity: "error",
      });
    }
    if (!r.sourceReference || typeof r.sourceReference.sourceId !== "string" || !r.sourceReference.sourceId) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "sourceReference",
        message: "Source reference is missing",
        severity: "error",
      });
    } else if (!validSourceIds.has(r.sourceReference.sourceId)) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "sourceReference.sourceId",
        message: `Raga sourceId '${r.sourceReference.sourceId}' is invalid`,
        severity: "error",
      });
    }
    if (!Array.isArray(r.samplePhrases)) {
      issues.push({
        entityType: "Raga",
        entityId: r.id,
        field: "samplePhrases",
        message: "Raga samplePhrases must be an array",
        severity: "error",
      });
    } else {
      r.samplePhrases.forEach((phrase, phraseIndex) => {
        if (!phrase || typeof phrase !== "object" || !Array.isArray(phrase.swaras) || phrase.swaras.length === 0) {
          issues.push({
            entityType: "Raga",
            entityId: r.id,
            field: "samplePhrases.swaras",
            message: `Sample phrase ${phraseIndex} must contain a swaras array`,
            severity: "error",
          });
          return;
        }
        phrase.swaras.forEach((swara) => {
          if (!isValidSwaraToken(swara)) {
            issues.push({
              entityType: "Raga",
              entityId: r.id,
              field: "samplePhrases.swaras",
              message: `Unknown sample phrase swara '${String(swara)}'`,
              severity: "error",
            });
          }
        });
      });
    }
  });

  // Validate Talas
  talaRecords.forEach((t) => {
    const vibhagStructure = Array.isArray(t.vibhagStructure) ? t.vibhagStructure : [];
    const bols = Array.isArray(t.bols) ? t.bols : [];
    const validVibhagStructure =
      vibhagStructure.length > 0 &&
      vibhagStructure.every((size) => Number.isInteger(size) && size > 0);
    const validBolObjects = bols.every((bol) =>
      !!bol &&
      typeof bol === "object" &&
      Number.isInteger(bol.matra) &&
      Number.isInteger(bol.vibhagIndex) &&
      isMappedTalaBolToken(bol.bol_si) &&
      typeof bol.action_si === "string" &&
      !!bol.action_si.trim() &&
      typeof bol.isSam === "boolean" &&
      typeof bol.isTali === "boolean" &&
      typeof bol.isKhali === "boolean"
    );

    if (t.matras <= 0 || !validBolObjects || bols.length !== t.matras) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: `Tala bols array is malformed or its length (${bols.length}) does not match matra count (${t.matras})`,
        severity: "error",
      });
    }
    if (!validVibhagStructure || vibhagStructure.reduce((sum, size) => sum + size, 0) !== t.matras) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "vibhagStructure",
        message: "Tala vibhag sizes must sum to its matra count",
        severity: "error",
      });
    }
    if (t.vibhagCount !== vibhagStructure.length) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "vibhagCount",
        message: "Tala vibhagCount must equal vibhagStructure length",
        severity: "error",
      });
    }
    const expectedVibhagByMatra: number[] = [];
    if (validVibhagStructure) {
      vibhagStructure.forEach((size, vibhagIndex) => {
        for (let index = 0; index < size; index += 1) expectedVibhagByMatra.push(vibhagIndex);
      });
    }
    if (validBolObjects && bols.some((bol, index) =>
      bol.matra !== index + 1 ||
      bol.vibhagIndex !== expectedVibhagByMatra[index]
    )) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: "Tala bol matras must be sequential and match the vibhag implied by vibhagStructure",
        severity: "error",
      });
    }
    if (validBolObjects && (bols.filter((bol) => bol.isSam).length !== 1 || bols.some((bol) => bol.isKhali && bol.isTali))) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols",
        message: "Tala must contain one sam and may not mark a bol as both tali and khali",
        severity: "error",
      });
    }

    if (bols.some((candidate) => {
      if (!isRecord(candidate)) return true;
      const bol = readOwnDataField(candidate, "bol_si");
      if (!isMappedTalaBolToken(bol)) return true;
      const plan = planTablaBol(bol);
      if (bol.trim().toLocaleLowerCase() === "-" || bol.trim().toLocaleLowerCase() === "s") return plan.length !== 0;
      return plan.length === 0 || plan.some((stroke) => stroke.kind === "fallback" || stroke.kind === "rest");
    })) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "bols.bol_si",
        message: "Every non-rest tala bol must map to a non-empty intentional tabla stroke plan",
        severity: "error",
      });
    }

    const tempo = t.practiceTempoBpm;
    if (
      !tempo ||
      typeof tempo !== "object" ||
      ![tempo.thah_bpm, tempo.dugun_bpm, tempo.chaugun_bpm].every(isSafePracticeBpm)
    ) {
      issues.push({
        entityType: "Tala",
        entityId: t.id,
        field: "practiceTempoBpm",
        message: "Application practice tempos must be finite values between 40 and 240 BPM",
        severity: "error",
      });
    }
  });

  const normalizedTalaNames = new Map<string, { id: string; canonical: boolean }>();
  talaRecords.forEach((tala) => {
    if (typeof tala.name_si !== "string" || !tala.name_si.trim()) {
      issues.push({ entityType: "Tala", entityId: tala.id, field: "name_si", message: "Tala canonical name is missing", severity: "error" });
    }
    if (!Array.isArray(tala.aliases_si) || tala.aliases_si.some((name) => typeof name !== "string" || !name.trim())) {
      issues.push({ entityType: "Tala", entityId: tala.id, field: "aliases_si", message: "Tala aliases must be an array of non-empty strings", severity: "error" });
    }
    const names = [
      ...(typeof tala.name_si === "string" ? [{ name: tala.name_si, canonical: true }] : []),
      ...(Array.isArray(tala.aliases_si) ? tala.aliases_si.filter((name): name is string => typeof name === "string").map((name) => ({ name, canonical: false })) : []),
    ];
    const seenWithinRecord = new Map<string, { canonical: boolean }>();
    names.forEach(({ name, canonical }) => {
      const normalized = identityKey(name);
      const localExisting = seenWithinRecord.get(normalized);
      if (localExisting) {
        issues.push({
          entityType: "Tala",
          entityId: tala.id,
          field: "aliases_si",
          message: localExisting.canonical !== canonical
            ? `Canonical identity '${name}' must not also be a tala alias`
            : `Duplicate identity '${name}' within one tala record`,
          severity: "error",
        });
      } else {
        seenWithinRecord.set(normalized, { canonical });
      }
      const existing = normalizedTalaNames.get(normalized);
      if (existing && existing.id !== tala.id) {
        issues.push({
          entityType: "Tala",
          entityId: tala.id,
          field: "aliases_si",
          message: `Normalized tala name/alias '${name}' collides with '${existing.id}'`,
          severity: "error",
        });
      } else {
        normalizedTalaNames.set(normalized, { id: tala.id, canonical });
      }
    });
  });

  const rawCatalogs: Array<{ type: string; records: unknown[] }> = [
    { type: "Lesson", records: Array.isArray(lessons) ? lessons : [] },
    { type: "Raga", records: Array.isArray(ragas) ? ragas : [] },
    { type: "Tala", records: Array.isArray(talas) ? talas : [] },
    { type: "Instrument", records: Array.isArray(instruments) ? instruments : [] },
    { type: "CulturalTradition", records: Array.isArray(culturalTraditions) ? culturalTraditions : [] },
    { type: "TheatreTradition", records: Array.isArray(theatreTraditions) ? theatreTraditions : [] },
    { type: "Glossary", records: glossaryData },
    { type: "LearningPath", records: learningPathsData },
    { type: "Quiz", records: quizzesData },
    { type: "ExamPaper", records: examPapersData },
    { type: "Terminology", records: terminologyData },
  ];
  const contractCatalogs: Array<{ type: string; kind: ContentEntityKind; records: unknown[] }> = [
    { type: "Glossary", kind: "glossary", records: glossaryData as unknown[] },
    { type: "LearningPath", kind: "learning-path", records: learningPathsData as unknown[] },
    { type: "Quiz", kind: "quiz", records: quizzesData as unknown[] },
    { type: "ExamPaper", kind: "exam-paper", records: examPapersData as unknown[] },
  ];
  contractCatalogs.forEach(({ type, kind, records }) => {
    records.forEach((candidate, index) => {
      const contract = validateContentRecord(candidate, kind);
      contract.issues.forEach((issue) => issues.push({
        entityType: type,
        entityId: localEntityId(candidate, index),
        field: issue.field,
        message: issue.message,
        severity: "error",
      }));
    });
  });
  const glossaryPublication = evaluatePublicationBatch(glossaryData, evaluationContext);
  issues.push(...validateCatalogIdentityContracts(
    rawCatalogs,
    glossaryData.filter((_term, index) => glossaryPublication.decisions[index]?.isPublic),
    terminologyData
  ));

  const entityPublication = evaluatePublicationBatch(allEntities.map(({ item }) => item), evaluationContext);
  allEntities.forEach(({ type, item }, index) => {
    const decision = entityPublication.decisions[index] ?? getRecordPublicationDecision(item, evaluationContext);
    if (!decision.isPublic) {
      issues.push({
        entityType: type,
        entityId: item.id,
        field: "sourceReference",
        message: `Canonical public input failed publication evidence: ${decision.reasonCodes.join(", ")}`,
        severity: "error",
      });
    }
  });

  const requiredTerms: Record<string, string> = {
    "term-pitch": "තාරතාවය",
    "term-intensity": "විපුලතාවය",
    "term-timbre": "ධ්වනි ගුණය",
    "term-frequency": "සංඛ්‍යාතය",
  };
  Object.entries(requiredTerms).forEach(([id, expected]) => {
    const glossaryTerm = glossaryData.find((term) => term.id === id);
    const terminologyTerm = terminologyData.find((term) => term.id === id);
    if (!glossaryTerm?.term_si.includes(expected) || !terminologyTerm?.term_si.includes(expected)) {
      issues.push({
        entityType: "Terminology",
        entityId: id,
        field: "term_si",
        message: `Canonical terminology must retain '${expected}' across catalogs`,
        severity: "error",
      });
    }
  });

  const errors = issues.filter((i) => i.severity === "error");
  return {
    isValid: errors.length === 0,
    issues,
  };
}
/**
 * Validate that every issue and evidence entry in forensic-ledger.json adheres
 * to the explicit schema contract, uses allowed enumerated values, and provides
 * complete path/locator fields.
 */

/**
 * Validate that every issue and evidence entry in forensic-ledger.json adheres
 * to the explicit schema contract, uses allowed enumerated values, and provides
 * complete path/locator fields.
 */
export function validateForensicLedger(
  ledgerInput: unknown = forensicLedgerData
): PublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const safeLedger = cloneBoundedRecord(ledgerInput);
  if (!safeLedger || !isRecord(safeLedger)) {
    return {
      isValid: false,
      issues: [baselineIssue("forensic-ledger", "ledger", "record", "Forensic ledger must be a bounded plain-data object.")],
    };
  }
  const ledger = safeLedger as Record<string, unknown>;
  const historicalBaseline = isRecord(ledger.historicalBaseline) ? ledger.historicalBaseline : {};
  const auditedThrough = isRecord(ledger.auditedThrough) ? ledger.auditedThrough : {};
  if (typeof ledger.phase !== "string" || !ledger.phase.startsWith("Phase 2 closeout")) {
    issues.push(baselineIssue("forensic-ledger", "header", "phase", "Ledger header must identify the Phase 2 closeout scope."));
  }
  if (typeof ledger.authority !== "string" || /current checkout/i.test(ledger.authority)) {
    issues.push(baselineIssue("forensic-ledger", "header", "authority", "Ledger authority must not claim a stored SHA is the current checkout."));
  }
  if (
    historicalBaseline.phase !== "Prompt 1 / publication containment and source baseline" ||
    historicalBaseline.baseSha !== "6e62a3ad2d9621b8790d35af3358b08fafceaa57"
  ) {
    issues.push(baselineIssue("forensic-ledger", "header", "historicalBaseline", "Prompt 1 baseline phase and base SHA must remain immutable historical metadata."));
  }
  if (
    auditedThrough.phase !== "Phase 2 p02r4 findings input" ||
    auditedThrough.baseSha !== "beba1479f473b3413b3f2de48a27c558e1937c6f" ||
    auditedThrough.reviewedHead !== "97c0c138b2b90ac27516a3c8c3716361ac537981" ||
    auditedThrough.reviewRunId !== "20260815-235819-p02r4" ||
    auditedThrough.status !== "Findings input only; not acceptance evidence"
  ) {
    issues.push(baselineIssue("forensic-ledger", "header", "auditedThrough", "Latest audited Phase 2 findings-input scope must be explicit and must not claim acceptance."));
  }
  const schema = (ledger.issueSchema || {}) as {
    requiredIssueFields?: string[];
    optionalIssueFields?: string[];
    requiredEvidenceFields?: string[];
    optionalEvidenceFields?: string[];
    severityValues?: string[];
    publicVisibilityValues?: string[];
    confidenceValues?: string[];
    evidenceBasisValues?: string[];
    statusValues?: string[];
  };

  const requiredIssueFields = schema.requiredIssueFields || [];
  const optionalIssueFields = schema.optionalIssueFields || [];
  const allowedIssueFields = new Set([...requiredIssueFields, ...optionalIssueFields]);

  const requiredEvidenceFields = schema.requiredEvidenceFields || [];
  const optionalEvidenceFields = schema.optionalEvidenceFields || [];
  const allowedEvidenceFields = new Set([...requiredEvidenceFields, ...optionalEvidenceFields]);

  const severitySet = new Set(schema.severityValues || []);
  const visibilitySet = new Set(schema.publicVisibilityValues || []);
  const confidenceSet = new Set(schema.confidenceValues || []);
  const basisSet = new Set(schema.evidenceBasisValues || []);
  const statusSet = new Set(schema.statusValues || []);

  if (!Array.isArray(schema.requiredIssueFields) || schema.requiredIssueFields.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issueSchema", "requiredIssueFields", "Schema must define requiredIssueFields."));
  }
  if (!Array.isArray(schema.requiredEvidenceFields) || schema.requiredEvidenceFields.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issueSchema", "requiredEvidenceFields", "Schema must define requiredEvidenceFields."));
  }
  if (!Array.isArray(schema.evidenceBasisValues) || schema.evidenceBasisValues.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issueSchema", "evidenceBasisValues", "Schema must define evidenceBasisValues."));
  }

  const ledgerIssues = Array.isArray(ledger.issues) ? (ledger.issues as Array<Record<string, unknown>>) : [];
  if (ledgerIssues.length === 0) {
    issues.push(baselineIssue("forensic-ledger", "issues", "length", "Forensic ledger must contain at least one issue entry."));
  }

  const seenIssueIds = new Set<string>();
  if (ledger.issueCountBaseline !== ledgerIssues.length) {
    issues.push(baselineIssue("forensic-ledger", "issues", "issueCountBaseline", "Ledger issue count baseline must remain synchronized."));
  }

  ledgerIssues.forEach((issue, index) => {
    if (!issue || typeof issue !== "object") {
      issues.push(baselineIssue("forensic-ledger", `issue-${index}`, "format", "Issue must be a non-null object."));
      return;
    }

    const issueId = typeof issue.id === "string" ? issue.id : `issue-${index}`;

    if (seenIssueIds.has(issueId)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "id", `Duplicate issue ID '${issueId}'.`));
    }
    seenIssueIds.add(issueId);

    requiredIssueFields.forEach((field) => {
      if (issue[field] === undefined || issue[field] === null || issue[field] === "") {
        issues.push(baselineIssue("forensic-ledger", issueId, field, `Issue is missing required field '${field}'.`));
      }
    });

    Object.keys(issue).forEach((field) => {
      if (!allowedIssueFields.has(field)) {
        issues.push(baselineIssue("forensic-ledger", issueId, field, `Unknown field '${field}' on issue object.`));
      }
    });

    if (issue.severity && !severitySet.has(issue.severity as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "severity", `Invalid severity '${issue.severity}'.`));
    }
    if (issue.publicVisibility && !visibilitySet.has(issue.publicVisibility as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "publicVisibility", `Invalid publicVisibility '${issue.publicVisibility}'.`));
    }
    if (issue.confidence && !confidenceSet.has(issue.confidence as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "confidence", `Invalid confidence '${issue.confidence}'.`));
    }
    if (issue.evidenceBasis && !basisSet.has(issue.evidenceBasis as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "evidenceBasis", `Invalid evidenceBasis '${issue.evidenceBasis}'.`));
    }
    if (issue.status && !statusSet.has(issue.status as string)) {
      issues.push(baselineIssue("forensic-ledger", issueId, "status", `Invalid status '${issue.status}'.`));
    }

    if (!Array.isArray(issue.evidence) || issue.evidence.length === 0) {
      issues.push(baselineIssue("forensic-ledger", issueId, "evidence", "Issue must have a non-empty evidence array."));
    } else {
      (issue.evidence as Array<Record<string, unknown>>).forEach((entry, eIndex) => {
        if (!entry || typeof entry !== "object") {
          issues.push(baselineIssue("forensic-ledger", `${issueId}.evidence[${eIndex}]`, "format", "Evidence entry must be a non-null object."));
          return;
        }
        const entryLocator = typeof entry.locator === "string" ? entry.locator : `entry-${eIndex}`;
        requiredEvidenceFields.forEach((field) => {
          if (!entry[field] || typeof entry[field] !== "string" || !entry[field].trim()) {
            issues.push(baselineIssue("forensic-ledger", `${issueId}.evidence[${eIndex}]`, field, `Evidence entry '${entryLocator}' missing required field '${field}'.`));
          }
        });
        Object.keys(entry).forEach((field) => {
          if (!allowedEvidenceFields.has(field)) {
            issues.push(baselineIssue("forensic-ledger", `${issueId}.evidence[${eIndex}]`, field, `Unknown field '${field}' on evidence entry.`));
          }
        });
      });
    }
  });

  return {
    isValid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}