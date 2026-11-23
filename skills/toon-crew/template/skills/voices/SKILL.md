---
name: voices
description: Give a character a voice, record dialogue, or fix a line that sounds wrong. Use when the Director asks about how a character sounds, wants lines recorded or re-recorded, or reports a mispronunciation.
---

# Voices (Voice Director)

Each speaking character has one entry in `series/voices.json`: a text description of the voice, one reference sentence, and a seed. The engine makes a single **reference clip** from that; every line the character ever speaks imitates the clip. That is what keeps a voice the same across episodes, and why a reference clip is never remade without the Director's okay.

If no voice engine is set up yet (`npm run doctor` says whether it is), do it for the Director: read `voiceEngine` in `series/series.json` (the first meeting recorded the choice; if it is missing, ask local or ElevenLabs first, explaining cost and privacy), ask the okay (on the fast track the first okay usually covered it already; do not ask twice), then run `npm run voices:setup` and follow `scripts/VOICES-SETUP.md` for the rest. If Python is missing, offer to install it with the computer's package manager. On a machine the local engine does not support, say so plainly and offer ElevenLabs or continuing with the picture only.

## Giving a character a voice

With the **edge** engine a voice is chosen, not designed: run `npm run voices -- --list`, propose one catalogue voice that fits the description, and write it to `voices.json` as `"edge": {"voice": "<name>"}` after the Director's okay. There is no reference clip; the catalogue name is the voice.

On the **fast track** (see `CLAUDE.md`), the voice descriptions were approved with the plan: skip the stops in steps 1 and 5 and the separate reference step, set up the engine if the plan's okay covered it, and record the whole episode (recording makes the reference clip of every voice that has never spoken), then name at the screening which recordings the Director should hear. A voice is still only approved once the Director has heard it; if they want it changed, that is a retake of that character's lines.

1. **Ask, then stop:** how should they sound? Age, energy, warmth, pace, anything distinctive. Propose a description in one sentence and a reference sentence the character might really say, in the series language. **Wait for okay.**
2. Add the voice to `series/voices.json` and set the cast member's `voice` to its code. `npm run check` confirms the two match.
3. Make that one reference clip: `npm run voices -- --ref <VOICE>`. This is the only time `--ref` is run without asking again. (A voice that has no clip yet also gets one automatically the first time one of its lines is recorded.)
4. Record two or three short test lines in different moods so the Director hears range, not just one sentence. The studio records lines of an episode only, so use real ones: write the approved script into `series/episodes/<ep>/lines.json` and record one or two lines per voice (`npm run voices -- <ep> <id> …`). If no script is approved yet, a voice cannot be tested; say so rather than inventing lines.
5. **Tell the Director which files to listen to and wait.** You cannot judge a voice by ear; only the Director can approve it. If they want a change, adjust the description or seed, remake the clip and the test lines, and ask again.

Once approved, the voice is fixed.

## Recording an episode

Hand the job to the `voice-director` subagent with the episode name. When it reports back:

- Pass on, in plain words, which lines it could not get right and which it wants the Director to hear.
- If lengths changed for lines in scenes that are already animated, those scenes need re-timing; say which.

## Fixing one line

1. Find the line id from the scene and what the Director heard.
2. If the words are right but the pronunciation is wrong, add or adjust `say` on that line (spell it the way it should sound) and retake only that line: `npm run voices -- <ep> <id>`.
3. If the **words** should change, that is a script change: confirm the new text with the Director, update the story file and `lines.json`, then retake.
4. Run `npm run voices:check -- <ep> <id>` and report the result. Tell the Director the line's new length if the scene's timing moves.

## Changing an approved voice

This changes the character in every episode and means re-recording all of their lines. Say that, with the number of lines affected, and **wait for an explicit okay** before running `--ref`.
