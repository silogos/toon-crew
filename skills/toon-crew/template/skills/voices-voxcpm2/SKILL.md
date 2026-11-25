---
name: voices-voxcpm2
description: How the VoxCPM2 voice engine (on this computer, through MLX on an Apple Silicon Mac) works in this studio. It covers setting it up, its models and memory, voices designed from a description or copied from a real person's recording, what it can and cannot do, and its known quirks. Read it before setting up, recording, testing or fixing voices in a series whose series.json says "voiceEngine": "voxcpm2" (or its older name "local").
---

# The VoxCPM2 voice engine

This guide is only for a series with `"voiceEngine": "voxcpm2"` (older series say `"local"`, which means the same). The rules that hold for every engine are in `CLAUDE.md` and `/voices`: one voice per character, never remade without the Director, write for the ear. Everything particular to this engine is in this folder: `engine.json` (what it needs, what it can do, how each vocal sound is asked for, how it is recommended) and `record.py` (its recorder, which `npm run voices` runs through the studio's shared loop in `skills/voices/voicelib.py`). This guide explains them; the code carries them out, whether or not this guide is read.

## What it is

- **What it runs:** VoxCPM2, an open model (Apache-2.0). It runs on the Mac through MLX (`mlx-audio`), in 8 bits. Nothing leaves the computer, and it costs nothing.
- **What it needs:**
  - an Apple Silicon Mac;
  - Python 3.12;
- **What it downloads:** two models on first use.
  - The voice model `mlx-community/VoxCPM2-8bit` is about 3.2 GB.
  - The listener (its own skill, `skills/listen-whisper`) downloads about 0.44 GB more.
  - Both go into the Hugging Face cache, `~/.cache/huggingface/hub/`. That cache is shared by every series on the Mac and is never committed.
- **Memory:** a recording session peaks at about 5 to 6 GB. The voice model takes 3.2 GB, plus about 1.7 GB while it makes a line, and the listener adds about 1.3 GB. The scripts hand freed memory back at once (`lean_mlx()`). Say this before a long session on a Mac with 8 GB.
- **Speed:** a line takes about 10 to 20 seconds, including the listening check.
- **Languages:** 30, including English and Indonesian, listed as `languages` in `engine.json` (from the model card). There is no language setting: it works the language out from the text, and how well it speaks one depends on how much of it the model was trained on. See the quirks below.

## Set it up

`npm run voices:setup` does it, after the Director's okay, because it downloads a lot. The manual steps are for when it cannot.

If `python3.12` is not on the machine, install it first. With Homebrew: `brew install python@3.12`.

From the series folder:

```bash
python3.12 -m venv .venv-voices
```

```bash
.venv-voices/bin/pip install mlx-audio soundfile numpy mlx-whisper
```

(`mlx-whisper` is the listener's.) Versions known to work together: `mlx-audio 0.6.8`, `mlx-whisper 0.4.3`, `mlx 0.32.4`, `numpy 2.5.5`, `soundfile 0.14.0`. If a newer release fails, install these.

To check it works, run `npm run voices:check -- <ep>` on an episode that is already recorded. Every line should be `ok` or `LISTEN`.

## How a voice is made

There are two ways. Both end as one reference clip, `series/voice-refs/<VOICE>.wav`, and every line the character speaks imitates that clip.

### Designed from a description (the usual way)

`voices.json` holds a `description` in English, a `sample` sentence in the series language, and a `seed`. The first time the voice speaks, or with `--ref` on the Director's okay, the engine speaks the sample in the described voice. That clip becomes the character's voice.

Two voices with the same description and seed would come out the same, so `npm run check` fails on that.

### Copied from a real person's recording

A character can speak in the voice of a real person the Director records: themselves, a child, a voice actor. The person must consent. This engine can (`"recordings": true` in `engine.json`). The engine copies the recording; nothing about the voice is generated.

1. **Ask the Director for the recording.**
   - One person only, 10 to 20 seconds.
   - A quiet room, no music.
   - Talking the way the character talks. If the character shouts in the story, include a little shouting: a recording without a shout gives weak shouts.
   - The exact words of one short sentence in it, or of a separate clip of 2 to 5 seconds.
2. **Save the files.**
   - The recording goes in as `series/voice-refs/<VOICE>.wav`. If it came in another format, convert it with the ffmpeg that comes with Remotion: `npx remotion ffmpeg -i <file> series/voice-refs/<VOICE>.wav`.
   - If the short clip is separate, save it next to it as `<VOICE>-prompt.wav`.
3. **Fill in `voices.json`.**
   - `"source": "recording"`.
   - A `description` that says whose recording it is and when it was brought.
   - A `sample` sentence, for the test panel.
   - `"prompt": {"file": "<VOICE>-prompt.wav", "text": "exactly what is said in it"}`.
   - No seed.

   The prompt is optional but makes the copy closer. This is VoxCPM2's high-fidelity cloning: the engine carries on from the person's own words, which keeps their accent. The text must match what is heard, word for word. A longer prompt makes every line slower.
4. **Test it.** Record the test panel (`npm run voices -- --test <VOICE>`) and let the Director listen.

**What the Director gives up.** Tell them before they choose a recording.

A recorded voice is copied as it is, so it takes no instruction:

- A line's `delivery` does not change how it is said.
- The `fx` values `shout`, `laugh`, `cheer` and `whisper` do not change how it is said either. `echo` still works, and `shout` still makes the balloon red.
- Vocal sounds are not voiced. A cough is synthesised; a laugh is brought in with `voices:import`.

`npm run check` warns about each such line.

`--ref` refuses to remake a recorded voice. The only way to change it is a new recording from the Director, and that is a change to an approved voice.

## What it can do

Beyond plain speech, what this engine can do comes from listening tests (`abilities` and `sounds` in `engine.json`):

| What | How | Note |
|---|---|---|
| `delivery`, `fx` | Given to the voice as an instruction alongside its reference clip | Designed voices only, not recorded ones |
| Laugh, sigh, gasp, sob, scream, hum, groan, yawn, giggle | The voice is asked for them | Uneven: let the Director listen to the test panel. A poor one goes to `"vocalSounds"` in `series.json` |
| Cough, sneeze, snore, hiccup, gulp, clearing the throat | Synthesised by the studio at the voice's pitch | Asked of the voice, it says the word instead |

## Known quirks

- **Indonesian "c" read as "k".** With no language setting, the engine read Indonesian "c" the English way. In one series, "Ucup" came out as "Ukup" and "Uma cari" as "makari", in every designed voice. Asking for Indonesian in the description or the sample did not help.
  - Fix a name that recurs in `series/pronunciation.voxcpm2.json`, for example `{"Ucup": "U-chup"}`: it is this engine's quirk, so it goes in this engine's own dictionary, which is used on top of `series/pronunciation.json` and is left behind if the series changes engine. Fix a single line with `say`.
  - Respell only the words you have heard come out wrong, never every "c": the spelling that works depends on the word, so listen to each fix.
  - It is not yet tested whether recorded voices with an Indonesian prompt do the same.
  - The same may happen with other letters that English reads differently. Listen for it on the first test panel of a non-English series.
- **The listener is told the series language.** A take heard in the wrong language scores badly even when it is right, so `language` in `series.json` must be correct.
- **Short shouted lines** ("Tolong!") are the likeliest to come out garbled. Check them in the `??` and `!!` list.
