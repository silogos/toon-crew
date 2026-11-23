---
name: new-episode
description: Start a new episode of the series and carry it through brief, script, storyboard, production and final render. Use when the Director wants a new episode or story, or wants to continue an episode that is partway through.
---

# New episode (Assistant Director leads)

An episode passes through five stages. **Each stage ends by showing the Director the result and waiting for okay.** Do not start the next stage in the same turn. After each okay, update the **Status** line at the top of `series/story/epNN-<title>.md`.

If the episode already exists, run `npm run status`, read its Status line and resume from that stage.

Before anything, read `series/story/00-bible.md`, the cast, and `series/story/world.md`.

## Stage 1 — Brief (Writer)

Ask what the Director has in mind, then write a brief of a few lines at the top of a new `series/story/epNN-<title>.md`:

- The point of the story in one sentence.
- Length, and roughly how many scenes that allows.
- Which cast members appear, and which places.
- **Anything that does not exist yet:** a new character, place, prop, expression or piece of music. List these plainly; each is its own approval (`/new-character`, `/new-place`, `/music`).

If the Director has only a vague idea, offer two or three one-line premises to choose from.

## Stage 2 — Script (Writer)

Write scene by scene in the story file: where and when, what happens, and every line of dialogue and narration with who says it. Keep each character's way of speaking as described in the bible. Read the dialogue as it will be heard: short lines, one thought per balloon. Estimate the running time and say so.

## Stage 3 — Storyboard (Storyboard Artist)

Add a shot table per scene: time of day, place, camera, who is in frame and what they do, expression changes, music mood, sound effects.

Two limits of the studio decide how scenes are cut, so settle them here and not in production:

- **One music mood per scene.** If the mood should change, that is where a new scene starts, even in the same place.
- **What stands on the map does not move.** A tree, a house or a bench is part of the world and stays as drawn. Anything that must move or change (a ball that falls, a door that opens, a tree that shakes) is drawn by the scene itself, or needs its own piece built first; list it in the brief's "does not exist yet". Follow the camera rules in the bible; when a shot departs from them, write the reason in the table. Choose camera positions that are free of obstructions; check them with `npm run still -- view …` if unsure.

## Stage 4 — Production

In this order, because recorded lengths set the timing:

1. **Lines** (Writer): write `series/episodes/epNN/lines.json` from the approved script. Add the episode's title line for the opening narration if the series has one.
2. **Voices** (hand to the `voice-director` subagent): record and check. Read its report; bring any line it marked for the Director's ear to the Director.
3. **Scenes** (Animator & Cinematographer): build each scene from the storyboard, timed by the cues. Register the episode in `series/episodes/index.ts`.
4. **QC** (hand to the `quality-control` subagent): tell it which scenes exist and what the storyboard says. Fix what it finds, or report what you chose not to fix and why.
5. **Screening** (follow `/screening`): show stills of every scene, and give the preview link from `npm run preview -- epNN` with the scene numbers to play.

If the script needs to change during production, stop and ask.

## Stage 5 — Final render (Editor)

Only after the Director approves the screening: follow `/render`.
