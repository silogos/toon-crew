---
name: new-place
description: Add a place to the series' world, move or change an existing place, or build an indoor set. Use when the Director asks for a new location, a building, a change to the map, or the inside of somewhere.
---

# New place (Art Director)

Work as the **Art Director**. The map of the world is a creative decision: nothing is placed, moved or built until the Director says okay.

On the **fast track** (see `CLAUDE.md`), a new place that the approved plan of an episode already describes needs no further okay: build it, check the stills yourself, and show it at the screening. Moving or changing a place that finished episodes use always needs its own okay.

First read the world rules in `series/story/00-bible.md`. A series with **one continuous world** keeps every outdoor place on one map (`series/world/` data, explained in `series/story/world.md`). A series whose scenes can happen anywhere uses separate sets; for those, skip the map steps and build the set directly.

## 1. Brief — ask, then stop

Render and look at the current map (`npm run still -- map`) so your proposal is concrete. Then ask, in one round with suggestions:

- What the place is and what happens there in the story.
- Where it sits relative to places that already exist ("east end of the road, across from the shop").
- Outdoor only, or does the story go inside?
- Times of day it will be seen at.

Propose a position and a one-paragraph description of how it looks. Point out anything it would block or crowd: camera positions used by finished scenes, sight lines between places. **Wait for okay.**

## 2. Put it on the map

1. Add the place to the map data in `series/world/` **and** describe it in `series/story/world.md`. Positions live in the data only; never write coordinates for a place inside a scene.
2. Build the place from the look's building blocks in `src/styles/<look>/`. A block that only this series needs stays in `series/world/`.
3. Add at least one review viewpoint for it.
4. `npm run check`.

## 3. Show — then stop

Render and look at:

- `npm run still -- map` — the labelled map with the new place.
- `npm run still -- view <viewpoint> <time>` for each time of day it will be seen at.
- One still from a finished scene that looks toward the new place, to confirm the background still works.

Check by eye: scale next to characters and neighbouring buildings, nothing overlapping, a clear spot to put a camera, lights that come on at dusk and night.

Show the stills, with the preview links of the map and the view from `npm run preview`. **Wait for okay**, or revise.

## Moving or changing an existing place

This changes every finished episode that shows it. Before touching the data, render the map and one still from each finished scene that includes the place. Make the change, render the same stills, and show before and after. If a finished scene now has a blocked camera or a character standing inside something, list it; fixing those scenes is separate work for the Director to approve.

## Indoor sets

An interior is its own set, not part of the outdoor map. Keep its door and windows consistent with the building outside (same side, same colour). Record the furniture layout in `series/story/world.md`, add review viewpoints, and show it at every time of day the story uses.
