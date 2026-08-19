/**
 * Bounded AudioContext resume helper.
 * Races `context.resume()` against a timeout and clears its timer on all paths.
 * A non-settling or rejected resume fails safely without wedging future attempts;
 * the caller's cached initPromise is cleared via its own finally handler.
 */

export async function resumeAudioContext(
  context: AudioContext,
  timeoutMs: number = 3000
): Promise<boolean> {
  if (context.state !== "suspended") return true;
  let timeoutId: number | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error("audio-resume-timeout")),
        timeoutMs
      ) as unknown as number;
    });
    await Promise.race([context.resume(), timeoutPromise]);
    return true;
  } catch {
    return false;
  } finally {
    if (timeoutId !== undefined) {
      try {
        window.clearTimeout(timeoutId);
      } catch {
        // Timer cancellation is best-effort.
      }
    }
  }
}
