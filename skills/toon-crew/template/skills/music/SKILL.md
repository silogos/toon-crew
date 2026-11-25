---
name: music
description: Create or change background music, a jingle, or a sound effect for the series. Use when the Director asks for music, a theme, a mood change in a scene, or a specific sound.
---

# Music and sound (Composer)

All music and effects are synthesised by the studio's synthesiser in this folder (`music-kit.mjs`, run by `npm run music` through `music.mjs`) from the series' own `series/music.mjs`, and written to `public/audio/`; the file name is the id used in scenes. Nothing is downloaded. If the Director brings their own audio, confirm they have the right to use it, place it in `public/audio/`, and register its length the same way.

## What exists

Scenes ask for music by **mood**, and the engine plays that mood's track, lowering it under speech. Before proposing anything, list the moods and effects the series already has and offer an existing one if it fits.

## New music or jingle

1. **Ask, then stop:** where it is used, the feeling, tempo (slow / walking / lively), length, and instruments or a reference in words ("a small marching band", "music box"). Propose it in one or two sentences. **Wait for okay.**
2. Add the track to the music script as a named piece with its own function; do not alter other tracks. Keep it loopable if it is a mood.
3. Generate only that file: `npm run music -- <word>`.
4. **Tell the Director which file to listen to and wait.** You cannot judge music by ear. Revise on their notes.
5. When it is a new mood, register it so scenes can ask for it, and note it in the bible's sound section.

## New sound effect

Same steps, shorter: what the sound is, how long, and where it lands in the scene. After generating, place it in the scene at the frame of the action it belongs to and render a still at that frame to confirm the action is really there.

## Changing the music of a scene

If the storyboard names the mood, changing it is a storyboard change: confirm with the Director, update the shot table, then change the scene. Give the Director the preview link (`npm run preview -- <ep>`) to play the scene and confirm speech is still clear over it, and say that you could not listen yourself.

## Music cut to the beat

When animation must hit the beat (an opening, a dance), keep the rhythm pattern in one data file read by **both** the music script and the animation, so changing the pattern moves both.
