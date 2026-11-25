"""
Record character voices with edge-tts: free, no account and no API key, on Windows, Linux and Mac.

Read this first: edge-tts is an UNOFFICIAL client of the online voices built into Microsoft Edge.
  - Every line of dialogue is sent to Microsoft.
  - It can stop working when Microsoft changes the service. The version is pinned to one that was tested.
  - You choose each character's voice from a fixed catalogue; a voice cannot be designed from a description,
    a line's "fx" only changes speed, pitch and volume a little, and "delivery" is ignored.
  - It speaks words only. Vocal sounds without a voice in them (a cough, a sneeze) are synthesised by the studio;
    the others (a laugh, a sigh) are recorded elsewhere and brought in with npm run voices:import.
Prefer another engine when you can (skills/voices/VOICES-SETUP.md compares them); use this one when you cannot.

How it works:
  1. Each voice in series/voices.json names one catalogue voice: "edge": {"voice": "en-US-AvaNeural"}.
     That name IS the character's voice in every episode.
  2. Every line is spoken with that voice. No two characters may share one (npm run check says so).
  3. Each take is listened back once and compared with the script. A take with words missing or garbled is made
     once more; one that is only a little off is kept and marked for the Director to hear.
  4. The result is cleaned (silence trimmed, loudness levelled) and its length is written to src/audio-durations.json.
     When each word is heard goes to src/audio-words.json, and what it was recorded from to src/audio-takes.json,
     so the next run records only the lines that changed.

  npm run voices -- --list                every voice for the series language (to choose from)
  npm run voices -- ep01                  the lines of series/episodes/ep01/lines.json that are new or changed
  npm run voices -- ep01 <line-id>        only those lines (always recorded again)
  npm run voices -- ep01 --force          every line again
  npm run voices -- opening               series/opening/lines.json
  npm run voices -- --test [VOICE ...] [sound ...]   the test panel, into out/voice-test/
"""
import asyncio
import sys

from voicelib import Engine, run, series, voices

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


class Edge(Engine):
    ext = "mp3"

    def __init__(self, edge_tts):
        self.edge_tts = edge_tts

    def prepare(self, codes):
        all_voices = voices()
        unassigned = sorted(c for c in codes if not all_voices[c].get("edge", {}).get("voice"))
        if unassigned:
            sys.exit(
                f"No edge-tts voice chosen for: {', '.join(unassigned)}.\n"
                'Run  npm run voices -- --list  to see the catalogue, then add  "edge": {"voice": "<name>"}  to each voice in series/voices.json.'
            )

    def identity(self, code):
        return voices()[code].get("edge", {}).get("voice", "")

    def take(self, line, spoken, number, raw, sound=None):
        asyncio.run(speak(self.edge_tts, spoken, self.identity(line["voice"]), line.get("fx"), raw))


def main():
    edge_tts = import_edge()
    args = sys.argv[1:]
    if "--list" in args:
        asyncio.run(list_voices(edge_tts, series()["language"]))
        return
    run(Edge(edge_tts), args)


if __name__ == "__main__":
    main()
