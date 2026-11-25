// Vocal sounds a voice engine cannot make (a cough, a sneeze, a snore…), synthesised from noise and a
// buzzing throat shaped like a mouth, at the pitch of the character's voice. Used by the voice scripts for
// a line with "sound" when the series' engine makes that sound with "synth" (the engine's engine.json, skills/voices-<name>/).
//
//   node skills/voices/vocal-synth.mjs <sound> <out.wav> [--voice <CODE>] [--pitch <Hz>] [--seed <n>]
//
// The pitch is, in order: --pitch, the voice's "pitch" in series/voices.json, the pitch heard in the voice's
// reference clip (series/voice-refs/), or 200 Hz.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {VOCAL_SOUNDS} from '../../scripts/lib/lines.mjs';
import {decodeAudio} from '../../scripts/lib/ffmpeg.mjs';
import {toWav as writeWav} from '../../scripts/lib/wav.mjs';

const SR = 44100;
const TAU = Math.PI * 2;
const toWav = (tr, peak) => writeWav(tr, peak, SR);

/** Repeatable noise in [-1, 1] from a seed. */
const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
};

/** A two-pole filter (RBJ biquad) that keeps its state from sample to sample. */
const biquad = (type, f, q = 0.8) => {
  const w = (TAU * Math.min(f, SR * 0.45)) / SR;
  const a = Math.sin(w) / (2 * q);
  const c = Math.cos(w);
  const k = {
    low: [(1 - c) / 2, 1 - c, (1 - c) / 2],
    high: [(1 + c) / 2, -(1 + c), (1 + c) / 2],
    band: [a, 0, -a],
  }[type];
  const a0 = 1 + a;
  const [b0, b1, b2] = k.map((v) => v / a0);
  const a1 = (-2 * c) / a0;
  const a2 = (1 - a) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
};

/** Vowel shapes of the mouth: the first three resonances (Hz) and how strong each is. */
const VOWELS = {
  ah: [[750, 1.0], [1200, 0.6], [2600, 0.25]],
  ih: [[320, 1.0], [2300, 0.5], [3000, 0.25]],
  oo: [[320, 1.0], [850, 0.5], [2300, 0.12]],
  mm: [[260, 1.0], [1000, 0.08], [2200, 0.05]],
  uh: [[550, 1.0], [1050, 0.5], [2400, 0.2]],
};

/**
 * One sound as a list of samples. A part is a stretch of `seconds` with:
 *   voice: {pitch: [from, to] (× the character's pitch), vowel, gain, rough (0..1, a creaky throat)}
 *   breath: {band: [low, high] Hz, gain}
 *   env: (x in 0..1) => loudness, and `flutter`: a rattle (Hz) for a snore.
 */
const render = (parts, f0, seed) => {
  const noise = rng(seed);
  const total = parts.reduce((t, p) => t + p.seconds, 0);
  const out = new Float32Array(Math.ceil(total * SR));
  let at = 0;
  for (const p of parts) {
    const n = Math.round(p.seconds * SR);
    const formants = p.voice ? VOWELS[p.voice.vowel ?? 'ah'].map(([f, g]) => [biquad('band', f, 6), g]) : [];
    const lo = p.breath ? biquad('high', p.breath.band[0], 0.7) : null;
    const hi = p.breath ? biquad('low', p.breath.band[1], 0.7) : null;
    let phase = 0;
    for (let i = 0; i < n && at + i < out.length; i++) {
      const x = i / n;
      // every part fades out over its last 6 ms, so a cut between parts never clicks
      const env = (p.env ? p.env(x) : 1) * Math.min(1, (n - i) / (0.006 * SR));
      const flutter = p.flutter ? 0.55 + 0.45 * Math.sin((TAU * p.flutter * i) / SR) : 1;
      let v = 0;
      if (p.voice) {
        const [a, b] = p.voice.pitch ?? [1, 1];
        const rough = p.voice.rough ?? 0;
        const f = f0 * (a + (b - a) * x) * (1 + rough * 0.25 * noise());
        phase += f / SR;
        // a buzzing throat: a falling sawtooth, which has every harmonic
        const buzz = (1 - 2 * (phase % 1)) * (1 - rough * 0.6 * Math.abs(noise()));
        for (const [filter, g] of formants) v += filter(buzz) * g * (p.voice.gain ?? 1);
      }
      if (p.breath) v += hi(lo(noise())) * p.breath.gain;
      out[at + i] = v * env * flutter;
    }
    at += n;
  }
  return out;
};

const rise = (a) => (x) => Math.min(1, x / a);
const fall = (k) => (x) => Math.exp(-x * k);
/** Up fast, then away: a hit at the start that fades. */
const burst = (a, k) => (x) => rise(a)(x) * fall(k)(x);
/** In and out smoothly. */
const swell = (x) => Math.sin(Math.PI * x) ** 1.5;
const gap = (seconds) => ({seconds});

/** Each sound the studio can synthesise, as parts (see `render`). */
export const SOUNDS = {
  cough: () => [
    gap(0.03),
    {seconds: 0.24, voice: {vowel: 'uh', pitch: [0.9, 0.75], gain: 0.5, rough: 0.7}, breath: {band: [350, 2600], gain: 1.4}, env: burst(0.02, 7)},
    gap(0.13),
    {seconds: 0.2, voice: {vowel: 'uh', pitch: [0.85, 0.7], gain: 0.4, rough: 0.7}, breath: {band: [350, 2600], gain: 1.1}, env: burst(0.02, 8)},
  ],
  clearThroat: () => [
    {seconds: 0.36, voice: {vowel: 'uh', pitch: [0.6, 0.55], gain: 0.9, rough: 1}, breath: {band: [150, 900], gain: 0.5}, env: (x) => rise(0.15)(x) * (1 - x) ** 0.5},
    gap(0.06),
    {seconds: 0.28, voice: {vowel: 'mm', pitch: [1.0, 0.85], gain: 1}, env: (x) => rise(0.1)(x) * (1 - x) ** 0.7},
  ],
  sneeze: () => [
    {seconds: 0.26, voice: {vowel: 'ah', pitch: [1.0, 1.35], gain: 0.7}, breath: {band: [500, 3000], gain: 0.45}, env: (x) => rise(0.3)(x) * (1 - 0.3 * x)},
    gap(0.06),
    {seconds: 0.22, voice: {vowel: 'ah', pitch: [1.25, 1.55], gain: 0.8}, breath: {band: [500, 3000], gain: 0.5}, env: (x) => rise(0.25)(x)},
    gap(0.05),
    {seconds: 0.3, breath: {band: [2200, 8000], gain: 2.2}, env: burst(0.01, 6)},
    {seconds: 0.16, voice: {vowel: 'oo', pitch: [1.3, 0.9], gain: 0.6}, env: fall(5)},
  ],
  snore: () =>
    [0, 1].flatMap(() => [
      {seconds: 1.1, voice: {vowel: 'uh', pitch: [0.35, 0.3], gain: 0.4, rough: 1}, breath: {band: [80, 600], gain: 1.2}, env: swell, flutter: 32},
      {seconds: 0.9, breath: {band: [300, 1600], gain: 0.35}, env: swell},
      gap(0.35),
    ]),
  gulp: () => [
    {seconds: 0.012, breath: {band: [1500, 6000], gain: 1.5}, env: fall(4)},
    {seconds: 0.14, voice: {vowel: 'oo', pitch: [0.9, 0.45], gain: 1}, env: burst(0.08, 3)},
    gap(0.03),
    {seconds: 0.07, voice: {vowel: 'mm', pitch: [0.4, 0.3], gain: 0.8}, breath: {band: [60, 400], gain: 0.6}, env: burst(0.05, 5)},
  ],
  hiccup: () => [
    {seconds: 0.015, breath: {band: [800, 5000], gain: 1.6}, env: fall(3)},
    {seconds: 0.12, voice: {vowel: 'ih', pitch: [1.35, 1.6], gain: 1}, breath: {band: [1000, 4000], gain: 0.2}, env: burst(0.05, 4)},
  ],
};

/** The sound as a stereo track at the given pitch, ready for `toWav`. */
export const synthesize = (sound, {pitch = 200, seed = 1} = {}) => {
  const make = SOUNDS[sound];
  if (!make) throw new Error(`The studio cannot synthesise "${sound}" (it can: ${Object.keys(SOUNDS).join(', ')}).`);
  const mono = render(make(), pitch, seed);
  return {L: mono, R: Float32Array.from(mono)};
};

/**
 * The pitch of a voice in Hz, heard in a recording: autocorrelation over the louder half of its moments,
 * the median of what is found. Null when ffmpeg cannot read it or nothing in it is voiced.
 */
export const pitchOf = (file) => {
  const rate = 16000;
  let pcm;
  try {
    pcm = decodeAudio(file, rate, 1);
  } catch {
    return null;
  }
  if (!pcm.length) return null;
  const x = Float32Array.from(pcm, (v) => v / 32768);
  return pitchOfSamples(x, rate);
};

export const pitchOfSamples = (x, rate) => {
  // YIN (de Cheveigné & Kawahara 2002): the first lag whose normalised difference dips under a threshold,
  // which avoids taking an octave above or below the voice
  const size = Math.round(rate * 0.04);
  const hop = Math.round(rate * 0.02);
  const minLag = Math.floor(rate / 600);
  const maxLag = Math.ceil(rate / 60);
  const frames = [];
  for (let s = 0; s + size + maxLag < x.length; s += hop) {
    let e = 0;
    for (let i = 0; i < size; i++) e += x[s + i] * x[s + i];
    frames.push([s, e]);
  }
  if (!frames.length) return null;
  const loud = [...frames].sort((a, b) => b[1] - a[1]).slice(0, Math.ceil(frames.length / 2));
  const d = new Float64Array(maxLag + 2);
  const found = [];
  for (const [s, e] of loud) {
    if (e < 1e-6 * size) continue; // silence has no pitch
    for (let lag = 1; lag <= maxLag + 1; lag++) {
      let sum = 0;
      for (let i = 0; i < size; i++) {
        const diff = x[s + i] - x[s + i + lag];
        sum += diff * diff;
      }
      d[lag] = sum;
    }
    let running = 0;
    let pick = 0;
    for (let lag = 1; lag <= maxLag; lag++) {
      running += d[lag];
      const cmnd = running > 0 ? (d[lag] * lag) / running : 1;
      if (lag >= minLag && cmnd < 0.15) {
        // walk down to the bottom of this dip
        let l = lag;
        let next = (d[l + 1] * (l + 1)) / (running + d[l + 1]);
        while (l < maxLag && next < (d[l] * l) / running) {
          running += d[l + 1];
          l++;
          next = (d[l + 1] * (l + 1)) / (running + d[l + 1]);
        }
        pick = l;
        break;
      }
    }
    if (pick) found.push(rate / pick);
  }
  if (found.length < 3) return null;
  found.sort((a, b) => a - b);
  return found[Math.floor(found.length / 2)];
};

/** The pitch to synthesise a voice's sounds at, and where it came from. */
export const voicePitch = (code, root = '.') => {
  const voices = fs.existsSync(path.join(root, 'series/voices.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'series/voices.json'), 'utf8')) : {};
  if (typeof voices[code]?.pitch === 'number') return {pitch: voices[code].pitch, from: 'voices.json'};
  for (const ext of ['wav', 'mp3']) {
    const ref = path.join(root, 'series/voice-refs', `${code}.${ext}`);
    if (fs.existsSync(ref)) {
      const p = pitchOf(ref);
      if (p) return {pitch: Math.round(p), from: `series/voice-refs/${code}.${ext}`};
    }
  }
  return {pitch: 200, from: 'default'};
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [sound, out, ...rest] = process.argv.slice(2);
  const opt = (name) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  if (!sound || !out || !VOCAL_SOUNDS[sound]) {
    console.error(`Usage: node skills/voices/vocal-synth.mjs <sound> <out.wav> [--voice <CODE>] [--pitch <Hz>] [--seed <n>]   (sounds: ${Object.keys(SOUNDS).join(', ')})`);
    process.exit(1);
  }
  try {
    const voice = opt('voice');
    const {pitch, from} = opt('pitch') ? {pitch: Number(opt('pitch')), from: '--pitch'} : voice ? voicePitch(voice) : {pitch: 200, from: 'default'};
    fs.mkdirSync(path.dirname(out), {recursive: true});
    fs.writeFileSync(out, toWav(synthesize(sound, {pitch, seed: Number(opt('seed') ?? 1)}), 0.9));
    console.log(`${sound} at ${pitch} Hz (pitch from ${from})`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
