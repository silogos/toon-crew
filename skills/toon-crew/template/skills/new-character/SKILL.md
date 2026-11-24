---
name: new-character
description: Add a cast member to the series, redesign one, or add an expression, pose or prop. The character is built from code, or drawn from a 3D model file (.glb) the Director brings. Use when the Director asks for a new character, a change to how someone looks, a new face or gesture, something for a character to hold, or wants to use a downloaded 3D model (also when a model character does not show up, is the wrong size, or will not render).
---

# New character (Character Designer)

Work as the **Character Designer**. Follow the stages in `CLAUDE.md`: nothing is added to the cast until the Director says okay.

On the **fast track** (see `CLAUDE.md`), a character that the approved plan of an episode already describes needs no further okay: build one design, check the sheets yourself, and show it at the screening. The steps below still apply when the Director asks for a character on its own.

## 1. Brief — ask, then stop

Read `series/story/00-bible.md` and the current cast first, so the new character fits the show and does not duplicate someone. Then ask only what you cannot infer, in one round, each with a suggestion:

- Who they are: name, age, role in the story, one line of personality.
- Main cast or occasional?
- Do they speak? (If yes, a voice is needed: that is the `/voices` recipe, after the look is approved.)
- Anything the Director already pictures: build, hair, clothing, colours, something they always carry.

Write a short design proposal: two or three sentences of who they are, the look you intend, and their signature pose. **Wait for okay.**

## 1b. Built from code, or from a model file?

Ask this in the same round as the brief, with a recommendation (code-built unless the Director already has a model). If they bring a **`.glb` model file**, follow "Model characters" at the end of this recipe instead of the design steps below (those are for code-built characters).

## 2. Design — show options, then stop

1. Add the cast member in `series/cast/index.ts`, with `voice: null` until they have a voice (a code that is not in `series/voices.json` fails the check), using the appearance options of the series' look (`src/styles/<look>/`). Prefer existing options. If the character needs clothing, headwear or a prop the look does not have, add it as a **series** addition, not to the neutral core, and say so in the report.
2. When the Director has not fixed the look, make two or three variants (for example different hair or colour) so they can choose by eye.
3. `npm run check`.
4. Render and look at: `npm run still -- sheet <id> expressions`, `npm run still -- sheet <id> poses`, and `npm run still -- cast` to see them next to everyone else.
5. Check by eye: readable silhouette next to the others, colours distinct from existing cast, face readable at the size it will appear in a wide shot, nothing clipping in any pose.

Show the sheets and the cast line-up, with the preview links of the cast and the sheet from `npm run preview`. **Wait for okay**, or revise.

## 3. Finish

- Delete rejected variants.
- Add the character to the cast section of `series/story/00-bible.md` (who they are, how they speak, what they never do).
- If they speak, offer `/voices` next.

## Adding an expression, pose or prop

Same stages, smaller:

1. Ask what it should convey and where it will be used.
2. Add it to the look's list **and** its drawing. The lists are checked by the compiler, so `npm run check` fails until both exist.
3. Render the sheet for at least two characters of different builds and look at both.
4. Show the Director; wait for okay.

## Redesigning an existing character

A redesign changes every finished episode. Before changing anything, render the current sheet and one still from a finished scene; after the change render the same two; show before and after side by side.

## Model characters (a `.glb` the Director brings)

A model character is drawn from a `.glb` file, with that file's own animations. It is optional and per character; the same stages apply and nothing is added to the cast until the Director says okay. Read "Characters from `.glb` models" in `CLAUDE.md` and `docs/models.md` (in the repository) for the full reference; this recipe is the order of work.

### M1. Say what it means, ask, then stop

Before anything is downloaded or set up, tell the Director plainly:

- **They gain:** more detail than the studio builds from basic shapes, and the model's own movement (walking, running, jumping and so on).
- **They give up:** a model has a painted face, so **no expressions and no moving mouth**; no props and no `accessories`. The balloon and the recorded voice still work.
- Mixing model characters with code-built ones in one series usually looks uneven; ask whether the series should use one kind only, and write the answer in `series/story/00-bible.md`.

Then ask, in one round with suggestions: which model (a file they already have, or a free pack they want to use), who the character is, and whether the character walks, talks, or both. **Wait for okay.**

### M2. Get the files — the Director downloads, you record

- **Never fetch a model yourself from a place the Director did not name.** The Director downloads the file (and any separate animation files for the same skeleton) and says where they put it. Under `public/models/` is the convention.
- **Never use a character that belongs to someone else's series.**
- Add one line per file to `public/models/LICENSES.md`: file name, source, licence. Ask the Director for the licence if they do not know it; if it is unclear, say so and stop. CC BY needs a credit in what they publish; say that.
- The files are never committed (`public/models/*` is ignored). Do not change that.

### M3. Set it up

1. Add the model to `series/models.json`: `file`, optional `animationFiles` (same skeleton, bone names must match), `height` in metres, and `clips` (`idle`, optional `walk`, `talk`, and `pose`).
2. Give the cast member `model: '<code>'` in `series/cast/index.ts`. Keep a normal `look`; the studio still uses it to size the picture.
3. `npm run check`. A missing file is a warning (it says what to download); a clip name that does not exist is an error and the message lists the names that do.
4. **Choose clips by eye, not by guess:** `npm run still -- sheet <id> clips` shows every animation the files have, each held part-way through. Pick idle, walk, talk and any pose clips from it.

### M4. Show — then stop

Render and look at: `sheet <id> clips`, `sheet <id> poses` (which clip each pose plays), and `cast` (next to everyone else). Check by eye: the right height next to the others, feet on the ground, the chosen clips read as what they are meant to be (a walk looks like walking, the idle is calm), nothing clipping or in a T-pose.

Show the pictures and the clip choices, with the preview link of the sheet from `npm run preview` (the clips move there). **Wait for okay**, or change the clips.

### M5. In scenes

A model character is used like any other, inside a `Stage`: `<Character look={m.look} model={m.model} position facing walking talking />`. It plays the walk clip while `walking`, then a pose's clip, then the talk clip while `talking` (true, or while one of the lines given to it plays), else idle. The picture is the same on every render because the animation follows the frame number.

Face the way it walks: a character walking east faces 90. Check a scene with stills at the start of the walk, the middle and the end, and look at all three, not one.

### When a model character is wrong

| What you see | Likely cause and fix |
|---|---|
| `npm run check`: "public/…glb is not there yet" | The Director has not downloaded it, or it is in another folder. Compare the path in `models.json` with where the file is. |
| `check`: "no animation called …" | A typo, or the clip lives in a file not listed in `animationFiles`. Use the names the message lists, or `sheet <id> clips`. |
| The character does not appear at all | Characters must be drawn inside a `Stage`; models load there before the picture. Check the file path and the console for a loading error. |
| Stands in a T-pose or does not move | The clip's bone names do not match the model's skeleton, or `clips.idle` points at a one-frame pose clip. Pick another clip, or another animation file made for this skeleton. |
| Far too big or too small | Change `height` in `models.json` (metres); the model is scaled to it. |
| Feet sink or float | The clip moves the whole body (a jump or a spawn does). Pick a clip that stays on the ground for idle and walk. |
| A render fails on a missing `.wav` | A line has a recording listed but no file. Record it again, or remove its entry from `src/audio-durations.json`. A line with no recording at all plays as silence and does not fail. |
| Looks out of place next to code-built characters | Expected: the styles differ. Raise it with the Director rather than mixing silently. |

### Changing an approved model character

Swapping the model or its clips changes every finished episode that shows the character. Render the current `cast` picture and one still from each finished scene they appear in before the change, and the same ones after; show them side by side.
