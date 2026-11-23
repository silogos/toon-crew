import {Easing, interpolate} from 'remotion';

/** Ease from one value to another between two frames, holding outside them. */
export const ease = (frame: number, frames: [number, number], values: [number, number]) =>
  interpolate(frame, frames, values, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

/** True while `frame` is inside [from, to). */
export const between = (frame: number, from: number, to: number) => frame >= from && frame < to;

/**
 * Repeatable pseudo-random number in [0, 1) from a seed. Use this instead of
 * Math.random(): every frame must render the same way every time.
 */
export const seeded = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
