import {describe, expect, it} from 'vitest';
import {placeBalloon, textDirection, textWidth} from './layout';
import {between, seeded} from './math';
import {musicStretches, stretchFade} from './music';
import {isVertical, textScale} from './series';
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

describe('placeBalloon', () => {
  const base = {k: 1, tailPct: 50, fontSize: 40, maxWidth: 700};

  it('centres the balloon on the speaker when there is room', () => {
    const p = placeBalloon({...base, x: 960, width: 1920, text: 'Hello there!'});
    expect(p.left + p.bodyW / 2).toBeCloseTo(960);
    expect(p.tailX).toBeCloseTo(p.bodyW / 2);
  });

  it('slides back inside the frame at either edge and keeps the tail on the balloon', () => {
    for (const x of [-200, 0, 30, 1050, 1080, 1400]) {
      const p = placeBalloon({...base, x, width: 1080, text: 'A line long enough to wrap onto two rows of text'});
      expect(p.left).toBeGreaterThanOrEqual(40);
      expect(p.left + p.bodyW).toBeLessThanOrEqual(1080 - 40 + 0.001);
      expect(p.tailX).toBeGreaterThanOrEqual(40);
      expect(p.tailX).toBeLessThanOrEqual(p.bodyW - 40);
    }
  });

  it('spreads long text over even rows instead of filling the widest balloon', () => {
    const long = 'Sudah! Kok belum tumbuh, Nek? Aku sudah menunggu lama sekali di sini.';
    const p = placeBalloon({...base, x: 540, width: 1080, text: long});
    expect(p.lines).toBeGreaterThan(1);
    expect(p.bodyW).toBeLessThanOrEqual(p.maxW);
    expect(placeBalloon({...base, x: 540, width: 1080, text: 'Hai!'}).lines).toBe(1);
  });

  it('stays finite in a frame too small for any balloon', () => {
    const p = placeBalloon({...base, x: 40, width: 120, text: 'A line long enough to wrap onto two rows of text'});
    expect(Number.isFinite(p.lines)).toBe(true);
    expect(Number.isFinite(p.bodyW)).toBe(true);
  });

  it('is never wider than a narrow frame, however large the text', () => {
    const p = placeBalloon({...base, k: 2, fontSize: 80, x: 300, width: 600, text: 'A line long enough to wrap onto two rows of text'});
    expect(p.maxW).toBeLessThanOrEqual(600 - 2 * 80);
    expect(p.bodyW).toBeLessThanOrEqual(p.maxW);
  });
});

describe('textWidth', () => {
  it('counts a square character as about twice a Latin letter', () => {
    expect(textWidth('日本語', 40)).toBeGreaterThan(textWidth('abc', 40) * 1.6);
  });
});

describe('textScale', () => {
  it('follows the long side, so vertical text is as large as landscape text', () => {
    expect(textScale(1920, 1080)).toBe(1);
    expect(textScale(1080, 1920)).toBe(1);
    expect(textScale(1280, 720)).toBeCloseTo(2 / 3);
    expect(isVertical(1080, 1920)).toBe(true);
    expect(isVertical(1920, 1080)).toBe(false);
  });
});

describe('music', () => {
  const known = (mood: string) => ['calm', 'cheerful'].includes(mood);

  it('joins neighbouring scenes with the same mood into one stretch', () => {
    const s = musicStretches([{duration: 100, music: 'calm'}, {duration: 50, music: 'calm'}, {duration: 30, music: 'cheerful'}], known);
    expect(s).toEqual([{mood: 'calm', from: 0, length: 150}, {mood: 'cheerful', from: 150, length: 30}]);
  });

  it('changes mood part-way through a scene, and null means silence', () => {
    const s = musicStretches([{duration: 200, music: 'cheerful', moods: [{at: 120, mood: 'calm'}, {at: 160, mood: null}]}], known);
    expect(s).toEqual([{mood: 'cheerful', from: 0, length: 120}, {mood: 'calm', from: 120, length: 40}]);
  });

  it('a change at the very start replaces the starting mood; unknown moods stay silent', () => {
    expect(musicStretches([{duration: 90, music: 'cheerful', moods: [{at: 0, mood: 'calm'}]}], known)).toEqual([{mood: 'calm', from: 0, length: 90}]);
    expect(musicStretches([{duration: 90, music: 'spooky'}], known)).toEqual([]);
  });

  it('Timeline.mood records the change where the script stands', () => {
    const t = new Timeline();
    t.wait(40);
    expect(t.mood('calm')).toBe(40);
    expect(t.moods).toEqual([{at: 40, mood: 'calm'}]);
  });

  it('fades stay between 0 and 1 even for a very short stretch', () => {
    for (const length of [6, 30, 300]) for (let f = 0; f <= length; f++) {
      const v = stretchFade(f, length);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(stretchFade(150, 300)).toBe(1);
  });
});

describe('textDirection', () => {
  it('reads Arabic right to left, even when it starts with a Latin name', () => {
    expect(textDirection('مرحبا يا صديقي!')).toBe('rtl');
    expect(textDirection('Ben، أين كتابك؟')).toBe('rtl');
  });
  it('reads a Latin line with one Arabic word left to right', () => {
    expect(textDirection('Ucapkan بسم sebelum makan.')).toBe('ltr');
    expect(textDirection("Don't worry. I have a plan.")).toBe('ltr');
  });
  it('gives vowel marks no width of their own', () => {
    expect(textWidth('بِسْمِ', 40)).toBe(textWidth('بسم', 40));
  });
  it('still counts spacing vowel signs, which take room', () => {
    expect(textWidth('का', 40)).toBeGreaterThan(textWidth('क', 40));
  });
});
