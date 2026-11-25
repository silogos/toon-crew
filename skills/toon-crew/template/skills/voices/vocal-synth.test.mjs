import {describe, expect, it} from 'vitest';
const SR = 44100;
const TAU = Math.PI * 2;
import {SOUNDS, pitchOfSamples, synthesize} from './vocal-synth.mjs';

describe('vocal-synth', () => {
  it('makes every sound: audible, never clipped, a sensible length, the same every time', () => {
    for (const name of Object.keys(SOUNDS)) {
      const a = synthesize(name, {pitch: 220, seed: 3}).L;
      const peak = a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      expect(peak, name).toBeGreaterThan(0.01);
      expect(a.every(Number.isFinite), name).toBe(true);
      expect(a.length / SR, name).toBeGreaterThan(0.1);
      expect(a.length / SR, name).toBeLessThan(6);
      expect(synthesize(name, {pitch: 220, seed: 3}).L, name).toEqual(a);
    }
  });
  it('hears the pitch of a voice', () => {
    const rate = 16000;
    for (const f of [110, 210, 470]) {
      const x = Float32Array.from({length: rate}, (_, i) => Math.sin((TAU * f * i) / rate) + 0.5 * Math.sin((TAU * 2 * f * i) / rate));
      expect(pitchOfSamples(x, rate)).toBeCloseTo(f, -1);
    }
    expect(pitchOfSamples(new Float32Array(rate), rate)).toBeNull();
  });
});
