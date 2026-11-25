# Setting up the voice engine

The crew does this once per series folder, the first time voices are needed. `npm run doctor` says whether it has been done. The sample series ships with its voices already recorded, so nothing here is required just to look around.

## Three engines

Which one a series uses is `"voiceEngine"` in `series/series.json`. There is no default: until the Director chooses, nothing can be recorded. Recommend **voxcpm2** on an Apple Silicon Mac and ElevenLabs elsewhere. (Series made before this say `"local"` for VoxCPM2, and that still works.)

Each engine is a folder of its own, `skills/voices-<name>/`: its guide (`SKILL.md`), what it needs and can do (`engine.json`) and its recorder (`record.py`). The studio names no engine; a new engine is a new folder.

| | VoxCPM2, `voxcpm2` (recommended on an Apple Silicon Mac) | ElevenLabs, `elevenlabs` | edge-tts, `edge` (last resort) |
|---|---|---|---|
| Runs on | Apple Silicon Mac only | Windows, Linux, any Mac | Windows, Linux, any Mac |
| Cost | Free | Needs an ElevenLabs account and API key; recordings use its credits | Free, no account |
| Privacy | Nothing leaves the computer | Each line of dialogue is sent to ElevenLabs | Each line of dialogue is sent to Microsoft |
| Voices | Designed from a description, or copied from a real person's recording | Designed from a description | Chosen from a fixed catalogue |
| Reliability | Stable | Official service | Unofficial: can stop working when Microsoft changes it |
| Needs | Python 3.12 | Python 3.10 or newer, internet | Python 3.10 or newer, internet |
| Languages | 30, including English and Indonesian | `eleven_v3`: 74, including English, Indonesian and Javanese | Whatever its catalogue has (`npm run voices -- --list`) |
| How a line is said (`delivery`) | Yes, as an instruction | Yes, as audio tags (`eleven_v3` only) | No: ignored |
| Laugh, sigh, gasp, sob… (`sound`) | Asked of the voice: listen to the test panel | Yes, as audio tags (`eleven_v3` only) | No: bring in a recording with `voices:import` |
| Cough, sneeze, snore, hiccup, gulp, clearing the throat | Synthesised by the studio at the voice's pitch (asked of the voice, it says words instead) | Yes, as audio tags (`eleven_v3` only; other models: synthesised) | Synthesised by the studio |

Offer edge-tts only when the Director has no Apple Silicon Mac and does not want to pay for ElevenLabs, and say plainly that it is unofficial. Pick the engine with the Director before the first recording, and say plainly what ElevenLabs means for cost and privacy. A series keeps one engine: switching later changes every voice. Whatever the engine, every character keeps one voice of its own; what an engine can do beyond plain speech is in its `engine.json` (`skills/voices-<name>/`), filled in from listening tests, with the languages each model speaks when its maker lists them (`languages`; `npm run check` warns when the series language is not among them), and `npm run voices -- --test <VOICE>` records a panel of it for the Director to hear. Recordings made elsewhere (a voice actor, another tool) can be brought in with `npm run voices:import` whatever the engine.

## Setting up the chosen engine

Each engine has its own guide, with its setup, how its voices are made, what it can do and what it gets wrong:

- VoxCPM2: `skills/voices-voxcpm2/SKILL.md`
- ElevenLabs: `skills/voices-elevenlabs/SKILL.md`
- edge-tts: `skills/voices-edge/SKILL.md`

`npm run voices:setup` sets up whichever engine `series.json` names, after the Director's okay.

## Where things go (every engine)

| What | Where | Committed |
|---|---|---|
| Voice definitions | `series/voices.json` | yes |
| Reference clip per voice (VoxCPM2) | `series/voice-refs/<VOICE>.wav` (and a prompt clip for a recorded voice) | yes: this is the character's voice |
| Chosen catalogue voice (edge-tts) | `series/voices.json`, key `edge` | yes: this is the character's voice |
| Voice ids (ElevenLabs) | `series/voice-ids.json` | yes: this is the character's voice |
| API key | `.env` | **never** |
| Finished lines | `public/audio/<line-id>.wav` | yes |
| Length of every sound | `src/audio-durations.json` | yes |
| When each word of a line is heard (for the highlight in balloons and captions) | `src/audio-words.json` | yes |
| What each line was recorded from (so unchanged lines are not recorded again) | `src/audio-takes.json` | yes |
| Words the voice gets wrong, and how they are said | `series/pronunciation.json` | yes |
| Words only one engine gets wrong (its quirks) | `series/pronunciation.<engine>.json` | yes |
| Test panel | `out/voice-test/<engine>/` | no |
| Raw takes | `out/.raw_voices/` | no |
| Python environment | `.venv-voices/` | no |
