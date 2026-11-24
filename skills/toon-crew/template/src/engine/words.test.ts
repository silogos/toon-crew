import {describe, expect, it} from 'vitest';
import {activeWord, splitWords, wordTimes} from './words';

const shown = (text: string) => splitWords(text).map((p) => text.slice(p.from, p.to));

describe('splitWords', () => {
  it('splits on spaces and keeps punctuation with its word', () => {
    expect(shown("Don't worry.  I have a plan!")).toEqual(["Don't", 'worry.', 'I', 'have', 'a', 'plan!']);
  });
  it('makes each Chinese character or kana a word of its own', () => {
    expect(shown('你好 world')).toEqual(['你', '好', 'world']);
  });
  it('finds the words of Thai, which is written without spaces', () => {
    const words = shown('ฉันหาหนังสือไม่เจอ');
    expect(words.length).toBeGreaterThan(2);
    expect(words.join('')).toBe('ฉันหาหนังสือไม่เจอ');
  });
  it('finds no words in an empty line', () => {
    expect(splitWords('   ')).toEqual([]);
  });
});

describe('wordTimes', () => {
  const heard = [
    {w: "Don't", s: 0, e: 0.22},
    {w: 'worry,', s: 0.22, e: 0.52},
    {w: 'I', s: 0.98, e: 1.12},
    {w: 'have', s: 1.12, e: 1.4},
    {w: 'a', s: 1.4, e: 1.52},
    {w: 'plan.', s: 1.52, e: 1.76},
  ];

  it('uses what was heard when it matches the words shown one for one', () => {
    const w = wordTimes("Don't worry. I have a plan.", 2.08, heard);
    expect(w.map((x) => x.s)).toEqual([0, 0.22, 0.98, 1.12, 1.4, 1.52]);
  });

  it('estimates inside the heard stretch when the words do not match', () => {
    const w = wordTimes('Do not worry. I have a plan.', 2.08, heard);
    expect(w).toHaveLength(7);
    expect(w[0].s).toBe(0);
    expect(w[6].e).toBeCloseTo(1.76);
    for (let i = 1; i < w.length; i++) expect(w[i].s).toBeGreaterThanOrEqual(w[i - 1].e - 1e-9);
  });

  it('estimates over the whole recording when nothing was heard, longer words taking longer', () => {
    const w = wordTimes('A wonderful day.', 3);
    expect(w[0].s).toBe(0);
    expect(w[2].e).toBeCloseTo(3);
    expect(w[1].e - w[1].s).toBeGreaterThan(w[0].e - w[0].s);
  });

  it('leaves a pause after a full stop', () => {
    const w = wordTimes('Stop. Go now', 2);
    expect(w[1].s - w[0].e).toBeGreaterThan(w[2].s - w[1].e);
  });
});

describe('activeWord', () => {
  const w = wordTimes('one two three', 3, [
    {w: 'one', s: 0.2, e: 0.5},
    {w: 'two', s: 1.0, e: 1.3},
    {w: 'three', s: 1.6, e: 2.4},
  ]);
  it('is -1 before the first word and after the voice stops', () => {
    expect(activeWord(w, 0, 3)).toBe(-1);
    expect(activeWord(w, 3, 3)).toBe(-1);
  });
  it('keeps a word lit through the pause after it', () => {
    expect(activeWord(w, 0.3, 3)).toBe(0);
    expect(activeWord(w, 0.8, 3)).toBe(0);
    expect(activeWord(w, 1.1, 3)).toBe(1);
    expect(activeWord(w, 2.9, 3)).toBe(2);
  });
});
