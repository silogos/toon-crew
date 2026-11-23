import {describe, expect, it} from 'vitest';
import {between, seeded} from './math';
import {Timeline, framesOf, hasRecording} from './timeline';

// A sound effect is used because clear-sample keeps effects but removes spoken lines.
const LINE = 'sfx_chime';

describe('Timeline', () => {
  it('uses one second for a sound with no recording', () => {
    expect(hasRecording('does-not-exist')).toBe(false);
    expect(framesOf('does-not-exist')).toBeGreaterThan(0);
  });

  it('places lines one after another with the gap between them', () => {
    const t = new Timeline();
    const a = t.say(LINE, {gap: 10});
    const b = t.say(LINE, {gap: 10});
    expect(a.start).toBe(10);
    expect(a.speechEnd).toBe(10 + framesOf(LINE));
    expect(b.start).toBe(a.speechEnd + 10);
  });

  it('keeps the balloon up for `hold` frames after the voice', () => {
    const c = new Timeline().say(LINE, {hold: 20});
    expect(c.end - c.speechEnd).toBe(20);
  });

  it('overlap does not push later lines back', () => {
    const t = new Timeline();
    const first = t.say(LINE, {gap: 0});
    t.say(LINE, {at: 5, overlap: true});
    const next = t.say(LINE, {gap: 0});
    expect(next.start).toBe(first.speechEnd);
  });

  it('wait and until move the cursor forward only', () => {
    const t = new Timeline();
    expect(t.wait(30)).toBe(30);
    expect(t.until(10)).toBe(30);
    expect(t.until(50)).toBe(50);
  });

  it('cut trims balloons that would outlive the cut', () => {
    const t = new Timeline();
    const c = t.say(LINE, {hold: 500});
    const at = t.cut(8);
    expect(at).toBe(c.speechEnd + 8);
    expect(c.end).toBe(at);
  });

  it('end covers the last line, balloon and sound', () => {
    const t = new Timeline();
    const c = t.say(LINE);
    t.play('sfx_chime', c.end + 100);
    expect(t.end).toBe(c.end + 100 + framesOf('sfx_chime'));
  });
});

describe('math', () => {
  it('between is inclusive at the start and exclusive at the end', () => {
    expect(between(5, 5, 10)).toBe(true);
    expect(between(10, 5, 10)).toBe(false);
  });

  it('seeded is repeatable and stays in [0, 1)', () => {
    for (let i = 0; i < 200; i++) {
      const v = seeded(i);
      expect(v).toBe(seeded(i));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
