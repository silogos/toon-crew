---
name: new-episode
description: Start a new episode of the series and carry it through brief, script, storyboard, production and final render. Use when the Director wants a new episode or story, or wants to continue an episode that is partway through.
---

# New episode (Assistant Director leads)

An episode passes through five stages. **Each stage ends by showing the Director the result and waiting for okay.** Do not start the next stage in the same turn. After each okay, update the **Status** line at the top of `series/story/epNN-<title>.md`.

**The story comes from the Director.** Fast or step by step, do not write a plan for an episode nobody asked for: if the Director has not said what this episode is about, ask that first. In the same message, ask what any new character or place the story needs is like, unless the Director described it or said you may choose (stage 1 offers premises only when they ask for ideas).

**Fast track.** If `npm run status` says the series is on the fast track, follow "Fast track" in `CLAUDE.md` instead of stopping after each stage: do stages 1 to 3 in one go and show them as one plan, wait for one okay, then do all of stage 4 including any new characters, places and voices, and wait at the screening. Each stage below is still done in full; only the stops change.

If the episode already exists, run `npm run status`, read its Status line and resume from that stage.

Before anything, read `series/story/00-bible.md`, the cast, and `series/story/world.md`. If the bible has an `## Episode formula`, the episode follows it beat by beat ("The episode formula belongs to the series" in `CLAUDE.md`).

## Stage 1 — Brief (Writer)

The story comes from the Director. Ask what happens in this episode if they have not said, then write a brief of a few lines at the top of a new `series/story/epNN-<title>.md`:

- The point of the story in one sentence.
- If the series has a formula: one line per beat, saying what happens in this episode at that beat. A beat that quotes a real text is left open for the Director's exact words and source.
- Length, and roughly how many scenes that allows.
- Which cast members appear, and which places.
- If this episode brings in something that must match the world outside the series (a quotation from a real text or person, a claim of fact, the rules of a field or faith) and the series has no specialist for it, say so and offer one (`/new-agent` says how). Until it is checked, such content is marked not verified.
- **Anything that does not exist yet:** a new character, place, prop, expression or piece of music. List these plainly; each is its own approval (`/new-character`, `/new-place`, `/music`).

Offer premises only when the Director asks you to choose: three one-line options, built on this series' own cast and places.

## Stage 2 — Script (Writer)

Write scene by scene in the story file: where and when, what happens, and every line of dialogue and narration with who says it. When the series has a formula, label each part of the script with its beat. Keep each character's way of speaking as described in the bible. Read the dialogue as it will be heard: short lines, one thought per balloon. Write it for the ear, because a voice reads every character: numbers in words, no symbols or emoji, abbreviations as they are said. A cough, a laugh, a gasp the scene needs is a line of its own, not "(coughs)" inside another line. Estimate the running time and say so.

Before showing it, hand the story file to the `quality-control` subagent (stage: script) and fix what it finds; with no subagents, run its checklist yourself. Show the Director anything it marked **not verified**.

## Stage 3 — Storyboard (Storyboard Artist)

Add a shot table per scene: time of day, place, camera, who is in frame and what they do, expression changes, music mood, sound effects.

Music is one mood per scene unless the table says where it turns: write the moment the mood turns and what it turns to, and production places it with `t.mood`. A change of place or time is a new scene; a change of mood alone is not.

What stands on the map stays still unless the table says otherwise. When a shot needs something on the map to move or change, write it in the table; production draws that scene's own version of the place with `<World replace>`, and the map stays as it is. If a building block cannot do what the shot needs, that is a new piece: list it in the brief's "does not exist yet".

If the series is vertical (taller than wide), frame every shot for it: see "Vertical video" in `CLAUDE.md` (`frameShot` fits a group into a tall frame for you). Follow the camera rules in the bible; when a shot departs from them, write the reason in the table. Choose camera positions that are free of obstructions; check them with `npm run still -- view …` if unsure.

Before showing it, hand the story file to `quality-control` again (stage: storyboard) and fix what it finds.

## Stage 4 — Production

In this order, because recorded lengths set the timing:

1. **Lines** (Writer): write `series/episodes/epNN/lines.json` from the approved script. Give a line a `delivery` where the storyboard's expression asks for more than a plain reading (`"scared, whispering"`), and make each vocal sound a line with `sound` (`{"id": …, "voice": "B", "text": "Achoo!", "sound": "sneeze"}`). Run `npm run check` and fix its warnings about lines before QC reads them. Add the episode's title line for the opening narration if the series has one. Hand it to `quality-control` (stage: lines) before recording: a wrong word found now costs nothing, found after recording it costs a retake.
2. **Voices** (hand to the `voice-director` subagent; if this session has no subagents, run its commands yourself and say so in the report): record and check. Voices that are new in this episode must have their entry in `series/voices.json` first; the recording makes their reference clip. Read its report; bring any line it marked for the Director's ear to the Director.
3. **Scenes** (Animator & Cinematographer): build each scene from the storyboard, timed by the cues. `scene-example.md`, next to this recipe, shows how a scene file is written: script, camera cuts, balloons, a change of music mood, and an object drawn by the scene. It is a pattern for the code only; take nothing of its content into the episode. Anything that moves in 3D is worked out from the frame number; `/threejs` says how, and why examples written for games go wrong in a render. Register the episode in `series/episodes/index.ts`.
4. **Quick look** (Animator): `npm run check`, then `npm run still -- epNN board` and look at it for an empty frame, a missing character or a cut-off balloon. Take a closer still only of a shot that looks wrong, and fix it. There is no shot-by-shot review: the Director watches it in the preview.
5. **Screening** (follow `/screening`): show the board, and give the preview link from `npm run preview -- epNN` with the scene numbers to play.

If the script needs to change during production, stop and ask.

## Stage 5 — Final render (Editor)

Only after the Director approves the screening: follow `/render`.
