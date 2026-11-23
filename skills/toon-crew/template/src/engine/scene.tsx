import React from 'react';
import {Cue, Sound, Timeline} from './timeline';

/** A scene ready to be assembled into an episode. */
export type SceneDef = {
  Component: React.FC;
  /** length in frames */
  duration: number;
  cues: Cue[];
  sounds: Sound[];
  /** a mood from series.json, or null when the scene is silent or brings its own music as a sound */
  music: string | null;
};

/**
 * Define one scene.
 *
 * `script` lays the scene out in time and returns whatever marks the picture needs
 * (cues for lines, frames for actions). `Component` draws the scene and receives
 * those marks as `m`. The scene's length follows from the script.
 *
 *   export const scene1 = defineScene({
 *     music: 'calm',
 *     script: (t) => ({hello: t.say('e1_s1_mia1'), reply: t.say('e1_s1_tobi1')}),
 *     Component: ({m}) => <Stage>… <Balloon cue={m.hello} x={600} y={400} /> …</Stage>,
 *   });
 */
export function defineScene<M>(def: {
  music?: string | null;
  /** frames to hold after everything has finished (default 20) */
  tail?: number;
  /** fixed length in frames, when the scene should not follow its script */
  duration?: number;
  script: (t: Timeline) => M;
  Component: React.FC<{m: M}>;
}): SceneDef {
  const t = new Timeline();
  const m = def.script(t);
  const Picture = def.Component;
  return {
    Component: () => <Picture m={m} />,
    duration: def.duration ?? t.end + (def.tail ?? 20),
    cues: t.cues,
    sounds: t.sounds,
    music: def.music ?? null,
  };
}
