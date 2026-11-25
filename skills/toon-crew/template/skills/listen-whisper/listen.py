"""
The studio's listener: Whisper hears what a recording says and when each word is said.

The voice kit (skills/voices/voicelib.py) asks it after every take, to score the take against the script and to time
each word for the highlight in balloons and captions. It is optional: without it, takes are kept unchecked and the
word times are estimated from the text.

  On an Apple Silicon Mac: mlx-whisper with whisper-large-v3-turbo in 4 bits (about 0.44 GB, downloaded on first use
  into ~/.cache/huggingface/hub). It heard the same words as the full model in English and Indonesian tests, in about
  half the memory.
  Elsewhere: faster-whisper "small" in 8 bits on the CPU (downloaded on first use).

What is installed for it is in listener.json, next to this file.
"""
import platform
import sys
from pathlib import Path

MLX_MODEL = "mlx-community/whisper-large-v3-turbo-q4"
CPU_MODEL = "small"

_cpu_model = None


def apple_silicon() -> bool:
    return sys.platform == "darwin" and platform.machine() == "arm64"


def _word_list(words) -> list[dict]:
    return [{"w": w.strip(), "s": round(s, 3), "e": round(e, 3)} for w, s, e in words if w.strip()]


def hear(path: Path, language: str) -> tuple[str, list[dict] | None]:
    """What a recording says, and when each word is heard: [{"w": word, "s": start, "e": end}, ...] in seconds.
    With no Whisper installed the text is empty and the word times are None."""
    global _cpu_model
    if apple_silicon():
        try:
            import mlx.core as mx
            import mlx_whisper
        except ImportError:
            pass
        else:
            # hand freed memory back at once: by default MLX keeps it, and a long session then holds many gigabytes
            mx.set_cache_limit(0)
            result = mlx_whisper.transcribe(str(path), path_or_hf_repo=MLX_MODEL, language=language, word_timestamps=True)
            words = [(w["word"], w["start"], w["end"]) for seg in result.get("segments", []) for w in seg.get("words", [])]
            return result["text"].strip(), _word_list(words)
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return "", None
    if _cpu_model is None:
        _cpu_model = WhisperModel(CPU_MODEL, device="cpu", compute_type="int8")
    segments, _ = _cpu_model.transcribe(str(path), language=language[:2], word_timestamps=True)
    segments = list(segments)
    words = [(w.word, w.start, w.end) for seg in segments for w in (seg.words or [])]
    return " ".join(seg.text.strip() for seg in segments), _word_list(words)
