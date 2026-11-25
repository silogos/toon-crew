"""
Listen back to recorded lines and compare what is heard with the script.

  npm run voices:check -- ep01              every line of the episode
  npm run voices:check -- ep01 <line-id>    only those lines

It also keeps when each word is heard (src/audio-words.json), so lines recorded before that
existed, or brought in with voices:import, get their words highlighted too.
"""
import sys

from voicelib import AUDIO, BROKEN_SCORE, PASS_SCORE, hear, load_lines, pronunciation, save_words, series, spoken_text
from voicelib import score as score_take

names = [a for a in sys.argv[1:] if not a.startswith("--")]
lines = load_lines("voices:check", names[0] if names else "", names[1:])
language = series()["language"]
table = pronunciation()

flagged = 0
for line in lines:
    wav = AUDIO / f"{line['id']}.wav"
    if not wav.exists():
        flagged += 1
        print(f"MISSING     {line['id']:16} | not recorded")
        continue
    if line.get("sound"):
        print(f"sound       {line['id']:16} | {line['sound']}: not words, so not checked; listen to it", flush=True)
        continue
    heard, words = hear(wav, language)
    if words is None:
        score, heard = 1.0, "(not checked: no listener is installed)"
    else:
        score = score_take(line, spoken_text(line, table), heard)
        save_words(line["id"], words)
    ok = score >= PASS_SCORE
    flagged += not ok
    label = "ok   " if ok else "LISTEN" if score >= BROKEN_SCORE else "RETAKE"
    print(f"{label:6} {score:.2f} {line['id']:16} | {heard}", flush=True)

print(f"{len(lines)} line(s), {flagged} to look at")
sys.exit(1 if flagged else 0)
