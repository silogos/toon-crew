/** Where things go on the screen. Pure arithmetic, so it can be tested without drawing anything. */

/** Roughly how wide a line of bold text is, in pixels. Only used to keep balloons inside the frame. */
export const textWidth = (text: string, fontSize: number) => {
  let em = 0;
  // Chinese, Japanese and Korean characters are a full square wide; Latin letters a little over half
  for (const ch of text) {
    // marks that sit on a letter (Arabic vowel marks, accents) take no width; spacing marks such as the
    // Devanagari vowel signs do, so they are counted
    if (/[\p{Mn}\p{Me}]/u.test(ch)) continue;
    em += /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(ch) ? 1.02 : 0.58;
  }
  return em * fontSize;
};

// Hebrew, Arabic, Syriac, Thaana, N'Ko and their presentation forms
const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/**
 * Which way a line reads. Decided by counting words, not by the first letter, because a line in Arabic
 * often starts with a Latin name. Without it an Arabic line in a left-to-right box puts its full stop
 * on the wrong side, and a mixed line reads in the wrong order.
 */
export const textDirection = (text: string): 'rtl' | 'ltr' => {
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  return words.filter((w) => RTL.test(w)).length > words.length / 2 ? 'rtl' : 'ltr';
};

/**
 * Horizontal placement of a speech balloon whose tail should point at screen position `x`.
 * The balloon is never wider than the frame and never hangs over an edge; when it has to slide
 * back in, the tail stays on the speaker as far as the balloon allows.
 *
 *   k         text scale of the frame
 *   tailPct   where the tail sits along the balloon when nothing is in the way (50 = centre)
 *   maxWidth  widest the balloon may grow, in design pixels
 */
export const placeBalloon = ({x, width, k, tailPct, text, fontSize, maxWidth}: {x: number; width: number; k: number; tailPct: number; text: string; fontSize: number; maxWidth: number}) => {
  // wide enough that the little overshoot of the pop-in cannot push the balloon over the edge
  const margin = 40 * k;
  const maxW = Math.min(maxWidth * k, width - 2 * margin);
  const px = Math.min(Math.max(x, 60 * k), width - 60 * k);
  const pad = 80 * k;
  const textW = textWidth(text, fontSize);
  // text too long for one row is spread evenly over as few rows as it needs, so no row is left with a single word
  // the estimate runs a little wide, so only text that clearly does not fit one row is split
  const lines = Math.max(1, Math.ceil((textW * 0.86) / Math.max(fontSize, maxW - pad)));
  const bodyW = Math.min(maxW, lines === 1 ? textW + pad : (textW / lines) * 1.12 + pad);
  const left = Math.min(Math.max(px - (tailPct / 100) * bodyW, margin), Math.max(margin, width - margin - bodyW));
  const tailX = Math.min(Math.max(px - left, 40 * k), bodyW - 40 * k);
  return {left, bodyW, maxW, tailX, lines};
};
