"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { repository } from "@/lib/data/repository";
import { validateContent, ValidationIssue } from "@/lib/validation/content-validator";
import { ContentReviewStatus, Lesson } from "@/types/content";

export default function AdminReviewDashboardPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [validationReport, setValidationReport] = useState<{
    isValid: boolean;
    issues: ValidationIssue[];
  }>({ isValid: true, issues: [] });
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [updatedSuccessMsg, setUpdatedSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const all = repository.getLessons();
    setLessons(all);
    const report = validateContent(
      all,
      repository.getRagas(),
      repository.getTalas(),
      repository.getInstruments(),
      repository.getCulturalTraditions(),
      repository.getTheatreTraditions()
    );
    setValidationReport(report);
  }, []);

  const handleUpdateStatus = (lessonId: string, newStatus: ContentReviewStatus) => {
    const isPublished = newStatus === "Published";
    repository.updateLessonReviewStatus(lessonId, newStatus, isPublished);
    setLessons(repository.getLessons());
    setUpdatedSuccessMsg(`පාඩම් අංක ${lessonId} තත්ත්වය '${newStatus}' ලෙස යාවත්කාලීන විය.`);
    setTimeout(() => setUpdatedSuccessMsg(null), 3000);
  };

  const statuses: ContentReviewStatus[] = [
    "Draft",
    "SME Review",
    "Language Review",
    "Pedagogical Review",
    "Audio Verification",
    "Accessibility & Mobile QA",
    "Rights & Source Verification",
    "Published",
  ];

  const filteredLessons = lessons.filter((l) => {
    if (selectedStatusFilter === "all") return true;
    return l.reviewMetadata.status === selectedStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-800 mb-3">
          <ShieldAlert className="w-4 h-4" />
          <span>පරිපාලන හා අන්තර්ගත සමාලෝචන පද්ධතිය (CMS)</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          අන්තර්ගත සමාලෝචන හා ප්‍රකාශන පුවරුව
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          8-අදියර ප්‍රකාශන කාර්ය ප්‍රවාහය (Publishing Workflow), මූලාශ්‍ර නිරවද්‍යතාව, සහ විෂය නිර්දේශ අනුකූලතාව අධීක්ෂණය කිරීම.
        </p>
      </div>

      {updatedSuccessMsg && (
        <div className="bg-green-50 border border-green-200 text-green-900 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest-green" />
          <span>{updatedSuccessMsg}</span>
        </div>
      )}

      {/* Automated Content Validation Report Summary */}
      <div
        className={`rounded-3xl p-6 border shadow-warm-md ${
          validationReport.isValid
            ? "bg-green-50/60 border-forest-green/40"
            : "bg-red-50/60 border-red-300"
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            {validationReport.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-forest-green" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h2 className="text-base font-bold text-text">
                ස්වයංක්‍රීය මූලාශ්‍ර හා පාරදත්ත සත්‍යාපන වාර්තාව
              </h2>
              <span className="text-xs text-text-muted">
                {validationReport.isValid
                  ? "සියලුම පාඩම්, රාග, තාල හා මූලාශ්‍ර 100% ක් නිවැරදිව පරීක්ෂාව සමත් වී ඇත."
                  : `ගැටලු ${validationReport.issues.length} ක් හඳුනාගෙන ඇත.`}
              </span>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              validationReport.isValid
                ? "bg-forest-green text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {validationReport.isValid ? "සත්‍යාපනය සමත් (Valid)" : "අවධානය අවශ්‍යයි"}
          </span>
        </div>

        {validationReport.issues.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-red-200 text-xs text-red-900 max-h-40 overflow-y-auto">
            {validationReport.issues.map((iss, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold">• [{iss.entityType} - {iss.entityId}]:</span>
                <span>{iss.message} ({iss.field})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8-Stage Publishing Workflow Filter */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-warm-sm space-y-4">
        <h3 className="text-sm font-bold text-text">අදියර අනුව පාඩම් පෙරහන:</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedStatusFilter === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-warm text-text border border-border-light hover:bg-white"
            }`}
          >
            සියලු පාඩම් ({lessons.length})
          </button>
          {statuses.map((st) => {
            const count = lessons.filter((l) => l.reviewMetadata.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedStatusFilter === st
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-warm text-text border border-border-light hover:bg-white"
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Lessons Table with Stage Controls */}
      <div className="bg-white rounded-3xl border border-border shadow-warm-md overflow-hidden">
        <div className="p-6 border-b border-border-light">
          <h3 className="text-base font-bold text-text">
            පාඩම් සමාලෝචන ලේඛනය ({filteredLessons.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-surface-warm font-bold text-text-secondary border-b border-border">
              <tr>
                <th className="p-3.5">පාඩම් අංකය</th>
                <th className="p-3.5">මාතෘකාව</th>
                <th className="p-3.5">ශ්‍රේණි</th>
                <th className="p-3.5">මූලාශ්‍ර අංකය</th>
                <th className="p-3.5">වර්තමාන තත්ත්වය</th>
                <th className="p-3.5">ක්‍රියාමාර්ගය</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredLessons.map((les) => (
                <tr key={les.id} className="hover:bg-amber-50/30">
                  <td className="p-3.5 font-mono text-text-muted">{les.id}</td>
                  <td className="p-3.5 font-bold text-text max-w-xs truncate">
                    <Link href={`/lessons/${les.id}`} className="hover:underline text-primary">
                      {les.title_si}
                    </Link>
                  </td>
                  <td className="p-3.5">{les.gradeBands.join(", ")}</td>
                  <td className="p-3.5 font-mono text-text-secondary">
                    {les.sourceReference.sourceId}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${
                        les.reviewMetadata.status === "Published"
                          ? "bg-green-100 text-forest-green"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {les.reviewMetadata.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={les.reviewMetadata.status}
                      onChange={(e) =>
                        handleUpdateStatus(les.id, e.target.value as ContentReviewStatus)
                      }
                      className="bg-surface-warm border border-border rounded-lg px-2 py-1 text-[11px] text-text font-medium"
                      aria-label="තත්ත්වය වෙනස් කරන්න"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
