import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {CAST} from '../../../series/cast';
import {MAP} from '../../../series/world/map';
import {FONT} from '../../engine/overlay';
import {SERIES} from '../../engine/series';
import {Character, heightOfMember} from './character';
import {CastMember, EXPRESSIONS, POSES} from './look';
import {modelFilesOf} from './model-spec';
import {clipNamesOf, useModelsReady} from './models';
import {Label, Shot, Stage, TIMES, Vec3} from './stage';
import {World} from './world';

/**
 * Review pictures for the Director and for quality control: the cast side by side,
 * one character's reference sheet, the labelled map, and named viewpoints of the world.
 * They are built from the series' cast and map, so new characters and places appear here
 * without touching this file.
 */

const FOV = 22;
/** A camera straight in front of a flat area `w` wide and `h` high centred on `centre`, far enough to fit it. */
const frontOn = (centre: Vec3, w: number, h: number, aspect: number): Shot => {
  const t = Math.tan((FOV * Math.PI) / 360);
  const distance = Math.max(h / 2 / t, w / 2 / (t * aspect));
  return {from: [centre[0], centre[1], centre[2] + distance], to: centre, fov: FOV};
};

const Title: React.FC<{children: React.ReactNode; bottom?: boolean}> = ({children, bottom = false}) => {
  const k = useVideoConfig().width / 1920;
  return (
    <div style={{position: 'absolute', [bottom ? 'bottom' : 'top']: 28 * k, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontSize: 40 * k, fontWeight: 800, color: '#222'}}>
      {children}
    </div>
  );
};
const Backdrop: React.FC = () => (
  <mesh position={[0, 0, -3]}>
    <planeGeometry args={[400, 400]} />
    <meshBasicMaterial color="#f3ead8" />
  </mesh>
);

/* ---------- cast line-up ---------- */

const Lineup: React.FC = () => {
  const {width, height} = useVideoConfig();
  const gap = 1.05;
  const x = (i: number) => (i - (CAST.length - 1) / 2) * gap;
  const tallest = Math.max(1, ...CAST.map((m) => heightOfMember(m)));
  const shot = frontOn([0, tallest / 2 - 0.1, 0], CAST.length * gap + 0.4, tallest + 1.1, width / height);
  return (
    <Stage
      camera={shot}
      overlay={
        <>
          <Title>{SERIES.title} · cast</Title>
          {CAST.map((m, i) => (
            <React.Fragment key={m.id}>
              <Label at={[x(i), -0.2, 0]} size={30}>{m.name}</Label>
              <Label at={[x(i), -0.42, 0]} size={20} plain>{m.main ? 'main' : 'occasional'} · {m.id}</Label>
            </React.Fragment>
          ))}
        </>
      }
    >
      <Backdrop />
      {CAST.map((m, i) => (
        <Character key={m.id} look={m.look} model={m.model} position={[x(i), 0, 0]} {...m.signature} clipPhase={0.4} />
      ))}
    </Stage>
  );
};

/* ---------- one character's reference sheet ---------- */

const ids = CAST.map((m) => m.id);
export const sheetSchema = z.object({
  id: z.enum(ids.length ? (ids as [string, ...string[]]) : ['none']),
  mode: z.enum(['expressions', 'poses', 'clips']),
});

const Sheet: React.FC<z.infer<typeof sheetSchema>> = ({id, mode}) => {
  const {width, height} = useVideoConfig();
  const member: CastMember | undefined = CAST.find((m) => m.id === id);
  if (!member) throw new Error(`There is no cast member with the id "${id}". The cast: ${ids.join(', ') || 'empty'}.`);
  const ready = useModelsReady(modelFilesOf([member.model]));
  if (!ready) return null;
  if (member.model && mode === 'expressions') throw new Error(`${member.name} is drawn from a model, which has no expressions. Use "poses" or "clips".`);
  if (!member.model && mode === 'clips') throw new Error(`${member.name} is drawn from code and has no animation clips. Use "expressions" or "poses".`);
  const names: readonly string[] = mode === 'expressions' ? EXPRESSIONS : mode === 'poses' ? POSES : clipNamesOf(member.model!);
  const cols = mode === 'expressions' ? 4 : 5;
  const rows = Math.ceil(names.length / cols);
  const tall = heightOfMember(member);
  // clip names are long and some clips jump or float, so a clip sheet needs wider and taller cells
  const cellW = mode === 'clips' ? Math.max(2.2, tall * 1.3) : Math.max(1.0, tall * 0.75);
  const cellH = mode === 'clips' ? tall + 1.0 : tall + 0.55;
  const at = (i: number): Vec3 => [((i % cols) - (cols - 1) / 2) * cellW, (rows - 1 - Math.floor(i / cols)) * cellH, 0];
  const shot = frontOn([0, (rows * cellH) / 2 - 0.25, 0], cols * cellW, rows * cellH + 0.5, width / height);
  // on the pose sheet, the pose that carries something shows the character's own prop
  const propFor = (pose: string) => (pose === 'hold' ? (member.signature.prop ?? 'book') : undefined);
  return (
    <Stage
      camera={shot}
      overlay={
        <>
          <Title>{member.name} · {mode}</Title>
          {names.map((n, i) => {
            const p = at(i);
            return <Label key={n} at={[p[0], p[1] - 0.17, 0]} size={mode === 'clips' ? 20 : 24}>{n}</Label>;
          })}
        </>
      }
    >
      <Backdrop />
      {names.map((n, i) =>
        mode === 'expressions' ? (
          <Character key={n} look={member.look} model={member.model} position={at(i)} expr={n as (typeof EXPRESSIONS)[number]} />
        ) : mode === 'poses' ? (
          <Character key={n} look={member.look} model={member.model} position={at(i)} pose={n as (typeof POSES)[number]} prop={propFor(n)} expr="happy" clipPhase={0.4} />
        ) : (
          // a model character's clips, each held part-way through, so the sheet shows the movement and not just the start
          <Character key={n} look={member.look} model={member.model} position={at(i)} clip={n} clipPhase={0.4} />
        ),
      )}
    </Stage>
  );
};

/* ---------- the labelled map, from above ---------- */

const MapView: React.FC = () => {
  const {width, height} = useVideoConfig();
  const [w, d] = MAP.size;
  const t = Math.tan((30 * Math.PI) / 360);
  const up = Math.max(d / 2 / t, w / 2 / (t * (width / height))) * 1.08;
  // a hair south of straight down, so north is at the top of the picture
  const shot: Shot = {from: [0, up, 0.01], to: [0, 0, 0], fov: 30};
  return (
    <Stage
      camera={shot}
      fog={false}
      overlay={
        <>
          {/* at the bottom: places at the north edge put their labels where a top title would be */}
          <Title bottom>{SERIES.title} · map (north is up)</Title>
          {Object.entries(MAP.places).map(([id, p]) => {
            const place = p as {label: string; at: [number, number]};
            return <Label key={id} at={[place.at[0], 4, place.at[1]]} size={26}>{place.label} · {id}</Label>;
          })}
        </>
      }
    >
      <World map={MAP} />
    </Stage>
  );
};

/* ---------- a named viewpoint ---------- */

const viewNames = Object.keys(MAP.viewpoints);
export const viewSchema = z.object({
  from: z.enum(viewNames.length ? (viewNames as [string, ...string[]]) : ['none']),
  time: z.enum(TIMES as unknown as [string, ...string[]]),
});
const View: React.FC<z.infer<typeof viewSchema>> = ({from, time}) => {
  const shot = MAP.viewpoints[from];
  if (!shot) throw new Error(`There is no viewpoint called "${from}". Viewpoints: ${viewNames.join(', ') || 'none yet'}.`);
  const t = time as (typeof TIMES)[number];
  return (
    <Stage camera={shot} time={t}>
      <World map={MAP} time={t} />
    </Stage>
  );
};

export type ReviewComposition = {id: string; component: React.FC<any>; schema: z.ZodObject<any>; defaultProps: Record<string, unknown>};
const none = z.object({});

export const REVIEW: ReviewComposition[] = [
  {id: 'cast', component: Lineup, schema: none, defaultProps: {}},
  {id: 'sheet', component: Sheet, schema: sheetSchema, defaultProps: {id: ids[0] ?? 'none', mode: 'expressions'}},
  {id: 'map', component: MapView, schema: none, defaultProps: {}},
  {id: 'view', component: View, schema: viewSchema, defaultProps: {from: viewNames[0] ?? 'none', time: 'day'}},
];
