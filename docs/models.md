# Characters from 3D model files (optional)

By default every character is built from code, with nothing downloaded. If you want a character with more detail than the studio can build from basic shapes, you can draw it from a **`.glb` model** instead. This is optional, per character, and the model files are never part of this repository: you download them yourself, from a source whose licence you have read.

## What you get, and what you give up

| | Built from code (default) | From a `.glb` model |
|---|---|---|
| Detail | Simple, toy-like | As detailed as the model |
| Faces | 12 expressions, the mouth moves with the dialogue | A painted face: **no expressions, no mouth movement** |
| Movement | 11 poses, walking, talking | The model's own animation clips |
| Props and `accessories` | Yes | No |
| Needs | Nothing | A model file with animations, and its licence |

The speech balloon and the recorded voice still work for a model character; only the mouth stays still. Mixing both kinds in one series usually looks uneven, so choose one and write it down in the series bible.

## Where to get models

Always read the licence on the page you download from. A few places with models that are free to use (check each one's current terms):

- **KayKit Adventurers** by Kay Lousberg ([kaylousberg.itch.io/kaykit-adventurers](https://kaylousberg.itch.io/kaykit-adventurers)): stylised low-poly characters, CC0, with a separate pack of animations for the same skeleton.
- **Quaternius** ([quaternius.com](https://quaternius.com)) and **Kenney** ([kenney.nl](https://kenney.nl)): character packs, mostly CC0.
- **Poly Pizza** ([poly.pizza](https://poly.pizza)): many models with a licence filter (CC0 or CC BY).

Do not use characters that belong to someone else's series. CC BY models need a credit; put it in the credits of what you publish.

## Steps

In a studio the crew follows these steps for you with the `/new-character` recipe (its "Model characters" part); this is what it does.

1. **Download** the character and, if the pack keeps its animations in separate files, those too. Put them under `public/`, for example `public/models/`. The `.glb` format is the one to look for (the `gltf` folder of a pack).
2. **Record the licence** in `public/models/LICENSES.md`, one line per model: the file name, where it comes from, the licence. `npm run check` warns when a model is missing from that list.
3. **Describe the model** in `series/models.json`. This example matches what was tested with KayKit's Knight (there the files sat in another folder under `public/`):

```json
{
  "knight": {
    "file": "models/Knight.glb",
    "animationFiles": ["models/Rig_Medium_General.glb", "models/Rig_Medium_MovementBasic.glb"],
    "height": 1.6,
    "clips": {"idle": "Idle_A", "walk": "Walking_A", "talk": "Idle_B", "pose": {"cheer": "Throw", "wave": "Interact"}}
  }
}
```

   - `height` is how tall the character stands, in metres; the model is scaled to it and stood on the ground.
   - `clips` says which animation plays when: `idle` always; `walk` while the character walks; `talk` while they speak (idle if left out); `pose` gives a clip to a named pose, and a pose with no clip plays idle.
   - `animationFiles` are extra files with animations for the **same skeleton** (the bone names must match).
4. **Give a cast member the model** in `series/cast/index.ts` by adding `model: 'knight'` (the code from `models.json`). Keep the usual `look`: the studio still uses it to size the picture.
5. **Check and look.** `npm run check` fails if a clip name does not exist in the files, and tells you which names there are. `npm run still -- sheet <id> clips` shows every animation the files have, each held part-way through, so you can pick by eye. `npm run still -- sheet <id> poses` shows which clip each pose plays.

## In a scene

A model character is used exactly like any other, inside a `Stage`:

```tsx
<Character look={KNIGHT.look} model={KNIGHT.model} position={pos} facing={90} walking talking={speaking} />
```

The studio loads the files before it draws the picture and plays the clip for the frame being drawn, so a render is the same every time.

## Limits to know about

- Models without animations still appear, but only in their resting pose, and the `clips` entry must name something that exists.
- A model with a very different skeleton cannot borrow another pack's animations.
- A large model slows stills and renders down.
- Facial expressions would need a model that has them built in (morph targets); the studio does not use those yet.
