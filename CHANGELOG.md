# Changelog

## 0.1.1 — 2026-11-24

- **The brief comes first.** Started with no idea given, the crew invented a whole show and first episode from the folder's name. Nothing is now proposed, installed or built until the Director has given the story and where it will be posted; length (about 30 seconds), language (the prompt's, else the Director's own) and pace have defaults. The fast track is the default pace, step by step on request, and the first proposal carries the plan of the first episode.
- **An answer is not an okay.** In a real first session the crew asked two questions, offered "just say okay", and took the reply "pake bahasa indo" as the go-ahead for setting up. The rules now say what counts as an okay, forbid mixing questions with "just say okay", and have the crew say before a long stretch of work what is and is not being made.
- **The crew no longer opens in English by default.** Started by its command alone, with no message to read, it answered an Indonesian Director in English. It now looks at the folder name and the computer's languages and region first, and inside a studio it uses the language of the series.
- **Fast track.** A Director who wants a finished video rather than nine approvals says "fast track" or "just make it": the first meeting becomes one proposal with one okay (which can carry the plan of the first episode too), and each episode stops twice (the whole plan in one message, then the finished picture). Tried twice by a fresh session on a one-sentence idea: first an 18-second vertical video with three stops, then, after its eleven reported unclear instructions were fixed, a 17-second one with two stops in five minutes (when the voice engine is set up, who makes reference clips, the language of voice descriptions, where the cover picture goes, what to do without subagents). `"pace": "fast"` in `series.json` records it, `npm run status` reports it, and installs, paid services and changes to approved work still ask on their own. Step by step stays the default.
- **Vertical video (1080×1920) is usable.** On-screen text follows the long side of the frame, so balloons and captions are readable on a phone instead of 56% of their landscape size; a balloon slides back inside the frame instead of hanging over an edge (in any format); captions sit above the bottom fifth of a vertical frame. `frameShot([...])` works out a shot that shows a group of characters whole in whatever shape the frame has, keeps room above the heads for the balloon, and in a tall frame lifts the group so the bottom is not empty ground, and `CLAUDE.md` and the episode recipe say how to frame shots for a tall picture.
- **A scene can change its music mood part-way:** `t.mood('calm')` in the script (or `t.mood(null)` for silence). It used to take a new scene. Music fades no longer break on a stretch shorter than 50 frames.
- **A scene can move something that stands on the map:** `<World replace={{tree: …}} />` draws that scene's own version of one place (a tree that shakes, a door that opens) without changing the map.
- New pose `pointUp`, for pointing at something overhead; `point` only ever pointed straight ahead.
- **Recording scores the finished file, not the raw take.** Trimming and levelling could clip a word, so `npm run voices` passed a line at 1.00 that `npm run voices:check` then flagged at 0.80. Both now listen to the same file; the line that showed it took three takes instead of one and passes both.
- A complete example scene ships with the episode recipe (`skills/new-episode/scene-example.md`): script, camera cuts, balloons, a change of mood and a prop drawn by the scene. An emptied studio used to have no scene left to learn from.
- Balloons with several rows spread their text evenly instead of leaving one word on the last row.
- `npm run still -- ep01 board`: the whole episode in one picture, 8 moments side by side (or `board 12`), from a single render. The quickest first look for QC and for the Director.
- **Ready to post.** After a final render the crew offers a cover picture and a `out/<ep>-<title>.post.md` with title, caption and tags in the series language.
- `npm run preview`: makes sure the preview (Remotion Studio) is running in the background and prints its links; a preview that is already up is reused, it starts itself again if Remotion Studio quits (it did once during a trial; killing it on purpose brings it back within two seconds), and `npm run preview -- stop` ends it. `npm run status` says whether it is running and where. Every request for a review now carries the link from this command (rule 6 on set, and the screening, episode, character and place recipes), so the Director is never told to start the preview themselves.
- Found by making a new series end to end ("Sari & Bimo", Indonesian, local voices):
  - `npm run voices:setup` also looks for Python in Homebrew and in uv, not only on the PATH; it used to say Python 3.12 was not installed when it was.
  - `npm run status` counts a render as an episode's only when the file is named after its story file, so the sample's leftover video is no longer reported as the new episode 1; `lessons.md` is no longer listed as if it had a stage.
  - `npm run clear-sample -- --yes` leaves an empty `series/story/world.md`, which the recipes read.
  - The map picture puts its title at the bottom, where place labels at the north edge no longer cover it.
  - The voices recipe says that test lines for a new voice are real lines of an approved script.
- Setting up the studio is one command (`scripts/setup-studio.mjs` in the skill): it copies the template, adds `TECH-STACK.md` and makes the links, never overwrites existing files, leaves out local leftovers (`node_modules`, `out`, voice environments, `.env`), and falls back to junctions or copies where Windows does not allow links.
- `npm run doctor`: what the computer and the folder have and what is missing (Node.js, ffmpeg, Chrome, packages, voice engine, API key present or not), with the command that installs each. Runs before `npm install`.
- `npm run status`: where the production stands, read from the folder: each story file's Status line, lines recorded per episode, what is registered and rendered. The crew starts from it when work is picked up again.
- `npm run still` takes a list of frames (`ep01 2 0,60,120`) and renders them in one go.
- `npm run clear-sample -- --keep` starts from the sample instead of emptying it, so `series.json` is no longer edited by hand.
- First meeting: the voice choice is written to `series.json` after the studio exists (it was asked for before the file was there), and is laid out as a table.
- Scripts share `scripts/lib/` (series folder, voice environment, Chrome search) instead of each reading the files its own way; an unknown `voiceEngine` now says which names are allowed.
- `/new-character` now also draws a character from a 3D model file: the order of work, and a table of what to do when one does not show, is the wrong size or will not render.
- A line with no recording no longer breaks a render: it plays as silence, as `check` always said.
- Optional characters from `.glb` models (`series/models.json`, `model` on a cast member): loaded before the picture is drawn, animation by frame number, checked by `npm run check`; model files are never committed. Review sheets for them: `sheet <id> poses` and `sheet <id> clips` show each animation part-way through.
- Character detail in the 3D look: sneakers with soles and toe caps, thumbs, sleeve cuffs, hem and neckline trims, shorts cuffs, and opt-in `nose` and `bigEars` (also `shoeSole`).
- Last-resort voice engine `edge-tts` (`"voiceEngine": "edge"`): free, no account, unofficial.
- `series/story/lessons.md`: the crew records what went wrong and how to avoid it, and reads it before every stage.
- `REMOTION_BROWSER_EXECUTABLE` and more Chromium locations for Linux; scripts no longer depend on `npx`, which could not start on Windows.
- Voice engine choice: ElevenLabs for Windows, Linux and Intel Macs (`"voiceEngine": "elevenlabs"`), and `npm run voices:import` for recordings from any source.
- The crew installs missing prerequisites itself (after one okay), asks the voice engine at the first meeting, and sets it up with `npm run voices:setup`.
- Getting started guide (`docs/getting-started.md`).
- Dependencies pinned to exact versions.
- Engine unit tests (`npm test`) and GitHub Actions CI.
- CONTRIBUTING guide and issue templates.

## 0.1.0

First public version: crew, engine, 3D look, sample series "Ada & Ben".
