/**
 * Shared Web Audio component-test FIXTURES for the split component suites.
 *
 * Only pure builders live here. The vi.hoisted mock objects and their
 * vi.mock(...) registrations deliberately stay inside each test file: vi.mock
 * factories are hoisted above imports and cannot close over bindings imported
 * from another module.
 */
import { vi } from "vitest";
import type { Mock } from "vitest";
import talasData from "@/data/talas.json";
import type { Tala } from "@/types/content";
import type { PitchMatchResult } from "@/lib/audio/pitch";

export const getKhemtaFixture = (): Tala => {
  const tala = (talasData as Tala[]).find((candidate) => candidate.id === "tala-khemta");
  if (!tala) throw new Error("Missing raw Khemta test fixture");
  return tala;
};

// Vitest 4 note: `ReturnType<typeof vi.fn>` resolves through an overloaded
// signature to `Mock<Procedure | Constructable>`, and that constructor union
// makes mockImplementation argument types incompatible (TS2322 at every
// readyCancel() call site). Annotating the explicit non-union shape keeps
// the runtime behavior identical while restoring assignability.
export const readyCancel = (cancel: Mock<(...args: any[]) => any> = vi.fn()) =>
  Object.assign(cancel, { ready: Promise.resolve(true) });

export const deferredPlayback = () => {
  let resolveReady!: (played: boolean) => void;
  let resolveFinished!: () => void;
  const ready = new Promise<boolean>((resolve) => { resolveReady = resolve; });
  const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });
  const cancel = vi.fn(() => {
    resolveReady(false);
    resolveFinished();
  });
  return {
    handle: Object.assign(cancel, { ready, finished }),
    resolveReady,
    resolveFinished,
  };
};

export const rejectingPlayback = () => {
  let rejectReady!: (reason?: unknown) => void;
  let rejectFinished!: (reason?: unknown) => void;
  const ready = new Promise<boolean>((_, reject) => { rejectReady = reject; });
  const finished = new Promise<void>((_, reject) => { rejectFinished = reject; });
  const cancel = vi.fn();
  return {
    handle: Object.assign(cancel, { ready, finished }),
    rejectReady,
    rejectFinished,
  };
};

export const pitchResultFixture = (): PitchMatchResult => ({
  frequency: 261.63,
  swara_si: "ස (Sa)",
  swara_en: "S",
  centsOff: 0,
  isInTune: true,
  clarity: 0.95,
});

export type PitchCallback = (result: PitchMatchResult | null) => void;

interface AudioComponentMocks {
  routeParams: { id: string };
  audioMocks: {
    playBol: Mock<(...args: any[]) => any>;
    playSwaraTone: Mock<(...args: any[]) => any>;
    playSequence: Mock<(...args: any[]) => any>;
    playSwaraToneHandle: Mock<(...args: any[]) => any>;
    playSequenceHandle: Mock<(...args: any[]) => any>;
  };
  pitchMocks: { PitchDetector: Mock<(...args: any[]) => any> };
}

/** Mirrors the original suite's global afterEach; call it from each test file. */
export function resetAudioComponentMocks(mocks: AudioComponentMocks): void {
  mocks.routeParams.id = "inst-tabla";
  mocks.audioMocks.playBol.mockReset();
  mocks.audioMocks.playSwaraTone.mockReset().mockResolvedValue(true);
  mocks.audioMocks.playSequence.mockReset().mockResolvedValue(true);
  mocks.audioMocks.playSwaraToneHandle.mockReset().mockImplementation(() => readyCancel());
  mocks.audioMocks.playSequenceHandle.mockReset().mockImplementation(() => readyCancel());
  mocks.pitchMocks.PitchDetector.mockReset();
  vi.useRealTimers();
}
