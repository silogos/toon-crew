---
name: voices
description: Give a character a voice (designed from a description, or copied from a real person's recording), record dialogue, or fix a line that sounds wrong. Use when the Director asks about how a character sounds, wants lines recorded or re-recorded, or reports a mispronunciation.
---

# Voices (Voice Director)

Each speaking character has one entry in `series/voices.json`: a text description of the voice, one reference sentence, and a seed. The engine makes a single **reference clip** from that; every line the character ever speaks imitates the clip. That is what keeps a voice the same across episodes, and why a reference clip is never remade without the Director's okay.

**Read the guide of the series' engine first:** `voiceEngine` in `series/series.json` names it, and `skills/voices-<name>/SKILL.md` (for example `voices-voxcpm2`, `voices-elevenlabs`, `voices-edge`; `npm run status` names the engine) says how that engine is set up, how its voices are made, what it can do and what it gets wrong. This recipe holds what is the same for every engine. If no engine is chosen yet, the Director chooses (`skills/voices/VOICES-SETUP.md` compares them); nothing is recorded before that.

If no voice engine is set up yet (`npm run doctor` says whether it is), do it for the Director: read `voiceEngine` in `series/series.json` (the first meeting recorded the choice; if it is missing, ask local or ElevenLabs first, explaining cost and privacy), ask the okay (on the fast track the first okay usually covered it already; do not ask twice), then run `npm run voices:setup` and follow the engine's guide for the rest. If Python is missing, offer to install it with the computer's package manager. On a machine the local engine does not support, say so plainly and offer ElevenLabs or continuing with the picture only.

## Giving a character a voice

How a voice is made differs per engine (designed from a description, copied from a real person's recording, or chosen from a catalogue): the engine's guide says how. The steps below are for a voice designed from a description.

On the **fast track** (see `CLAUDE.md`), the voice descriptions were approved with the plan: skip the stops in steps 1 and 5 and the separate reference step, set up the engine if the plan's okay covered it, and record the whole episode (recording makes the reference clip of every voice that has never spoken), then name at the screening which recordings the Director should hear. A voice is still only approved once the Director has heard it; if they want it changed, that is a retake of that character's lines.

1. **Ask, then stop:** how should they sound? Age, energy, warmth, pace, anything distinctive. Propose a description in one sentence and a reference sentence the character might really say, in the series language. **Wait for okay.**
2. Add the voice to `series/voices.json` and set the cast member's `voice` to its code. `npm run check` confirms the two match.
3. Make that one reference clip: `npm run voices -- --ref <VOICE>`. This is the only time `--ref` is run without asking again. (A voice that has no clip yet also gets one automatically the first time one of its lines is recorded.)
4. Record two or three short test lines in different moods so the Director hears range, not just one sentence. The studio records lines of an episode only, so use real ones: write the approved script into `series/episodes/<ep>/lines.json` and record one or two lines per voice (`npm run voices -- <ep> <id> …`). If no script is approved yet, a voice cannot be tested; say so rather than inventing lines.
5. **Tell the Director which files to listen to and wait.** You cannot judge a voice by ear; only the Director can approve it. If they want a change, adjust the description or seed, remake the clip and the test lines, and ask again.
6. **The test panel** of the new voice: `npm run voices -- --test <VOICE>` records into `out/voice-test/<engine>/` its sample sentence plainly and with two deliveries (when the engine takes them), and every vocal sound the way this engine makes it (in the voice, or synthesised at the voice's pitch). Nothing in the series changes. Name the files and ask the Director which sounds are poor; for each, propose another way (`synth` for a sound without a voice in it, `import` to record it themselves or with someone else) and, with their okay, write it to `series.json` `"vocalSounds"`. On a paid engine the panel costs credits (the engine's guide says how much): ask first, or narrow it (`--test <VOICE> laugh cough`). A synthesised sound follows the pitch heard in the reference clip; if it sounds too high or low, set `"pitch"` (Hz) on the voice in `voices.json`.

Once approved, the voice is fixed.

Every character needs a voice of its own: `npm run check` fails when two would sound the same (the same description and seed, or the same edge-tts voice), and warns when two share a description and differ only by seed.

## A voice from a real person's recording

A character can speak in the voice of a real person the Director records, with that person's consent. Only an engine that can copy a recording does it (VoxCPM2 today); its guide says how to ask for a good recording, how to write it into `voices.json`, and what the Director gives up (a recorded voice takes no `delivery`, spoken `fx` or voiced sounds). Say that before they choose it.

## Recording an episode

Hand the job to the `voice-director` subagent with the episode name. When it reports back:

- Pass on, in plain words, which lines it could not get right and which it wants the Director to hear.
- If lengths changed for lines in scenes that are already animated, those scenes need re-timing; say which.

## Fixing one line

1. Find the line id from the scene and what the Director heard.
2. If the words are right but the pronunciation is wrong, add or adjust `say` on that line (spell it the way it should sound) and retake only that line: `npm run voices -- <ep> <id>`. If the same word is wrong wherever it appears (a name), put it in `series/pronunciation.json` instead (`{"word": "how it is said"}`), or, when only this engine gets it wrong (a quirk in its guide), in `series/pronunciation.<engine>.json`, which that engine alone uses on top; `npm run voices -- <ep>` then retakes every line of that episode that has the word, and the others stay as they are. Earlier episodes keep their recordings until they are recorded again: `npm run check` lists their lines as changed.
3. If the **words** should change, that is a script change: confirm the new text with the Director, update the story file and `lines.json`, then retake.
4. If the **way it is said** is wrong (too flat, should sound scared), set or change the line's `delivery` (`"scared, whispering"`) and retake it. If it should be a cough or a laugh rather than words, make it a line of its own with `sound`. A sound the engine cannot make is either synthesised (the sounds without a voice in them) or brought in: the Director records it on a phone, or another tool makes it, and `npm run voices:import -- <id> <file>` brings it in. An imported recording is never recorded over unless its line is named.
5. Run `npm run voices:check -- <ep> <id>` and report the result. Tell the Director the line's new length if the scene's timing moves.

## Changing an approved voice

This changes the character in every episode and means re-recording all of their lines. Say that, with the number of lines affected, and **wait for an explicit okay** before running `--ref`.
