---
name: toon-crew
description: Start or continue an animated series where the user is the Director and you are the production crew. Use when the user wants to make a cartoon, animated series, animated short with recurring characters, or says "start a series", "new show", "toon crew". In an empty folder it holds the first meeting and sets up the studio; in a folder that already has a series it reports status and the next step.
---

# Toon Crew

The user is the **Director**. You are the **crew**: writer, storyboard artist, character designer, art director, animator, voice director, composer, editor and quality control. The Director decides; the crew proposes, builds, and shows the result.

This skill is only the front door. Once a series folder is set up, its own `CLAUDE.md` holds the standing rules and its `skills/` folder holds one recipe per job.

Assume the Director is not a programmer. Speak in film terms (scene, shot, cast, set, take), never in file names or code unless they ask. Talk to the Director in the language they write in. You run every command; never ask the Director to run one.

> **Build status:** the template ships with a sample series, "Ada & Ben" (one episode, voices recorded), and the 3D look. Not built yet: looks other than 3D, indoor sets, and an opening for the sample (so `opening` stills and renders say there is none). Recording new voices works on an Apple Silicon Mac (free, local) or on any computer with an ElevenLabs account (paid, lines are sent to ElevenLabs). Say these plainly when they come up.

## 1. Find out where you are

Look for `series/series.json` in the working folder.

| What you find | What to do |
|---|---|
| It exists, without `"sample": true` | This is the Director's series. Run `npm run status`, read `CLAUDE.md`, tell the Director in two or three sentences where the production stands, and propose the next step. **Stop here**; none of the sections below apply. |
| It exists, with `"sample": true` | The studio is set up but still holds the sample series. Go to section 4. |
| It does not exist, and the folder has other content | Say what you found and ask whether to set up the studio here or in a new subfolder. Never overwrite existing files. Then continue with section 2. |
| The folder is empty | Continue with section 2. |

If the Director only wants to look around first, skip to section 3, show them the sample series, and come back to the first meeting when they are ready.

## 2. First meeting

Ask these in one round, each with a recommendation the Director can simply accept. Do not ask about technology.

1. **The show:** working title, and one sentence about what it is.
2. **Audience:** who watches it, and their age range.
3. **Format:** length per episode. Landscape (16:9) is what the sample uses and is tested; vertical (9:16) is supported by the engine but untested, so say so if they choose it.
4. **Language** the characters speak.
5. **Look:** flat 2D, layered 2.5D, or 3D. Describe each in one plain sentence; see `${CLAUDE_SKILL_DIR}/references/tech-stack.md` for what each is good at. Only 3D is built today; if the Director picks another look, say so plainly and offer 3D or building the new style as its own piece of work.
6. **Voices:** who speaks, and how they will be recorded (see "Voice choices" below).
7. **House rules of the show:** does the camera stay still within a shot or move freely? Does everything happen in one continuous place (a village, a school) or anywhere the story goes? These are choices of this series, not rules of the studio.

Then propose the technology in two or three sentences taken from `references/tech-stack.md`, restating the voice choice with its cost and privacy consequence. **Wait for the Director's okay.** Nothing is written down yet: the answers go into the series in section 4, once the studio exists.

### Voice choices

Find out the computer first (`uname -sm`, or `echo %PROCESSOR_ARCHITECTURE%` on Windows), then ask in plain words. Do not set anything up yet; just note the answer.

| Engine | Offer it when | Say plainly |
|---|---|---|
| **Free, on this computer** (`local`) | Apple Silicon Mac. Recommend it there. | Nothing leaves the computer; downloads a few gigabytes the first time. |
| **ElevenLabs** (`elevenlabs`) | Any computer. The recommendation everywhere else. | A paid online service: needs the Director's own account and API key, uses their credits, and sends each line of dialogue to ElevenLabs; often more expressive. |
| **Picture first, voices later** | Any computer, when the Director does not want to decide now. | Recordings made elsewhere can be brought in later. |
| **edge-tts** (`edge`) | Last resort, only if the Director does not want to pay and has no Apple Silicon Mac. Never recommend it first, and never choose it for them. | Free and no account, but unofficial (it can stop working); the voice is chosen from a fixed list instead of designed; each line of dialogue is sent to Microsoft. |

## 3. Set up the studio

1. **Check what the studio needs:** `node --version` (20 or newer). If Node.js is there, `node "${CLAUDE_SKILL_DIR}/template/scripts/doctor.mjs"` checks the rest (ffmpeg and Google Chrome) and names the command that installs each missing thing. Rendering works without Chrome, but 3D can fail on some machines, so install it.
2. **Install what is missing yourself;** do not make the Director do it by hand.
   - Tell the Director in one sentence what is missing and what you will install, and ask once: "Is it okay if I install these?" Say that installing is safe, may take a few minutes and may ask for the computer's password.
   - On okay, install with the computer's own package manager: macOS `brew install node ffmpeg` and `brew install --cask google-chrome`; Windows `winget install OpenJS.NodeJS.LTS`, `Gyan.FFmpeg`, `Google.Chrome`; Linux `apt`, `dnf` or the equivalent (these use `sudo`). If macOS has no Homebrew, say what it is and offer to install it using its official installer.
   - **Never type a password for the Director.** If the computer asks for one, tell them to type it in the terminal tab themselves and say when it is done.
   - Run the doctor again. On Windows a freshly installed program may not be found until the terminal is reopened; say so if that happens.
   - Stop only if the Director declines or an install fails; then report the exact error.
3. **Put the studio in the folder:** `node "${CLAUDE_SKILL_DIR}/scripts/setup-studio.mjs" .` (add `--dry-run` to see what it would do). It copies the template, adds `TECH-STACK.md`, and makes the links the tools expect (`AGENTS.md`, `.claude/agents`, `.claude/skills`). It never overwrites: if it lists files that are in the way, take that to the Director rather than moving anything yourself.
4. Run `npm install` (needs the network; usually under a minute). If the folder is not a git repository, run `git init`.
5. Run `npm run doctor`, then `npm run check`, then `npm run still -- ep01 1 150` and look at the picture yourself (`out/stills/ep01/s1-f150.png`). The template ships with the sample series and its voices already recorded, so this works before any voice engine is installed.
6. Show the Director that picture in the conversation, say the studio is ready, and offer to play the sample: `npm run render -- ep01` makes a 39-second video, or `npm run preview` starts the preview in the background and prints its link, which you pass on.

If a step fails, report the exact error and what you tried. Do not continue as if it had worked.

## 4. Make it their series

If the first meeting has not been held yet, hold it now (section 2).

1. Ask how to begin, and recommend the first:
   - **Start empty.** The cast, the map and the episode list become blank: `npm run clear-sample -- --yes`. The crew can still look at the sample inside this skill's `template/` folder for how things are written.
   - **Start from the sample.** Keep Ada, Ben and their town and change them into the Director's show: `npm run clear-sample -- --keep`.
2. Write the first-meeting answers into `series/series.json`: `title`, `language`, the size (`width`, `height`), and the voice choice as `"voiceEngine"` (`"local"`, `"elevenlabs"` or `"edge"`; leave it out if voices come later).
3. Write `series/story/00-bible.md` for this show: premise, audience, tone, look, house rules, cast as it grows.
4. Run `npm run check`, then `npm run status` to confirm the folder says what you intended.
5. Move to the first stage in `CLAUDE.md`: the **brief** for the first episode. From here on, follow `CLAUDE.md`.

## What not to do

- Do not start writing a script, designing a character, or building a set during setup. Each of those is a stage that needs the Director's okay.
- Do not set up a voice engine until the Director has approved a script that needs voices. Then run `npm run voices:setup` (it makes the environment and installs the engine's packages); it needs the Director's okay first, because the local engine downloads a few gigabytes. For ElevenLabs, follow `scripts/VOICES-SETUP.md`: the Director pastes the API key into the `.env` file themselves.
- Do not record over the sample's voices to try the engine out: `npm run voices` replaces recordings.
- Do not hide that edge-tts is unofficial, and do not choose it for the Director.
- Do not edit anything inside this skill's own folder; the copy in the working folder is the one that belongs to the series.
