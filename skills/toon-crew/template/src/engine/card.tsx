/**
 * A full-frame 2D card that shows one line on its own: the advice or moral at the end of an episode,
 * a lesson, a quotation, a title between parts. It works in every look, over or instead of the picture.
 *
 *   script: (t) => ({moral: t.say('e1_s4_end_n', {caption: false})}),
 *   Component: ({m}) => <MessageCard cue={m.moral} heading="…" />,
 *
 * The text is the line's own (from lines.json), read by its voice, with each word lit as it is spoken.
 * Say `caption: false` for a narration line so it is not shown a second time at the bottom.
 *
 * Motion comes from remotion-bits (MIT, github.com/av/remotion-bits): the heading rises word by word,
 * and soft sparkles drift up behind the text. A wavy line draws itself under the heading
 * (`evolvePath` from @remotion/paths). Everything moves by the frame number.
 */
import {evolvePath} from '@remotion/paths';
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AnimatedText, Behavior, Particles, Spawner} from 'remotion-bits';
import {FONT} from './font';
import {textDirection} from './layout';
import {useLine} from './lines';
import {Spoken} from './overlay';
import {textScale} from './series';
import {Cue} from './timeline';

export type CardColors = {
  /** background, from the centre outwards */
  from: string;
  to: string;
  /** the line's text */
  ink: string;
  /** heading and sparkles */
  accent: string;
  /** the mark behind the word being spoken */
  mark: string;
};

const WARM: CardColors = {from: '#fff8e7', to: '#ffd9a0', ink: '#3b2a17', accent: '#d9822b', mark: '#ffe066'};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const MessageCard: React.FC<{
  /** the line to show and hear */
  cue: Cue;
  /** a few words above the line, in the series language (optional) */
  heading?: string;
  colors?: Partial<CardColors>;
  /** soft sparkles drifting up behind the text (default true) */
  sparkles?: boolean;
}> = ({cue, heading, colors, sparkles = true}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const k = textScale(width, height);
  const c = {...WARM, ...colors};
  const line = useLine(cue.id);

  // the line slides in a little before its voice starts, and stays
  const shown = interpolate(f, [cue.start - 12, cue.start + 6], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${c.from} 0%, ${c.to} 100%)`, fontFamily: FONT}}>
      {sparkles ? (
        <Particles startFrame={60} style={{position: 'absolute', inset: 0, zIndex: 0}}>
          <Spawner
            rate={0.3}
            max={28}
            position={{x: width / 2, y: height * 0.75}}
            area={{width: width * 1.1, height: height * 0.8}}
            velocity={{x: 0, y: -1.1 * k, varianceX: 0.6 * k, varianceY: 0.5 * k}}
            lifespan={150}
            lifespanVariance={40}
          >
            <div style={{width: 46 * k, height: 46 * k, borderRadius: '50%', background: `radial-gradient(circle, ${c.accent} 0%, ${c.accent}00 65%)`, opacity: 0.45}} />
          </Spawner>
          <Behavior opacity={[0, 0.55, 0]} scale={{start: 0.6, end: 1.2, startVariance: 0.3}} wiggle={{magnitude: 0.6 * k, frequency: 0.05}} />
        </Particles>
      ) : null}

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: `0 ${8 * k}%`, gap: 36 * k, zIndex: 1}}>
        {heading ? (
          <div dir={textDirection(heading)}>
            <AnimatedText
              transition={{split: 'word', splitStagger: 4, opacity: [0, 1], y: [40 * k, 0], frames: [0, 22], easing: 'easeOutCubic'}}
              style={{color: c.accent, fontSize: 58 * k, fontWeight: 800, textAlign: 'center'}}
            >
              {heading}
            </AnimatedText>
            <Squiggle color={c.accent} k={k} />
          </div>
        ) : null}
        <div
          dir={textDirection(line.text)}
          style={{
            opacity: shown,
            transform: `translateY(${(1 - shown) * 30 * k}px)`,
            color: c.ink,
            fontSize: 72 * k,
            fontWeight: 800,
            lineHeight: 1.3,
            textAlign: 'center',
            textWrap: 'balance',
            maxWidth: 1500 * k,
          }}
        >
          <Spoken cue={cue} text={line.text} mark={c.mark} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// a hand-drawn wave, 360 × 24 design pixels
const WAVE = 'M 4 14 Q 34 2 64 14 T 124 14 T 184 14 T 244 14 T 304 14 T 356 12';

/** A wavy line under the heading that draws itself from left to right once the heading is up. */
const Squiggle: React.FC<{color: string; k: number}> = ({color, k}) => {
  const f = useCurrentFrame();
  const progress = interpolate(f, [16, 40], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const {strokeDasharray, strokeDashoffset} = evolvePath(progress, WAVE);
  return (
    <svg viewBox="0 0 360 24" width={240 * k} height={16 * k} style={{display: 'block', margin: `${10 * k}px auto 0`, overflow: 'visible'}}>
      <path d={WAVE} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
    </svg>
  );
};
