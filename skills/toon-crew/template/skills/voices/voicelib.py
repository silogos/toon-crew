"""Shared by the voice scripts: paths, series settings, listening check, audio clean-up, and the recording
loop every engine runs through (which lines need recording, how a vocal sound is made, the test panel).

Nothing here names an engine or a model. Each engine is a folder skills/voices-<name>/ with its engine.json (what it
needs and can do) and its record.py, which defines an Engine and hands it to run() (see engines.mjs). The listener
that hears each take is a skill of its own too, skills/listen-<name>/listen.py; without one, takes are kept unchecked.
Audio is decoded and levelled with the ffmpeg that comes with Remotion (passed in by py.mjs as TOON_FFMPEG)."""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
import wave
import zlib
from array import array
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent  # skills/voices/ -> the studio folder
SERIES = ROOT / "series"
AUDIO = ROOT / "public" / "audio"
REFS = SERIES / "voice-refs"          # one reference clip per voice; committed, it IS the character's voice
RAW = ROOT / "out" / ".raw_voices"      # raw takes; not committed
DURATIONS = ROOT / "src" / "audio-durations.json"
WORDS = ROOT / "src" / "audio-words.json"        # when each word of a recorded line is heard, for highlighting
TAKES = ROOT / "src" / "audio-takes.json"        # what each line was recorded from, so an unchanged line is not recorded again
PRONUNCIATION = SERIES / "pronunciation.json"    # {"word as written": "how it is said"}, for every line without "say"
TEST_DIR = ROOT / "out" / "voice-test"           # the test panel (npm run voices -- --test)
ENGINES = ROOT / "skills"                         # one folder per voice engine: skills/voices-<name>/engine.json
# every vocal sound a line can be ("sound": "cough") and whether a voice is heard in it; shared with npm run check
VOCAL_SOUNDS = json.loads((ROOT / "scripts" / "lib" / "vocal-sounds.json").read_text())
FFMPEG = os.environ.get("TOON_FFMPEG", "ffmpeg")    # Remotion's ffmpeg (set by py.mjs); a system one otherwise
FFPROBE = os.environ.get("TOON_FFPROBE", "ffprobe")
PASS_SCORE = 0.85    # at or above: the take says the script
BROKEN_SCORE = 0.5   # below: words missing or garbled, so the take is made again; in between: kept, for the Director's ear
MAX_TAKES = 2


def series() -> dict:
    return json.loads((SERIES / "series.json").read_text())


_engine_spec = None


def engine_spec() -> dict:
    """The engine.json of the series' voice engine (found by its name or an older name in "aliases").
    There is no default: the engine is the Director's choice (skills/voices/VOICES-SETUP.md)."""
    global _engine_spec
    if _engine_spec is None:
        chosen = series().get("voiceEngine")
        found = {}
        for f in sorted(ENGINES.glob("voices-*/engine.json")):
            spec = json.loads(f.read_text())
            found[spec["name"]] = spec
            if chosen and (chosen == spec["name"] or chosen in spec.get("aliases", [])):
                _engine_spec = spec
        if not chosen:
            sys.exit(f'No voice engine chosen yet: set "voiceEngine" in series/series.json to one of: {", ".join(found)} '
                     "(the Director's choice; see skills/voices/VOICES-SETUP.md).")
        if _engine_spec is None:
            sys.exit(f'series/series.json: "voiceEngine" is "{chosen}", which is not a voice engine of this studio. Use one of: {", ".join(found)}.')
    return _engine_spec


def engine() -> str:
    """The name of the series' voice engine."""
    return engine_spec()["name"]


def load_env():
    """Read KEY=value lines from .env into the environment (without overriding what is already set)."""
    f = ROOT / ".env"
    if not f.exists():
        return
    for raw in f.read_text().splitlines():
        raw = raw.strip()
        if raw and not raw.startswith("#") and "=" in raw:
            k, v = raw.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip("\"'"))


def voices() -> dict:
    f = SERIES / "voices.json"
    return json.loads(f.read_text()) if f.exists() else {}


def sources() -> list[str]:
    eps = sorted(p.parent.name for p in (SERIES / "episodes").glob("*/lines.json"))
    return eps + (["opening"] if (SERIES / "opening" / "lines.json").exists() else [])


def lines_file(name: str) -> Path:
    return SERIES / "opening" / "lines.json" if name == "opening" else SERIES / "episodes" / name / "lines.json"


def load_lines(command: str, name: str, ids: list[str]) -> list[dict]:
    """Lines of one episode (or the opening), narrowed to `ids` when given. Exits with usage on a bad name."""
    f = lines_file(name) if name else None
    if not f or not f.exists():
        sys.exit(f"Usage: npm run {command} -- <episode> [line-id ...]   (available: {', '.join(sources()) or 'none yet'})")
    lines = json.loads(f.read_text())
    unknown = set(ids) - {l["id"] for l in lines}
    if unknown:
        sys.exit(f"No such line id in {f.relative_to(ROOT)}: {', '.join(sorted(unknown))}")
    return [l for l in lines if not ids or l["id"] in ids]


def _units(text: str) -> list[str]:
    """Words of a text, or its characters for scripts written without spaces. Works for any language."""
    text = unicodedata.normalize("NFKC", text).lower()
    text = "".join(ch if unicodedata.category(ch)[0] in "LN" else " " for ch in text)
    words = text.split()
    if len(words) <= 1 and len(text.strip()) > 6:
        return [ch for ch in text if not ch.isspace()]
    return words


def similarity(expected: str, heard: str) -> float:
    return SequenceMatcher(None, _units(expected), _units(heard)).ratio()


def _listener():
    """The listener skill (skills/listen-<name>/listen.py), or None when the studio has none."""
    for f in sorted((ROOT / "skills").glob("listen-*/listen.py")):
        if str(f.parent) not in sys.path:
            sys.path.insert(0, str(f.parent))
        try:
            import listen
        except ImportError:
            return None
        return listen
    return None


def hear(path: Path, language: str) -> tuple[str, list[dict] | None]:
    """What a recording says, and when each word is heard: [{"w": word, "s": start, "e": end}, ...] in seconds.
    Asks the listener skill; with none (or its model not installed) the text is empty and the word times are None."""
    listener = _listener()
    return listener.hear(path, language) if listener else ("", None)


def listen(path: Path, expected: str, language: str) -> tuple[float, str]:
    """Listen back to a recording and score how close it is to the script (0..1).

    If no listener is installed the line is passed unchecked (score 1.0) and says so.
    """
    heard, words = hear(path, language)
    if words is None:
        return 1.0, "(not checked: no listener is installed)"
    return similarity(expected, heard), heard


def save_words(lid: str, words: list[dict] | None):
    """Keep the word times of a finished recording (None forgets them: the picture then estimates them)."""
    table = json.loads(WORDS.read_text()) if WORDS.exists() else {}
    if words:
        table[lid] = words
    else:
        table.pop(lid, None)
    WORDS.write_text(json.dumps(dict(sorted(table.items())), ensure_ascii=False, separators=(",", ":")).replace('],"', '],\n"') + "\n")


def record_words(lid: str, path: Path, language: str):
    """Listen to the finished file of a line and keep when each word is heard.

    If listening fails, the old times are forgotten (the picture then estimates them) and recording goes on.
    """
    try:
        words = hear(path, language)[1]
    except Exception as err:  # the recording is already saved; word times are a nicety
        print(f"   (could not time the words of {lid}: {err}; they will be estimated)", flush=True)
        words = None
    save_words(lid, words)


def _read_pcm(src: Path, tmp: Path) -> array:
    """Any audio file as 16-bit samples, 48 kHz stereo, interleaved."""
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", str(src), "-ac", "2", "-ar", "48000", "-acodec", "pcm_s16le", str(tmp)], check=True)
    with wave.open(str(tmp)) as w:
        samples = array("h", w.readframes(w.getnframes()))
    if sys.byteorder == "big":
        samples.byteswap()
    tmp.unlink(missing_ok=True)
    return samples


def _write_pcm(samples: array, dst: Path):
    out = array("h", samples)
    if sys.byteorder == "big":
        out.byteswap()
    with wave.open(str(dst), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(48000)
        w.writeframes(out.tobytes())


def sound_bounds(samples: array, channels: int = 2, threshold_db: float = -45) -> tuple[int, int]:
    """First and last frame louder than -45 dB (the same rule as scripts/lib/ffmpeg.mjs): [start, end) in frames."""
    limit = 32768 * 10 ** (threshold_db / 20)
    frames = len(samples) // channels
    loud = lambda f: any(abs(samples[f * channels + c]) > limit for c in range(channels))
    start = 0
    while start < frames and not loud(start):
        start += 1
    end = frames
    while end > start and not loud(end - 1):
        end -= 1
    return (start, end) if start < end else (0, frames)


def add_echo(samples: array, rate: int = 48000) -> array:
    """The "echo" fx: softened (low-passed near 2.2 kHz) and repeated after 0.25 s and 0.5 s, fainter each time."""
    k = 1 - __import__("math").exp(-2 * 3.141592653589793 * 2200 / rate)
    out = array("h", bytes(len(samples) * 2))
    for c in range(2):
        x = samples[c::2]
        soft, y = [], 0.0
        for v in x:
            y += k * (v - y)
            soft.append(y)
        d1, d2 = int(0.25 * rate), int(0.5 * rate)
        for n in range(len(soft)):
            v = 0.8 * soft[n] + (0.5 * soft[n - d1] if n >= d1 else 0) + (0.3 * soft[n - d2] if n >= d2 else 0)
            out[n * 2 + c] = max(-32768, min(32767, int(0.6 * 0.5 * v)))
    return out


def clean(src: Path, dst: Path, echo: bool = False):
    """Trim silence at both ends, add the echo when asked, normalise loudness, write 48 kHz stereo wav."""
    tmp = dst.with_name(dst.stem + ".work.wav")
    samples = _read_pcm(src, tmp)
    start, end = sound_bounds(samples)
    samples = samples[start * 2:end * 2]
    if echo:
        samples = add_echo(samples)
    _write_pcm(samples, tmp)
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", str(tmp), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2",
                    "-acodec", "pcm_s16le", str(dst)], check=True)
    tmp.unlink(missing_ok=True)


def seconds(path: Path) -> float:
    out = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out.strip()), 3)


# ---------------------------------------------------------------- what is said, and how

def engine_model() -> str | None:
    """The engine's model setting in .env (engine.json "model": {"env", "default"}), or None for an engine with no models."""
    setting = engine_spec().get("model")
    if not setting:
        return None
    load_env()
    return os.environ.get(setting["env"]) or setting["default"]


def abilities() -> dict:
    """What the series' engine can do beyond plain speech, for the model in use (same as abilitiesOf in skills/voices/engines.mjs):
    {"label", "delivery", "spoken", "unspoken", "asks", "recordings"}."""
    spec = engine_spec()
    return {"label": spec["label"], **(spec["abilities"].get(engine_model() or "") or spec["abilities"]["*"])}


def from_recording(code: str) -> bool:
    """A voice taken from a real person's recording ("source": "recording"): copied as it is, never designed, remade or instructed."""
    return (voices().get(code) or {}).get("source") == "recording"


def sound_method(sound: str, voice: str | None = None) -> str:
    """How a vocal sound is made here: "voice" (asked of the voice), "synth" (the studio's synthesiser) or "import".
    A recorded voice cannot be asked for a sound, so "voice" falls back to synth or import for it (as in scripts/lib/lines.mjs)."""
    chosen = series().get("vocalSounds") or {}
    kind = VOCAL_SOUNDS[sound]["kind"]
    how = chosen.get(sound) or abilities()[kind]
    if how == "voice" and voice and from_recording(voice):
        return "synth" if kind == "unspoken" else "import"
    return how


def pronunciation() -> dict:
    return json.loads(PRONUNCIATION.read_text()) if PRONUNCIATION.exists() else {}


def apply_pronunciation(text: str, table: dict) -> str:
    """Whole words only, case as written, longest first, in one pass (same rules as scripts/lib/lines.mjs)."""
    keys = sorted((k for k in table if k), key=len, reverse=True)
    if not keys:
        return text
    pattern = re.compile(r"(?<!\w)(?:" + "|".join(re.escape(k) for k in keys) + r")(?!\w)")
    return pattern.sub(lambda m: table[m.group(0)], text)


def spoken_text(line: dict, table: dict) -> str:
    """What the voice is given: "say" when the line has one, else the text through the pronunciation dictionary."""
    return line["say"] if "say" in line else apply_pronunciation(line["text"], table)


def score(line: dict, spoken: str, heard: str) -> float:
    """How close a take is to the script. Either form counts: a listener may write a name as written or as said."""
    return max(similarity(spoken, heard), similarity(line["text"], heard))


# ---------------------------------------------------------------- the recording loop

def _read(path: Path) -> dict:
    return json.loads(path.read_text()) if path.exists() else {}


def _write_takes(takes: dict):
    TAKES.write_text(json.dumps(dict(sorted(takes.items())), ensure_ascii=False, indent=1) + "\n")


def file_hash(path: Path) -> str:
    return hashlib.sha1(path.read_bytes()).hexdigest()[:12] if path.exists() else ""


def synth_sound(sound: str, voice: str, seed: int, dest: Path):
    """A vocal sound from the studio's synthesiser, at the pitch of the voice (skills/voices/vocal-synth.mjs)."""
    r = subprocess.run(["node", str(ROOT / "skills" / "voices" / "vocal-synth.mjs"), sound, str(dest), "--voice", voice, "--seed", str(seed)],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"Could not synthesise {sound}: {r.stderr.strip() or r.stdout.strip()}")


class Engine:
    """What one voice engine provides to the recording loop. Each engine script defines a subclass."""
    ext = "wav"          # file type of a raw take
    max_takes = MAX_TAKES

    def prepare(self, codes: list[str]):
        """Get ready to speak with these voices (load a model, make a voice that has never spoken)."""

    def identity(self, code: str) -> str:
        """What the voice of `code` is made from, so a line is recorded again when its voice is remade."""
        return ""

    def take(self, line: dict, spoken: str, number: int, raw: Path, sound: str | None = None):
        """Write one take of the line to `raw`. With `sound`, ask the voice for that vocal sound instead of words."""
        raise NotImplementedError


def fingerprint(eng: Engine, line: dict, spoken: str, method: str | None) -> str:
    voice = (voices().get(line["voice"]) or {})
    parts = {
        "engine": engine(), "voice": eng.identity(line["voice"]), "spoken": spoken, "fx": line.get("fx"),
        "delivery": line.get("delivery"), "sound": line.get("sound"), "method": method,
        "pitch": voice.get("pitch") if method == "synth" else None,
    }
    return hashlib.sha1(json.dumps(parts, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]


def _usage(eng: Engine) -> str:
    return ("Usage: npm run voices -- <episode> [line-id ...] [--force]   |   npm run voices -- --test [VOICE ...] [sound ...]"
            f"   (episodes: {', '.join(sources()) or 'none yet'})")


def test_lines(eng: Engine, picks: list[str]) -> list[dict]:
    """The test panel: per voice its sample sentence, two deliveries (when the engine takes them) and every vocal sound."""
    all_voices = voices()
    codes = [p for p in picks if p in all_voices] or list(all_voices)
    sounds = [p for p in picks if p in VOCAL_SOUNDS] or list(VOCAL_SOUNDS)
    unknown = [p for p in picks if p not in all_voices and p not in VOCAL_SOUNDS]
    if unknown:
        sys.exit(f"Not a voice or a vocal sound: {', '.join(unknown)}. Voices: {', '.join(all_voices)}. Sounds: {', '.join(VOCAL_SOUNDS)}.")
    only_sounds = any(p in VOCAL_SOUNDS for p in picks)
    lines = []
    for code in codes:
        sample = all_voices[code]["sample"]
        if not only_sounds:
            lines.append({"id": f"{code}_plain", "voice": code, "text": sample})
            if abilities()["delivery"] != "none" and not from_recording(code):
                lines.append({"id": f"{code}_scared", "voice": code, "text": sample, "delivery": "scared, whispering"})
                lines.append({"id": f"{code}_excited", "voice": code, "text": sample, "delivery": "excited, very happy"})
        for s in sounds:
            lines.append({"id": f"{code}_{s}", "voice": code, "text": s, "sound": s})
    return lines


def run(eng: Engine, args: list[str]):
    """`npm run voices`: record the lines of an episode (only those that changed), or the test panel."""
    testing = "--test" in args
    force = "--force" in args
    names = [a for a in args if not a.startswith("--")]
    if testing:
        lines = test_lines(eng, names)
        named = True
    else:
        lines = load_lines("voices", names[0] if names else "", names[1:])
        named = bool(names[1:])  # lines asked for by id are always recorded again
    all_voices = voices()
    missing = sorted({l["voice"] for l in lines} - set(all_voices))
    if missing:
        sys.exit(f"Voice not defined in series/voices.json: {', '.join(missing)}. A new voice is the Director's decision.")
    copied = sorted({l["voice"] for l in lines if from_recording(l["voice"])})
    if copied and not abilities().get("recordings"):
        sys.exit(f"{', '.join(copied)}: a voice taken from a recording, and {abilities()['label']} cannot speak in one.")
    language = series()["language"]
    table = pronunciation()
    out = TEST_DIR / engine() if testing else AUDIO
    for d in (RAW, out):
        d.mkdir(parents=True, exist_ok=True)

    durations = _read(DURATIONS)
    takes = _read(TAKES)
    words_now = _read(WORDS)
    todo, kept = [], 0
    for line in lines:
        lid = line["id"]
        sound = line.get("sound")
        method = sound_method(sound, line["voice"]) if sound else None
        spoken = f"({sound})" if sound else spoken_text(line, table)
        recorded = (AUDIO / f"{lid}.wav").exists() and lid in durations
        prev = takes.get(lid)
        if not testing and recorded and not named and prev and prev.get("by") == "import":
            # a recording brought in from elsewhere is replaced only when its line is named, never by --force
            print(f"kept {lid:16} brought in with voices:import; name the line to record it here instead", flush=True)
            kept += 1
            continue
        if not testing and recorded and not (named or force):
            if prev and prev.get("hash") == fingerprint(eng, line, spoken, method):
                kept += 1
                continue
            if not prev:
                # recorded before takes were tracked: keep it if what was heard matches the script (or it is a sound)
                heard = " ".join(w["w"] for w in words_now.get(lid, []))
                if sound or not heard or score(line, spoken, heard) >= PASS_SCORE:
                    takes[lid] = {"hash": fingerprint(eng, line, spoken, method), "text": line["text"], "spoken": spoken, "by": method or engine()}
                    print(f"kept {lid:16} recorded earlier" + ("" if heard or sound else "; run npm run voices:check to hear that it matches"), flush=True)
                    kept += 1
                    continue
        todo.append((line, spoken, method))
    if not testing:
        _write_takes(takes)
    if not todo:
        print(f"nothing to record: all {len(lines)} line(s) are recorded and unchanged (name a line, or add --force, to record it again)")
        return
    if testing:
        print(f"test panel: {len(todo)} recording(s) into {out.relative_to(ROOT)}/", flush=True)

    eng.prepare(sorted({l["voice"] for l, _, m in todo if m not in ("import", "synth")}))
    t0, drifted, imports = time.time(), 0, []
    for line, spoken, method in todo:
        lid, voice, fx, sound = line["id"], line["voice"], line.get("fx"), line.get("sound")
        if method == "import":
            imports.append(lid)
            who = f"voice {voice} is copied from a recording and cannot be asked for it" if from_recording(voice) else f"{abilities()['label']} cannot make it"
            print(f"--  {lid:16} {voice:5} sound {sound}: {who}; record it and bring it in with npm run voices:import", flush=True)
            continue
        t = time.time()
        raw = RAW / f"{lid}.{'wav' if method == 'synth' else eng.ext}"
        best_raw = RAW / f"{lid}.best{raw.suffix}"
        heard_as = RAW / f"{lid}.cleaned.wav"
        best = (-1.0, "", None)
        takes_made = 0
        if sound:
            # a vocal sound has no words for a listener to check: one take, and the Director listens
            takes_made = 1
            if method == "synth":
                synth_sound(sound, voice, zlib.crc32(lid.encode()) % 100_000, raw)
            else:
                eng.take(line, line["text"], 0, raw, sound=sound)
            shutil.copyfile(raw, best_raw)
            best = (1.0, f"({sound})", None)
        for number in range(0 if sound else eng.max_takes):
            takes_made += 1
            eng.take(line, spoken, number, raw)
            # score the take as it will be heard in the video: trimming and levelling can clip a word.
            # An echo is added on purpose and would only confuse the listener, so that one is scored raw.
            if fx == "echo":
                s, heard = listen(raw, spoken, language)
                s = max(s, similarity(line["text"], heard))
                words = None
            else:
                clean(raw, heard_as)
                heard, words = hear(heard_as, language)
                s = 1.0 if words is None else score(line, spoken, heard)
                if words is None:
                    heard = "(not checked: no listener is installed)"
            if s > best[0]:
                best = (s, heard, words)
                shutil.copyfile(raw, best_raw)
            # only a broken take is made again; one that is merely a little off is the Director's to judge
            if s >= BROKEN_SCORE:
                break
        s, heard, words = best
        dst = out / f"{lid}.wav"
        clean(best_raw, dst, echo=fx == "echo" and not sound)
        for f in (heard_as, best_raw):
            f.unlink(missing_ok=True)
        length = seconds(dst)
        drifted += s < PASS_SCORE
        flag = "♪  " if sound else ("ok " if s >= PASS_SCORE else "?? " if s >= BROKEN_SCORE else "!! ")
        what = f"sound {sound} ({'synthesised' if method == 'synth' else 'voice'}): listen to it" if sound else f"score {s:.2f}  takes {takes_made}"
        print(f"{flag}{lid:16} {voice:5} {length:5.2f}s  {what}  ({time.time() - t:.0f}s)"
              + ("" if s >= PASS_SCORE else f"  heard: '{heard}'" + ("  listen to it" if s >= BROKEN_SCORE else "  still broken")), flush=True)
        if testing:
            continue
        # save after every line so an interrupted run loses nothing; the length first, so the scene is timed to the new take
        durations[lid] = length
        DURATIONS.write_text(json.dumps(durations, indent=2) + "\n")
        if sound:
            save_words(lid, None)  # a sound has no words to light up
        elif fx == "echo":
            record_words(lid, dst, language)
        else:
            save_words(lid, words)  # the same listening that scored the take timed its words
        takes[lid] = {"hash": fingerprint(eng, line, spoken, method), "text": line["text"], "spoken": spoken, "by": method or engine()}
        _write_takes(takes)

    made = len(todo) - len(imports)
    print(f"done in {time.time() - t0:.0f}s: {made} recorded, {kept} unchanged and kept, {drifted} to listen to (?? a little off, !! still broken)"
          + (f", {len(imports)} to bring in with voices:import" if imports else ""))
    if testing:
        print(f"Listen to {out.relative_to(ROOT)}/. Where a sound is poor, set how it is made in series.json, for example "
              '"vocalSounds": {"laugh": "import"} (voice, synth or import; synth only for sounds without a voice in them).')
