/**
 * Which word of a line is being spoken: the highlight that runs through balloons and captions.
 *
 * The voice scripts write when each word is heard (`src/audio-words.json`, from Whisper). When the
 * words heard match the words shown one for one, those times are used. Otherwise (no listener
 * installed, a recording brought in from elsewhere, `say` spelt differently from `text`) the times
 * are estimated from the length of each word and the pauses its punctuation asks for.
 *
 * Pure arithmetic apart from the data file, so it can be tested without drawing anything.
 */

/** A word as heard in a recording, in seconds from its start. */
export type HeardWord = {w: string; s: number; e: number};

/** One word as shown: where it sits in the text, and when it is spoken (seconds from the start of the line). */
export type Word = {from: number; to: number; s: number; e: number};

// Chinese characters and Japanese kana are written without spaces: each is a word of its own.
const SOLO = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/u;
const TOKENS = /[぀-ヿ㐀-䶿一-鿿豈-﫿]|[^\s぀-ヿ㐀-䶿一-鿿豈-﫿]+/gu;

// Thai, Lao, Myanmar and Khmer have no spaces between words either, but their words are several
// letters long: the browser's word dictionary (Intl.Segmenter) finds where they end.
const RUN_ON = /[฀-໿က-႟ក-៿]/u;
type Segment = {segment: string; index: number; isWordLike?: boolean};
type SegmenterClass = new (locale?: string, options?: {granularity: 'word'}) => {segment(text: string): Iterable<Segment>};
const Segmenter = (Intl as unknown as {Segmenter?: SegmenterClass}).Segmenter;
const segmenter = Segmenter ? new Segmenter(undefined, {granularity: 'word'}) : null;

/** Where each word of a text is: [from, to) character offsets, whitespace left out. */
export const splitWords = (text: string): {from: number; to: number}[] => {
  const out: {from: number; to: number}[] = [];
  for (const m of text.matchAll(TOKENS)) {
    const from = m.index!;
    if (!segmenter || !RUN_ON.test(m[0])) {
      out.push({from, to: from + m[0].length});
      continue;
    }
    let last: {from: number; to: number} | null = null;
    for (const seg of segmenter.segment(m[0])) {
      const a = from + seg.index;
      const b = a + seg.segment.length;
      if (seg.isWordLike || !last) {
        last = {from: a, to: b};
        out.push(last);
      } else {
        last.to = b; // punctuation stays with the word before it
      }
    }
  }
  return out;
};

/** Letters and digits only, lower case: "Don't," and "don't" are the same word. */
const bare = (w: string) => w.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** How long a word takes to say, in rough units: its letters, plus the pause its punctuation asks for. */
const weight = (word: string) => {
  const letters = Math.max(1, bare(word).length || (SOLO.test(word) ? 2 : 1));
  const pause = /[.!?。！？…]["')\]]*$/u.test(word) ? 4 : /[,;:、，；：—–-]["')\]]*$/u.test(word) ? 2 : 0;
  return {letters, pause};
};

/**
 * When each word of `text` is spoken. `speech` is the length of the recording in seconds;
 * `heard` is what Whisper heard, if anything.
 */
export const wordTimes = (text: string, speech: number, heard?: HeardWord[]): Word[] => {
  const spots = splitWords(text);
  if (!spots.length) return [];
  const words = spots.map((p) => text.slice(p.from, p.to));
  const usable = heard?.filter((h) => bare(h.w));

  if (usable && usable.length === spots.length) {
    return spots.map((p, i) => ({...p, s: usable[i].s, e: usable[i].e}));
  }

  // Estimate inside the stretch where speech was heard, or the whole recording.
  const a = usable?.length ? usable[0].s : 0;
  const b = usable?.length ? Math.max(usable[usable.length - 1].e, a) : speech;
  const w = words.map(weight);
  const total = w.reduce((sum, x, i) => sum + x.letters + (i < w.length - 1 ? x.pause : 0), 0);
  const unit = (b - a) / total;
  let t = a;
  return spots.map((p, i) => {
    const s = t;
    const e = s + w[i].letters * unit;
    t = e + (i < w.length - 1 ? w[i].pause * unit : 0);
    return {...p, s, e};
  });
};

/**
 * The word being spoken `t` seconds into the line, or -1 before the first and after the voice stops.
 * A word stays lit through the pause after it, until the next one begins.
 */
export const activeWord = (words: Word[], t: number, speech: number, lead = 0.05): number => {
  if (!words.length || t >= speech || t + lead < words[0].s) return -1;
  let i = 0;
  while (i + 1 < words.length && t + lead >= words[i + 1].s) i++;
  return i;
};
