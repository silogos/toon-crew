# Episode 1 — The Lost Book

**Status:** sample episode, all stages complete. Not rendered in this folder yet: `npm run render -- ep01` makes `out/ep01-the-lost-book.mp4` (42.0 s).

## Brief

- **The point:** sometimes what you are looking for is already in your hands.
- **Length:** about 40 seconds, two scenes and a closing card.
- **Cast:** Ada, Ben, the narrator.
- **Place:** the square, in the morning and again at dusk.
- **New things needed:** none. Ben's book already exists as a prop.
- **The joke:** Ben is hugging the book in the very first picture. The audience sees it; the two of them do not.

## Script

### Scene 1 — The square, morning

Ben stands on the square hugging his book to his chest, looking around anxiously. Ada arrives.

| # | Who | Line | How |
|---|---|---|---|
| `e1_s1_n` | Narrator | One sunny morning, Ben had a problem. | |
| `e1_s1_b1` | Ben | Ada! My book is gone! | worried, still hugging the book |
| `e1_s1_a1` | Ada | Don't worry. I have a plan. | hands on hips, sure of herself |
| `e1_s1_a2` | Ada | First the bench. Then the pond. Then everywhere! | pointing one way, then another |
| `e1_s1_b2` | Ben | Everywhere? | small, unsure |
| `e1_s1_a3` | Ada | Everywhere! | arms in the air |

Ada marches off. Ben hurries after her, book still in his arms.

### Scene 2 — The square, dusk

The lamp is on and the windows glow. Ada and Ben trudge back to where they started. Ben is still hugging the book.

| # | Who | Line | How |
|---|---|---|---|
| `e1_s2_n` | Narrator | They looked all day. | |
| `e1_s2_a1` | Ada | Bench. Pond. Shop. Nothing. | tired, thinking |
| `e1_s2_b1` | Ben | It was my best one. | sad |
| `e1_s2_a2` | Ada | Ben. What are you holding? | turns to him, surprised |
| `e1_s2_b2` | Ben | Oh. | looks down at the book, surprised, then shy |
| `e1_s2_a3` | Ada | Ha ha ha! | laughing; Ben laughs with her |

### Scene 3 — Closing card

The moral, on a card of its own.

| # | Who | Line | How |
|---|---|---|---|
| `e1_s3_end_n` | Narrator | Sometimes what you are looking for is right in your hands. | |

**Running time:** 58 spoken words, about 25 seconds of speech; with the silent shots and the closing card, roughly 40 seconds.

**Note for the Director:** `e1_s2_a3` is a laugh. Recorded laughter is the hardest thing for the voice engine to get right. If it does not sound natural, the fallback is a short line instead ("You had it all day!").

## Storyboard

All shots are on the square (`origin="square"`). The camera never moves: every shot is still, joined by hard cuts, as the bible asks. Exact frames follow from the recorded lines.

Three framings are used, and reused, so the two scenes echo each other:

- **Wide** — the whole square from the south: bench at left, lamp at right, the two houses behind.
- **Two-shot** — Ada and Ben from the knees up, side by side, turned toward each other.
- **Close** — one character, head and shoulders.

### Scene 1 — morning (`day`), music `cheerful`

| Shot | Camera | Who and what | Lines and sound |
|---|---|---|---|
| 1A | Wide, still | Ben alone in the middle of the square, hugging his book to his chest (`hold`, `book`), `worried`, head turning left and right. Near the end Ada walks in from the left. | `e1_s1_n` |
| 1B | Cut to two-shot | Ada arrives and stops. Ben turns to her, `worried`, talking. Ada listens, then hands on hips (`hips`), `happy`. | `e1_s1_b1`, `e1_s1_a1` · chime as she says "plan" |
| 1C | Cut to close on Ada | She points left on "bench" (`point`), right on "pond", then both arms up (`cheer`) on "everywhere". `happy` → `laugh`. | `e1_s1_a2` |
| 1D | Cut back to two-shot | Ben, `shy`, the book still in his arms, small voice. Ada `cheer`, `laugh`. | `e1_s1_b2`, `e1_s1_a3` |
| 1E | Cut to wide | Ada marches off to the right. Ben hurries after her. The square is empty for a beat. | — |

### Scene 2 — dusk (`dusk`), music `calm`

| Shot | Camera | Who and what | Lines and sound |
|---|---|---|---|
| 2A | Wide, still: the same framing as 1A | Lamp on, windows glowing. Ada and Ben walk in slowly from the right and stop where the day began. Ben is still hugging the book. | `e1_s2_n` |
| 2B | Cut to two-shot | Ada `thinking`, hand to chin (`think`), counts off the places. Ben `sad`. | `e1_s2_a1`, `e1_s2_b1` |
| 2C | Two-shot holds | Ada turns her head toward Ben and stops: `surprised`. | `e1_s2_a2` |
| 2D | Cut to close on Ben | The book fills the lower part of the frame. He looks down at it: `surprised`, then `shy`. | `e1_s2_b2` |
| 2E | Cut back to two-shot | Ada `laugh`, arms up. Ben `laugh`, hugging the book tighter. | `e1_s2_a3` · chime |
| 2F | Cut to wide | The two of them small on the glowing square, still laughing. | |

### Scene 3 — closing card, music `calm` continues

| Shot | Camera | Who and what | Lines and sound |
|---|---|---|---|
| 3A | Full-frame card (2D) | Warm background, sparkles drifting up. The heading "Today's lesson" rises word by word; the moral appears under it, each word lit as it is spoken. | `e1_s3_end_n` (no caption: the card shows it) |

### Notes

- **The book must read from the first frame.** In the wide shots Ben faces the camera so the blue cover is visible; in the two-shots he is turned no more than half-way toward Ada.
- **Why the wide shot returns three times:** it shows that they end up exactly where they started, which is the joke.
- **One small thing the look cannot do yet:** in 2D Ben *looks down* at the book. Characters can turn their heads left and right but not nod. Adding a head nod to the character is a small addition to the 3D look and would be used here; without it, he keeps his head level and only his expression changes.
- **Music:** scene 1 is `cheerful` from the start because the plan is the fun of it; scene 2 drops to `calm`.
