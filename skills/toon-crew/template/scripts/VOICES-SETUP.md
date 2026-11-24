# Setting up the voice engine

The crew does this once per series folder, the first time voices are needed. `npm run doctor` says whether it has been done. The sample series ships with its voices already recorded, so nothing here is required just to look around.

## Three engines

Which one a series uses is `"voiceEngine"` in `series/series.json`. Leave it out for **local**.

| | Local (default) | ElevenLabs | edge-tts (last resort) |
|---|---|---|---|
| Runs on | Apple Silicon Mac only | Windows, Linux, any Mac | Windows, Linux, any Mac |
| Cost | Free | Needs an ElevenLabs account and API key; recordings use its credits | Free, no account |
| Privacy | Nothing leaves the computer | Each line of dialogue is sent to ElevenLabs | Each line of dialogue is sent to Microsoft |
| Voices | Designed from a description | Designed from a description | Chosen from a fixed catalogue |
| Reliability | Stable | Official service | Unofficial: can stop working when Microsoft changes it |
| Needs | Python 3.12, ffmpeg | Python 3.10 or newer, ffmpeg, internet | Python 3.10 or newer, ffmpeg, internet |

Offer edge-tts only when the Director has no Apple Silicon Mac and does not want to pay for ElevenLabs, and say plainly that it is unofficial. Pick the engine with the Director before the first recording, and say plainly what ElevenLabs means for cost and privacy. A series keeps one engine: switching later changes every voice. Recordings made elsewhere (a voice actor, another tool) can be brought in with `npm run voices:import` whatever the engine.

## ElevenLabs engine

1. Set `"voiceEngine": "elevenlabs"` in `series/series.json`.
2. Walk the Director through getting a key in plain steps: sign in at elevenlabs.io, open the account's API keys page, create a key, copy it. Then they open the file named `.env` in the series folder, paste it after `ELEVENLABS_API_KEY=`, save, and tell you. Offer to open the folder for them (`open .` on macOS, `explorer .` on Windows). **Never ask for the key in the conversation, never print it, never commit `.env`.** If the Director pastes it into the chat anyway, tell them to put it in `.env` themselves.
3. Run `npm run voices:setup`. It finds Python (3.10 or newer; if missing, offer to install it with the Director's okay), makes `.venv-voices`, installs `faster-whisper`, creates `.env` from `.env.example` if there is none, and says whether the key is present, without printing it. `faster-whisper` listens back to every take, on the CPU; it is optional, and without it lines are accepted unchecked and say so. The first check downloads a small model.
4. Record as usual: `npm run voices -- ep01`. The first time a voice speaks, its description is turned into a voice at ElevenLabs and the id is kept in `series/voice-ids.json`. A short preview is saved as `series/voice-refs/<VOICE>.mp3` so the Director can listen. That id is the character's voice: commit it, and never run `--ref` without the Director's okay.
5. Voice design and the `eleven_v3` model (the one that can shout, laugh and whisper) may need a paid plan; if ElevenLabs refuses, the error says so. With another model (`ELEVENLABS_MODEL` in `.env`), lines with an `fx` are spoken plainly.
6. Voice ids belong to the account that designed them. Someone working on the same series from another account must have the voices shared with them, or redesign them (which changes the voices).

## edge-tts engine (last resort)

1. Set `"voiceEngine": "edge"` in `series/series.json`.
2. Run `npm run voices:setup`. It makes `.venv-voices` and installs `edge-tts` (pinned to the version tested, because it follows an online service and breaks across upgrades) and `faster-whisper` for the listening check.
3. Choose each character's voice: `npm run voices -- --list` prints the catalogue for the series language. Propose one voice per character to the Director (gender, age feel), then write it into `series/voices.json` as `"edge": {"voice": "en-US-AvaNeural"}`. That name is the character's voice; changing it changes the voice in every episode, so it needs the Director's okay.
4. Record as usual: `npm run voices -- ep01`. A line's `fx` only changes speed, pitch and volume a little; `laugh` is spoken plainly.
5. If recording fails with a network or service error, check the connection first. If it keeps failing, Microsoft may have changed the service: say so, and offer another engine.

## Local engine

### What it needs

- An Apple Silicon Mac (the engine runs on MLX)
- Python 3.12
- ffmpeg and ffprobe on the PATH

### Install

`npm run voices:setup` does this for you (after the Director's okay, since it downloads a lot). The manual steps are below for when it cannot.

If `python3.12` is not on the machine, install it first (with Homebrew: `brew install python@3.12`).

From the series folder:

```bash
python3.12 -m venv .venv-voices
```

```bash
.venv-voices/bin/pip install mlx-audio mlx-whisper soundfile numpy
```

The first recording downloads two models (the voice model and the listening model), a few gigabytes in total. Say so before starting, since it takes a while.

Versions known to work together: `mlx-audio 0.6.7`, `mlx-whisper 0.4.3`, `mlx 0.32.4`, `numpy 2.5.5`, `soundfile 0.14.0`. If a newer release fails, install these.

### Check it works

```bash
npm run voices:check -- ep01
```

Every line of the sample episode should be listed as `ok`.

## Where things go (every engine)

| What | Where | Committed |
|---|---|---|
| Voice definitions | `series/voices.json` | yes |
| Reference clip per voice (local) | `series/voice-refs/<VOICE>.wav` | yes: this is the character's voice |
| Chosen catalogue voice (edge-tts) | `series/voices.json`, key `edge` | yes: this is the character's voice |
| Voice ids (ElevenLabs) | `series/voice-ids.json` | yes: this is the character's voice |
| API key | `.env` | **never** |
| Finished lines | `public/audio/<line-id>.wav` | yes |
| Length of every sound | `src/audio-durations.json` | yes |
| When each word of a line is heard (for the highlight in balloons and captions) | `src/audio-words.json` | yes |
| Raw takes | `scripts/.raw_voices/` | no |
| Python environment | `.venv-voices/` | no |
