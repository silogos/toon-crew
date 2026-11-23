# Changelog

## Unreleased

- `npm run preview`: makes sure the preview (Remotion Studio) is running in the background and prints its links; a preview that is already up is reused, and `npm run preview -- stop` ends it. Every request for a review now carries the link from this command (rule 6 on set, and the screening, episode, character and place recipes), so the Director is never told to start the preview themselves.
- Found by making a new series end to end ("Sari & Bimo", Indonesian, local voices):
  - `npm run voices:setup` also looks for Python in Homebrew and in uv, not only on the PATH; it used to say Python 3.12 was not installed when it was.
  - `npm run status` counts a render as an episode's only when the file is named after its story file, so the sample's leftover video is no longer reported as the new episode 1; `lessons.md` is no longer listed as if it had a stage.
  - `npm run clear-sample -- --yes` leaves an empty `series/story/world.md`, which the recipes read.
  - The map picture puts its title at the bottom, where place labels at the north edge no longer cover it.
  - Recipes say what the studio cannot do before it is discovered in production: one music mood per scene, things on the map do not move, and test lines for a new voice are real lines of an approved script.
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
