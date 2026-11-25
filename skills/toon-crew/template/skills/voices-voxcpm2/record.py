"""
Record character voices with VoxCPM2 (open source) through MLX on Apple Silicon.

How it works:
  1. Each voice in series/voices.json gets ONE reference clip, made from its text description.
     A voice taken from a real person ("source": "recording") is that person's recording instead: never made here.
  2. Every line that voice speaks imitates that clip, so the voice stays the same in every episode.
     A line's "fx" and "delivery" are given to the voice as an instruction: how to say it, not who says it.
     A recorded voice is copied as it is, with no instruction; its "prompt" (a short clip and exactly what is said
     in it) lets the engine carry on from the speaker's own words, which keeps their accent (high-fidelity cloning).
  3. Each take is listened back once and compared with the script. A take with words missing or garbled is made
     once more; one that is only a little off is kept and marked for the Director to hear.
  4. The result is cleaned (silence trimmed, loudness levelled) and its length is written to src/audio-durations.json.
     When each word is heard goes to src/audio-words.json, and what it was recorded from to src/audio-takes.json,
     so the next run records only the lines that changed.

Run from the series folder:
  npm run voices -- ep01                  the lines of series/episodes/ep01/lines.json that are new or changed
  npm run voices -- ep01 <line-id>        only those lines (always recorded again)
  npm run voices -- ep01 --force          every line again
  npm run voices -- opening               series/opening/lines.json
  npm run voices -- --test [VOICE ...] [sound ...]   the test panel, into out/voice-test/ (nothing in the series changes)
  npm run voices -- --ref <VOICE>         (re)make ONE voice's reference clip — this changes that voice everywhere
"""
import sys
import time
import zlib

import mlx.core as mx
import numpy as np
import soundfile as sf
from mlx_audio.tts import load_model

from voicelib import REFS, Engine, engine_spec, file_hash, run, voices

# the voice model; downloaded on first use into the Hugging Face cache (~/.cache/huggingface/hub), shared by every series
TTS_MODEL = "mlx-community/VoxCPM2-8bit"

# hand freed memory back at once: by default MLX keeps every freed buffer, and a recording session then holds over
# 12 GB; with this, about 6
mx.set_cache_limit(0)

# How a line is delivered when it has an "fx". "echo" is an audio effect, added after recording.
DELIVERY = {
    "shout": "shouting loudly",
    "laugh": "laughing",
    "cheer": "cheerful and excited, calling out happily",
    "whisper": "whispering quietly",
}


def generate(model, text, **kw):
    chunks, rate = [], None
    for r in model.generate(text=text, inference_timesteps=10, cfg_value=2.0, **kw):
        chunks.append(np.array(r.audio))
        rate = r.sample_rate
    return np.concatenate(chunks), rate


def make_ref(model, code: str, voice: dict):
    if voice.get("source") == "recording":
        sys.exit(f"Voice {code} is a recording the Director brought (series/voice-refs/{code}.wav); it is never generated or remade here.")
    mx.random.seed(int(voice["seed"]))
    audio, rate = generate(model, voice["sample"], instruct=voice["description"])
    sf.write(REFS / f"{code}.wav", audio, rate)
    print(f"reference {code}: {len(audio) / rate:.1f}s", flush=True)


def instruction(line: dict, sound: str | None) -> str | None:
    """How to say it, in words: the sound asked for, or the line's fx and delivery together."""
    if sound:
        return engine_spec()["sounds"][sound]
    parts = [DELIVERY.get(line.get("fx") or ""), line.get("delivery")]
    return ", ".join(p for p in parts if p) or None


def clone_args(code: str, voice: dict, line: dict, sound: str | None) -> dict:
    """How a line is cloned from its voice: the reference clip, plus the instruction for a designed voice, or the
    prompt clip and its words for a recorded one (an instruction would pull a recorded voice away from the person)."""
    kw = {"ref_audio": str(REFS / f"{code}.wav")}
    if voice.get("source") != "recording":
        kw["instruct"] = instruction(line, sound)
    elif voice.get("prompt"):
        kw["prompt_audio"] = str(REFS / voice["prompt"]["file"])
        kw["prompt_text"] = voice["prompt"]["text"].rstrip() + " "
    return kw


class Local(Engine):
    ext = "wav"

    def __init__(self):
        self.model = None

    def load(self):
        if self.model is None:
            t0 = time.time()
            self.model = load_model(TTS_MODEL)
            print(f"model loaded in {time.time() - t0:.0f}s", flush=True)
        return self.model

    def prepare(self, codes):
        # a voice that has never spoken gets its reference clip now; existing clips are never touched here
        REFS.mkdir(parents=True, exist_ok=True)
        all_voices = voices()
        for code in codes:
            if (REFS / f"{code}.wav").exists():
                continue
            if all_voices[code].get("source") == "recording":
                sys.exit(f"Voice {code} is a recording, but series/voice-refs/{code}.wav is missing; put the Director's recording there.")
            make_ref(self.load(), code, all_voices[code])

    def identity(self, code):
        voice = voices().get(code) or {}
        prompt = voice.get("prompt") if voice.get("source") == "recording" else None
        base = f"{TTS_MODEL}:{file_hash(REFS / f'{code}.wav')}"
        # the prompt is part of the voice: changing its clip or its words records the voice's lines again
        return base + (f":{file_hash(REFS / prompt['file'])}:{prompt['text'].strip()}" if prompt else "")

    def take(self, line, spoken, number, raw, sound=None):
        mx.random.seed(zlib.crc32(f"{line['id']}:{number}".encode()) % 100_000)
        audio, rate = generate(self.load(), spoken, **clone_args(line["voice"], voices()[line["voice"]], line, sound))
        sf.write(raw, audio, rate)


def main():
    args = sys.argv[1:]
    if "--ref" in args:
        i = args.index("--ref")
        code = args[i + 1] if i + 1 < len(args) else ""
        all_voices = voices()
        if code not in all_voices:
            sys.exit(f"Usage: npm run voices -- --ref <VOICE>   (defined: {', '.join(all_voices) or 'none'})")
        REFS.mkdir(parents=True, exist_ok=True)
        make_ref(Local().load(), code, all_voices[code])
        return
    run(Local(), args)


if __name__ == "__main__":
    main()
