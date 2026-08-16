/**
 * Local Autocorrelation Pitch Detector (100% Client-Side Web Audio)
 * Complies strictly with Child Privacy & Safety policies:
 * - No audio buffer is saved or uploaded
 * - Audio processing occurs purely in ephemeral RAM
 */

export interface PitchMatchResult {
  frequency: number;
  swara_si: string;
  swara_en: string;
  centsOff: number; // -50 to +50 cents
  isInTune: boolean; // within +/- 15 cents
  clarity: number; // 0.0 to 1.0 (correlation confidence)
}

export const SWARA_STEPS: { si: string; en: string; semitones: number }[] = [
  { si: "ස (Sa)", en: "Sa", semitones: 0 },
  { si: "රි (කෝ) (re)", en: "re", semitones: 1 },
  { si: "රි (Re)", en: "Re", semitones: 2 },
  { si: "ග (කෝ) (ga)", en: "ga", semitones: 3 },
  { si: "ග (Ga)", en: "Ga", semitones: 4 },
  { si: "ම (Ma)", en: "Ma", semitones: 5 },
  { si: "ම (තී) (ma)", en: "ma", semitones: 6 },
  { si: "ප (Pa)", en: "Pa", semitones: 7 },
  { si: "ධ (කෝ) (dha)", en: "dha", semitones: 8 },
  { si: "ධ (Dha)", en: "Dha", semitones: 9 },
  { si: "නි (කෝ) (ni)", en: "ni", semitones: 10 },
  { si: "නි (Ni)", en: "Ni", semitones: 11 },
  { si: "ස̇ (තාර Sa)", en: "Sa'", semitones: 12 },
];

export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isListening: boolean = false;
  private animFrameId: number | null = null;
  private generation = 0;
  private buffer: Float32Array = new Float32Array(2048);

  private stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // A track may already be stopped during browser teardown.
        }
      });
    } catch {
      // The stream can become unavailable while permissions are being revoked.
    }
  }

  private closeContext(context: AudioContext | null): void {
    if (!context) return;
    try {
      void Promise.resolve(context.close()).catch(() => {
        // Closing an already-closed context is harmless for ownership cleanup.
      });
    } catch {
      // Context construction can fail before close is available.
    }
  }

  private releaseResources(
    stream: MediaStream | null,
    source: MediaStreamAudioSourceNode | null,
    context: AudioContext | null,
  ): void {
    try {
      source?.disconnect();
    } catch {
      // A partially constructed graph may already be disconnected.
    }
    this.stopStream(stream);
    this.closeContext(context);
  }

  private disposeCurrentResources(): void {
    this.isListening = false;

    const frameId = this.animFrameId;
    this.animFrameId = null;
    if (frameId !== null && typeof cancelAnimationFrame === "function") {
      try {
        cancelAnimationFrame(frameId);
      } catch {
        // The frame may already have fired or the document may be tearing down.
      }
    }

    const source = this.source;
    this.source = null;
    const stream = this.mediaStream;
    this.mediaStream = null;
    const context = this.audioCtx;
    this.audioCtx = null;
    this.analyser = null;
    this.releaseResources(stream, source, context);
  }

  private cleanupAttempt(
    stream: MediaStream | null,
    source: MediaStreamAudioSourceNode | null,
    context: AudioContext | null,
  ): void {
    this.releaseResources(stream, source, context);
  }

  public async startListening(
    onPitchDetected: (result: PitchMatchResult | null) => void,
    rootFreq: number = 261.63
  ): Promise<boolean> {
    const generation = ++this.generation;
    // A new start owns the detector. It invalidates and releases any previous
    // active attempt while a previous pending getUserMedia call is guarded by
    // its older generation and will stop its late stream when it resolves.
    this.disposeCurrentResources();

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let transferred = false;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (this.generation !== generation) {
        this.stopStream(stream);
        return false;
      }

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) throw new Error("AudioContext is unavailable");
      context = new AudioCtx();
      const activeContext = context;
      if (this.generation !== generation) {
        this.cleanupAttempt(stream, source, activeContext);
        return false;
      }
      source = activeContext.createMediaStreamSource(stream);

      const analyser = activeContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      if (this.generation !== generation) {
        this.cleanupAttempt(stream, source, activeContext);
        return false;
      }

      this.audioCtx = activeContext;
      this.source = source;
      this.mediaStream = stream;
      this.analyser = analyser;
      this.isListening = true;
      transferred = true;

      const detect = () => {
        if (
          this.generation !== generation ||
          !this.isListening ||
          this.analyser !== analyser ||
          this.audioCtx !== activeContext
        ) return true;

        try {
          analyser.getFloatTimeDomainData(this.buffer as any);
          const { freq, clarity } = this.autoCorrelate(this.buffer, activeContext.sampleRate);

          if (freq > 60 && freq < 1200 && clarity > 0.82) {
            const match = this.mapFrequencyToSwara(freq, rootFreq, clarity);
            onPitchDetected(match);
          } else {
            onPitchDetected(null);
          }

          if (
            this.generation !== generation ||
            !this.isListening ||
            this.analyser !== analyser ||
            this.audioCtx !== activeContext
          ) return false;

          this.animFrameId = requestAnimationFrame(detect);
          return true;
        } catch (error) {
          console.error("Pitch detection error:", error);
          if (this.generation === generation) this.stopListening();
          return false;
        }
      };

      return detect();
    } catch (err) {
      console.error("Microphone access error:", err);
      if (transferred && this.generation === generation) {
        this.disposeCurrentResources();
      } else {
        this.cleanupAttempt(stream, source, context);
      }
      return false;
    }
  }

  public stopListening() {
    this.generation += 1;
    this.disposeCurrentResources();
  }

  /**
   * Standard normalized autocorrelation pitch algorithm
   */
  private autoCorrelate(buffer: Float32Array, sampleRate: number): { freq: number; clarity: number } {
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // If signal is too quiet (noise floor threshold)
    if (rms < 0.015) {
      return { freq: -1, clarity: 0 };
    }

    let r1 = 0,
      r2 = SIZE - 1,
      thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buffer.slice(r1, r2);
    const c = new Float32Array(trimmed.length);

    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 <= 0) return { freq: -1, clarity: 0 };

    // Parabolic interpolation for fine sub-sample frequency resolution
    const x1 = c[T0 - 1],
      x2 = c[T0],
      x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) {
      T0 = T0 - b / (2 * a);
    }

    const freq = sampleRate / T0;
    const clarity = maxval / c[0];

    return { freq, clarity };
  }

  private mapFrequencyToSwara(freq: number, rootFreq: number, clarity: number): PitchMatchResult {
    // Determine semitones relative to Root Sa
    const semitonesFromRoot = 12 * Math.log2(freq / rootFreq);
    const roundedSemitones = Math.round(semitonesFromRoot);

    // Normalize into 0..12 range
    let normalized = ((roundedSemitones % 12) + 12) % 12;
    if (roundedSemitones === 12) normalized = 12;

    const closestSwara = SWARA_STEPS[normalized] || SWARA_STEPS[0];
    const exactTargetFreq = rootFreq * Math.pow(2, roundedSemitones / 12);
    const centsOff = Math.round(1200 * Math.log2(freq / exactTargetFreq));

    return {
      frequency: Math.round(freq * 10) / 10,
      swara_si: closestSwara.si,
      swara_en: closestSwara.en,
      centsOff: Math.max(-50, Math.min(50, centsOff)),
      isInTune: Math.abs(centsOff) <= 15,
      clarity: Math.round(clarity * 100) / 100,
    };
  }
}
