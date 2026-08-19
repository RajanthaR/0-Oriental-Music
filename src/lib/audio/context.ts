/**
 * Shared AudioContext resume helper with bounded timeout.
 *
 * A non-settling or rejected `AudioContext.resume()` must fail safely without
 * permanently wedging future audio attempts. The helper races `resume()` against
 * a bounded timeout and clears its timer on all paths.
 */

export async function resumeAudioContext(
  context: AudioContext,
  timeoutMs: number = 3000
): Promise<void> {
  if (context.state !== "suspended") return;
  let timeoutId: number | undefined;
  try {
    await Promise.race([
      context.resume(),
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error("audio-resume-timeout")),
          timeoutMs
        ) as unknown as number;
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      try {
        window.clearTimeout(timeoutId);
      } catch {
        // Timer cleanup is best-effort.
      }
    }
  }
}

export const resumeWithTimeout = resumeAudioContext;
