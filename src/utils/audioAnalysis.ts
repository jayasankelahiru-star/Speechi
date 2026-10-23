import { AudioMetrics, FillersData } from '../types';
import { FILLER_WORDS } from '../data/curriculum';

export function rmsOf(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

// Autocorrelation pitch detector with downsampling
export function pitchDetect(buffer: Float32Array, sampleRate: number): number {
  const downsample = Math.max(1, Math.floor(sampleRate / 11025));
  const n = Math.floor(buffer.length / downsample);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = buffer[i * downsample];
  }

  const effectiveRate = sampleRate / downsample;
  const lo = Math.floor(effectiveRate / 400); // Max pitch ~400Hz
  const hi = Math.min(Math.floor(effectiveRate / 75), n - 2); // Min pitch ~75Hz

  let bestCorr = 0;
  let bestLag = 0;

  for (let lag = lo; lag <= hi; lag++) {
    let sum = 0;
    let autoA = 0;
    let autoB = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += x[i] * x[i + lag];
      autoA += x[i] * x[i];
      autoB += x[i + lag] * x[i + lag];
    }
    const r = sum / Math.sqrt(autoA * autoB + 1e-9);
    if (r > bestCorr) {
      bestCorr = r;
      bestLag = lag;
    }
  }

  return bestCorr > 0.6 && bestLag ? effectiveRate / bestLag : 0;
}

export function summarizeAudio(rmsList: number[], pitchList: number[]): AudioMetrics | null {
  if (rmsList.length < 25) return null;

  const sorted = [...rmsList].sort((a, b) => a - b);
  const p75 = sorted[Math.floor(sorted.length * 0.75)] || 0.05;
  const threshold = Math.max(0.008, 0.2 * p75);

  let start = 0;
  let end = rmsList.length - 1;
  while (start < end && rmsList[start] < threshold) start++;
  while (end > start && rmsList[end] < threshold) end--;

  const segment = rmsList.slice(start, end + 1);
  const voiced = segment.filter((x) => x >= threshold);
  if (voiced.length < 10) return null;

  let longPauses = 0;
  let silenceRun = 0;
  segment.forEach((x) => {
    if (x < threshold) {
      silenceRun++;
    } else {
      if (silenceRun >= 10) longPauses++;
      silenceRun = 0;
    }
  });

  const dbList = voiced.map((x) => 20 * Math.log10(Math.max(x, 1e-5)));
  const meanDb = dbList.reduce((s, x) => s + x, 0) / dbList.length;
  const volSd = Math.sqrt(dbList.reduce((s, x) => s + (x - meanDb) ** 2, 0) / dbList.length);

  const pitches = pitchList.slice(start, end + 1).filter((p) => p > 50 && p < 500);
  const meanPitch = pitches.length ? pitches.reduce((s, x) => s + x, 0) / pitches.length : 0;

  const pitchSd =
    pitches.length >= 15
      ? Math.sqrt(
          pitches
            .map((x) => 12 * Math.log2(Math.max(x, 1) / (meanPitch || 1)))
            .reduce((s, x) => s + x * x, 0) / pitches.length
        )
      : null;

  return {
    span: Math.round(segment.length / 10),
    speak: Math.round(voiced.length / 10),
    silentPct: Math.round(100 * (1 - voiced.length / segment.length)),
    long: longPauses,
    volSd: Number(volSd.toFixed(1)),
    pitch: pitchSd == null ? 0 : Math.round(meanPitch),
    pitchSd: pitchSd == null ? null : Number(pitchSd.toFixed(1)),
  };
}

export function extractFillerWords(text: string): FillersData {
  const breakdown: Record<string, number> = {};
  let total = 0;
  const lower = (text || '').toLowerCase();

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      breakdown[filler] = matches.length;
      total += matches.length;
    }
  }

  return { total, breakdown };
}

export async function captureVideoFrame(video: HTMLVideoElement): Promise<string | null> {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;
  const canvas = document.createElement('canvas');
  const width = 384;
  const height = Math.round((384 * video.videoHeight) / video.videoWidth);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.65);
}
