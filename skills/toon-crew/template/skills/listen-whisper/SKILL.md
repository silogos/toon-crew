---
name: listen-whisper
description: How the studio's listener (Whisper) works. It covers which Whisper model it uses on which computer, what it downloads, the memory it takes, what it is used for (scoring each take against the script, timing each word for the highlight) and where it goes wrong. Read it when a take's score or its word highlight looks wrong, when the listener is missing, or before changing the listener.
---

# The listener (Whisper)

After every take, the voice kit (`skills/voices/voicelib.py`) asks the listener two things: what the recording says, and when each word is heard. The answers are used twice:

- **to score the take against the script.** This gives the `ok` / `??` / `!!` marks while recording, and `ok` / `LISTEN` / `RETAKE` in `npm run voices:check`;
- **to time each word** for the highlight in balloons and captions (`src/audio-words.json`).

The listener is optional. Without it, takes are kept unchecked, each is marked "not checked: no listener is installed", and the word highlight is estimated from the text. Nothing in the studio names this listener: the voice kit uses whichever `skills/listen-<name>/listen.py` it finds.

## What it uses

| Computer | Package | Model | Download |
|---|---|---|---|
| Apple Silicon Mac | `mlx-whisper` | `mlx-community/whisper-large-v3-turbo-q4` (4 bits) | about 0.44 GB, on first use |
| Anything else | `faster-whisper` | `small`, 8 bits, on the CPU | about 0.5 GB, on first use |

- **Where the models go:** the Hugging Face cache, `~/.cache/huggingface/hub/`. It is shared by every series on the computer and is never committed.
- **How it is installed:** `npm run voices:setup` installs the package listed in `listener.json` for this computer, together with the voice engine's own packages.
- **Why the 4-bit model:** in English and Indonesian tests it heard the same words as the full model. It uses about 1.3 GB of memory at its peak instead of 2.5 GB, and takes about 3.5 seconds a line. It hands freed memory back at once, so a long recording session does not grow.

## Where it goes wrong

- **Sounds without words.** On a cough or a laugh it makes up words ("Thank you.", "And that's it."). That is why vocal sound lines are never scored; the Director listens to them instead.
- **The wrong language.** The listener is told `language` from `series.json`. A take heard in the wrong language scores low even when it is right.
- **Names and short shouts.** These are misheard more often than other words. A low score on a name is often the listener, not the voice. Before retaking, compare what it heard with the script, or hear the take yourself.
- **Accents.** A voice copied from a real person's recording can carry an accent the listener writes differently. Treat `LISTEN` on such a voice as a request for the Director's ear, not as a fault.

## Changing the listener

Another listener is a folder `skills/listen-<name>/` with:

- a `listen.py` that has `hear(path, language)`, returning `(text, [{"w", "s", "e"}, ...])`, or `("", None)` when it cannot listen;
- a `listener.json` naming the packages it needs on an Apple Silicon Mac and elsewhere.

Keep one listener per studio: the voice kit uses the first one it finds.
