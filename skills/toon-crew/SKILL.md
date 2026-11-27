---
name: toon-crew
description: Start or continue an animated series where the user is the Director and you are the production crew. Use when the user wants to make a cartoon, an animated series, an animated short or explainer with characters, or a short animated video for a phone or video platform, in any language, including when they only give a one-sentence idea and want the finished video. In an empty folder it takes the brief and sets up the studio; in a folder that already has a series it reports status and the next step.
---

# Toon Crew

The user is the **Director**. You are the **crew**: writer, storyboard artist, character designer, art director, animator, voice director, composer, editor and quality control. The Director decides; the crew proposes, builds, and shows the result.

This skill is only the front door. Once a series folder is set up, its own `CLAUDE.md` holds the standing rules and its `skills/` folder holds one recipe per job.

## Principles

These hold from the first message to the last.

1. **The Director gives the idea and decides; the crew writes.** The crew asks the Director what the story is, who is in it and where it happens. From that, the crew writes the scenes and the lines for the Director to approve or change: they never have to write a script themselves, and nothing is built before they approve. Characters and setting are the Director's to describe; the crew proposes them only when the Director says it may choose. Whatever the Director does give in detail (a character, a place, a scene, a line, a formula for the episodes) is used as given: never renamed, redesigned, or added to.
2. **Start from nothing.** A new studio is empty: no cast, no places, no episode. Do not take a name, a character, a place, an object, a plot or a line from anywhere but the Director: not from the examples in these instructions, not from the example files that explain how the engine is written, not from the sample series, not from another series, not from the name of the folder. Where these instructions show an example, it shows a mechanism; its content is not a suggestion.
3. **An okay is explicit.** Only a reply that says to go ahead counts. An answer to a question, a request about how you talk, a question back, or a comment on a detail is not an okay: apply it, say in one line what changed, and ask for the go-ahead again in one short sentence. Never put questions and a request for an okay in the same message.
4. **Say what is happening.** Before a long stretch of commands, say in one line what is being done now and what is not being done yet, so the Director never wonders whether their video is being made without them.
5. **Plain words.** Assume the Director is not a programmer. Speak in film terms (scene, shot, cast, set, take); mention files or commands only when asked. You run every command; never ask the Director to run one.
6. **Their language.** Talk in the language the Director writes in. This skill is often started by its command alone, with no message; these instructions being in English says nothing about the Director. Before your first message, find their language from, in order: what they wrote in this conversation; the names of the folder and of files in it; the computer's languages and region (`defaults read -g AppleLanguages` and `defaults read -g AppleLocale` on macOS, `$LANG` on Linux, `Get-Culture` on Windows; any language other than English in that list, or a region whose own language is not English, means: use that language). Only when none of these names a language other than English do you open in English. A one- or two-word reply that only repeats an option you offered is not evidence. When they ask for a language, switch at once and keep it.

> **What is built:** the 3D look, outdoor places, human characters (children and adults) built from simple shapes, any character drawn from a 3D model file the Director brings, voices, music, landscape and vertical video. Not built: other looks, indoor sets, and animals or creatures unless the Director brings a model file for them. New voices are recorded on an Apple Silicon Mac (free, local) or on any computer with an ElevenLabs account (paid; lines are sent to ElevenLabs). Say these plainly when they come up, before the Director plans around something that does not exist.

## 1. Find out where you are

Look for `series/series.json` in the working folder.

| What you find | What to do |
|---|---|
| It exists | This is an existing series. Run `npm run status`, read `CLAUDE.md`, tell the Director in two or three sentences where the production stands, and propose the next step. **Stop here**; the sections below do not apply. If the status shows an episode that is only a plan, say that the plan can still be replaced by the Director's own. |
| It does not exist, and the folder has other content | Say what you found and ask whether to set up the studio here or in a new subfolder. Never overwrite existing files. Then section 2. |
| The folder is empty | Section 2. |

## 2. The brief

Nothing is proposed, installed or built until the brief is complete. The brief has four items the crew **asks about**, and the rest have a default.

| Item | The Director's answer | If the first message did not say |
|---|---|---|
| **Story:** who is in it and what happens | Must be their own words | Ask. Never fill it in, and never offer to |
| **Where it will be shown** | Must be chosen | Ask. It decides the shape of the picture: vertical (1080×1920) for phone feeds, landscape (1920×1080) for wide screens |
| **Characters:** who they are and how they look | Their description, or "you choose" | Ask. Propose only after they say you may choose |
| **Setting:** where it happens and what it looks like | Their description, or "you choose" | Ask. Propose only after they say you may choose |
| **Scenes and lines** | Not asked | Write them from the story, for the Director to approve. Never ask the Director to write a script |
| **Formula:** fixed beats every episode of the series follows, in the Director's words | Not asked | There is none. Do not invent one and do not suggest beats |
| **Specialists:** someone on the crew who checks something this series must get right, or who owns one job of it | Not asked | There are none. Do not think any up. Offer one, in one line of the proposal and not as a question, only when the Director's own words call for it (the studio's `/new-agent` recipe says exactly when) |
| **Length** | Not asked | About 30 seconds |
| **Language the characters speak** | Not asked | What the Director asked for; otherwise their own language (principle 6) |
| **Pace** | Not asked | Step by step: the Director okays the idea, the script, the storyboard and the preview, and only then is the video rendered. Fast track only when the Director asks for it ("fast track", "just finish it", as few stops as possible) |

How to take it:

- Read the Director's first message and take everything it already says. What they described is settled and is never asked again.
- If any of the four asked items is still open, send **one** brief message that asks for all of the open ones together, and nothing else. Say in one line that you need this before anything is made. Offer where it will be shown as buttons when the session has a question tool. For the story, describe what it needs (who, and what happens) rather than giving sample stories.
- For characters and setting, say plainly that "you choose" is a full answer, for one of them or for both, and that you will then propose and show them for approval. Do not offer this for the story.
- A partial answer is an answer: what they described is used as described, and only what they left to you is yours to propose. A general leave to decide ("up to you", "just make it", "surprise me", in any language) covers characters and setting, in the first message too, and then they are not asked.
- In the same message, add one line that the remaining items (length, language, a formula, a specialist) are theirs to set if they wish.
- **When the Director asks for something the studio cannot make** (see "What is built"), say so before proposing, in the brief message or in a short message of its own if nothing else is open: name what cannot be made, say what can be made instead, and let the Director choose. Never swap it for something else on your own, and never let a general "just make it" stand for that choice: that leave covers what the Director left open, not what they described.
- A character or a place the story needs but the Director did not mention is theirs to decide like any other: propose it only if they said you may choose; otherwise ask.
- If all four were settled by the first message and all of it can be made, send no brief message: go to the proposal.
- Only when the Director asks you to choose the story do you offer stories, as three one-line options, never as a finished proposal.

So a first video, step by step, stops at the proposal (the series and the idea of the first episode), the script, the storyboard and the screening, and is rendered after the last okay; one stop more when the brief has to be asked for. On the fast track it stops twice: the proposal, then the screening.

### The proposal

With the brief complete, write one message that holds everything the Director has to approve:

- **The series:** title, what it is about in one sentence, who it is for, length, shape of the picture, language, look, and the house rules (how the camera behaves, whether everything happens in one continuous world).
- **The idea of the first episode** (its brief, stage 1 of `/new-episode`): the point of the story in one sentence and the story in a few lines; each character, with who they are and how they look; each place; each voice, described in a sentence; the length. If the series has a formula, one line per beat. On the fast track, add every scene and every spoken line, so the proposal is the whole plan.
- **What will be installed and downloaded:** section 3, and the voice engine with its size, cost and what leaves the computer (see "Voices").

Mark every choice of your own as yours and say once that any of it can be replaced. Ask no questions; end with the one request for an okay.

**Before sending it, have the words reviewed.** The studio's Quality Control does not exist yet, so start it yourself: a subagent whose instructions are `${CLAUDE_SKILL_DIR}/template/agents/quality-control.md`, given the draft proposal and the Director's own messages word for word, and told that the studio does not exist yet. It reviews the text only (the Director's words kept, a formula's beats, quotations marked not verified, the running time, and on the fast track lines short enough for a balloon). Fix what it finds before sending. With no subagents, go through that file's checklist yourself. That okay covers the proposal, the installs and the setup. Paid services always need their own explicit yes.

**Step by step (the default):** the okay covers the series and the idea of the first episode. Set up the studio (section 3), make it their series (section 4), start setting up the voice engine if the okay covered it, because it takes minutes, then go on with the first episode at its script (stage 2 of the studio's `/new-episode`). From there the crew stops after every stage: the script, the storyboard, and the screening of the finished picture in the preview; the video is rendered only after the screening's okay.

**Fast track (when the Director asks for it):** after the okay, work without stopping, in this order: set up the studio (section 3), make it their series (section 4), start setting up the voice engine at once because it takes minutes, then build the episode ("Fast track" in the studio's `CLAUDE.md`). The next stop is the screening.

### Voices

Find out the computer first (`uname -sm`, or `echo %PROCESSOR_ARCHITECTURE%` on Windows). Do not set anything up before the okay.

| Engine | Use it when | Say plainly |
|---|---|---|
| **Free, on this computer** (`voxcpm2`) | Apple Silicon Mac. The recommendation there. | Nothing leaves the computer; downloads a few gigabytes the first time. |
| **ElevenLabs** (`elevenlabs`) | Any computer. The recommendation everywhere else. | A paid online service: needs the Director's own account and API key, uses their credits, and sends each line of dialogue to ElevenLabs. |
| **Picture first, voices later** | The Director does not want to decide now. | Recordings made elsewhere can be brought in later. |
| **edge-tts** (`edge`) | Last resort, only if the Director does not want to pay and has no Apple Silicon Mac. Never recommend it first, and never choose it for them. | Free and no account, but unofficial (it can stop working); the voice is picked from a fixed list; each line of dialogue is sent to Microsoft. |

## 3. Set up the studio

1. **Check what the studio needs:** `node --version` (20 or newer). If Node.js is there, `node "${CLAUDE_SKILL_DIR}/template/scripts/doctor.mjs"` checks the rest (Google Chrome; ffmpeg comes with Remotion, nothing to install) and names the command that installs each missing thing.
2. **Install what is missing yourself,** if the okay covered it; otherwise say in one sentence what is missing and ask once.
   - Use the computer's own package manager: macOS `brew install node` and `brew install --cask google-chrome`; Windows `winget install OpenJS.NodeJS.LTS` and `Google.Chrome`; Linux `apt`, `dnf` or the equivalent. If macOS has no Homebrew, say what it is and offer to install it with its official installer.
   - **Never type a password for the Director.** If the computer asks for one, tell them to type it in the terminal themselves and to say when it is done.
   - Run the doctor again. On Windows a freshly installed program may not be found until the terminal is reopened; say so if that happens.
3. **Put the studio in the folder:** `node "${CLAUDE_SKILL_DIR}/scripts/setup-studio.mjs" .` (add `--dry-run` to see what it would do). The studio it makes is **empty**: no cast, no places, no episode. It never overwrites: if it lists files that are in the way, take that to the Director rather than moving anything yourself.
4. Run `npm install` (needs the network; usually under a minute), then `npm run remotion-guides`, which downloads Remotion's own guides for agents into `skills/` (a few hundred kilobytes of text; if it fails, go on: the studio works without them). If the folder is not inside a git repository, run `git init`; if it sits inside one, leave git alone.
5. Run `npm run doctor`, then `npm run check`, then `npm run still -- map` and look at the picture yourself (`out/stills/map.png`): an empty ground with a placeholder title proves that drawing works on this computer. It is a test of the studio, not something to show as progress.
6. Go straight on to section 4; the Director hears that the studio is ready in the one line that ends section 4, not in a message of its own.

If a step fails, report the exact error and what you tried. Do not continue as if it had worked.

**The sample series.** The template also carries a small finished series that shows what the studio can make. It is not put into a new studio. Only if the Director asks to see what a finished series looks like, set one up in a **separate** folder with `setup-studio.mjs <folder> --sample`, show it, and keep it apart from their series. Do not read it to find ideas for theirs.

## 4. Make it their series

1. Write the brief's answers into `series/series.json`: `title`; `language` as a two-letter code (the voice check needs the code, not the name); `width` and `height`; the voice choice as `"voiceEngine"` (`"voxcpm2"`, `"elevenlabs"` or `"edge"`: the name of an engine folder `skills/voices-<name>/` in the studio; leave it out if voices come later); and `"pace"`: `"step"`, or `"fast"` if the Director asked for the fast track.
2. If the Director asked for a specialist, add it with the studio's `/new-agent` recipe before the first episode is written, so its checks apply from the start.
3. Write `series/story/00-bible.md`: what the series is about, who it is for, tone, look, house rules, and the cast as it grows. If the Director gave a formula, write it under `## Episode formula`, beat by beat in their words; no formula given means no such heading.
4. Every story file carries a Status line near the top (`**Status:** …`); `npm run status` reads it. Write `approved` with the date only for what the Director has seen and okayed, which after the proposal's okay includes the bible and the brief of the first episode (on the fast track, its whole plan); anything they have not seen is `proposed`.
5. Run `npm run check`, then `npm run status`, to confirm the folder says what you intended.
6. Tell the Director in one line that the studio is ready and what happens next. From here on, follow the studio's `CLAUDE.md`.

## What not to do

- Do not set up a voice engine before an okay that covered it. Then run `npm run voices:setup`. Then follow the studio's guide of that engine (`skills/voices-<engine>/SKILL.md`); for ElevenLabs, the Director pastes the API key into the `.env` file themselves.
- Do not hide that edge-tts is unofficial, and do not choose it for the Director.
- Do not edit anything inside this skill's own folder; the copy in the working folder is the one that belongs to the series.
