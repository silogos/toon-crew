---
name: new-episode
description: Start a new episode of the series and carry it through brief, script, storyboard, production and final render. Use when the Director wants a new episode or story, or wants to continue an episode that is partway through.
---

# New episode (Assistant Director leads)

An episode passes through five stages. **Each stage ends by showing the Director the result and waiting for okay.** Do not start the next stage in the same turn. After each okay, update the **Status** line at the top of `series/story/epNN-<title>.md`.

**The story comes from the Director.** Fast or step by step, do not write a plan for an episode nobody asked for: if the Director has not said what this episode is about, ask that one question first (stage 1 offers premises only when they ask for ideas).

**Fast track.** If `npm run status` says the series is on the fast track, follow "Fast track" in `CLAUDE.md` instead of stopping after each stage: do stages 1 to 3 in one go and show them as one plan, wait for one okay, then do all of stage 4 including any new characters, places and voices, and wait at the screening. Each stage below is still done in full; only the stops change.

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

Music is one mood per scene unless the table says where it turns: write the moment ("mood → calm when the ball drops") and production places it with `t.mood`. A change of place or time is a new scene; a change of mood alone is not.

Things on the map (a tree, a house, a bench) stay still unless the table says otherwise. When a shot needs one to move or change (a tree that shakes, a door that opens), write it in the table; production draws that scene's own version of the place with `<World replace>`, and the map stays as it is. A building block that cannot do what the shot needs (a door that opens when the block has no door) is a new piece: list it in the brief's "does not exist yet".

If the series is vertical (taller than wide), frame every shot for it: see "Vertical video" in `CLAUDE.md` (`frameShot` fits a group into a tall frame for you). Follow the camera rules in the bible; when a shot departs from them, write the reason in the table. Choose camera positions that are free of obstructions; check them with `npm run still -- view …` if unsure.

## Stage 4 — Production

In this order, because recorded lengths set the timing:

1. **Lines** (Writer): write `series/episodes/epNN/lines.json` from the approved script. Add the episode's title line for the opening narration if the series has one.
2. **Voices** (hand to the `voice-director` subagent; if this session has no subagents, run its commands yourself and say so in the report): record and check. Voices that are new in this episode must have their entry in `series/voices.json` first; the recording makes their reference clip. Read its report; bring any line it marked for the Director's ear to the Director.
3. **Scenes** (Animator & Cinematographer): build each scene from the storyboard, timed by the cues. `scene-example.md`, next to this recipe, is a complete scene file to start from: script, camera cuts, balloons, a change of music mood, and a prop drawn by the scene. Register the episode in `series/episodes/index.ts`.
4. **QC** (hand to the `quality-control` subagent, or do its checks yourself if this session has no subagents): tell it which scenes exist and what the storyboard says. Fix what it finds, or report what you chose not to fix and why.
5. **Screening** (follow `/screening`): show stills of every scene, and give the preview link from `npm run preview -- epNN` with the scene numbers to play.

If the script needs to change during production, stop and ask.

## Stage 5 — Final render (Editor)

Only after the Director approves the screening: follow `/render`.
