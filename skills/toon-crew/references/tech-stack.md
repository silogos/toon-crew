# Technology choices

The crew reads this at the first meeting to recommend a setup. The Director chooses a **look**; the crew translates that into technology. Everything listed as "default" runs on the Director's own computer and uses no outside assets: pictures, voices and music are all produced by code in the series folder.

Check current package versions and model names against their documentation when building or upgrading. Do not rely on the versions you remember.

## Foundation (every look)

| Part | Choice | Why |
|---|---|---|
| Video from code | Remotion | Every frame is a function of the frame number, so renders are repeatable and reviewable still by still |
| UI and language | React + TypeScript (strict) | The compiler catches a missing pose, prop or voice before a render does |
| Composition controls | zod schemas | Gives the Director sliders and pickers in Remotion Studio |
| Audio processing | ffmpeg / ffprobe | Trim silence, normalise loudness, measure durations |
| Render | Installed Google Chrome | Needed for WebGL; set the OpenGL renderer to ANGLE for 3D |

Remotion is free for individuals and small teams and needs a company licence above that size. Tell the Director if the series is being made by a company.

## Looks

| Look | What the Director sees | Default | Alternatives | Status |
|---|---|---|---|---|
| **2D** | Flat shapes, paper-cutout feel | SVG in React, moved with Remotion `interpolate` / `spring` | Lottie or Rive when the Director brings finished animations | not built yet |
| **2.5D** | Flat layers at different depths that slide past each other | SVG/HTML layers with CSS 3D transforms | Flat planes in three.js | not built yet |
| **3D** | Solid characters and sets, real camera angles and light | three.js through `@react-three/fiber` and `@remotion/three`; every model built from basic shapes | glTF models when the Director brings assets | **built** |

How to recommend:
- Characters who walk around a place, shots from several angles, day and night: **3D**.
- A storybook or comic feel, mostly side-on staging: **2D**.
- Storybook feel with a sense of depth and slow camera drifts: **2.5D**.

All looks share the same engine for script, voices, timing, speech balloons, music and assembly. Only the picture layer differs.

## Voices

| Part | Default | Alternatives |
|---|---|---|
| Character voices | VoxCPM2 through mlx-audio. Each character is defined by a text description and gets one reference clip; every line imitates that clip, so the voice stays the same across episodes | ElevenLabs on any machine (`voiceEngine: elevenlabs`; paid, sends the dialogue to ElevenLabs); edge-tts as a last resort (`voiceEngine: edge`; free, unofficial, fixed catalogue, sends the dialogue to Microsoft) |
| Character models | Built from basic shapes in code (default); optionally a `.glb` model file brought by the Director, with its own animations, never committed | Hand-made models in Blender exported to `.glb`; free packs such as KayKit (CC0) |
| Pronunciation check | Whisper through mlx-whisper: listen back to each line and compare with the script | faster-whisper (CPU) with the ElevenLabs engine |

The local default needs an Apple Silicon Mac, Python and ffmpeg. On any other machine, tell the Director at the first meeting that free local voices are not available yet and offer ElevenLabs (their own API key, paid credits, dialogue sent to ElevenLabs) or proceeding with the picture and adding voices later.

Voice quality depends on the language. If the series is not in a widely spoken language, record one test line per character and let the Director listen before recording an episode.

## Music and sound effects

| Part | Default | Alternatives |
|---|---|---|
| Background music and jingles | Synthesised in Node.js, written straight to WAV | Files the Director owns, placed in `public/audio/` |
| Sound effects | Synthesised the same way | Files the Director owns |

Only use outside audio that the Director confirms they have the right to use.

## On-screen text

Speech balloons, captions, titles and the logo are HTML/CSS drawn over the picture and positioned by projecting a point in the scene onto the screen. This keeps text sharp in every look and makes any script and language work.
