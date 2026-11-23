"""
Record character voices with VoxCPM2 (open source) through MLX on Apple Silicon.

How it works:
  1. Each voice in series/voices.json gets ONE reference clip, made from its text description.
  2. Every line that voice speaks imitates that clip, so the voice stays the same in every episode.
  3. Each take is listened back and compared with the script; the best of a few takes is kept.
  4. The result is cleaned with ffmpeg and its length is written to src/audio-durations.json.

Run from the series folder:
  npm run voices -- ep01                  every line in series/episodes/ep01/lines.json
  npm run voices -- ep01 <line-id>        only those lines
  npm run voices -- opening               series/opening/lines.json
  npm run voices -- --ref <VOICE>         (re)make ONE voice's reference clip — this changes that voice everywhere
"""
import json
import sys
import time
import zlib

import mlx.core as mx
import numpy as np
import soundfile as sf
from mlx_audio.tts import load_model

from voicelib import AUDIO, DURATIONS, PASS_SCORE, RAW, REFS, TTS_MODEL, clean, listen, load_lines, seconds, series, voices

# How a line is delivered when it has an "fx". "echo" is an audio effect, added after recording.
DELIVERY = {
    "shout": "shouting loudly",
    "laugh": "laughing",
    "cheer": "cheerful and excited, calling out happily",
    "whisper": "whispering quietly",
}
MAX_TAKES = 4


def generate(model, text, **kw):
    chunks, rate = [], None
    for r in model.generate(text=text, inference_timesteps=10, cfg_value=2.0, **kw):
        chunks.append(np.array(r.audio))
        rate = r.sample_rate
    return np.concatenate(chunks), rate


def make_ref(model, code: str, voice: dict):
    mx.random.seed(int(voice["seed"]))
    audio, rate = generate(model, voice["sample"], instruct=voice["description"])
    sf.write(REFS / f"{code}.wav", audio, rate)
    print(f"reference {code}: {len(audio) / rate:.1f}s", flush=True)


def main():
    args = sys.argv[1:]
    all_voices = voices()
    for d in (REFS, RAW, AUDIO):
        d.mkdir(parents=True, exist_ok=True)

    if "--ref" in args:
        i = args.index("--ref")
        code = args[i + 1] if i + 1 < len(args) else ""
        if code not in all_voices:
            sys.exit(f"Usage: npm run voices -- --ref <VOICE>   (defined: {', '.join(all_voices) or 'none'})")
        model = load_model(TTS_MODEL)
        make_ref(model, code, all_voices[code])
        return

    names = [a for a in args if not a.startswith("--")]
    lines = load_lines("voices", names[0] if names else "", names[1:])
    missing = sorted({l["voice"] for l in lines} - set(all_voices))
    if missing:
        sys.exit(f"Voice not defined in series/voices.json: {', '.join(missing)}. A new voice is the Director's decision.")
    language = series()["language"]

    t0 = time.time()
    model = load_model(TTS_MODEL)
    print(f"model loaded in {time.time() - t0:.0f}s", flush=True)

    # a voice that has never spoken gets its reference clip now; existing clips are never touched here
    for code in sorted({l["voice"] for l in lines}):
        if not (REFS / f"{code}.wav").exists():
            make_ref(model, code, all_voices[code])

    durations = json.loads(DURATIONS.read_text()) if DURATIONS.exists() else {}
    drifted = 0
    for line in lines:
        lid, voice, fx = line["id"], line["voice"], line.get("fx")
        text = line.get("say", line["text"])  # "say" = how to pronounce it, when that differs from the balloon
        t = time.time()
        raw = RAW / f"{lid}.wav"
        best = (-1.0, None, None, "")
        takes = 0
        for take in range(MAX_TAKES):
            takes += 1
            mx.random.seed(zlib.crc32(f"{lid}:{take}".encode()) % 100_000)
            audio, rate = generate(model, text, ref_audio=str(REFS / f"{voice}.wav"), instruct=DELIVERY.get(fx))
            sf.write(raw, audio, rate)
            score, heard = listen(raw, text, language)
            if score > best[0]:
                best = (score, audio, rate, heard)
            if score >= PASS_SCORE:
                break
        score, audio, rate, heard = best
        sf.write(raw, audio, rate)

        dst = AUDIO / f"{lid}.wav"
        clean(raw, dst, ["lowpass=f=2200", "aecho=0.8:0.6:250|500:0.5|0.3", "volume=0.5"] if fx == "echo" else [])
        durations[lid] = seconds(dst)
        flag = "ok " if score >= PASS_SCORE else "!! "
        drifted += score < PASS_SCORE
        print(f"{flag}{lid:16} {voice:5} {durations[lid]:5.2f}s  score {score:.2f}  takes {takes}  ({time.time() - t:.0f}s)"
              + ("" if score >= PASS_SCORE else f"  heard: '{heard}'"), flush=True)
        # save after every line so an interrupted run loses nothing
        DURATIONS.write_text(json.dumps(durations, indent=2) + "\n")

    print(f"done in {time.time() - t0:.0f}s: {len(lines)} line(s), {drifted} below {PASS_SCORE}")


if __name__ == "__main__":
    main()
