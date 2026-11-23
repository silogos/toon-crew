import React, {useEffect, useMemo, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {Pose} from './look';
import {MODELS, clipTime, pickClip} from './model-spec';
import type {Vec3} from './stage';

/*
 * Models drawn from .glb files. The files are loaded BEFORE the 3D canvas is drawn (see `useModelsReady`,
 * used by Stage) and kept here, because Remotion takes the picture as soon as nothing is pending, and a file
 * loaded from inside the canvas arrives after that. The canvas does not pass React context on, so the loaded
 * files wait in this cache instead.
 */

const cache = new Map<string, GLTF>();
const pending = new Map<string, Promise<void>>();

const load = (file: string): Promise<void> => {
  if (cache.has(file)) return Promise.resolve();
  let p = pending.get(file);
  if (!p) {
    p = new GLTFLoader().loadAsync(staticFile(file)).then((g) => {
      cache.set(file, g);
    });
    pending.set(file, p);
  }
  return p;
};

const model = (file: string): GLTF => {
  const g = cache.get(file);
  if (!g) throw new Error(`The model file "${file}" is not loaded. Models load in Stage before the picture is drawn; draw characters inside a Stage.`);
  return g;
};

/** Names of every animation available to a model (its own file and its animation files), each once, in order. Needs the files loaded. */
export const clipNamesOf = (code: string): string[] => {
  const spec = MODELS[code];
  if (!spec) throw new Error(`series/models.json has no model "${code}".`);
  return [...new Set([spec.file, ...(spec.animationFiles ?? [])].flatMap((f) => model(f).animations.map((a) => a.name)))];
};

/** True once every file is loaded; until then Remotion is told to wait. Call it outside the canvas. */
export const useModelsReady = (files: string[]): boolean => {
  const key = files.join('|');
  const loaded = () => files.every((f) => cache.has(f));
  const [ready, setReady] = useState(loaded);
  const [handle] = useState(() => (loaded() ? null : delayRender(`loading models: ${key}`)));
  useEffect(() => {
    if (ready) return;
    Promise.all(files.map(load)).then(() => setReady(true), (e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  // release the picture only after the characters have been put on screen, not when the file arrives
  useEffect(() => {
    if (ready && handle !== null) continueRender(handle);
  }, [ready, handle]);
  return ready;
};

/** A character drawn from a model. Its animation follows the frame number, so every frame renders the same way every time. */
export const GlbCharacter: React.FC<{
  model: string;
  position?: Vec3;
  /** degrees; 0 faces the camera of a shot looking north, like the characters drawn from code */
  facing?: number;
  scale?: number;
  pose?: Pose;
  talking?: boolean;
  walking?: boolean;
  /** play this animation whatever the character is doing (for review sheets) */
  clip?: string;
  /** hold the animation at this point of its length, 0 to 1, instead of following the frame (for review pictures) */
  clipPhase?: number;
}> = ({model: code, position = [0, 0, 0], facing = 0, scale = 1, pose = 'down', talking = false, walking = false, clip: forced, clipPhase}) => {
  const spec = MODELS[code];
  if (!spec) throw new Error(`series/models.json has no model "${code}". Defined: ${Object.keys(MODELS).join(', ') || 'none'}.`);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // one private copy per character with its own mixer, so two characters of one model never share a pose
  const built = useMemo(() => {
    const gltf = model(spec.file);
    const root = clone(gltf.scene);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.frustumCulled = false; // a skinned mesh moves outside its resting box
      }
    });
    // stand on the ground at the height the series asked for
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const k = spec.height / Math.max(0.001, box.max.y - box.min.y);
    root.position.y = -box.min.y;
    const clips = [...gltf.animations, ...(spec.animationFiles ?? []).flatMap((f) => model(f).animations)];
    return {root, k, mixer: new THREE.AnimationMixer(root), clips};
  }, [spec]);

  const name = forced ?? pickClip(spec, {walking, talking, pose});
  const clip = THREE.AnimationClip.findByName(built.clips, name);
  if (!clip) throw new Error(`Model "${code}" has no animation called "${name}". It has: ${built.clips.map((c) => c.name).join(', ')}.`);
  built.mixer.stopAllAction();
  built.mixer.clipAction(clip).reset().play();
  built.mixer.setTime(clipTime({frame, fps, duration: clip.duration, phase: clipPhase}));

  return (
    <group position={position} rotation={[0, (facing * Math.PI) / 180, 0]} scale={built.k * scale}>
      <primitive object={built.root} />
    </group>
  );
};
