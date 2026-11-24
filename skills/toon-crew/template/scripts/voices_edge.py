"""
Record character voices with edge-tts: free, no account and no API key, on Windows, Linux and Mac.

Read this first: edge-tts is an UNOFFICIAL client of the online voices built into Microsoft Edge.
  - Every line of dialogue is sent to Microsoft.
  - It can stop working when Microsoft changes the service. The version is pinned to one that was tested.
  - You choose each character's voice from a fixed catalogue; a voice cannot be designed from a description,
    and a line's "fx" only changes speed, pitch and volume a little.
Prefer the local engine (Apple Silicon Mac) or ElevenLabs when you can; use this one when you cannot.

How it works:
  1. Each voice in series/voices.json names one catalogue voice: "edge": {"voice": "en-US-AvaNeural"}.
     That name IS the character's voice in every episode.
  2. Every line is spoken with that voice.
  3. Each take is listened back and compared with the script; the best of a few takes is kept.
  4. The result is cleaned with ffmpeg and its length is written to src/audio-durations.json.
     When each word is heard goes to src/audio-words.json.

  npm run voices -- --list                every voice for the series language (to choose from)
  npm run voices -- ep01                  every line in series/episodes/ep01/lines.json
  npm run voices -- ep01 <line-id>        only those lines
  npm run voices -- opening               series/opening/lines.json
"""
import asyncio
import json
import sys
import time

from voicelib import AUDIO, DURATIONS, PASS_SCORE, RAW, clean, listen, record_words, load_lines, seconds, series, voices

MAX_TAKES = 3

# How a line is delivered when it has an "fx": small changes of speed, pitch and volume.
# "laugh" has no equivalent and is spoken plainly. "echo" is an audio effect added after recording.
DELIVERY = {
    "shout": {"rate": "+10%", "pitch": "+10Hz", "volume": "+30%"},
    "cheer": {"rate": "+10%", "pitch": "+5Hz"},
    "whisper": {"rate": "-10%", "pitch": "-5Hz", "volume": "-30%"},
}


def delivery(fx: str | None) -> dict:
    return DELIVERY.get(fx or "", {})


def import_edge():
    try:
        import edge_tts
    except ImportError:
        sys.exit("edge-tts is not installed in this folder's voice environment. Run: npm run voices:setup")
    return edge_tts


async def list_voices(edge_tts, language: str):
    prefix = language.split("-")[0].lower()
    found = [v for v in await edge_tts.list_voices() if v["Locale"].lower().startswith(prefix)]
    if not found:
        sys.exit(f"No edge-tts voices found for language '{language}'.")
    for v in sorted(found, key=lambda v: (v["Locale"], v["Gender"], v["ShortName"])):
        print(f"{v['ShortName']:34} {v['Gender']:7} {v['Locale']}")


async def speak(edge_tts, text: str, voice: str, fx: str | None, dest) -> None:
    last = None
    for attempt in range(3):
        try:
            await edge_tts.Communicate(text, voice, **delivery(fx)).save(str(dest))
            return
        except Exception as e:  # network trouble or a changed service; retry, then explain
            last = e
            await asyncio.sleep(2 * (attempt + 1))
    sys.exit(
        f"edge-tts could not record the line ({type(last).__name__}: {last}).\n"
        "Check the internet connection. If it keeps failing, Microsoft may have changed the service: "
        "try updating with  npm run voices:setup  or switch the series to another voice engine."
    )


def main():
    edge_tts = import_edge()
    args = sys.argv[1:]
    language = series()["language"]

    if "--list" in args:
        asyncio.run(list_voices(edge_tts, language))
        return

    all_voices = voices()
    for d in (RAW, AUDIO):
        d.mkdir(parents=True, exist_ok=True)
    names = [a for a in args if not a.startswith("--")]
    lines = load_lines("voices", names[0] if names else "", names[1:])
    missing = sorted({l["voice"] for l in lines} - set(all_voices))
    if missing:
        sys.exit(f"Voice not defined in series/voices.json: {', '.join(missing)}. A new voice is the Director's decision.")
    unassigned = sorted(c for c in {l["voice"] for l in lines} if not all_voices[c].get("edge", {}).get("voice"))
    if unassigned:
        sys.exit(
            f"No edge-tts voice chosen for: {', '.join(unassigned)}.\n"
            'Run  npm run voices -- --list  to see the catalogue, then add  "edge": {"voice": "<name>"}  to each voice in series/voices.json.'
        )

    durations = json.loads(DURATIONS.read_text()) if DURATIONS.exists() else {}
    t0, drifted = time.time(), 0
    for line in lines:
        lid, code, fx = line["id"], line["voice"], line.get("fx")
        text = line.get("say", line["text"])  # "say" = how to pronounce it, when that differs from the balloon
        voice = all_voices[code]["edge"]["voice"]
        t = time.time()
        raw = RAW / f"{lid}.mp3"
        best = (-1.0, b"", "")
        takes = 0
        for _ in range(MAX_TAKES):
            takes += 1
            asyncio.run(speak(edge_tts, text, voice, fx, raw))
            score, heard = listen(raw, text, language)
            if score > best[0]:
                best = (score, raw.read_bytes(), heard)
            if score >= PASS_SCORE:
                break
        score, audio, heard = best
        raw.write_bytes(audio)

        dst = AUDIO / f"{lid}.wav"
        clean(raw, dst, ["lowpass=f=2200", "aecho=0.8:0.6:250|500:0.5|0.3", "volume=0.5"] if fx == "echo" else [])
        durations[lid] = seconds(dst)
        flag = "ok " if score >= PASS_SCORE else "!! "
        drifted += score < PASS_SCORE
        print(f"{flag}{lid:16} {code:5} {durations[lid]:5.2f}s  score {score:.2f}  takes {takes}  ({time.time() - t:.0f}s)"
              + ("" if score >= PASS_SCORE else f"  heard: '{heard}'"), flush=True)
        DURATIONS.write_text(json.dumps(durations, indent=2) + "\n")  # save after every line
        # after the length is saved: if this is interrupted, the scene is still timed to the new take
        record_words(lid, dst, language)  # when each word is heard, for the highlight in balloons and captions

    print(f"done in {time.time() - t0:.0f}s: {len(lines)} line(s), {drifted} below {PASS_SCORE}")


if __name__ == "__main__":
    main()
