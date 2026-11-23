---
name: screening
description: Show the Director the current state of the series - a scene, an episode, the cast, a character sheet, the map, or a set - or prepare a review package after work has changed. Use when the Director says "show me", asks where things stand, or when production work is ready to be looked at.
---

# Screening (Assistant Director)

A screening puts pictures in front of the Director and says exactly what to look at. It never changes the work.

**Every screening ends with the preview link.** Run `npm run preview -- <ep>` (or `npm run preview` when it is not about one episode) just before you report. It makes sure the preview is running, starting it in the background if needed, and prints the links. Copy the link into your message as a clickable link, next to the stills. If the command fails, say so and show what it printed; do not send a link from memory.

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

1. Start with `npm run still -- <ep> board` and look at it: one picture shows whether every shot has its characters in frame and its balloons readable. Then hand the changed scenes to the `quality-control` subagent with what the storyboard says should be visible.
2. Fix what it found, or list what you left and why.
3. Show the Director, per scene: the stills, what changed since they last saw it (before and after for a fix), and anything QC flagged that needs their eye.
4. Say what was **not** checked. Stills cannot show motion or sound; for those, give the scene link from `npm run preview -- <ep>`, say which scene number to pick under Props, and ask them to play it.
5. End with the one decision you need: approve, or what to change.

## The screening on the fast track

On the fast track this is the first time the Director sees anything, so show more than the scenes: the cast line-up, the map, the episode board, and a still of every shot; then the preview link, the recordings of every new voice by name, what the crew chose on its own, and what was not checked. End with the one question: render it, or what to change. After the okay, render without asking again.

## Playing a scene

`npm run preview -- <ep>` makes sure the preview is running and prints two links: one scene at a time, and the whole video. Give the Director the link and tell them in plain words: open it, set the scene number, press play. Voices, effects and music play with it, and changes appear as the crew makes them.
