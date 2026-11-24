/**
 * Mouths that follow the voice. Each recorded line of a scene is read once, before its first frame
 * is drawn, and turned into how far the mouth is open on every frame (0 shut, 1 wide): loud syllables
 * open it, pauses between words close it.
 *
 * A scene hands a character its lines instead of a plain yes/no:
 *
 *   <Character … talking={[m.hello, m.again]} />    mouth follows these recordings while they play
 *   <Character … talking={between(f, a, b)} />      still works: the mouth flaps at a steady beat
 *
 * A line not recorded yet flaps at the steady beat, so a scene can be blocked before the voices exist.
 */
import {getAudioData} from '@remotion/media-utils';
import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Cue, hasRecording} from './timeline';

/** Whether a character is speaking: yes/no, or the line(s) whose recording the mouth follows. */
export type Talking = boolean | Cue | Cue[];

/**
 * How open the mouth is on each frame of a recording, from its samples.
 * Loudness is measured per frame, scaled to the loudest moment of the line, softened a little
 * so the mouth does not chatter, and quiet stretches close it.
 */
export const mouthLevels = (samples: ArrayLike<number>, sampleRate: number, fps: number): number[] => {
  const per = sampleRate / fps;
  const frames = Math.ceil(samples.length / per);
  const rms: number[] = [];
  for (let i = 0; i < frames; i++) {
    const a = Math.floor(i * per);
    const b = Math.min(samples.length, Math.floor((i + 1) * per));
    let sum = 0;
    for (let j = a; j < b; j++) sum += samples[j] * samples[j];
    rms.push(b > a ? Math.sqrt(sum / (b - a)) : 0);
  }
  const peak = Math.max(0, ...rms);
  if (peak === 0) return rms.map(() => 0);
  const soft = rms.map((v, i) => 0.25 * (rms[i - 1] ?? v) + 0.5 * v + 0.25 * (rms[i + 1] ?? v));
  return soft.map((v) => {
    const x = v / peak;
    return x < 0.12 ? 0 : Math.min(1, Math.pow((x - 0.12) / 0.88, 0.7));
  });
};

/** The steady beat used when there is no recording to follow. */
const flap = (f: number) => Math.abs(Math.sin(f * 0.85));

const LevelsContext = createContext<Record<string, number[]>>({});

/** Reads the recordings of a scene's lines before the scene is drawn. `defineScene` puts it around every scene. */
export const VoiceLevels: React.FC<{cues: Cue[]; children: React.ReactNode}> = ({cues, children}) => {
  const {fps} = useVideoConfig();
  const ids = [...new Set(cues.map((c) => c.id))].filter(hasRecording);
  const key = ids.join('|');
  const [levels, setLevels] = useState<Record<string, number[]>>({});
  const [handle] = useState(() => (ids.length ? delayRender('Reading the voice recordings for the mouths') : null));
  const released = useRef(false);

  useEffect(() => {
    if (handle === null) return;
    let live = true;
    Promise.all(
      ids.map((id) =>
        getAudioData(staticFile(`audio/${id}.wav`))
          .then((a) => [id, mouthLevels(a.channelWaveforms[0], a.sampleRate, fps)] as const)
          // a file that cannot be read leaves that line on the steady beat; the missing sound is reported where it plays
          .catch((err) => {
            console.warn(`Mouth movement: could not read audio/${id}.wav`, err);
            return null;
          }),
      ),
    ).then((entries) => {
      if (live) setLevels(Object.fromEntries(entries.filter((e) => e !== null)));
      if (!released.current) {
        released.current = true;
        continueRender(handle);
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fps, handle]);

  return <LevelsContext.Provider value={levels}>{children}</LevelsContext.Provider>;
};

/**
 * Whether a character speaks on this frame, and how open the mouth is (null when it does not speak).
 */
export const useMouth = (talking: Talking | undefined): {speaking: boolean; open: number | null} => {
  const f = useCurrentFrame();
  const levels = useContext(LevelsContext);
  if (talking === undefined || typeof talking === 'boolean') return {speaking: !!talking, open: talking ? flap(f) : null};
  const cue = (Array.isArray(talking) ? talking : [talking]).find((c) => f >= c.start && f < c.speechEnd);
  if (!cue) return {speaking: false, open: null};
  const line = levels[cue.id];
  return {speaking: true, open: line ? (line[f - cue.start] ?? 0) : flap(f)};
};
