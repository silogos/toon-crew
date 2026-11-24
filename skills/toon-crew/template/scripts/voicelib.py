"""Shared helpers for the voice scripts: paths, series settings, listening check, audio clean-up."""
import json
import os
import re
import subprocess
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERIES = ROOT / "series"
AUDIO = ROOT / "public" / "audio"
REFS = SERIES / "voice-refs"          # one reference clip per voice; committed, it IS the character's voice
RAW = ROOT / "scripts" / ".raw_voices"  # raw takes; not committed
DURATIONS = ROOT / "src" / "audio-durations.json"
WORDS = ROOT / "src" / "audio-words.json"        # when each word of a recorded line is heard, for highlighting

TTS_MODEL = "mlx-community/VoxCPM2-8bit"
LISTEN_MODEL = "mlx-community/whisper-large-v3-turbo"
PASS_SCORE = 0.85


def series() -> dict:
    return json.loads((SERIES / "series.json").read_text())


def engine() -> str:
    return series().get("voiceEngine", "local")


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


_portable_model = None


def hear(path: Path, language: str) -> tuple[str, list[dict] | None]:
    """What a recording says, and when each word is heard: [{"w": word, "s": start, "e": end}, …] in seconds.

    The local engine uses mlx-whisper (Apple Silicon). Other setups use faster-whisper on the CPU.
    With neither installed the text is empty and the word times are None.
    """
    global _portable_model
    if engine() == "local":
        import mlx_whisper

        result = mlx_whisper.transcribe(str(path), path_or_hf_repo=LISTEN_MODEL, language=language, word_timestamps=True)
        words = [(w["word"], w["start"], w["end"]) for seg in result.get("segments", []) for w in seg.get("words", [])]
        return result["text"].strip(), _word_list(words)
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return "", None
    if _portable_model is None:
        _portable_model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = _portable_model.transcribe(str(path), language=language[:2], word_timestamps=True)
    segments = list(segments)
    words = [(w.word, w.start, w.end) for seg in segments for w in (seg.words or [])]
    return " ".join(seg.text.strip() for seg in segments), _word_list(words)


def _word_list(words: list[tuple[str, float, float]]) -> list[dict]:
    return [{"w": w.strip(), "s": round(s, 3), "e": round(e, 3)} for w, s, e in words if w.strip()]


def listen(path: Path, expected: str, language: str) -> tuple[float, str]:
    """Listen back to a recording and score how close it is to the script (0..1).

    If no listener is installed the line is passed unchecked (score 1.0) and says so.
    """
    heard, words = hear(path, language)
    if words is None:
        return 1.0, "(not checked: faster-whisper is not installed)"
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


def clean(src: Path, dst: Path, extra: list[str]):
    """Trim silence at both ends, apply extra filters, normalise loudness, write 48 kHz stereo."""
    trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    filters = ",".join([trim, *extra, "loudnorm=I=-16:TP=-1.5:LRA=11"])
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", filters, "-ar", "48000", "-ac", "2", str(dst)], check=True)


def seconds(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out.strip()), 3)
