import React from 'react';
import {useCurrentFrame} from 'remotion';
import {between, ease} from '../../../src/engine/math';
import {MessageCard} from '../../../src/engine/card';
import {SceneDef, defineScene} from '../../../src/engine/scene';
import {Character, aboveHead} from '../../../src/styles/3d/character';
import {Shot, Speech, Stage, Vec3, cuts} from '../../../src/styles/3d/stage';
import {World} from '../../../src/styles/3d/world';
import {ADA, BEN} from '../../cast';
import {MAP} from '../../world/map';

// Episode 1 — The Lost Book. Storyboard: series/story/ep01-the-lost-book.md
//
// Both scenes play on the square. Coordinates are local to it: x to the right,
// z toward the camera. The camera never moves; shots are joined by cuts.

/** Where each of them stands when they talk. */
const ADA_SPOT: Vec3 = [-0.6, 0, 0.5];
const BEN_SPOT: Vec3 = [0.6, 0, 0.5];
const OFF_LEFT = -6.5;
const OFF_RIGHT = 6.5;

/** The three framings of the storyboard. */
const WIDE: Shot = {from: [0, 1.75, 8.4], to: [0, 0.95, 0], fov: 34};
const TWO: Shot = {from: [0, 1.1, 3.5], to: [0, 1.0, 0.5], fov: 30};
// each close shot is taken from the other character's side, so that only one face is in frame
const CLOSE_ADA: Shot = {from: [0.5, 1.02, 2.4], to: [ADA_SPOT[0], 1.02, 0.5], fov: 28};
const CLOSE_BEN: Shot = {from: [0.15, 1.2, 2.7], to: [BEN_SPOT[0] + 0.05, 0.9, 0.5], fov: 28};

const over = (p: Vec3) => aboveHead(p, 'kid');

/* ---------- Scene 1 — morning ---------- */

const scene1 = defineScene({
  music: 'cheerful',
  script: (t) => {
    // 1A wide: Ben alone, looking for his book; Ada walks in
    const intro = t.say('e1_s1_n', {gap: 20});
    const adaIn: [number, number] = [intro.start + 15, intro.speechEnd + 10];
    // 1B two-shot
    const cutB = t.cut(16);
    const gone = t.say('e1_s1_b1', {gap: 6});
    const plan = t.say('e1_s1_a1', {gap: 10});
    const chime = t.play('sfx_chime', plan.speechEnd - 10, 0.6);
    // 1C close on Ada
    const cutC = t.cut();
    const list = t.say('e1_s1_a2', {gap: 6});
    // 1D two-shot
    const cutD = t.cut();
    const ask = t.say('e1_s1_b2', {gap: 8});
    const yes = t.say('e1_s1_a3', {gap: 8});
    // 1E wide: they march off to the right
    const cutE = t.cut(14);
    const adaOut: [number, number] = [cutE + 4, cutE + 54];
    const benOut: [number, number] = [cutE + 16, cutE + 70];
    t.until(cutE + 84);
    return {intro, adaIn, cutB, gone, plan, chime, cutC, list, cutD, ask, yes, cutE, adaOut, benOut};
  },
  Component: ({m}) => {
    const f = useCurrentFrame();

    // Ada: walks in, talks, lists the places, marches off
    const leaving = f >= m.adaOut[0];
    const adaX = leaving ? ease(f, m.adaOut, [ADA_SPOT[0], OFF_RIGHT]) : ease(f, m.adaIn, [OFF_LEFT, ADA_SPOT[0]]);
    const ada: Vec3 = [adaX, 0, ADA_SPOT[2]];
    const adaWalking = between(f, m.adaIn[0], m.adaIn[1]) || between(f, m.adaOut[0], m.adaOut[1]);
    const third = (m.list.speechEnd - m.list.start) / 3;
    const beat = f < m.list.start ? -1 : Math.min(2, Math.floor((f - m.list.start) / third));
    const listing = between(f, m.cutC, m.cutD);
    const cheering = f >= m.yes.start && f < m.adaOut[0];
    const adaLines = [m.plan, m.list, m.yes];

    // Ben: looks around, tells her, follows her out
    const benLeaving = f >= m.benOut[0];
    const ben: Vec3 = [benLeaving ? ease(f, m.benOut, [BEN_SPOT[0], OFF_RIGHT]) : BEN_SPOT[0], 0, BEN_SPOT[2]];
    const benWalking = between(f, m.benOut[0], m.benOut[1]);
    const alone = f < m.adaIn[1];
    const benLines = [m.gone, m.ask];

    return (
      <Stage
        camera={cuts([
          {at: 0, shot: WIDE},
          {at: m.cutB, shot: TWO},
          {at: m.cutC, shot: CLOSE_ADA},
          {at: m.cutD, shot: TWO},
          {at: m.cutE, shot: WIDE},
        ])}
        time="day"
        overlay={
          <>
            <Speech cue={m.gone} at={over(ben)} />
            <Speech cue={m.plan} at={over(ada)} />
            <Speech cue={m.list} at={over(ada)} maxWidth={620} />
            <Speech cue={m.ask} at={over(ben)} />
            <Speech cue={m.yes} at={over(ada)} />
          </>
        }
      >
        <World map={MAP} origin="square" time="day" />
        <Character
          look={ADA.look}
          position={ada}
          walking={adaWalking}
          facing={adaWalking ? 90 : listing ? [-15, 100, 25][Math.max(0, beat)] : cheering ? 15 : 50}
          pose={adaWalking ? 'down' : listing ? (beat === 2 ? 'cheer' : 'point') : cheering ? 'cheer' : f >= m.plan.start ? 'hips' : 'down'}
          expr={cheering || (listing && beat === 2) ? 'laugh' : 'happy'}
          lookX={listing && beat === 1 ? -0.9 : 0}
          talking={adaLines}
        />
        <Character
          look={BEN.look}
          position={ben}
          walking={benWalking}
          facing={benWalking ? 90 : alone ? 0 : -35}
          pose="hold"
          prop="book"
          expr="worried"
          lookX={alone ? Math.sin(f * 0.12) * 0.9 : 0}
          talking={benLines}
        />
      </Stage>
    );
  },
});

/* ---------- Scene 2 — dusk ---------- */

const scene2 = defineScene({
  music: 'calm',
  tail: 30,
  script: (t) => {
    // 2A wide: they walk back in from the right
    const adaIn: [number, number] = [0, 62];
    const benIn: [number, number] = [10, 76];
    const looked = t.say('e1_s2_n', {at: 26});
    // 2B two-shot
    const cutB = t.until(Math.max(looked.speechEnd + 12, benIn[1] + 8));
    const count = t.say('e1_s2_a1', {gap: 8});
    const best = t.say('e1_s2_b1', {gap: 10});
    // 2C the two-shot holds: Ada notices
    const notice = t.wait(8);
    const what = t.say('e1_s2_a2', {gap: 10});
    // 2D close on Ben
    const cutD = t.cut();
    const oh = t.say('e1_s2_b2', {gap: 16});
    // 2E two-shot: laughing
    const cutE = t.cut(22);
    const chime = t.play('sfx_chime', cutE + 2, 0.6);
    const laugh = t.say('e1_s2_a3', {gap: 6});
    // 2F wide: still laughing, small on the square
    const cutF = t.cut(12);
    t.wait(45);
    return {adaIn, benIn, looked, cutB, count, best, notice, what, cutD, oh, cutE, chime, laugh, cutF};
  },
  Component: ({m}) => {
    const f = useCurrentFrame();

    const ada: Vec3 = [ease(f, m.adaIn, [OFF_RIGHT - 1.2, ADA_SPOT[0]]), 0, ADA_SPOT[2]];
    const ben: Vec3 = [ease(f, m.benIn, [OFF_RIGHT, BEN_SPOT[0]]), 0, BEN_SPOT[2]];
    const adaWalking = f < m.adaIn[1];
    const benWalking = f < m.benIn[1];

    const noticed = f >= m.notice;
    const found = f >= m.cutE;
    const adaLines = [m.count, m.what, m.laugh];
    const benLines = [m.best, m.oh];
    // Ben lowers his head to the book, then lifts it again
    const nod = ease(f, [m.cutD + 4, m.cutD + 14], [0, 0.6]) - ease(f, [m.oh.speechEnd + 2, m.oh.speechEnd + 10], [0, 0.6]);

    return (
      <Stage
        camera={cuts([
          {at: 0, shot: WIDE},
          {at: m.cutB, shot: TWO},
          {at: m.cutD, shot: CLOSE_BEN},
          {at: m.cutE, shot: TWO},
          {at: m.cutF, shot: WIDE},
        ])}
        time="dusk"
        overlay={
          <>
            <Speech cue={m.count} at={over(ada)} maxWidth={620} />
            <Speech cue={m.best} at={over(ben)} />
            <Speech cue={m.what} at={over(ada)} />
            <Speech cue={m.oh} at={over(ben)} />
            <Speech cue={m.laugh} at={over(ada)} />
          </>
        }
      >
        <World map={MAP} origin="square" time="dusk" />
        <Character
          look={ADA.look}
          position={ada}
          walking={adaWalking}
          facing={adaWalking ? -90 : found ? 25 : noticed ? 45 : 20}
          pose={adaWalking ? 'down' : found ? 'cheer' : noticed ? 'down' : f >= m.cutB ? 'think' : 'down'}
          expr={found ? 'laugh' : noticed ? 'surprised' : f >= m.cutB ? 'thinking' : 'sad'}
          lookX={noticed && !found ? 0.8 : 0}
          talking={adaLines}
        />
        <Character
          look={BEN.look}
          position={ben}
          walking={benWalking}
          facing={benWalking ? -90 : -20}
          pose="hold"
          prop="book"
          expr={found ? 'laugh' : f >= m.oh.speechEnd + 8 ? 'shy' : f >= m.cutD + 6 ? 'surprised' : 'sad'}
          lookY={nod}
          talking={benLines}
        />
      </Stage>
    );
  },
});

// 3 — the moral, on a card of its own (2D, in front of no picture)
const scene3 = defineScene({
  music: 'calm',
  tail: 45,
  script: (t) => ({moral: t.say('e1_s3_end_n', {gap: 18, caption: false})}),
  Component: ({m}) => <MessageCard cue={m.moral} heading="Today's lesson" />,
});

export const SCENES: SceneDef[] = [scene1, scene2, scene3];
