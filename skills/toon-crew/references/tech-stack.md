# Technology choices

The crew reads this at the first meeting to recommend a setup. The Director chooses a **look**; the crew translates that into technology. Everything listed as "default" runs on the Director's own computer and uses no outside assets: pictures, voices and music are all produced by code in the series folder.

Check current package versions and model names against their documentation when building or upgrading. Do not rely on the versions you remember.

## Foundation (every look)

| Part | Choice | Why |
|---|---|---|
| Video from code | Remotion | Every frame is a function of the frame number, so renders are repeatable and reviewable still by still |
| UI and language | React + TypeScript (strict) | The compiler catches a missing pose, prop or voice before a render does |
| Composition controls | zod schemas | Gives the Director sliders and pickers in Remotion Studio |
| Audio processing | The ffmpeg and ffprobe that come with Remotion; silence trimming, the echo and the board done in the studio's own code (Remotion's ffmpeg has no filters for them) | Decode and encode, normalise loudness, measure durations; nothing extra to install |
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
| Character voices | Each engine is a skill folder of its own (`skills/voices-<name>/`: guide, `engine.json`, recorder); the studio names none and recommends VoxCPM2 through mlx-audio on an Apple Silicon Mac. Each character is defined by a text description and gets one reference clip; every line imitates that clip, so the voice stays the same across episodes | ElevenLabs on any machine (`voiceEngine: elevenlabs`; paid, sends the dialogue to ElevenLabs); edge-tts as a last resort (`voiceEngine: edge`; free, unofficial, fixed catalogue, sends the dialogue to Microsoft) |
| Character models | Built from basic shapes in code (default); optionally a `.glb` model file brought by the Director, with its own animations, never committed | Hand-made models in Blender exported to `.glb`; free packs such as KayKit (CC0) |
| Pronunciation check | The listener skill (`skills/listen-whisper`): Whisper through mlx-whisper on an Apple Silicon Mac, listening back to each line and comparing it with the script | faster-whisper (CPU) on other computers |
| Word timing | The same listening pass notes when each word is heard, for the highlight in balloons and captions | Estimated from word lengths when no listener is installed |
| Mouth movement | Each recording is read with `@remotion/media-utils` before its scene is drawn; the mouth opens with the loudness of the voice, frame by frame, and shuts in pauses | A steady beat, for something with no recording |

VoxCPM2 needs an Apple Silicon Mac and Python. On any other machine, tell the Director at the first meeting that free local voices are not available yet and offer ElevenLabs (their own API key, paid credits, dialogue sent to ElevenLabs) or proceeding with the picture and adding voices later.

Voice quality depends on the language. If the series is not in a widely spoken language, record one test line per character and let the Director listen before recording an episode.

## Music and sound effects

| Part | Default | Alternatives |
|---|---|---|
| Background music and jingles | Synthesised in Node.js by the music skill (`skills/music/`), written straight to WAV | Files the Director owns, placed in `public/audio/` |
| Sound effects | Synthesised the same way | Files the Director owns |

Only use outside audio that the Director confirms they have the right to use.

## 2D pieces

Flat pieces in any look (a closing card with the moral, titles, counters, particles over the picture) use [remotion-bits](https://github.com/av/remotion-bits) (MIT; it needs `culori`, which the studio installs alongside because remotion-bits lists it only for its own development). It shares the studio's three.js instead of bringing its own. Lines that draw themselves, shapes that morph and things that travel along a path use [`@remotion/paths`](https://www.remotion.dev/docs/paths/). The studio's `MessageCard` is built from both. A full 2D look would start from the same toolbox.

## On-screen text

Speech balloons, captions, titles and the logo are HTML/CSS drawn over the picture and positioned by projecting a point in the scene onto the screen. This keeps text sharp in every look and makes any script and language work.

The typeface is Nunito (SIL Open Font License), shipped inside the studio by the `@fontsource/nunito` package and loaded through `@remotion/fonts` before any frame is drawn (`src/engine/font.ts`). Every machine renders the same letters, offline too; before, the text took whatever rounded font the computer had. Nunito covers Latin, Vietnamese and Cyrillic; Arabic script (Arabic, Persian, Urdu, with vowel marks) is drawn in Noto Sans Arabic, shipped the same way; other scripts fall back to the computer's own fonts. A line written mostly in a right-to-left script (Arabic, Hebrew) is laid out right to left in its balloon or caption.

The word being spoken is lit up in balloons and captions, like a marker pen over it, so the text can be followed with the sound off. It changes no letter or spacing. A series can turn it off with `"highlightWords": false`.
