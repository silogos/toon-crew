# The world of Ada & Ben

**Status:** sample series

Everything in the series happens in one small town. The map is data in `series/world/map.tsx`; this page explains it in words. To see it: `npm run still -- map`.

## Layout

A road runs east–west through the middle. North of the road stand two houses; south of it are the square, the shop and the pond. Positions are `[east, south]` in metres from the middle of the road.

| Place | Id | Where | What is there |
|---|---|---|---|
| Square | `square` | just south of the road, in the middle | A paved patch with a bench on its west side and a street lamp on its east side. Most scenes play here. |
| Red house | `red_house` | north-west | Cream walls, red roof, blue door, a white fence in front, a bush at its east corner |
| Blue house | `blue_house` | north-east | Pale walls, blue roof, red door, a round tree to its west |
| Shop | `shop` | south-east, facing west toward the square | Ms Rosa's shop: flat roof, red-and-white awning, an open counter |
| Pond | `pond` | south-west | A round pond with two rocks and a bush |

Trees stand around the edges of town, and two more street lamps line the road.

## What you see from the square

Looking north from the square, the red house is on the left, the blue house on the right, and two round trees stand between them. This never changes: every outdoor scene draws the same world.

## Time of day

- **Day:** blue sky, short shadows.
- **Dusk:** orange sky, long shadows, windows glowing, lamps lit.
- **Night:** dark blue sky, windows and lamps lit, the shop counter glowing.

## Review viewpoints

`npm run still -- view <name> <day|dusk|night>`

| Name | Looks at |
|---|---|
| `square` | the square from the south |
| `street` | along the road from the west |
| `shop` | the shop from the square |
| `pond` | the pond from the square |
| `houses` | both houses from the south |

## Indoors

No indoor sets yet.
