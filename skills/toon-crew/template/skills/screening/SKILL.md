---
name: screening
description: Show the Director the current state of the series - a scene, an episode, the cast, a character sheet, the map, or a set - or prepare a review package after work has changed. Use when the Director says "show me", asks where things stand, or when production work is ready to be looked at.
---

# Screening (Assistant Director)

A screening puts pictures in front of the Director and says exactly what to look at. It never changes the work.

**Every screening ends with the preview link.** Just before you report, make sure the preview is running: as a background task of the session with `npm run preview -- --attached` when your session can run one (it is then listed there and can be stopped there), otherwise with plain `npm run preview`. Then `npm run preview -- <ep>` (or `npm run preview` when it is not about one episode) prints the links. The preview stops by itself when the session ends. Copy the link into your message as a clickable link, next to the stills. If the command fails, say so and show what it printed; do not send a link from memory.

## "Show me …"

| The Director asks for | Render | Then |
|---|---|---|
| A scene | `npm run still -- <ep> <scene> <frames>` with a list of three or more moments (for example `0,90,180`): early, middle, late, plus each camera cut | Show them in order with one line each |
| A whole episode | `npm run still -- <ep> board` (the episode in one picture), plus single stills of anything that needs a closer look | Give the whole-video link from `npm run preview -- <ep>` |
| The cast | `npm run still -- cast` | |
| One character | `npm run still -- sheet <id> expressions` and `… poses` | |
| The map | `npm run still -- map` | |
| A place | `npm run still -- view <viewpoint> <time>` | Offer other times of day |
| The opening | `npm run still -- opening <frames>` with one frame per beat | |

Look at every picture yourself before showing it. If one is wrong, say so rather than leaving it for the Director to notice.

## "Where are we?"

Run `npm run status` (each story file's Status line, lines recorded per episode, what is registered and rendered) and `git status` (work not yet saved). Answer in a few sentences: what is approved, what is waiting for the Director, what the crew would do next. The report states facts; what is *approved* is only what a Status line says.

## Review package after production

1. Render `npm run still -- <ep> board` and look at it: one picture shows whether every shot has its characters in frame and its balloons readable. Take a closer still only of a shot that looks wrong. (Quality Control reviewed the script, storyboard and lines before production; it does not look at pictures.)
2. Fix what you found, or list what you left and why.
3. Show the Director: the board, what changed since they last saw it (before and after for a fix), and anything QC marked not verified that is still open.
4. Say what was **not** checked: motion, sound and detail were not reviewed shot by shot. Give the scene link from `npm run preview -- <ep>`, say which scene number to pick under Props, and ask them to play it.
5. End with the one decision you need: approve, or what to change.

## When the Director asks for changes

What they ask for at a screening is a change to work they have not approved yet. Apply it, then screen again; do not wait for a second okay to start.

1. **Words** (a line said differently, a line added or cut): change the script in the story file and `lines.json`, hand `lines.json` to `quality-control` (stage: lines), record only the lines that changed, and let the scenes re-time from the new lengths. A change to the story itself (what happens, who is in it) goes back to the plan: show the new plan and wait for an okay before building.
2. **Picture** (framing, a pose, a colour, a balloon): fix it in the scene. No QC.
3. **A voice** (how a character sounds): that is a retake of every line of that character; say so and how long it takes before you start.
4. Render a fresh board, look at it, and screen again: only what changed (before and after), the preview link from `npm run preview -- <ep>` with the scenes to replay, and what was not changed. Update the story file's Status line.

## The screening on the fast track

On the fast track this is the first time the Director sees anything, so show more than the scenes: the cast line-up, the map and the episode board; then the preview link, the recordings of every new voice by name, what the crew chose on its own, and what was not checked. End with the one question: render it, or what to change. After the okay, render without asking again.

## Playing a scene

`npm run preview -- <ep>` makes sure the preview is running and prints two links: one scene at a time, and the whole video. Give the Director the link and tell them in plain words: open it, set the scene number, press play. Voices, effects and music play with it, and changes appear as the crew makes them.
