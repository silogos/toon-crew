---
name: voices-elevenlabs
description: How the ElevenLabs voice engine works in this studio. It covers the API key, voice design and voice ids, credits, models, and what eleven_v3 can and cannot do. Read it before setting up, recording, testing or fixing voices in a series whose series.json says "voiceEngine": "elevenlabs".
---

# The ElevenLabs voice engine

This guide is only for a series with `"voiceEngine": "elevenlabs"`. The rules that hold for every engine are in `CLAUDE.md` and `/voices`. Everything particular to this engine is in this folder: `engine.json` (what it needs, the API key it needs, what each model can do, the audio tag of each vocal sound) and `record.py` (its recorder, run by `npm run voices` through the studio's shared loop in `skills/voices/voicelib.py`).

## What it is

ElevenLabs is a paid online service that runs on any computer.

- **Privacy:** each line of dialogue is sent to ElevenLabs.
- **Cost:** every recording uses the Director's credits.
- **What it needs:**
  - Python 3.10 or newer;
  - an internet connection;
  - the Director's own account and API key.
- **The listening check:** the studio's listener (`skills/listen-whisper`) hears each take. It is optional; without it, lines are accepted unchecked and the output says so.

## Set it up

1. Set `"voiceEngine": "elevenlabs"` in `series/series.json` once the Director has chosen it.
2. Walk the Director through getting a key, in plain steps:
   1. Sign in at elevenlabs.io.
   2. Open the account's API keys page.
   3. Create a key and copy it.
   4. Open the file named `.env` in the series folder and paste the key after `ELEVENLABS_API_KEY=`.
   5. Save the file and say when it is done.

   Offer to open the folder for them: `open .` on macOS, `explorer .` on Windows.

   **Never ask for the key in the conversation, never print it, and never commit `.env`.** If the Director pastes it into the chat anyway, tell them to put it in `.env` themselves.
3. Run `npm run voices:setup`. It:
   - finds Python (if it is missing, offer to install it with the Director's okay);
   - makes `.venv-voices` and installs the listener;
   - creates `.env` from `.env.example` if there is none;
   - says whether the key is present, without printing it.

## How a voice is made

The first time a voice speaks, its description is turned into a voice at ElevenLabs. Its id is kept in `series/voice-ids.json`, and a short preview is saved as `series/voice-refs/<VOICE>.mp3` for the Director to hear.

That id is the character's voice. Commit it, and never run `--ref` without the Director's okay.

Voice ids belong to the account that designed them. Someone working on the same series from another account must have the voices shared with them, or must redesign them, which changes the voices.

A voice copied from a real recording (`"source": "recording"`) is not supported on this engine; `npm run check` fails on it.

## What it can do

It depends on the model, set as `ELEVENLABS_MODEL` in `.env`. The default is `eleven_v3`.

| What | `eleven_v3` | Other models |
|---|---|---|
| `delivery` and `fx` | Sent as audio tags (`[scared]`, `[whispers]`) | Ignored: lines are spoken plainly |
| Every vocal sound (`sound`) | Its audio tag alone (`[coughs]`) | Coughs and other unvoiced sounds are synthesised; laughs and other voiced sounds are brought in |

Voice design and `eleven_v3` may need a paid plan. If ElevenLabs refuses, the error says so.

## Credits

- Every take costs credits. Only new or changed lines are recorded, so do not add `--force` without the Director's okay.
- The test panel costs about 18 requests per voice. Ask first, or narrow it: `npm run voices -- --test <VOICE> laugh cough`.
