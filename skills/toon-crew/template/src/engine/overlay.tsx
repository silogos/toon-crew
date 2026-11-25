import React, {useMemo} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import heard from '../audio-words.json';
import {FONT} from './font';
import {placeBalloon, textDirection} from './layout';
import {useLine} from './lines';
import {SERIES, isVertical, textScale} from './series';
import {Cue, hasRecording} from './timeline';
import {HeardWord, activeWord, wordTimes} from './words';

const HEARD = heard as Record<string, HeardWord[]>;

export {FONT};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** On-screen text is designed at 1920 on the long side and scaled to the real frame. */
const useScale = () => {
  const {width, height} = useVideoConfig();
  return textScale(width, height);
};

/**
 * The text of a line with the word being spoken lit up, like a marker pen over it.
 * The mark changes no letter and no spacing, so the text wraps exactly as it would plain.
 * A line not yet recorded, or a series with `"highlightWords": false`, shows plain text.
 */
export const Spoken: React.FC<{cue: Cue; text: string; mark: string; ink?: string}> = ({cue, text, mark, ink}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = useScale();
  const speech = (cue.speechEnd - cue.start) / fps;
  const words = useMemo(() => wordTimes(text, speech, HEARD[cue.id]), [text, speech, cue.id]);
  if (SERIES.highlightWords === false || !hasRecording(cue.id)) return <>{text}</>;
  const i = activeWord(words, (f - cue.start) / fps, speech);
  if (i < 0) return <>{text}</>;
  const {from, to} = words[i];
  const pad = 5 * k;
  return (
    <>
      {text.slice(0, from)}
      <span style={{background: mark, boxShadow: `0 0 0 ${pad}px ${mark}`, borderRadius: pad * 1.6, color: ink}}>{text.slice(from, to)}</span>
      {text.slice(to)}
    </>
  );
};

/**
 * Speech balloon for one line. (x, y) is where the tail points, in screen pixels:
 * a look supplies it by projecting the speaker's head onto the screen.
 * The text comes from the episode's lines, so it can never differ from the script.
 */
export const Balloon: React.FC<{
  cue: Cue;
  x: number;
  y: number;
  /** which side of the balloon the tail sits on */
  tail?: 'center' | 'left' | 'right';
  /** widest the balloon may grow, in design pixels */
  maxWidth?: number;
}> = ({cue, x, y, tail = 'center', maxWidth = 700}) => {
  const f = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const k = useScale();
  const line = useLine(cue.id);
  if (f < cue.start || f >= cue.end) return null;

  const shout = line.fx === 'shout';
  // a vocal sound (a cough, a sigh) is lettered like a sound effect, not spoken words
  const sound = Boolean(line.sound);
  // the pop-in may overshoot a little, but never so far that a balloon near an edge leaves the frame
  const pop = Math.min(1.05, spring({frame: f - cue.start, fps, config: {damping: 11, stiffness: 170}}));
  const fade = interpolate(f, [cue.end - 8, cue.end], [1, 0], clamp);
  const tailPct = tail === 'center' ? 50 : tail === 'left' ? 12 : 88;
  const ink = shout ? '#c62828' : sound ? '#7a4b00' : '#222';
  const jitter = shout || sound ? Math.sin(f * 1.3) * 2 * k : 0;
  const tilt = sound ? -4 : 0;
  const fontSize = (shout ? 50 : 40) * k;
  // never wider than the frame, never over an edge; the tail stays on the speaker
  const {left, bodyW, maxW, tailX, lines} = placeBalloon({x, width, k, tailPct, text: line.text, fontSize, maxWidth});

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: y,
        minWidth: bodyW,
        transform: `translate(0, -100%) translate(${jitter}px, ${-30 * k}px) scale(${pop}) rotate(${tilt}deg)`,
        transformOrigin: `${tailX}px 100%`,
        opacity: fade,
      }}
    >
      <div
        dir={textDirection(line.text)}
        style={{
          background: sound ? '#fff4cc' : 'white',
          border: `${6 * k}px ${sound ? 'dashed' : 'solid'} ${ink}`,
          borderRadius: 36 * k,
          padding: `${22 * k}px ${34 * k}px`,
          fontSize,
          lineHeight: 1.25,
          fontWeight: 800,
          color: ink,
          boxSizing: 'border-box',
          // one row grows with its text; several rows share a fixed width so they come out even
          width: lines === 1 ? 'max-content' : bodyW,
          minWidth: bodyW,
          maxWidth: maxW,
          textWrap: 'balance',
          overflowWrap: 'anywhere',
          textAlign: 'center',
          fontFamily: FONT,
          boxShadow: `0 ${8 * k}px 0 rgba(0,0,0,0.18)`,
        }}
      >
        {sound ? line.text : <Spoken cue={cue} text={line.text} mark="#ffe066" />}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -30 * k,
          left: tailX,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: `${18 * k}px solid transparent`,
          borderRight: `${18 * k}px solid transparent`,
          borderTop: `${34 * k}px solid ${ink}`,
        }}
      />
    </div>
  );
};

/** Narration at the bottom of the frame. The assembler shows this for every narration cue. */
export const Caption: React.FC<{cue: Cue}> = ({cue}) => {
  const f = useCurrentFrame();
  const k = useScale();
  const {width, height} = useVideoConfig();
  const line = useLine(cue.id);
  if (f < cue.start || f >= cue.end) return null;
  // on a vertical video the bottom fifth is under the phone app's own buttons and captions
  const bottom = isVertical(width, height) ? height * 0.2 : 40 * k;
  const o = interpolate(f, [cue.start, cue.start + 10, cue.end - 10, cue.end], [0, 1, 1, 0], clamp);
  return (
    <div
      dir={textDirection(line.text)}
      style={{
        position: 'absolute',
        bottom,
        left: '50%',
        transform: `translateX(-50%) translateY(${(1 - o) * 20 * k}px)`,
        opacity: o,
        background: 'rgba(20,12,5,0.75)',
        color: '#fff8e1',
        fontFamily: FONT,
        fontSize: 42 * k,
        fontWeight: 700,
        padding: `${16 * k}px ${40 * k}px`,
        borderRadius: 20 * k,
        width: 'max-content',
        maxWidth: '84%',
        textAlign: 'center',
      }}
    >
      {line.sound ? line.text : <Spoken cue={cue} text={line.text} mark="#ffd43b" ink="#2b1d0e" />}
    </div>
  );
};
