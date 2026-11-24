import {describe, expect, it} from 'vitest';
import {mouthLevels} from './voice';

// one second at 1000 samples a second: loud, silent, quiet, loud (250 ms each)
const rate = 1000;
const tone = (amp: number, n: number) => Array.from({length: n}, (_, i) => amp * Math.sin(i * 0.7));
const samples = [...tone(0.8, 250), ...tone(0, 250), ...tone(0.3, 250), ...tone(0.8, 250)];

describe('mouthLevels', () => {
  const lv = mouthLevels(samples, rate, 20); // 50 samples a frame → 20 frames

  it('gives one value per frame, between 0 and 1', () => {
    expect(lv).toHaveLength(20);
    for (const v of lv) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(1);
  });
  it('opens wide on the loudest part and shuts in silence', () => {
    expect(Math.max(...lv)).toBeCloseTo(1, 1);
    expect(lv[7]).toBe(0);
  });
  it('opens less for quieter speech', () => {
    expect(lv[12]).toBeGreaterThan(0);
    expect(lv[12]).toBeLessThan(lv[2]);
  });
  it('keeps the mouth shut for a silent recording', () => {
    expect(mouthLevels(new Float32Array(500), rate, 20).every((v) => v === 0)).toBe(true);
  });
});
