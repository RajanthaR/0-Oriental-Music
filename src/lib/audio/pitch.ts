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
  private mediaStream: MediaStream | null = null;
  private isListening: boolean = false;
  private animFrameId: number | null = null;
  private buffer: Float32Array = new Float32Array(2048);

  public async startListening(
    onPitchDetected: (result: PitchMatchResult | null) => void,
    rootFreq: number = 261.63
  ): Promise<boolean> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      this.isListening = true;

      const detect = () => {
        if (!this.isListening || !this.analyser || !this.audioCtx) return;

        this.analyser.getFloatTimeDomainData(this.buffer as any);
        const { freq, clarity } = this.autoCorrelate(this.buffer, this.audioCtx.sampleRate);

        if (freq > 60 && freq < 1200 && clarity > 0.82) {
          const match = this.mapFrequencyToSwara(freq, rootFreq, clarity);
          onPitchDetected(match);
        } else {
          onPitchDetected(null);
        }

        this.animFrameId = requestAnimationFrame(detect);
      };

      detect();
      return true;
    } catch (err) {
      console.error("Microphone access error:", err);
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
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
