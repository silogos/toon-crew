"""
Record character voices with ElevenLabs. Works on Windows, Linux and Mac; needs an API key and an internet connection.

It follows the same steps as the local engine:
  1. Each voice in series/voices.json is designed ONCE from its text description. ElevenLabs returns a voice id,
     kept in series/voice-ids.json. That id IS the character's voice in every episode.
  2. Every line is spoken with that voice id.
  3. Each take is listened back and compared with the script; the best of a few takes is kept.
  4. The result is cleaned with ffmpeg and its length is written to src/audio-durations.json.

Setup: put ELEVENLABS_API_KEY=... in the .env file of the series folder (see scripts/VOICES-SETUP.md).
Optional in .env: ELEVENLABS_MODEL (default eleven_v3).

  npm run voices -- ep01                  every line in series/episodes/ep01/lines.json
  npm run voices -- ep01 <line-id>        only those lines
  npm run voices -- opening               series/opening/lines.json
  npm run voices -- --ref <VOICE>         (re)design ONE voice: it changes that voice everywhere
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

from voicelib import AUDIO, DURATIONS, PASS_SCORE, RAW, REFS, SERIES, clean, listen, load_env, load_lines, seconds, series, voices

API = "https://api.elevenlabs.io/v1"
IDS = SERIES / "voice-ids.json"  # committed: voice ids made for this series, in the account that designed them
MAX_TAKES = 3

# How a line is delivered when it has an "fx". Spoken as audio tags, which only the eleven_v3 model understands.
# "echo" is an audio effect added after recording, so it needs no tag.
TAGS = {"shout": "[shouting]", "laugh": "[laughing]", "cheer": "[excited]", "whisper": "[whispers]"}


def prepare_text(text: str, fx: str | None, model: str) -> str:
    """The text sent to the voice. Delivery tags are added only for models that understand them."""
    tag = TAGS.get(fx or "")
    return f"{tag} {text}" if tag and model == "eleven_v3" else text


def api(path: str, body: dict, key: str, query: str = "") -> tuple[bytes, dict]:
    """POST JSON, return the raw response. Waits and retries when the service says to slow down."""
    req = urllib.request.Request(
        f"{API}{path}{query}",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"},
        method="POST",
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return r.read(), dict(r.headers)
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:400]
            if e.code == 429 and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            hint = {
                401: "The API key was refused. Check ELEVENLABS_API_KEY in .env.",
                402: "This needs a paid ElevenLabs plan, or the plan has no credits left.",
                422: "ElevenLabs did not accept the request (see below).",
            }.get(e.code, "")
            sys.exit(f"ElevenLabs error {e.code} on {path}. {hint}\n{detail}")
        except urllib.error.URLError as e:
            sys.exit(f"Could not reach ElevenLabs: {e.reason}. Check the internet connection.")
    sys.exit(f"ElevenLabs kept saying 'too many requests' on {path}. Try again in a minute.")


def read_ids() -> dict:
    return json.loads(IDS.read_text()) if IDS.exists() else {}


def design_voice(code: str, voice: dict, key: str):
    """Make the voice from its description and keep its id."""
    sample = voice["sample"]
    body = {"voice_description": voice["description"], "model_id": "eleven_ttv_v3", "seed": int(voice["seed"])}
    if 100 <= len(sample) <= 1000:
        body["text"] = sample
    else:
        body["auto_generate_text"] = True  # the preview text must be 100-1000 characters
    data, _ = api("/text-to-voice/design", body, key)
    previews = json.loads(data)["previews"]
    if not previews:
        sys.exit(f"ElevenLabs returned no voice for {code}. Try a more detailed description.")
    pick = previews[0]
    (REFS).mkdir(parents=True, exist_ok=True)
    (REFS / f"{code}.mp3").write_bytes(base64.b64decode(pick["audio_base_64"]))  # to listen to; not used for speaking
    data, _ = api(
        "/text-to-voice",
        {"voice_name": f"{series()['title']} - {code}", "voice_description": voice["description"], "generated_voice_id": pick["generated_voice_id"]},
        key,
    )
    ids = read_ids()
    ids[code] = {"voice_id": json.loads(data)["voice_id"]}
    IDS.write_text(json.dumps(ids, indent=2) + "\n")
    print(f"voice {code}: designed, id kept in series/voice-ids.json (preview: series/voice-refs/{code}.mp3)", flush=True)


def speak(text: str, voice_id: str, model: str, key: str, language: str) -> bytes:
    body = {"text": text, "model_id": model}
    if model == "eleven_v3":
        body["language_code"] = language[:2]
    data, _ = api(f"/text-to-speech/{voice_id}", body, key, "?output_format=mp3_44100_128")
    return data


def main():
    load_env()
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set. Put it in the .env file of this folder (see scripts/VOICES-SETUP.md).")
    model = os.environ.get("ELEVENLABS_MODEL", "eleven_v3")

    args = sys.argv[1:]
    all_voices = voices()
    for d in (REFS, RAW, AUDIO):
        d.mkdir(parents=True, exist_ok=True)

    if "--ref" in args:
        i = args.index("--ref")
        code = args[i + 1] if i + 1 < len(args) else ""
        if code not in all_voices:
            sys.exit(f"Usage: npm run voices -- --ref <VOICE>   (defined: {', '.join(all_voices) or 'none'})")
        design_voice(code, all_voices[code], key)
        return

    names = [a for a in args if not a.startswith("--")]
    lines = load_lines("voices", names[0] if names else "", names[1:])
    missing = sorted({l["voice"] for l in lines} - set(all_voices))
    if missing:
        sys.exit(f"Voice not defined in series/voices.json: {', '.join(missing)}. A new voice is the Director's decision.")
    language = series()["language"]

    # a voice that has never spoken is designed now; existing voices are never touched here
    for code in sorted({l["voice"] for l in lines}):
        if code not in read_ids():
            design_voice(code, all_voices[code], key)
    ids = read_ids()

    durations = json.loads(DURATIONS.read_text()) if DURATIONS.exists() else {}
    t0, drifted = time.time(), 0
    for line in lines:
        lid, voice, fx = line["id"], line["voice"], line.get("fx")
        text = line.get("say", line["text"])  # "say" = how to pronounce it, when that differs from the balloon
        spoken = prepare_text(text, fx, model)
        t = time.time()
        raw = RAW / f"{lid}.mp3"
        best = (-1.0, b"", "")
        takes = 0
        for _ in range(MAX_TAKES):
            takes += 1
            audio = speak(spoken, ids[voice]["voice_id"], model, key, language)
            raw.write_bytes(audio)
            score, heard = listen(raw, text, language)
            if score > best[0]:
                best = (score, audio, heard)
            if score >= PASS_SCORE:
                break
        score, audio, heard = best
        raw.write_bytes(audio)

        dst = AUDIO / f"{lid}.wav"
        clean(raw, dst, ["lowpass=f=2200", "aecho=0.8:0.6:250|500:0.5|0.3", "volume=0.5"] if fx == "echo" else [])
        durations[lid] = seconds(dst)
        flag = "ok " if score >= PASS_SCORE else "!! "
        drifted += score < PASS_SCORE
        print(f"{flag}{lid:16} {voice:5} {durations[lid]:5.2f}s  score {score:.2f}  takes {takes}  ({time.time() - t:.0f}s)"
              + ("" if score >= PASS_SCORE else f"  heard: '{heard}'"), flush=True)
        DURATIONS.write_text(json.dumps(durations, indent=2) + "\n")  # save after every line

    print(f"done in {time.time() - t0:.0f}s: {len(lines)} line(s), {drifted} below {PASS_SCORE}")


if __name__ == "__main__":
    main()
