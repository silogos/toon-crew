---
name: opening
description: Create or change the series opening (title sequence), or switch which opening version the series uses. Use when the Director asks for an intro, title sequence, theme, or wants to compare opening ideas.
---

# Opening (Assistant Director leads)

The opening is shared by every episode, so it is made once, carefully, through the same five stages as an episode. It lives in `series/opening/` and does not depend on any episode; the episode number and title are passed in.

## 1. Brief — then stop

Ask: how long (10–20 seconds is typical), what it must do (introduce the cast, set the tone, show the world, show the title), and whether there is a jingle. Offer two or three distinct concepts in one line each, drawn from the bible and the world. **Wait for the Director to pick.**

## 2. Script and storyboard — then stop

Write `series/story/opening.md` (or `opening-<name>.md` for an alternative version): beat by beat, what is seen and heard, and where the series title and the episode title appear. Add the shot table. The line-up of characters comes from the cast members marked as main; do not hard-code a list. Hand it to `quality-control` (stage: storyboard) and fix what it finds. **Wait for okay.**

## 3. Production

1. Music first when the picture is cut to the beat: follow `/music`, and keep the beat pattern in one file that both the music script and the animation read.
2. Any spoken lines go in `series/opening/lines.json`; hand them to `quality-control` (stage: lines), then recording to the `voice-director` subagent.
3. Build the opening. Title text comes from `series/series.json` and the episode, never from a constant.
4. Take a quick look yourself: stills at each beat and at the title card with a long and a short episode title (one `npm run still -- opening <frames>` call), then show them with the preview link.

## Several versions

When the Director wants to compare, keep each version as its own entry so they can be played side by side in the preview (`npm run preview` prints its link). Which one is attached to finished episodes is a single setting in `series/series.json`; changing it is the Director's decision.
