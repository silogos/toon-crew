import type {ThreeElements} from '@react-three/fiber';
import React from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {Build, CastMember, CharacterAction, CharacterLook, Expression, Hair, ModelCode, Pose, PropKind} from './look';
import {useMouth} from '../../engine/voice';
import {MODELS} from './model-spec';
import {GlbCharacter} from './models';
import type {Vec3} from './stage';

/* ---------- small building pieces ---------- */

type MeshProps = Omit<ThreeElements['mesh'], 'children'>;
const Mat: React.FC<{color: string; side?: THREE.Side}> = ({color, side}) => <meshStandardMaterial color={color} roughness={0.85} side={side} />;

const Ball: React.FC<MeshProps & {r: number; color: string}> = ({r, color, ...p}) => (
  <mesh castShadow {...p}>
    <sphereGeometry args={[r, 28, 20]} />
    <Mat color={color} />
  </mesh>
);
/** A cylinder; `top` is the radius at the top when it differs from the bottom. */
const Tube: React.FC<MeshProps & {r: number; top?: number; h: number; color: string}> = ({r, top, h, color, ...p}) => (
  <mesh castShadow {...p}>
    <cylinderGeometry args={[top ?? r, r, h, 24]} />
    <Mat color={color} />
  </mesh>
);
const Box: React.FC<MeshProps & {size: Vec3; color: string}> = ({size, color, ...p}) => (
  <mesh castShadow {...p}>
    <boxGeometry args={size} />
    <Mat color={color} />
  </mesh>
);
/** Part of a ring, lying flat facing the viewer: used for smiles, frowns and closed eyes. */
const Arc: React.FC<MeshProps & {r: number; thick: number; span?: number; color: string}> = ({r, thick, span = Math.PI, color, ...p}) => (
  <mesh {...p}>
    <torusGeometry args={[r, thick, 8, 20, span]} />
    <meshBasicMaterial color={color} />
  </mesh>
);
const Disc: React.FC<MeshProps & {r: number; color: string; from?: number; span?: number; opacity?: number}> = ({r, color, from = 0, span = Math.PI * 2, opacity = 1, ...p}) => (
  <mesh {...p}>
    <circleGeometry args={[r, 24, from, span]} />
    <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
  </mesh>
);

/** A colour made lighter (k > 1) or darker (k < 1), for trims, seams and shading. */
const shade = (color: string, k: number) => '#' + new THREE.Color(color).multiplyScalar(k).convertLinearToSRGB().getHexString();

/* ---------- proportions ---------- */

type Dims = {headR: number; torsoH: number; torsoR: number; legLen: number; legR: number; upper: number; fore: number; armR: number};
const DIMS: Record<Build, Dims> = {
  kid: {headR: 0.25, torsoH: 0.34, torsoR: 0.15, legLen: 0.26, legR: 0.055, upper: 0.15, fore: 0.14, armR: 0.042},
  adult: {headR: 0.24, torsoH: 0.58, torsoR: 0.19, legLen: 0.62, legR: 0.07, upper: 0.27, fore: 0.25, armR: 0.05},
  stout: {headR: 0.25, torsoH: 0.56, torsoR: 0.27, legLen: 0.56, legR: 0.08, upper: 0.26, fore: 0.24, armR: 0.058},
};
const SHOE = 0.05;

/** Standing height of a build, in metres. */
export const heightOf = (build: Build) => {
  const d = DIMS[build];
  return SHOE + d.legLen + d.torsoH + d.headR * 1.85;
};
/** Standing height of a cast member: the height asked for in series/models.json, or that of their build. */
export const heightOfMember = (m: Pick<CastMember, 'look' | 'model'>) => (m.model ? MODELS[m.model]?.height : undefined) ?? heightOf(m.look.build);
/** The point just above a character's head: where a speech balloon's tail should point. */
export const aboveHead = (position: Vec3, build: Build, scale = 1): Vec3 => [position[0], position[1] + (heightOf(build) + 0.1) * scale, position[2]];

/* ---------- faces ---------- */

type Eye = 'open' | 'wide' | 'half' | 'happy' | 'closed';
type Mouth = 'small' | 'smile' | 'grin' | 'smirk' | 'flat' | 'o' | 'wavy' | 'frown' | 'wail';
/** brow: tilt in radians, positive = inner ends down (stern), negative = inner ends up (sorry). */
type Face = {eye: Eye; mouth: Mouth; brow: number; browY: number; blush?: boolean; tears?: boolean; tilt?: number};

const FACES: Record<Expression, Face> = {
  neutral: {eye: 'open', mouth: 'small', brow: 0, browY: 0},
  happy: {eye: 'open', mouth: 'smile', brow: -0.06, browY: 0.012},
  laugh: {eye: 'happy', mouth: 'grin', brow: -0.1, browY: 0.02},
  smirk: {eye: 'half', mouth: 'smirk', brow: 0.18, browY: -0.004},
  shy: {eye: 'closed', mouth: 'small', brow: -0.22, browY: 0, blush: true, tilt: -0.1},
  thinking: {eye: 'open', mouth: 'flat', brow: 0.12, browY: 0.018, tilt: 0.12},
  surprised: {eye: 'wide', mouth: 'o', brow: 0, browY: 0.045},
  scared: {eye: 'wide', mouth: 'wavy', brow: -0.38, browY: 0.03},
  worried: {eye: 'open', mouth: 'frown', brow: -0.32, browY: 0.012},
  sad: {eye: 'half', mouth: 'frown', brow: -0.38, browY: 0},
  cry: {eye: 'closed', mouth: 'wail', brow: -0.42, browY: 0.008, tears: true},
  angry: {eye: 'open', mouth: 'frown', brow: 0.48, browY: -0.018},
};

const INK = '#2a1d1a';
const MOUTH_DARK = '#5a1f1f';

const EyeShape: React.FC<{kind: Eye; s: number}> = ({kind, s}) => {
  if (kind === 'happy') return <Arc r={0.036 * s} thick={0.01 * s} color={INK} position={[0, -0.012 * s, 0]} />;
  if (kind === 'closed') return <Arc r={0.036 * s} thick={0.009 * s} color={INK} rotation={[0, 0, Math.PI]} position={[0, 0.012 * s, 0]} />;
  if (kind === 'wide') {
    return (
      <>
        <Disc r={0.052 * s} color="#ffffff" />
        <Disc r={0.024 * s} color={INK} position={[0, 0, 0.002]} />
      </>
    );
  }
  const squash = kind === 'half' ? 0.62 : 1;
  return (
    <group scale={[1, squash, 1]}>
      <Disc r={0.036 * s} color={INK} scale={[1, 1.3, 1]} />
      <Disc r={0.011 * s} color="#ffffff" position={[0.012 * s, 0.018 * s, 0.002]} />
    </group>
  );
};

const MouthShape: React.FC<{kind: Mouth; s: number; open: number | null}> = ({kind, s, open}) => {
  // while talking, the mouth opens and closes over whatever expression is underneath
  if (open !== null && kind !== 'grin' && kind !== 'wail') {
    return <Disc r={0.042 * s} color={MOUTH_DARK} scale={[1, 0.22 + 0.78 * open, 1]} />;
  }
  const flap = open === null ? 1 : 0.55 + 0.45 * open;
  switch (kind) {
    case 'small':
      return <Arc r={0.034 * s} thick={0.009 * s} span={Math.PI * 0.8} color={INK} rotation={[0, 0, Math.PI * 1.1]} position={[0, 0.02 * s, 0]} />;
    case 'smile':
      return <Arc r={0.06 * s} thick={0.011 * s} color={INK} rotation={[0, 0, Math.PI]} position={[0, 0.03 * s, 0]} />;
    case 'grin':
      return (
        <group position={[0, 0.03 * s, 0]} scale={[1, flap, 1]}>
          <Disc r={0.072 * s} color={MOUTH_DARK} from={Math.PI} span={Math.PI} />
          <Disc r={0.036 * s} color="#f08a8a" from={Math.PI} span={Math.PI} position={[0, -0.03 * s, 0.002]} />
        </group>
      );
    case 'smirk':
      return <Arc r={0.05 * s} thick={0.01 * s} span={Math.PI * 0.65} color={INK} rotation={[0, 0, Math.PI * 1.3]} position={[0.012 * s, 0.03 * s, 0]} />;
    case 'flat':
      return <Disc r={0.01 * s} color={INK} scale={[4.2, 1, 1]} />;
    case 'o':
      return <Disc r={0.034 * s} color={MOUTH_DARK} scale={[0.9, 1.15, 1]} />;
    case 'wavy':
      return (
        <>
          <Disc r={0.009 * s} color={INK} scale={[2.6, 1, 1]} rotation={[0, 0, 0.35]} position={[-0.034 * s, 0, 0]} />
          <Disc r={0.009 * s} color={INK} scale={[2.6, 1, 1]} rotation={[0, 0, -0.35]} position={[0, 0, 0]} />
          <Disc r={0.009 * s} color={INK} scale={[2.6, 1, 1]} rotation={[0, 0, 0.35]} position={[0.034 * s, 0, 0]} />
        </>
      );
    case 'frown':
      return <Arc r={0.05 * s} thick={0.01 * s} color={INK} position={[0, -0.04 * s, 0]} />;
    case 'wail':
      return (
        <group position={[0, -0.04 * s, 0]} scale={[1, flap, 1]}>
          <Disc r={0.066 * s} color={MOUTH_DARK} from={0} span={Math.PI} />
        </group>
      );
  }
};

/* ---------- hair ---------- */

const HairShape: Record<Hair, React.FC<{R: number; color: string}>> = {
  none: () => null,
  short: ({R, color}) => (
    <mesh castShadow rotation={[-0.42, 0, 0]}>
      <sphereGeometry args={[R * 1.05, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      <Mat color={color} side={THREE.DoubleSide} />
    </mesh>
  ),
  spiky: ({R, color}) => (
    <>
      <HairShape.short R={R} color={color} />
      {[-0.5, -0.25, 0, 0.25, 0.5].map((a, i) => (
        <mesh key={i} castShadow position={[Math.sin(a) * R * 0.75, R * (0.98 - Math.abs(a) * 0.25), R * 0.12]} rotation={[0.35, 0, -a]}>
          <coneGeometry args={[R * 0.22, R * 0.5, 10]} />
          <Mat color={color} />
        </mesh>
      ))}
    </>
  ),
  bob: ({R, color}) => (
    <>
      <HairShape.short R={R} color={color} />
      {/* a shell around the sides and back, open at the face */}
      <mesh castShadow>
        <sphereGeometry args={[R * 1.09, 28, 18, Math.PI / 2 + 1.0, Math.PI * 2 - 2.0, 0, Math.PI * 0.74]} />
        <Mat color={color} side={THREE.DoubleSide} />
      </mesh>
    </>
  ),
  long: ({R, color}) => (
    <>
      <HairShape.bob R={R} color={color} />
      <mesh castShadow position={[0, -R * 0.75, -R * 0.42]} scale={[1, 1, 0.5]}>
        <capsuleGeometry args={[R * 0.72, R * 0.9, 6, 18]} />
        <Mat color={color} />
      </mesh>
    </>
  ),
  bun: ({R, color}) => (
    <>
      <HairShape.short R={R} color={color} />
      <Ball r={R * 0.36} color={color} position={[0, R * 1.02, -R * 0.35]} />
    </>
  ),
  curly: ({R, color}) => (
    <>
      <HairShape.short R={R} color={color} />
      {Array.from({length: 9}, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <Ball key={i} r={R * 0.3} color={color} position={[Math.cos(a) * R * 0.78, R * 0.62, Math.sin(a) * R * 0.78 - R * 0.12]} />;
      })}
      <Ball r={R * 0.34} color={color} position={[0, R * 0.95, -R * 0.05]} />
    </>
  ),
};

/* ---------- arms and poses ---------- */

/** [raise forward, raise sideways, bend elbow forward, bend elbow inward], in radians. */
type Arm = [number, number, number, number];
const REST: Arm = [0, 0.1, 0.15, 0];
/** `right` and `left` are the character's own right and left. */
const POSE_ARMS: Record<Pose, {right: Arm; left: Arm}> = {
  down: {right: REST, left: REST},
  wave: {right: [0, 2.5, 0, 0.4], left: REST},
  point: {right: [1.45, 0.05, 0.05, 0], left: REST},
  // at something overhead: a kite, a ball in a tree
  pointUp: {right: [2.3, 0.55, 0.05, 0], left: REST},
  hips: {right: [-0.15, 0.85, 0, 1.75], left: [-0.15, 0.85, 0, 1.75]},
  cheer: {right: [0, 2.25, 0, -0.35], left: [0, 2.25, 0, -0.35]},
  think: {right: [0.75, 0.05, 2.3, 0.2], left: [0.2, 0.1, 1.5, 0.9]},
  shrug: {right: [0.25, 0.45, 1.5, -0.3], left: [0.25, 0.45, 1.5, -0.3]},
  cover: {right: [1.55, -0.15, 1.75, 0.45], left: [1.55, -0.15, 1.75, 0.45]},
  hold: {right: [0.55, 0, 1.35, 0.25], left: [0.55, 0, 1.35, 0.25]},
  reach: {right: [2.7, 0.15, 0.1, 0], left: [0, 0.25, 0.15, 0]},
};

/* ---------- props ---------- */

const PROP_SHAPES: Record<PropKind, React.FC | null> = {
  none: null,
  book: () => (
    // held against the chest with the cover toward the viewer
    <group position={[0.09, -0.03, 0.02]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
      <Box size={[0.19, 0.24, 0.035]} color="#3d7dca" />
      <Box size={[0.175, 0.225, 0.026]} color="#fdfaf0" position={[0.012, 0, 0]} />
    </group>
  ),
  ball: () => <Ball r={0.1} color="#ff7a3d" position={[0, -0.1, 0.03]} />,
  stick: () => <Tube r={0.012} h={0.7} color="#8a5a2b" position={[0, 0.18, 0]} />,
  cup: () => (
    <group position={[0, 0.02, 0.05]}>
      <Tube r={0.035} top={0.042} h={0.08} color="#ffffff" />
      <mesh position={[0.045, 0, 0]}>
        <torusGeometry args={[0.022, 0.007, 8, 16]} />
        <Mat color="#ffffff" />
      </mesh>
    </group>
  ),
  basket: () => (
    <group position={[0, -0.13, 0.02]}>
      <Tube r={0.1} top={0.13} h={0.11} color="#c79a55" />
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[0.12, 0.01, 8, 20, Math.PI]} />
        <Mat color="#a87c3e" />
      </mesh>
    </group>
  ),
  flower: () => (
    <group position={[0, 0.02, 0]}>
      <Tube r={0.008} h={0.26} color="#4f9a4a" position={[0, 0.1, 0]} />
      <Ball r={0.03} color="#ffd34d" position={[0, 0.25, 0]} />
      {Array.from({length: 6}, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <Ball key={i} r={0.03} color="#ff8fb3" position={[Math.cos(a) * 0.045, 0.25 + Math.sin(a) * 0.045, 0]} />;
      })}
    </group>
  ),
};
const isPropKind = (p: unknown): p is PropKind => typeof p === 'string' && p in PROP_SHAPES;

/* ---------- the character ---------- */

export type CharacterProps = CharacterAction & {
  look: CharacterLook;
  /** draw the character from this .glb model (a code from series/models.json) instead of from code; expressions, props and accessories do not apply */
  model?: ModelCode;
  /** for a model character in review pictures: play this animation, and hold it at this point of its length (0 to 1) */
  clip?: string;
  clipPhase?: number;
  /** where the feet are */
  position?: Vec3;
  /** which way they face, in degrees: 0 = toward the south (a camera looking north), 90 = east, -90 = west */
  facing?: number;
  scale?: number;
};

const CodeCharacter: React.FC<CharacterProps> = ({
  look,
  position = [0, 0, 0],
  facing = 0,
  scale = 1,
  expr = 'neutral',
  pose = 'down',
  prop = 'none',
  talking = false,
  walking = false,
  lookX = 0,
  lookY = 0,
}) => {
  const f = useCurrentFrame();
  const {speaking, open} = useMouth(talking);
  const d = DIMS[look.build];
  const s = d.headR / 0.25;
  const face = FACES[expr];
  const R = d.headR;

  const hipY = SHOE + d.legLen;
  const shoulderY = hipY + d.torsoH - d.armR * 0.6;
  const headY = hipY + d.torsoH + R * 0.85;
  const topR = d.torsoR * 0.82;

  const stride = walking ? Math.sin(f * 0.36) : 0;
  const bob = walking ? Math.abs(Math.cos(f * 0.36)) * 0.025 : speaking ? Math.sin(f * 0.5) * 0.004 : 0;

  // a point on the front of the head, with the shape turned to lie on the surface
  const onFace = (x: number, y: number, lift = 0.004) => {
    const z = Math.sqrt(Math.max(0.0001, R * R - x * x - y * y)) + lift;
    return {position: [x, y, z] as Vec3, rotation: [-Math.asin(y / R) * 0.9, Math.asin(x / R) * 0.9, 0] as Vec3};
  };

  const arm = (side: 1 | -1, a: Arm) => {
    let [pitch, roll, elbow, inward] = a;
    if (walking && pose === 'down') pitch += stride * 0.5 * side;
    if (pose === 'wave' && side === -1) roll += Math.sin(f * 0.45) * 0.22;
    const holding = side === -1 && prop !== 'none' && prop != null;
    const Shape = isPropKind(prop) ? PROP_SHAPES[prop] : null;
    return (
      <group position={[side * (topR + d.armR * 0.5), shoulderY, 0]} rotation={[-pitch, 0, side * roll]}>
        <Ball r={d.armR * 1.15} color={look.topColor} />
        <Tube r={d.armR} h={d.upper} color={look.topColor} position={[0, -d.upper / 2, 0]} />
        <mesh castShadow position={[0, -d.upper + d.armR * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[d.armR * 1.02, d.armR * 0.28, 8, 20]} />
          <Mat color={look.top === 'plain' ? shade(look.topColor, 0.82) : look.topAccent} />
        </mesh>
        <group position={[0, -d.upper, 0]} rotation={[-elbow, 0, -side * inward]}>
          <Ball r={d.armR * 1.1} color={look.skin} />
          <Tube r={d.armR * 0.92} h={d.fore} color={look.skin} position={[0, -d.fore / 2, 0]} />
          <group position={[0, -d.fore, 0]}>
            <Ball r={d.armR * 1.3} color={look.skin} />
            <Ball r={d.armR * 0.6} color={look.skin} position={[-side * d.armR * 1.0, d.armR * 0.35, d.armR * 0.75]} />
            {holding && (
              <group scale={s}>
                {Shape ? <Shape /> : !isPropKind(prop) ? prop : null}
              </group>
            )}
            {side === -1 && look.accessories?.filter((x) => x.on === 'hand').map((x, i) => <group key={i}>{x.node}</group>)}
          </group>
        </group>
      </group>
    );
  };

  const leg = (side: 1 | -1) => {
    const trousers = look.bottom === 'pants';
    return (
      <group position={[side * d.torsoR * 0.45, hipY, 0]} rotation={[-stride * 0.55 * side, 0, 0]}>
        <Tube r={d.legR} h={d.legLen} color={trousers ? look.bottomColor : look.skin} position={[0, -d.legLen / 2, 0]} />
        {look.bottom === 'shorts' && <Tube r={d.legR * 1.4} h={d.legLen * 0.45} color={look.bottomColor} position={[0, -d.legLen * 0.225, 0]} />}
        {look.bottom === 'shorts' && <Tube r={d.legR * 1.46} h={d.legLen * 0.07} color={shade(look.bottomColor, 0.78)} position={[0, -d.legLen * 0.425, 0]} />}
        {/* a sneaker: coloured upper, pale sole, a toe cap and a lace strip */}
        <group position={[0, -d.legLen, d.legR * 0.9]}>
          <Ball r={d.legR * 1.5} color={look.shoeColor} scale={[1, 0.62, 1.7]} position={[0, 0.01, 0]} />
          <Ball r={d.legR * 1.52} color={look.shoeSole ?? '#f3efe6'} scale={[1, 0.24, 1.74]} position={[0, -0.02, 0]} />
          <Ball r={d.legR * 0.95} color={look.shoeSole ?? '#f3efe6'} scale={[1, 0.5, 0.85]} position={[0, 0.0, d.legR * 1.45]} />
          <Box size={[d.legR * 0.7, d.legR * 0.12, d.legR * 1.1]} color={shade(look.shoeColor, 0.8)} position={[0, d.legR * 0.78, d.legR * 0.1]} />
        </group>
      </group>
    );
  };

  const dress = look.top === 'dress';
  const Hairdo = HairShape[look.hair];
  const eyeX = 0.098 * s;
  const eyeY = 0.015 * s;

  return (
    <group position={[position[0], position[1] + bob, position[2]]} rotation={[0, (facing * Math.PI) / 180, 0]} scale={scale}>
      {leg(1)}
      {leg(-1)}

      {/* body */}
      {dress ? (
        <Tube r={d.torsoR * 1.6} top={topR} h={d.torsoH + d.legLen * 0.45} color={look.topColor} position={[0, hipY + d.torsoH / 2 - d.legLen * 0.225, 0]} />
      ) : (
        <>
          <Tube r={d.torsoR} top={topR} h={d.torsoH} color={look.topColor} position={[0, hipY + d.torsoH / 2, 0]} />
          <Ball r={d.torsoR * 1.08} color={look.bottomColor} scale={[1, 0.5, 1]} position={[0, hipY, 0]} />
        </>
      )}
      <Ball r={topR} color={look.topColor} scale={[1, 0.5, 1]} position={[0, hipY + d.torsoH, 0]} />
      {!dress && <Tube r={d.torsoR * 1.03} h={d.torsoH * 0.09} color={shade(look.topColor, 0.82)} position={[0, hipY + d.torsoH * 0.055, 0]} />}
      {look.top !== 'collar' && (
        <mesh position={[0, hipY + d.torsoH + 0.012 * s, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[topR * 0.58, 0.02 * s, 8, 24]} />
          <Mat color={shade(look.topColor, 0.8)} />
        </mesh>
      )}
      {look.bottom === 'skirt' && !dress && (
        <Tube r={d.torsoR * 1.6} top={d.torsoR * 1.12} h={d.legLen * 0.5} color={look.bottomColor} position={[0, hipY - d.legLen * 0.2, 0]} />
      )}
      {look.top === 'stripe' &&
        [0.22, 0.5, 0.78].map((t) => (
          <Tube key={t} r={d.torsoR + (topR - d.torsoR) * (t - 0.07) + 0.004} top={d.torsoR + (topR - d.torsoR) * (t + 0.07) + 0.004} h={d.torsoH * 0.14} color={look.topAccent} position={[0, hipY + d.torsoH * t, 0]} />
        ))}
      {look.top === 'collar' && (
        <>
          <mesh position={[0, hipY + d.torsoH + 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[topR * 0.62, 0.028 * s, 8, 24]} />
            <Mat color={look.topAccent} />
          </mesh>
          {[0.72, 0.5].map((t) => (
            <Ball key={t} r={0.016 * s} color={look.topAccent} position={[0, hipY + d.torsoH * t, d.torsoR + (topR - d.torsoR) * t + 0.004]} />
          ))}
        </>
      )}
      {look.accessories?.filter((x) => x.on === 'body').map((x, i) => (
        <group key={i} position={[0, hipY + d.torsoH, 0]}>
          {x.node}
        </group>
      ))}

      {arm(1, POSE_ARMS[pose].left)}
      {arm(-1, POSE_ARMS[pose].right)}

      {/* head */}
      <group position={[0, headY, 0]} rotation={[lookY * 0.45, lookX * 0.55, face.tilt ?? 0]}>
        <Ball r={R} color={look.skin} />
        {/* hair that falls over the sides covers the ears */}
        {look.hair !== 'bob' && look.hair !== 'long' && (
          <>
            {([1, -1] as const).map((side) => (
              <group key={side} position={[side * R * 0.97, -0.02 * s, 0]}>
                <Ball r={R * (look.bigEars ? 0.27 : 0.2)} color={look.skin} scale={look.bigEars ? [0.55, 1, 0.9] : [1, 1, 1]} />
                {look.bigEars && <Ball r={R * 0.13} color={shade(look.skin, 0.82)} scale={[0.4, 1, 0.9]} position={[side * R * 0.05, 0, R * 0.04]} />}
              </group>
            ))}
          </>
        )}
        <Hairdo R={R} color={look.hairColor} />

        {([1, -1] as const).map((side) => (
          <React.Fragment key={side}>
            <group {...onFace(side * eyeX, eyeY)}>
              <EyeShape kind={face.eye} s={s} />
            </group>
            <group {...onFace(side * eyeX, eyeY + (0.085 + face.browY) * s, 0.006)}>
              <Disc r={0.011 * s} color={look.hair === 'none' ? INK : look.hairColor} scale={[4, 1, 1]} rotation={[0, 0, side * face.brow]} />
            </group>
            {(look.blush || face.blush) && (
              <group {...onFace(side * 0.145 * s, -0.06 * s, 0.003)}>
                <Disc r={0.034 * s} color="#ff7d7d" opacity={face.blush ? 0.6 : 0.3} />
              </group>
            )}
            {face.tears && (
              <group {...onFace(side * eyeX, eyeY - 0.07 * s, 0.01)}>
                <Disc r={0.02 * s} color="#6ec3ff" scale={[0.8, 1.5 + 0.4 * Math.sin(f * 0.4 + side), 1]} />
              </group>
            )}
            {look.glasses && (
              <group {...onFace(side * eyeX, eyeY, 0.02)}>
                <mesh>
                  <torusGeometry args={[0.058 * s, 0.008 * s, 8, 24]} />
                  <meshBasicMaterial color={INK} />
                </mesh>
              </group>
            )}
          </React.Fragment>
        ))}
        {look.glasses && (
          <group {...onFace(0, eyeY, 0.02)}>
            <Disc r={0.007 * s} color={INK} scale={[6, 1, 1]} />
          </group>
        )}
        {look.nose && (
          <group {...onFace(0, -0.04 * s, 0.002)}>
            <Ball r={R * 0.075} color={shade(look.skin, 0.94)} scale={[1, 0.85, 0.8]} />
          </group>
        )}
        <group {...onFace(0, -0.1 * s, 0.006)}>
          <MouthShape kind={face.mouth} s={s} open={open} />
        </group>
        {look.accessories?.filter((x) => x.on === 'head').map((x, i) => (
          <group key={i}>{x.node}</group>
        ))}
      </group>
    </group>
  );
};

/** One character: drawn from a .glb model when the cast member has one, otherwise built from code. */
export const Character: React.FC<CharacterProps> = (props) =>
  props.model ? <ModelCharacter {...props} /> : <CodeCharacter {...props} />;

/** A model has no mouth to move: it plays its talk animation while a line plays. */
const ModelCharacter: React.FC<CharacterProps> = (props) => {
  const {speaking} = useMouth(props.talking);
  return (
    <GlbCharacter model={props.model!} position={props.position} facing={props.facing} scale={props.scale} pose={props.pose} talking={speaking} walking={props.walking} clip={props.clip} clipPhase={props.clipPhase} />
  );
};
