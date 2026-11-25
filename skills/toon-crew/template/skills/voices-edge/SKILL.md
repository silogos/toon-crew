---
name: voices-edge
description: How the edge-tts voice engine (last resort) works in this studio. It covers setting it up, choosing each character's voice from Microsoft's catalogue, and what it cannot do. Read it before setting up, recording, testing or fixing voices in a series whose series.json says "voiceEngine": "edge".
---

# The edge-tts voice engine (last resort)

This guide is only for a series with `"voiceEngine": "edge"`. The rules that hold for every engine are in `CLAUDE.md` and `/voices`. Everything particular to this engine is in this folder: `engine.json` (what it needs and can do) and `record.py` (its recorder, run by `npm run voices` through the studio's shared loop in `skills/voices/voicelib.py`).

## What it is

edge-tts is Microsoft's online voices, reached through an unofficial package. It runs on any computer.

- **Cost:** free, with no account.
- **Privacy:** each line of dialogue is sent to Microsoft.
- **Reliability:** it is unofficial and can stop working whenever Microsoft changes the service. Say so plainly.
- **When to offer it:** only when the Director has no Apple Silicon Mac and does not want to pay for ElevenLabs. Never choose it for them.

## Set it up

1. Set `"voiceEngine": "edge"` in `series/series.json` once the Director has chosen it.
2. Run `npm run voices:setup`. It makes `.venv-voices` and installs `edge-tts` and the listener (`skills/listen-whisper`, for the listening check). `edge-tts` is pinned to the tested version, because it follows an online service and breaks across upgrades.

## How a voice is chosen

A voice is chosen from a catalogue, not designed.

1. Run `npm run voices -- --list` to print the catalogue for the series language.
2. Propose one voice per character to the Director, by gender and how old it sounds.
3. After their okay, write it into `series/voices.json` as `"edge": {"voice": "<name>"}`.

There is no reference clip: the catalogue name is the character's voice. Changing it changes the voice in every episode, so it needs the Director's okay.

The catalogue is small, so two characters can easily end up wanting the same voice. `npm run check` fails when they share one.

A voice copied from a real recording (`"source": "recording"`) is not supported on this engine.

## What it can do

This engine only reads text aloud.

- `delivery` is ignored.
- `fx` changes speed, pitch and volume a little. `laugh` is spoken plainly.
- Coughs and other unvoiced sounds are synthesised by the studio. Laughs and other voiced sounds must be recorded and brought in with `voices:import`.

## When it fails

If recording fails with a network or service error, check the connection first. If it keeps failing, Microsoft may have changed the service: say so, and offer another engine.
