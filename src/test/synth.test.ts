import { describe, it, expect } from "vitest";
import { SWARA_SEMITONES, swaraSynth } from "@/lib/audio/synth";
import { ROOT_PITCHES } from "@/lib/audio/tanpura";

describe("Audio Synthesis Engine & Tuning Suite", () => {
  it("should have correct semitone mapping for standard 12 swaras", () => {
    expect(SWARA_SEMITONES["S"].semitonesFromSa).toBe(0);
    expect(SWARA_SEMITONES["r"].semitonesFromSa).toBe(1);
    expect(SWARA_SEMITONES["R"].semitonesFromSa).toBe(2);
    expect(SWARA_SEMITONES["g"].semitonesFromSa).toBe(3);
    expect(SWARA_SEMITONES["G"].semitonesFromSa).toBe(4);
    expect(SWARA_SEMITONES["M"].semitonesFromSa).toBe(5);
    expect(SWARA_SEMITONES["m"].semitonesFromSa).toBe(6);
    expect(SWARA_SEMITONES["P"].semitonesFromSa).toBe(7);
    expect(SWARA_SEMITONES["d"].semitonesFromSa).toBe(8);
    expect(SWARA_SEMITONES["D"].semitonesFromSa).toBe(9);
    expect(SWARA_SEMITONES["n"].semitonesFromSa).toBe(10);
    expect(SWARA_SEMITONES["N"].semitonesFromSa).toBe(11);
    expect(SWARA_SEMITONES["S'"].semitonesFromSa).toBe(12);
  });

  it("should calculate exact frequencies for octaves", () => {
    const baseFreq = 261.63; // C4
    const taraSaFreq = baseFreq * Math.pow(2, 12 / 12);
    expect(Math.round(taraSaFreq)).toBe(523);

    const mandraSaFreq = baseFreq * Math.pow(2, -12 / 12);
    expect(Math.round(mandraSaFreq)).toBe(131);
  });

  it("should define valid Tanpura root pitches", () => {
    expect(ROOT_PITCHES.length).toBeGreaterThan(5);
    const cPitch = ROOT_PITCHES.find((p) => p.name.startsWith("C (ස)"));
    expect(cPitch).toBeDefined();
    expect(cPitch?.freq).toBeCloseTo(130.81, 1);
  });
});
