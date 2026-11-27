import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {CAST} from '../../../series/cast';
import {Balloon, FONT} from '../../engine/overlay';
import {textScale} from '../../engine/series';
import {Cue} from '../../engine/timeline';
import {modelFilesOf} from './model-spec';
import {useModelsReady} from './models';

/** World units are metres. The ground is y = 0, +x is east, +z is south (toward a camera looking north). */
export type Vec3 = [number, number, number];
export type TimeOfDay = 'day' | 'dusk' | 'night';
export const TIMES: readonly TimeOfDay[] = ['day', 'dusk', 'night'];

/** One camera set-up: where it stands, what it looks at, and how wide the lens is (degrees). */
export type Shot = {from: Vec3; to: Vec3; fov?: number};
/** What the camera does over a scene: a shot for every frame. */
export type CameraPlan = (frame: number) => Shot;

const DEFAULT_FOV = 35;

/** The camera does not move. */
export const still = (shot: Shot): CameraPlan => () => shot;

/** Still shots joined by hard cuts: each shot holds from its `at` frame until the next one. */
export const cuts = (list: {at: number; shot: Shot}[]): CameraPlan => {
  const sorted = [...list].sort((a, b) => a.at - b.at);
  return (f) => {
    let current = sorted[0].shot;
    for (const c of sorted) if (f >= c.at) current = c.shot;
    return current;
  };
};

/** The camera travels from one shot to another between two frames, easing in and out; it holds before and after. */
export const move = (a: Shot, b: Shot, frames: [number, number]): CameraPlan => (f) => {
  const k = interpolate(f, frames, [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const mix = (p: Vec3, q: Vec3): Vec3 => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
  const fa = a.fov ?? DEFAULT_FOV;
  const fb = b.fov ?? DEFAULT_FOV;
  return {from: mix(a.from, b.from), to: mix(a.to, b.to), fov: fa + (fb - fa) * k};
};

type Light = {sky: string; fog: [number, number]; hemi: [string, string, number]; sun: [string, number, Vec3]; fill: number};
const LIGHT: Record<TimeOfDay, Light> = {
  day: {sky: '#bfe3f5', fog: [45, 140], hemi: ['#ffffff', '#b9d6a2', 1.5], sun: ['#fff1d0', 2.6, [9, 16, 11]], fill: 0.35},
  dusk: {sky: '#f4b98a', fog: [40, 120], hemi: ['#ffd9b0', '#8a7a8f', 1.1], sun: ['#ff9d5c', 2.2, [-14, 6, 8]], fill: 0.3},
  night: {sky: '#18203a', fog: [30, 100], hemi: ['#8fa6e8', '#1c2238', 0.75], sun: ['#a9bcff', 0.9, [-8, 14, 6]], fill: 0.18},
};
export const skyColor = (time: TimeOfDay) => LIGHT[time].sky;

type StageInfo = {
  time: TimeOfDay;
  /** Where a point in the world lands on the screen, in pixels. `visible` is false behind the camera. */
  project: (p: Vec3) => {x: number; y: number; visible: boolean};
};
const StageContext = createContext<StageInfo | null>(null);

/** For anything drawn over the picture (balloons, labels): the current time of day and the world-to-screen projection. */
export const useStage = (): StageInfo => {
  const s = useContext(StageContext);
  if (!s) throw new Error('useStage must be used inside the overlay of a <Stage>');
  return s;
};

// The camera is positioned while rendering, not in an effect, so the frame that is captured is the frame asked for.
const Rig: React.FC<{shot: Required<Shot>}> = ({shot}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...shot.from);
  camera.fov = shot.fov;
  camera.near = 0.1;
  camera.far = 400;
  camera.lookAt(...shot.to);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return null;
};

const Lights: React.FC<{time: TimeOfDay; focus: Vec3}> = ({time, focus}) => {
  const l = LIGHT[time];
  const [sunColor, sunPower, sunFrom] = l.sun;
  const light = React.useMemo(() => {
    const d = new THREE.DirectionalLight();
    d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048);
    d.shadow.bias = -0.0004;
    d.shadow.normalBias = 0.03;
    const c = d.shadow.camera;
    c.left = -22;
    c.right = 22;
    c.top = 22;
    c.bottom = -22;
    c.near = 1;
    c.far = 90;
    return d;
  }, []);
  // the sun follows what the camera looks at, so shadows stay sharp wherever the scene is
  light.color.set(sunColor);
  light.intensity = sunPower;
  light.position.set(focus[0] + sunFrom[0] * 1.6, sunFrom[1] * 1.6, focus[2] + sunFrom[2] * 1.6);
  light.target.position.set(focus[0], 0, focus[2]);
  light.target.updateMatrixWorld();
  return (
    <>
      <hemisphereLight args={[l.hemi[0], l.hemi[1], l.hemi[2]]} />
      <ambientLight intensity={l.fill} />
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};

/**
 * One 3D picture: sky, light for the time of day, a camera, and the scene's contents.
 *
 * `children` are 3D objects (world, characters). `overlay` is drawn on top in screen
 * space (balloons, labels) and can use `useStage()` to find where things are on screen.
 */
export const Stage: React.FC<{
  camera: CameraPlan | Shot;
  time?: TimeOfDay;
  /** distance haze; turn it off for pictures taken from far away, such as the map */
  fog?: boolean;
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}> = ({camera, time = 'day', fog = true, overlay, children}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  // characters drawn from .glb files need their files before the canvas is drawn
  const modelsReady = useModelsReady(modelFilesOf(CAST.map((m) => m.model)));
  const raw = typeof camera === 'function' ? camera(frame) : camera;
  const shot: Required<Shot> = {from: raw.from, to: raw.to, fov: raw.fov ?? DEFAULT_FOV};
  const l = LIGHT[time];

  // the same camera, built outside the canvas, tells the overlay where things are on screen
  const probe = new THREE.PerspectiveCamera(shot.fov, width / height, 0.1, 400);
  probe.position.set(...shot.from);
  probe.lookAt(...shot.to);
  probe.updateMatrixWorld();
  probe.updateProjectionMatrix();
  const project: StageInfo['project'] = (p) => {
    const v = new THREE.Vector3(...p).project(probe);
    return {x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, visible: v.z < 1};
  };

  return (
    <AbsoluteFill style={{background: l.sky}}>
      {modelsReady && (
        <ThreeCanvas width={width} height={height} shadows="percentage" camera={{fov: shot.fov, position: shot.from, near: 0.1, far: 400}}>
          <Rig shot={shot} />
          <color attach="background" args={[l.sky]} />
          {fog && <fog attach="fog" args={[l.sky, l.fog[0], l.fog[1]]} />}
          <Lights time={time} focus={shot.to} />
          {children}
        </ThreeCanvas>
      )}
      <StageContext.Provider value={{time, project}}>
        <AbsoluteFill>{overlay}</AbsoluteFill>
      </StageContext.Provider>
    </AbsoluteFill>
  );
};

/** A speech balloon whose tail points at a place in the world, such as just above a speaker's head. */
export const Speech: React.FC<{cue: Cue; at: Vec3; tail?: 'center' | 'left' | 'right'; maxWidth?: number}> = ({cue, at, tail, maxWidth}) => {
  const {project} = useStage();
  const p = project(at);
  if (!p.visible) return null;
  return <Balloon cue={cue} x={p.x} y={p.y} tail={tail} maxWidth={maxWidth} />;
};

/** A text label pinned to a place in the world. Used by the map and the reference sheets. */
export const Label: React.FC<{at: Vec3; children: React.ReactNode; size?: number; plain?: boolean}> = ({at, children, size = 30, plain = false}) => {
  const {project} = useStage();
  const {width, height} = useVideoConfig();
  const k = textScale(width, height);
  const p = project(at);
  if (!p.visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: p.x,
        top: p.y,
        transform: 'translate(-50%, -50%)',
        fontFamily: FONT,
        fontSize: size * k,
        fontWeight: 800,
        color: '#222',
        background: plain ? 'none' : 'rgba(255,255,255,0.9)',
        border: plain ? 'none' : `${3 * k}px solid #222`,
        borderRadius: 12 * k,
        padding: plain ? 0 : `${4 * k}px ${14 * k}px`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};
