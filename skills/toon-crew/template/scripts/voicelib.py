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


def listen(path: Path, expected: str, language: str) -> tuple[float, str]:
    """Listen back to a recording and score how close it is to the script (0..1).

    The local engine uses mlx-whisper (Apple Silicon). Other setups use faster-whisper on the CPU.
    If neither is installed the line is passed unchecked (score 1.0) and says so.
    """
    global _portable_model
    if engine() == "local":
        import mlx_whisper

        heard = mlx_whisper.transcribe(str(path), path_or_hf_repo=LISTEN_MODEL, language=language)["text"].strip()
        return similarity(expected, heard), heard
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return 1.0, "(not checked: faster-whisper is not installed)"
    if _portable_model is None:
        _portable_model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = _portable_model.transcribe(str(path), language=language[:2])
    heard = " ".join(seg.text.strip() for seg in segments)
    return similarity(expected, heard), heard


def clean(src: Path, dst: Path, extra: list[str]):
    """Trim silence at both ends, apply extra filters, normalise loudness, write 48 kHz stereo."""
    trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    filters = ",".join([trim, *extra, "loudnorm=I=-16:TP=-1.5:LRA=11"])
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", filters, "-ar", "48000", "-ac", "2", str(dst)], check=True)


def seconds(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out.strip()), 3)
