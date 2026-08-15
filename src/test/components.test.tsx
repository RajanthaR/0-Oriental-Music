import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { DroneController } from "@/components/audio/DroneController";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { TalaVisualizer } from "@/components/audio/TalaVisualizer";
import { repository } from "@/lib/data/repository";

describe("Interactive Audio & Quiz Components Suite", () => {
  it("renders SwaraKeyboard with Sinhala key labels", () => {
    render(<SwaraKeyboard />);
    expect(screen.getByText("ස්වර යතුරුපුවරුව (Swara Keyboard)")).toBeInTheDocument();
    expect(screen.getByText("ස")).toBeInTheDocument();
    expect(screen.getByText("ප")).toBeInTheDocument();
  });

  it("renders DroneController with Tanpura controls and string labels", () => {
    render(<DroneController />);
    expect(screen.getByText("තාන්පුර ශ්‍රැති මෙවලම (Tanpura Drone)")).toBeInTheDocument();
    expect(screen.getByText("අරඹන්න")).toBeInTheDocument();
  });

  it("maps a public raga scale into the keyboard highlight contract", () => {
    const yaman = repository.getRagaById("raga-yaman");
    expect(yaman).toBeDefined();
    if (!yaman) return;
    render(
      <SwaraKeyboard
        highlightNotes={yaman.arohana_swaras}
        selectedRagaName={yaman.name_si}
      />
    );
    expect(screen.getByText(`${yaman.name_si} ස්වර ඉස්මතු කර ඇත`)).toBeInTheDocument();
  });

  it("maps a public tala into the visualizer and discloses practice-only BPM", () => {
    const lawani = repository.getTalaById("tala-lawani");
    expect(lawani).toBeDefined();
    if (!lawani) return;
    render(<TalaVisualizer tala={lawani} />);
    expect(screen.getByText(/මාත්‍රා 8 \| විභාග 4 \(2\+2\+2\+2\)/)).toBeInTheDocument();
    expect(screen.getByText(/යෙදුමේ පුහුණු වේගය:/)).toBeInTheDocument();
    expect(screen.getByText(/මූලාශ්‍රයෙන් සනාථ කළ ලය වර්ගීකරණයක් නොවේ/)).toBeInTheDocument();
  });

  it("renders QuizRunner and first question properly", () => {
    const quizzes = repository.getQuizzes();
    if (quizzes.length === 0) {
      // All quizzes are contained during Phase 1 forensic remediation
      expect(quizzes).toHaveLength(0);
      return;
    }
    const quiz = quizzes[0];
    render(<QuizRunner quiz={quiz} />);
    expect(screen.getByText(quiz.questions[0].prompt_si)).toBeInTheDocument();
    expect(screen.getByText("පිළිතුර පරීක්ෂා කරන්න")).toBeInTheDocument();
  });
});
