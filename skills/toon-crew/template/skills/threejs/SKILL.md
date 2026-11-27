---
name: threejs
description: How the 3D look uses three.js in this studio, and the three.js mistakes that only show up in a render. Read it before writing or changing 3D code (a character's parts, a building block, a place or set, lights, the camera, a material, a .glb model), and when a 3D picture differs between the preview and the render, jumps between frames, comes out pale or black, or a model will not load.
---

# three.js in this studio

The 3D look (`src/styles/3d/`) draws with three.js 0.187, through React Three Fiber 9.8 and the `<ThreeCanvas>` of `@remotion/three` (inside `Stage`). Most three.js help, and most of what a model remembers, is written for games and web pages that run in real time. A video is made differently. This guide says what changes, and lists the parts of the three.js API that changed between releases, so that code written here runs on the version installed.

## 1. Every movement comes from the frame number

How Remotion makes a video: for each frame it jumps straight to that frame, waits until nothing is pending, takes the picture and moves on. Several browser tabs share the frames among them, so no tab draws every frame in order, and a still is a fresh page that draws one frame only. One frame can take 50 ms, the next 2 s.

What `<ThreeCanvas>` does: while rendering, it switches off React Three Fiber's own loop (`frameloop: "never"`) and draws once for each frame. In the preview, that loop runs at the speed of the screen, whatever frame the timeline is on, even while it is paused.

So anything that keeps its own time goes wrong. Usually the mistake does not show in the preview, only in the final render:

| Written for real time | What goes wrong here | Written for this studio |
|---|---|---|
| `useFrame((_, delta) => { ref.current.rotation.y += delta })` | `delta` is the real time since the last picture, which changes from frame to frame; each tab adds up only the frames it drew, so the render jumps and flickers; in the preview it keeps turning while paused | `const f = useCurrentFrame();` then `rotation={[0, (f / fps) * speed, 0]}` |
| `new THREE.Clock()`, `THREE.Timer`, `state.clock`, `performance.now()`, `Date.now()` | the same | `useCurrentFrame()`, and `fps` from `useVideoConfig()` |
| `mixer.update(delta)` for a model's animation | the clip drifts away from the voice and differs on every render | `mixer.setTime(seconds worked out from the frame)`; `GlbCharacter` in `models.tsx` already does this through `clipTime` |
| a spring or pendulum that remembers where it was (cloth, hair, a swinging sign) | it depends on every frame before it, and another tab never drew those | a formula of the frame: `Math.sin((f / fps) * 2 * Math.PI * hz) * angle`, or Remotion's `interpolate` and `spring({frame, fps})` |
| `Math.random()` | a different picture on every render | `seeded(n)` from `src/engine/math.ts` |
| a position set in `useEffect` or `useLayoutEffect`, or `setState` from a loop | the picture can be taken before the effect has run | set it while rendering, the way `Rig` in `stage.tsx` sets the camera |
| the TSL `time` node, or a shader uniform fed by a timer | the same as a clock | a uniform set from the frame while rendering |

The studio does not use `useFrame`. A callback that only read the frame number would work, but there is no need for one: set the value while rendering.

**Check:** `npm run still -- <ep> <scene> <frame>` draws that frame in a fresh page, the way a render tab arrives at it. If the still differs from the preview at the same frame, something keeps its own time.

## 2. Loading files

- `Stage` loads a `.glb` **before** the canvas is drawn (`useModelsReady` in `models.tsx`), because Remotion takes the picture as soon as nothing is pending. Do not load models or textures inside the canvas (`useGLTF`, `useLoader`, a loader in an effect).
- Copies of one model are made with `SkeletonUtils.clone`, never with `.clone()`. A plain clone shares the skeleton, so two characters of one model would move as one. `models.tsx` already does this.
- **Compressed `.glb` files do not load:** the studio's loader has no decoders. The error says which kind it is:
  - `No DRACOLoader instance provided`: Draco-compressed shapes;
  - `setMeshoptDecoder must be called before loading compressed files`: meshopt;
  - `setKTX2Loader must be called before loading KTX2 textures`: KTX2 textures.

  Ask the Director for an uncompressed version of the file (many packs offer one, and Blender exports one with "Compression" off). Teaching the loader to decode is a change to the studio's code and needs the Director's okay.
- Nothing is loaded from a web address (`CLAUDE.md`). Textures and environment maps (`.hdr`) come only from files the Director brought.

## 3. Colour and light

- Colours written as strings (`color="#e8b04a"`) are right as they are. A **texture** that holds colour needs `texture.colorSpace = THREE.SRGBColorSpace`, or it comes out pale. A texture that holds data (normal, roughness, ambient occlusion, alpha, a toon `gradientMap`) keeps the default. `texture.encoding` and `THREE.sRGBEncoding` no longer exist, and a line that sets them does nothing.
- Light strength is in physical units, and `physicallyCorrectLights` and `useLegacyLights` no longer exist. How far a point light reaches depends on its `distance` and `decay` as much as its `intensity`. Match a new light to the light of the `Lamp` block in `blocks.tsx` and look at a night still, instead of taking a number from an example.
- `envMapIntensity` dims only a material's own `envMap`. An environment set on the scene is dimmed with `scene.environmentIntensity`.
- `RGBELoader` is now called `HDRLoader`.
- A mesh casts a shadow only with `castShadow`. The sun in `stage.tsx` already casts. Stripes on a lit surface ("shadow acne") are fixed with the sun's `shadow.bias` and `normalBias`, which are set there; change them only for the whole look, and check several stills.
- `PCFSoftShadowMap` was removed in r182: three falls back to `PCFShadowMap` and warns in the console. A canvas with `shadows` alone (true) asks for it; `Stage` uses `shadows="percentage"`, which gives the same picture without the warning. Keep it that way on any new canvas.
- A flat cel-shaded cartoon look is `meshToonMaterial`, with a `gradientMap` whose `minFilter` and `magFilter` are `THREE.NearestFilter` (hard steps). It changes the look of the whole series, so show the Director stills first.

## 4. Shapes

- The built-in shapes are already buffer geometries. `BoxBufferGeometry` and the other `…BufferGeometry` names no longer exist.
- `CapsuleGeometry(radius, height, capSegments, radialSegments, heightSegments)`: the second parameter used to be called `length`.
- `TextGeometry`: the thickness is `depth` (it used to be `height`, which is now ignored, and the letters come out 50 units deep). Words the viewer reads belong in the overlay with `FONT`, not in 3D.
- `BufferGeometryUtils.mergeBufferGeometries` is now `mergeGeometries`.
- Lines are drawn one pixel wide whatever `linewidth` says. An outline or ink stroke that must be seen is a thin mesh: a torus, a flat box or a disc, the way `Arc` and `Disc` in `character.tsx` draw the face.
- Positions in JSX are arrays: `position={[1, 0, 2]}`. An object such as `{x, y, z}` throws an error.
- `layers.set(n)` takes an object off layer 0, where the camera and the lights are; `layers.enable(n)` adds a layer.

## 5. Imports

`three/examples/jsm/…` and `three/addons/…` point to the same files here: three's package lists both, and Remotion bundles the code. Advice to rewrite one into the other is for web pages that load three.js through an import map. It does not apply here; leave working imports alone.

## 6. Not used here

- **Mouse and touch:** picking objects (raycasting), `OrbitControls`, gizmos. A video is watched, not clicked.
- **Speed tuning for frames per second:** fps counters, level of detail. A slow frame only makes the render slower; it never changes the picture. Keep scenes light so renders finish, nothing more.
- **WebGPU and TSL node materials** (`three/webgpu`, `three/tsl`): the studio renders with WebGL in Chrome (ANGLE, `remotion.config.ts`).
- **Post-processing** (`EffectComposer`, bloom, depth of field): the studio has none, and none has been checked with the way `<ThreeCanvas>` draws each frame. Treat it as new work: ask the Director first, then compare a rendered still with the preview.

## Credits

Sections 3 to 5 are adapted from the "Common Mistakes" lists of [threejs-skills](https://github.com/cloudai-x/threejs-skills) by CloudAI-X (MIT licence, commit `0e18186`, 19 October 2026). They were checked against three 0.187.0, React Three Fiber 9.8.2 and `@remotion/three` 4.0.545 as installed in the studio, and rewritten for a studio that renders frame by frame. The licence is in `CREDITS.md` next to this file. When three.js is upgraded, check these notes against that release's migration guide.
