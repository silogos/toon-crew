# A scene, from top to bottom

A complete, working scene file (`series/episodes/epNN/scenes.tsx`). The names are the sample's (Ada, Ben, the square); use your own cast, places and line ids. It type-checks against the studio as written.

```tsx
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {between, ease} from '../../../src/engine/math';
import {SceneDef, defineScene} from '../../../src/engine/scene';
import {Character, aboveHead} from '../../../src/styles/3d/character';
import {frameShot} from '../../../src/styles/3d/framing';
import {Shot, Speech, Stage, Vec3, cuts} from '../../../src/styles/3d/stage';
import {World} from '../../../src/styles/3d/world';
import {ADA, BEN} from '../../cast';
import {MAP} from '../../world/map';

// Positions are local to the scene's origin (a place on the map): x to the right, y up, z toward the camera.
const ADA_SPOT: Vec3 = [-0.6, 0, 0.5];
const BEN_SPOT: Vec3 = [0.6, 0, 0.5];
const POT: Vec3 = [0, 0, 0.9];

// frameShot fits its subjects into the frame, landscape or vertical. `headroom` is the space kept above
// the heads for the balloon; `lift` raises the group in the picture (a vertical series lifts a little by itself).
const TWO: Shot = frameShot([{position: ADA_SPOT, height: 1.2}, {position: BEN_SPOT, height: 1.2}]);
// a single: frame one character, with the camera on the far side from the other so only one face shows
const CLOSE_BEN: Shot = frameShot([{position: BEN_SPOT, height: 1.2}], {toward: [0.5, 0.1, 1], margin: 1.1});

const over = (p: Vec3) => aboveHead(p, 'kid');

const scene1 = defineScene({
  music: 'cheerful',
  script: (t) => {
    // the script lays the scene out in time; every mark the picture needs is returned
    const hello = t.say('e1_s1_b1', {gap: 12});
    const cut = t.cut(); // camera cut: no balloon lingers across it
    const reply = t.say('e1_s1_a1');
    const sprout: [number, number] = [reply.speechEnd, reply.speechEnd + 40];
    t.mood('calm', sprout[0]); // the music turns here
    t.until(sprout[1] + 20);
    return {hello, cut, reply, sprout};
  },
  Component: ({m}) => {
    const f = useCurrentFrame();
    const grown = ease(f, m.sprout, [0, 1]); // 0 → 1 over those frames
    return (
      <Stage
        camera={cuts([
          {at: 0, shot: CLOSE_BEN},
          {at: m.cut, shot: TWO},
        ])}
        time="day"
        overlay={
          <>
            <Speech cue={m.hello} at={over(BEN_SPOT)} />
            <Speech cue={m.reply} at={over(ADA_SPOT)} />
          </>
        }
      >
        <World map={MAP} origin="square" time="day" />
        <Character look={ADA.look} position={ADA_SPOT} facing={20} expr="happy" talking={between(f, m.reply.start, m.reply.speechEnd)} />
        <Character look={BEN.look} position={BEN_SPOT} facing={-20} expr="worried" pose="think" talking={between(f, m.hello.start, m.hello.speechEnd)} />
        {/* something only this scene has is drawn here from plain shapes, moved by the frame number */}
        <group position={POT}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.22, 0.16, 0.3, 20]} />
            <meshStandardMaterial color="#c0603a" />
          </mesh>
          <mesh position={[0, 0.3 + 0.2 * grown, 0]} scale={[1, Math.max(0.01, grown), 1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            <meshStandardMaterial color="#4f9f58" />
          </mesh>
        </group>
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

export const ep01 = defineEpisode({no: 1, title: 'The Lost Book', lines: lines as Line[], scenes: SCENES});
```

and the episode is added to the list in `series/episodes/index.ts`.

Things that go wrong most often:

- **Record before timing.** `t.say` uses the recorded length; a line with no recording counts as one second.
- **Facing.** 0 faces the camera in a shot that looks north; a character turned more than about 40 degrees away from the camera shows the back of their head in a close shot.
- **A single with two people nearby.** Put the camera on the far side from the other character (`toward`), or move the other one out of the way for that shot.
- **Balloons.** `over(position)` is the top of the head; `frameShot` keeps room above it. A hand-written shot needs that room left by hand.
- **Vertical series.** Use `frameShot` for anything with two or more characters; it keeps everyone in the tall frame and lifts the group a little so the bottom is not empty ground.
