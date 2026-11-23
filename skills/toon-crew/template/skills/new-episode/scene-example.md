# How a scene file is written

This shows the **shape of the code** of `series/episodes/epNN/scenes.tsx`, nothing more. It has no story: two unnamed cast members stand somewhere, two lines are spoken, the camera cuts once, the music changes once, and a grey box moves. Take the pattern; take none of the content. The characters, the place, what happens and what is said in your scene come from the approved script of your series.

It type-checks against the studio as written, in a series that has at least two cast members.

```tsx
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {between, ease} from '../../../src/engine/math';
import {SceneDef, defineScene} from '../../../src/engine/scene';
import {Character, aboveHead} from '../../../src/styles/3d/character';
import {frameShot} from '../../../src/styles/3d/framing';
import {Shot, Speech, Stage, Vec3, cuts} from '../../../src/styles/3d/stage';
import {World} from '../../../src/styles/3d/world';
import {CAST} from '../../cast';
import {MAP} from '../../world/map';

// Two cast members of the series. In a real scene, import them by name from series/cast.
const [FIRST, SECOND] = CAST;

// Positions are local to the scene's origin: x to the right, y up, z toward the camera.
const FIRST_SPOT: Vec3 = [-0.6, 0, 0.5];
const SECOND_SPOT: Vec3 = [0.6, 0, 0.5];
const OBJECT_SPOT: Vec3 = [0, 0, 1];

// frameShot fits its subjects into the frame, landscape or vertical, with room above the heads for the balloon.
const GROUP: Shot = frameShot([
  {position: FIRST_SPOT, height: 1.2},
  {position: SECOND_SPOT, height: 1.2},
]);
// A single: frame one character, with the camera on the far side from the other, so only one face shows.
const SINGLE: Shot = frameShot([{position: SECOND_SPOT, height: 1.2}], {toward: [0.5, 0.1, 1], margin: 1.1});

const over = (p: Vec3) => aboveHead(p, FIRST.look.build);

const scene1 = defineScene({
  music: 'calm', // a mood listed in series/series.json
  script: (t) => {
    // The script lays the scene out in time. Every mark the picture needs is returned.
    const lineA = t.say('e1_s1_x1', {gap: 12}); // ids are those of series/episodes/<ep>/lines.json
    const cut = t.cut(); // a camera cut: no balloon lingers across it
    const lineB = t.say('e1_s1_y1');
    const action: [number, number] = [lineB.speechEnd, lineB.speechEnd + 40]; // frames of something that happens
    t.mood('cheerful', action[0]); // the music turns here
    t.until(action[1] + 20);
    return {lineA, cut, lineB, action};
  },
  Component: ({m}) => {
    const f = useCurrentFrame();
    const progress = ease(f, m.action, [0, 1]); // 0 → 1 over those frames
    return (
      <Stage
        camera={cuts([
          {at: 0, shot: SINGLE},
          {at: m.cut, shot: GROUP},
        ])}
        time="day"
        overlay={
          <>
            <Speech cue={m.lineA} at={over(SECOND_SPOT)} />
            <Speech cue={m.lineB} at={over(FIRST_SPOT)} />
          </>
        }
      >
        {/* origin is a place id of the map, or a point [east, south] */}
        <World map={MAP} origin={[0, 0]} time="day" />
        <Character look={FIRST.look} position={FIRST_SPOT} facing={20} expr="neutral" talking={between(f, m.lineB.start, m.lineB.speechEnd)} />
        <Character look={SECOND.look} position={SECOND_SPOT} facing={-20} expr="neutral" talking={between(f, m.lineA.start, m.lineA.speechEnd)} />
        {/* Something only this scene has is drawn here from plain shapes and moved by the frame number. */}
        <mesh position={[OBJECT_SPOT[0], 0.15 + 0.5 * progress, OBJECT_SPOT[2]]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      </Stage>
    );
  },
});

export const SCENES: SceneDef[] = [scene1];
```

Next to it, `series/episodes/epNN/index.ts`:

```ts
import {defineEpisode} from '../../../src/engine/episode';
import {Line} from '../../../src/engine/lines';
import lines from './lines.json';
import {SCENES} from './scenes';

export const ep01 = defineEpisode({no: 1, title: '<the episode title>', lines: lines as Line[], scenes: SCENES});
```

and the episode is added to the list in `series/episodes/index.ts`.

What goes wrong most often:

- **Record before timing.** `t.say` uses the recorded length; a line with no recording counts as one second.
- **Facing.** 0 faces the camera in a shot that looks north; a character turned more than about 40 degrees away from the camera shows the back of the head in a close shot.
- **A single with someone else nearby.** Put the camera on the far side from the other character (`toward`), or move the other one out of frame for that shot.
- **Balloons.** `aboveHead` is the top of the head; `frameShot` keeps room above it. A hand-written shot needs that room left by hand.
- **Vertical series.** Use `frameShot` for anything with two or more characters; it keeps everyone in the tall frame.
