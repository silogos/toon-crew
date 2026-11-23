---
name: render
description: Produce the finished video file of an approved episode or of the opening. Use when the Director asks to render, export, or get the final video.
---

# Final render (Editor)

Rendering is the last stage and only for approved work. Reviews use the studio and stills, not renders.

## Before rendering

1. Check the Status line of the episode's story file. If production has not been approved, say so and offer a screening instead.
2. `npm run check` must pass.
3. Every line must have a recording: `npm run status` lists any line of the episode that is not recorded. A missing recording renders as one second of silence. If lines were recorded or changed since the last listening check, run `npm run voices:check -- <ep>` too.
4. Say roughly how long the render will take if you can estimate it from the episode length.

## Render

- Full episode (opening + story): `npm run render -- <ep>` → `out/<ep>-<title>.mp4`
- A stretch only: `npm run render -- <ep> --frames=<from>-<to>`
- Opening alone: `npm run render -- opening` → `out/opening.mp4`

Run it in the background; it can take many minutes. Do not start a second render while one is running.

## After rendering

1. Confirm the file exists and its duration matches the episode's total length (`ffprobe`).
2. Pull three frames from the finished file (start, middle, end) and look at them: a render can differ from stills when a frame fails.
3. Report the exact file path, duration and size, and that sound was **not** checked by ear.
4. Set the story file's Status to final-rendered with the date.

## Ready to post

A finished video still needs a few things before it goes online. Offer them once, right after the report, and make them only if the Director says yes (on the fast track, make them without asking and include them in the report):

1. **Cover picture.** Choose the frame that best sells the episode (a clear face, the moment of the story, no balloon cut off) and render it with `npm run still`, then copy it to `out/<ep>-<title>.cover.png` next to the video. Look at it before showing it.
2. **Title, caption and tags**, in the language of the series, written to `out/<ep>-<title>.post.md`: a title under 60 characters, a caption of one or two sentences that opens with the hook rather than the name of the series, and five to eight tags. Write them from what happens in the episode; never promise something the video does not show.
3. **Format check.** Say whether the video is landscape or vertical and which platforms that suits. A landscape video posted to a vertical feed plays small with black bars; if the Director wants a vertical version, that is new work (every shot is framed again), not a setting.

The crew does not post anything. Uploading, and the account it goes to, are the Director's.

If the render fails, report the error as printed and the frame it stopped at. Do not report a partial file as finished.
