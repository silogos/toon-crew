import type {ThreeElements} from '@react-three/fiber';
import React from 'react';
import * as THREE from 'three';
import type {TimeOfDay, Vec3} from './stage';

/**
 * Building blocks for places. Each sits on the ground at its own origin and faces
 * south (+z); a place puts blocks together and the world puts places on the map.
 * Blocks that take `time` light up at dusk and at night.
 */

type GroupProps = Omit<ThreeElements['group'], 'children'>;
const lit = (time: TimeOfDay | undefined) => time === 'dusk' || time === 'night';

const Solid: React.FC<{color: string; glow?: number}> = ({color, glow = 0}) => (
  <meshStandardMaterial color={color} roughness={0.9} emissive={glow ? color : '#000000'} emissiveIntensity={glow} />
);
const Block: React.FC<Omit<ThreeElements['mesh'], 'children'> & {size: Vec3; color: string; glow?: number}> = ({size, color, glow, ...p}) => (
  <mesh castShadow receiveShadow {...p}>
    <boxGeometry args={size} />
    <Solid color={color} glow={glow} />
  </mesh>
);

/** The ground of the whole world. */
export const Ground: React.FC<{size?: [number, number]; color?: string}> = ({size = [200, 200], color = '#8fcf7a'}) => (
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={size} />
    <Solid color={color} />
  </mesh>
);

/** A flat strip between two points on the ground: a road, a path, a square. */
export const Road: React.FC<{from: [number, number]; to: [number, number]; width?: number; color?: string}> = ({from, to, width = 3, color = '#d9c9a3'}) => {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  return (
    <mesh receiveShadow position={[(from[0] + to[0]) / 2, 0.01, (from[1] + to[1]) / 2]} rotation={[-Math.PI / 2, 0, Math.atan2(dx, dz)]}>
      <planeGeometry args={[width, length + width]} />
      <Solid color={color} />
    </mesh>
  );
};

/** A flat round or square patch on the ground. */
export const Patch: React.FC<GroupProps & {size: [number, number]; color: string}> = ({size, color, ...p}) => (
  <group {...p}>
    <mesh receiveShadow position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <Solid color={color} />
    </mesh>
  </group>
);

/** A house with a pitched roof, a door and two windows on the front. */
export const House: React.FC<GroupProps & {w?: number; d?: number; h?: number; wall?: string; roof?: string; door?: string; time?: TimeOfDay}> = ({
  w = 5,
  d = 4,
  h = 2.8,
  wall = '#f3e3c3',
  roof = '#c2553f',
  door = '#5b7fb5',
  time,
  ...p
}) => {
  const glow = lit(time) ? 1.6 : 0;
  const rise = w * 0.32;
  const slope = Math.hypot(w / 2 + 0.35, rise);
  const angle = Math.atan2(rise, w / 2 + 0.35);
  return (
    <group {...p}>
      <Block size={[w, h, d]} color={wall} position={[0, h / 2, 0]} />
      {/* gable ends */}
      {[1, -1].map((s) => (
        <mesh key={s} castShadow position={[0, h, (s * d) / 2 - s * 0.01]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <shapeGeometry args={[gable(w, rise)]} />
          <Solid color={wall} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <Block key={s} size={[slope, 0.14, d + 0.7]} color={roof} position={[(s * (w / 2 + 0.35)) / 2, h + rise / 2 + 0.05, 0]} rotation={[0, 0, -s * angle]} />
      ))}
      <Block size={[0.95, 1.9, 0.08]} color={door} position={[0, 0.95, d / 2 + 0.03]} />
      {[1, -1].map((s) => (
        <group key={s} position={[s * w * 0.3, h * 0.56, d / 2 + 0.03]}>
          <Block size={[0.95, 0.95, 0.06]} color="#ffffff" />
          <Block size={[0.78, 0.78, 0.08]} color={glow ? '#ffd98a' : '#9cc9e8'} glow={glow} />
        </group>
      ))}
    </group>
  );
};

const gable = (w: number, rise: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, rise);
  s.closePath();
  return s;
};

/** A flat-roofed shop with a striped awning and an open counter. */
export const Shop: React.FC<GroupProps & {w?: number; d?: number; h?: number; wall?: string; awning?: string; time?: TimeOfDay}> = ({
  w = 4.5,
  d = 3.5,
  h = 2.6,
  wall = '#ffe9b8',
  awning = '#e0584f',
  time,
  ...p
}) => {
  const glow = lit(time) ? 1.4 : 0;
  const stripes = 7;
  return (
    <group {...p}>
      <Block size={[w, h, d]} color={wall} position={[0, h / 2, 0]} />
      <Block size={[w + 0.3, 0.18, d + 0.3]} color="#b98a5a" position={[0, h + 0.09, 0]} />
      <Block size={[w * 0.72, 1.05, 0.08]} color={glow ? '#ffd98a' : '#6a4a35'} glow={glow} position={[0, 1.55, d / 2 + 0.03]} />
      <Block size={[w * 0.8, 0.12, 0.6]} color="#a87c4f" position={[0, 0.98, d / 2 + 0.3]} />
      <Block size={[w * 0.8, 0.95, 0.1]} color="#c79a66" position={[0, 0.48, d / 2 + 0.55]} />
      {Array.from({length: stripes}, (_, i) => (
        <Block
          key={i}
          size={[(w + 0.2) / stripes, 0.06, 1.25]}
          color={i % 2 ? '#ffffff' : awning}
          position={[-(w + 0.2) / 2 + ((i + 0.5) * (w + 0.2)) / stripes, h - 0.38, d / 2 + 0.55]}
          rotation={[0.38, 0, 0]}
        />
      ))}
    </group>
  );
};

/** A tree: round and leafy, or a pointed pine. */
export const Tree: React.FC<GroupProps & {kind?: 'round' | 'pine'; h?: number; leaves?: string}> = ({kind = 'round', h = 4, leaves = '#5fae5a', ...p}) => (
  <group {...p}>
    <mesh castShadow position={[0, h * 0.22, 0]}>
      <cylinderGeometry args={[h * 0.045, h * 0.065, h * 0.44, 10]} />
      <Solid color="#8a5a3a" />
    </mesh>
    {kind === 'round' ? (
      <>
        <mesh castShadow position={[0, h * 0.66, 0]}>
          <sphereGeometry args={[h * 0.3, 18, 14]} />
          <Solid color={leaves} />
        </mesh>
        <mesh castShadow position={[h * 0.17, h * 0.55, h * 0.06]}>
          <sphereGeometry args={[h * 0.2, 16, 12]} />
          <Solid color={leaves} />
        </mesh>
        <mesh castShadow position={[-h * 0.16, h * 0.57, -h * 0.05]}>
          <sphereGeometry args={[h * 0.21, 16, 12]} />
          <Solid color={leaves} />
        </mesh>
      </>
    ) : (
      [0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[0, h * (0.5 + i * 0.17), 0]}>
          <coneGeometry args={[h * (0.26 - i * 0.06), h * 0.34, 12]} />
          <Solid color={leaves} />
        </mesh>
      ))
    )}
  </group>
);

export const Bush: React.FC<GroupProps & {r?: number; color?: string}> = ({r = 0.5, color = '#6dbb62', ...p}) => (
  <group {...p}>
    {[[0, 0], [r * 0.7, 0.1], [-r * 0.65, -0.05]].map(([x, z], i) => (
      <mesh key={i} castShadow position={[x, r * (i ? 0.5 : 0.65), z]}>
        <sphereGeometry args={[r * (i ? 0.62 : 0.8), 14, 10]} />
        <Solid color={color} />
      </mesh>
    ))}
  </group>
);

export const Rock: React.FC<GroupProps & {r?: number}> = ({r = 0.35, ...p}) => (
  <group {...p}>
    <mesh castShadow position={[0, r * 0.45, 0]} scale={[1.2, 0.75, 1]}>
      <dodecahedronGeometry args={[r, 0]} />
      <Solid color="#a9a59b" />
    </mesh>
  </group>
);

/** A picket fence running east from its origin. */
export const Fence: React.FC<GroupProps & {length?: number; color?: string}> = ({length = 4, color = '#ffffff', ...p}) => {
  const n = Math.max(2, Math.round(length / 0.35));
  return (
    <group {...p}>
      {Array.from({length: n}, (_, i) => (
        <Block key={i} size={[0.1, 0.75, 0.04]} color={color} position={[(i / (n - 1)) * length, 0.375, 0]} />
      ))}
      <Block size={[length, 0.07, 0.03]} color={color} position={[length / 2, 0.55, -0.03]} />
      <Block size={[length, 0.07, 0.03]} color={color} position={[length / 2, 0.25, -0.03]} />
    </group>
  );
};

/** A street lamp. It shines at dusk and at night. */
export const Lamp: React.FC<GroupProps & {h?: number; time?: TimeOfDay}> = ({h = 3.2, time, ...p}) => {
  const on = lit(time);
  return (
    <group {...p}>
      <mesh castShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, h, 10]} />
        <Solid color="#3f4a5a" />
      </mesh>
      <mesh position={[0, h + 0.12, 0]}>
        <sphereGeometry args={[0.2, 14, 10]} />
        <Solid color={on ? '#ffe9a8' : '#f4f4ee'} glow={on ? 2.2 : 0} />
      </mesh>
      {on && <pointLight position={[0, h, 0]} color="#ffd98a" intensity={14} distance={12} decay={1.6} />}
    </group>
  );
};

export const Bench: React.FC<GroupProps & {color?: string}> = ({color = '#b07a4a', ...p}) => (
  <group {...p}>
    <Block size={[1.6, 0.08, 0.45]} color={color} position={[0, 0.45, 0]} />
    <Block size={[1.6, 0.4, 0.07]} color={color} position={[0, 0.78, -0.2]} />
    {[-0.65, 0.65].map((x) => (
      <Block key={x} size={[0.08, 0.45, 0.4]} color="#5a4a40" position={[x, 0.225, 0]} />
    ))}
  </group>
);

export const Pond: React.FC<GroupProps & {r?: number}> = ({r = 2.2, ...p}) => (
  <group {...p}>
    <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.3, 1, 1]}>
      <circleGeometry args={[r + 0.25, 32]} />
      <Solid color="#c9b98a" />
    </mesh>
    <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.3, 1, 1]}>
      <circleGeometry args={[r, 32]} />
      <meshStandardMaterial color="#6fc0e8" roughness={0.25} />
    </mesh>
  </group>
);
