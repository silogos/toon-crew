import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLine} from './lines';
import {DESIGN_WIDTH} from './series';
import {Cue} from './timeline';

export const FONT = "'Arial Rounded MT Bold', 'Trebuchet MS', 'Helvetica Neue', sans-serif";
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** On-screen text is designed at 1920 wide and scaled to the real frame. */
const useScale = () => useVideoConfig().width / DESIGN_WIDTH;

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
  const pop = spring({frame: f - cue.start, fps, config: {damping: 11, stiffness: 170}});
  const fade = interpolate(f, [cue.end - 8, cue.end], [1, 0], clamp);
  const tailPct = tail === 'center' ? 50 : tail === 'left' ? 12 : 88;
  const ink = shout ? '#c62828' : '#222';
  const jitter = shout ? Math.sin(f * 1.3) * 2 * k : 0;
  // keep the tail point inside the frame so a balloon never leaves the screen sideways
  const px = Math.min(Math.max(x, 40 * k), width - 40 * k);

  return (
    <div
      style={{
        position: 'absolute',
        left: px,
        top: y,
        transform: `translate(-${tailPct}%, -100%) translate(${jitter}px, ${-30 * k}px) scale(${pop})`,
        transformOrigin: `${tailPct}% 100%`,
        opacity: fade,
      }}
    >
      <div
        style={{
          background: 'white',
          border: `${6 * k}px solid ${ink}`,
          borderRadius: 36 * k,
          padding: `${22 * k}px ${34 * k}px`,
          fontSize: (shout ? 50 : 40) * k,
          lineHeight: 1.25,
          fontWeight: 800,
          color: ink,
          width: 'max-content',
          maxWidth: maxWidth * k,
          textAlign: 'center',
          fontFamily: FONT,
          boxShadow: `0 ${8 * k}px 0 rgba(0,0,0,0.18)`,
        }}
      >
        {line.text}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -30 * k,
          left: `${tailPct}%`,
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
  const line = useLine(cue.id);
  if (f < cue.start || f >= cue.end) return null;
  const o = interpolate(f, [cue.start, cue.start + 10, cue.end - 10, cue.end], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40 * k,
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
      {line.text}
    </div>
  );
};
