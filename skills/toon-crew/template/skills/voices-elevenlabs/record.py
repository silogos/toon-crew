"""
Record character voices with ElevenLabs. Works on Windows, Linux and Mac; needs an API key and an internet connection.

It follows the same steps as every engine (the shared loop in skills/voices/voicelib.py):
  1. Each voice in series/voices.json is designed ONCE from its text description. ElevenLabs returns a voice id,
     kept in series/voice-ids.json. That id IS the character's voice in every episode.
  2. Every line is spoken with that voice id. A line's "fx" and "delivery" become audio tags (eleven_v3 only).
  3. Each take is listened back once and compared with the script. A take with words missing or garbled is made
     once more; one that is only a little off is kept and marked for the Director to hear.
  4. The result is cleaned (silence trimmed, loudness levelled) and its length is written to src/audio-durations.json.
     When each word is heard goes to src/audio-words.json, and what it was recorded from to src/audio-takes.json,
     so the next run records (and pays for) only the lines that changed.

Setup: put ELEVENLABS_API_KEY=... in the .env file of the series folder (see skills/voices-elevenlabs/SKILL.md).
Optional in .env: ELEVENLABS_MODEL (default eleven_v3).

  npm run voices -- ep01                  the lines of series/episodes/ep01/lines.json that are new or changed
  npm run voices -- ep01 <line-id>        only those lines (always recorded again)
  npm run voices -- ep01 --force          every line again
  npm run voices -- opening               series/opening/lines.json
  npm run voices -- --test [VOICE ...] [sound ...]   the test panel, into out/voice-test/ (uses credits)
  npm run voices -- --ref <VOICE>         (re)design ONE voice: it changes that voice everywhere
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

from voicelib import REFS, SERIES, Engine, engine_model, engine_spec, load_env, run, series, voices

API = "https://api.elevenlabs.io/v1"
IDS = SERIES / "voice-ids.json"  # committed: voice ids made for this series, in the account that designed them
# How a line is delivered when it has an "fx". Spoken as audio tags, which only the eleven_v3 model understands.
# "echo" is an audio effect added after recording, so it needs no tag.
TAGS = {"shout": "[shouting]", "laugh": "[laughing]", "cheer": "[excited]", "whisper": "[whispers]"}


def prepare_text(text: str, line: dict, model: str) -> str:
    """The text sent to the voice. Delivery tags ("fx", then each word group of "delivery") only for eleven_v3."""
    if model != "eleven_v3":
        return text
    tags = [TAGS.get(line.get("fx") or "")]
    tags += [f"[{w.strip()}]" for w in (line.get("delivery") or "").split(",") if w.strip()]
    tags = [t for t in tags if t]
    return f"{' '.join(tags)} {text}" if tags else text


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


class ElevenLabs(Engine):
    ext = "mp3"

    def __init__(self, key: str, model: str):
        self.api_key, self.model = key, model

    def prepare(self, codes):
        # a voice that has never spoken is designed now; existing voices are never touched here
        all_voices = voices()
        for code in codes:
            if code not in read_ids():
                design_voice(code, all_voices[code], self.api_key)

    def identity(self, code):
        return f"{self.model}:{read_ids().get(code, {}).get('voice_id', '')}"

    def take(self, line, spoken, number, raw, sound=None):
        # a sound is the audio tag alone: a cough, not the word for it
        text = engine_spec()["sounds"][sound] if sound else prepare_text(spoken, line, self.model)
        raw.write_bytes(speak(text, read_ids()[line["voice"]]["voice_id"], self.model, self.api_key, series()["language"]))


def main():
    load_env()
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set. Put it in the .env file of this folder (see skills/voices-elevenlabs/SKILL.md).")
    model = engine_model()

    args = sys.argv[1:]
    if "--ref" in args:
        all_voices = voices()
        i = args.index("--ref")
        code = args[i + 1] if i + 1 < len(args) else ""
        if code not in all_voices:
            sys.exit(f"Usage: npm run voices -- --ref <VOICE>   (defined: {', '.join(all_voices) or 'none'})")
        design_voice(code, all_voices[code], key)
        return
    run(ElevenLabs(key, model), args)


if __name__ == "__main__":
    main()
