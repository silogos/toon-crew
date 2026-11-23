"""
Listen back to recorded lines and compare what is heard with the script.

  npm run voices:check -- ep01              every line of the episode
  npm run voices:check -- ep01 <line-id>    only those lines
"""
import sys

from voicelib import AUDIO, PASS_SCORE, listen, load_lines, series

names = [a for a in sys.argv[1:] if not a.startswith("--")]
lines = load_lines("voices:check", names[0] if names else "", names[1:])
language = series()["language"]

flagged = 0
for line in lines:
    wav = AUDIO / f"{line['id']}.wav"
    if not wav.exists():
        flagged += 1
        print(f"MISSING     {line['id']:16} | not recorded")
        continue
    score, heard = listen(wav, line.get("say", line["text"]), language)
    ok = score >= PASS_SCORE
    flagged += not ok
    print(f"{'ok   ' if ok else 'CHECK'} {score:.2f} {line['id']:16} | {heard}", flush=True)

print(f"{len(lines)} line(s), {flagged} to look at")
sys.exit(1 if flagged else 0)
