// A small synthesiser: everything a series needs to write its own music and
// sound effects as WAV files, with no library and no outside audio.
export const SR = 44100;
export const TAU = Math.PI * 2;

/** Repeatable noise in [-1, 1]. */
let seed = 12345;
export const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

/** An empty stereo track of the given length in seconds. */
export const track = (seconds) => ({L: new Float32Array(Math.ceil(seconds * SR)), R: new Float32Array(Math.ceil(seconds * SR))});

/**
 * Add a sound to a track. `voice(t)` returns the sample at t seconds into the note.
 * `at` and `length` are in seconds; `pan` runs from -1 (left) to 1 (right).
 * With `wrap`, a note that runs past the end continues at the start, so loops are seamless.
 */
export const add = (tr, at, length, voice, {gain = 1, pan = 0, wrap = false} = {}) => {
  const n = tr.L.length;
  const from = Math.round(at * SR);
  const count = Math.round(length * SR);
  const gl = gain * Math.min(1, 1 - pan);
  const gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < count; i++) {
    let idx = from + i;
    if (idx >= n) {
      if (!wrap) break;
      idx %= n;
    }
    const v = voice(i / SR);
    tr.L[idx] += v * gl;
    tr.R[idx] += v * gr;
  }
};

const attack = (t, a = 0.006) => Math.min(1, t / a);

/** Instruments: each takes a frequency and returns a voice for `add`. */
export const pluck = (f, decay = 5) => (t) =>
  attack(t) * Math.exp(-t * decay) * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) + 0.1 * Math.sin(TAU * 3 * f * t));
export const bell = (f, decay = 2.5) => (t) =>
  attack(t, 0.004) * (Math.exp(-t * decay) * Math.sin(TAU * f * t) + 0.35 * Math.exp(-t * decay * 2.5) * Math.sin(TAU * 2.76 * f * t));
export const pad = (f, length) => (t) =>
  Math.min(1, t / 0.4) * Math.min(1, Math.max(0, (length - t) / 0.6)) * (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 1.005 * t));
export const kick = (t) => Math.exp(-t * 9) * Math.sin(TAU * (120 - t * 70) * t);
export const tick = (t) => Math.exp(-t * 35) * (0.7 * noise() + 0.5 * Math.sin(TAU * 620 * t));

/** Frequency of a note name such as C4, F#3 or Bb5. */
export const note = (name) => {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`not a note name: ${name}`);
  const semis = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((semis - 9) / 12 + (Number(m[3]) - 4));
};

/** Encode a track as a 16-bit stereo WAV, normalised to `peak`. */
export const toWav = (tr, peak = 0.9) => {
  const n = tr.L.length;
  let max = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(tr.L[i]), Math.abs(tr.R[i]));
  const k = max > 0 ? peak / max : 1;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  const s16 = (v) => Math.round(Math.max(-1, Math.min(1, v * k)) * 32767);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(s16(tr.L[i]), 44 + i * 4);
    buf.writeInt16LE(s16(tr.R[i]), 46 + i * 4);
  }
  return buf;
};
