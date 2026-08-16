import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { NotationArranger } from "@/components/audio/NotationArranger";
import { EarTrainingModule } from "@/components/audio/EarTrainingModule";
import LessonDetailPage from "@/app/lessons/[id]/page";
import RagaDetailPage from "@/app/ragas/[id]/page";

const routeParams = vi.hoisted(() => ({ id: "les-intro-01" }));

const audioMocks = vi.hoisted(() => ({
  playSwaraToneHandle: vi.fn(),
  playSequenceHandle: vi.fn(),
}));

vi.mock("@/lib/audio/synth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/audio/synth")>();
  return {
    ...original,
    swaraSynth: {
      playSwaraToneHandle: audioMocks.playSwaraToneHandle,
      playSequenceHandle: audioMocks.playSequenceHandle,
    },
  };
});

vi.mock("next/navigation", () => ({
  useParams: () => routeParams,
}));

const resolvedPlayback = () => Object.assign(vi.fn(), {
  ready: Promise.resolve(true),
  finished: Promise.resolve(),
});

const rejectingPlayback = () => {
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

const rejectPlayback = async (playback: ReturnType<typeof rejectingPlayback>) => {
  await act(async () => {
    playback.rejectReady(new Error("ready rejected"));
    await Promise.resolve();
    playback.rejectFinished(new Error("finished rejected"));
    await Promise.resolve();
  });
};

afterEach(() => {
  routeParams.id = "les-intro-01";
  audioMocks.playSwaraToneHandle.mockReset().mockImplementation(resolvedPlayback);
  audioMocks.playSequenceHandle.mockReset().mockImplementation(resolvedPlayback);
});

describe("Swara playback rejection consumers", () => {
  it("releases a rejected keyboard scale and reports unavailable audio", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSequenceHandle.mockReturnValueOnce(playback.handle);
    const view = render(<SwaraKeyboard />);

    fireEvent.click(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]);
    expect(screen.getByRole("button", { name: "වාදනය වේ..." })).toBeDisabled();
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    await waitFor(() => expect(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]).not.toBeDisabled());
    view.unmount();
  });

  it("contains a rejected keyboard direct-tone lifecycle", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(playback.handle);
    const view = render(<SwaraKeyboard />);

    fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }));
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    view.unmount();
  });

  it("contains rejected NotationArranger tone promises", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(playback.handle);
    const view = render(<NotationArranger />);

    fireEvent.click(screen.getByRole("button", { name: "ස" }));
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    view.unmount();
  });

  it("contains rejected EarTraining tone promises", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(playback.handle);
    const view = render(<EarTrainingModule />);

    fireEvent.click(screen.getByRole("button", { name: /නාදය අසන්න/ }));
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    view.unmount();
  });

  it("resets a rejected lesson sequence in a finally path", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSequenceHandle.mockReturnValueOnce(playback.handle);
    routeParams.id = "les-intro-01";
    const view = render(<LessonDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශනයට සවන් දෙන්න" }));
    expect(screen.getByRole("button", { name: "ශ්‍රවණය වෙමින් පවතී..." })).toBeDisabled();
    await rejectPlayback(playback);

    expect(await screen.findByRole("status")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    await waitFor(() => expect(screen.getByRole("button", { name: "ආදර්ශනයට සවන් දෙන්න" })).not.toBeDisabled());
    view.unmount();
  });

  it("resets a rejected Raga sequence in a finally path", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSequenceHandle.mockReturnValueOnce(playback.handle);
    routeParams.id = "raga-bilawal";
    const view = render(<RagaDetailPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]);
    expect(screen.getByRole("button", { name: "වාදනය වේ..." })).toBeDisabled();
    await rejectPlayback(playback);

    expect(await screen.findByRole("status")).toHaveTextContent("රාග නාදය ආරම්භ කළ නොහැක");
    await waitFor(() => expect(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]).not.toBeDisabled());
    view.unmount();
  });
});
