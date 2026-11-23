# How Toon Crew works

> Looking for how to use it? Start with [Getting started](getting-started.md).

Toon Crew is two things in one repository: a **crew** (instructions that turn a coding agent into a production team) and a **studio** (a small engine that turns scripts into animated video). This page explains both, and why they are built the way they are.

## The idea

Making a cartoon is mostly a sequence of decisions: what happens, who says what, where the camera stands. A coding agent can execute every one of those decisions as code, but it should not be the one making them. So the user is the **Director**, and the agent is the **crew**. Every piece of work passes through the same five stages, and the crew stops at the end of each one:

```
brief ─▶ script ─▶ storyboard ─▶ production ─▶ final render
   ▲         ▲           ▲             ▲              ▲
   └─────────┴───────────┴── Director says okay ──────┘
```

Changing your mind is cheap early and expensive late, so the stages are ordered to put the cheap decisions first. A line of dialogue costs nothing to change in the script; after production it means a new recording and a re-timed scene.

## The crew

The crew lives in three kinds of files.

| File | Loaded | What it does |
|---|---|---|
| `skills/toon-crew/SKILL.md` | when the user types `/toon-crew` | The front door. Holds the first meeting, puts the studio into the folder (`scripts/setup-studio.mjs`, which never overwrites), hands over. |
| `CLAUDE.md` (in each series folder) | always | Standing rules: the jobs, the five stages, how to talk to a Director who is not a programmer, how the engine fits together. |
| `skills/*/SKILL.md` (in each series folder) | when the job comes up | One recipe per job: new character, new place, new episode, opening, voices, music, screening, render. |

Two jobs run as **subagents** with their own context:

- **Quality Control** renders stills of everything that changed, looks at each picture, compares it with the storyboard, and reports. It has no tools to edit files, so it cannot quietly fix what it finds.
- **Voice Director** records lines, listens back to each one, and retakes the ones that drifted from the script. It may not change what a character says.

The creative jobs stay in the main conversation, because they need back-and-forth with the Director.

### Why an independent checker matters

The agent that builds a scene knows what it meant to build, and tends to see that in the picture. A checker that only knows the storyboard sees what is actually there. On the sample episode, Quality Control looked at 41 stills and found things the builder had passed over: speech balloons lingering a few frames into the next shot after a cut, a character's mouth disappearing behind his book at the punchline, and a framing that showed whole bodies where the storyboard asked for knees-up. The first of those became an engine feature (`t.cut()`), so it cannot happen again.

## The studio

### Script → voice → time → picture

The order matters, because **the length of each recorded line sets the timing of the animation**.

1. The script is written for people in `series/story/`, then entered as data in `lines.json`: an id, a voice, the text.
2. Each line is recorded by a local voice engine and listened back to by a speech recogniser; the best of a few takes is kept, and its length is written to a durations file.
3. A scene lays itself out in time by *saying* its lines:

   ```tsx
   const scene = defineScene({
     music: 'calm',
     script: (t) => {
       const hello = t.say('e1_s1_a1');          // starts after the previous line, lasts as long as its recording
       const cut   = t.cut();                    // a camera cut once that line is over
       const reply = t.say('e1_s1_b1');
       return {hello, cut, reply};
     },
     Component: ({m}) => /* draw the scene; m.hello.start, m.cut … drive mouths, balloons, camera */,
   });
   ```

   Nobody types frame numbers for dialogue. Re-record a line and everything after it moves.
4. The engine assembles scenes into an episode: recordings at their cues, narration as captions, sound effects, and mood music that steps back while someone speaks.

### Every frame is a function of the frame number

Video is rendered with [Remotion](https://www.remotion.dev/), so a frame depends only on its number: no real time, no unseeded randomness. That is what makes review by stills possible. "Scene 2, frame 336" is the same picture every time, on every machine, so the crew can render it, look at it, fix it, and render it again.

### Consistency across episodes

A series is recognisable because things stay the same. Three mechanisms do that:

- **One cast list.** A character is defined once (build, hair, clothes, colours, signature pose, voice) and every scene draws from that definition.
- **One voice per character.** A voice is a text description plus one reference clip generated from it. Every line the character ever speaks imitates that clip. The crew is forbidden to remake a reference clip without the Director's okay.
- **One world.** Places live on a single map. A scene picks an origin ("the square") and writes local coordinates; the whole world is drawn around it, so what stands behind the shop is the same in every episode.

### The engine does not know the series

Everything specific to a show lives in `series/`: title, cast, voices, map, music, episodes. The engine (`src/engine/`) and the look (`src/styles/3d/`) contain no character names and no title; a check fails if they do. House rules such as "the camera never moves within a shot" are choices written in the series bible, not behaviour baked into the engine, which supports still cameras, cuts and moves alike.

### Mistakes that fail loudly

Where possible, a mistake stops `npm run check` instead of producing a subtly wrong video:

- A cast member with a voice that is not defined: type error.
- A new pose, expression or prop without a drawing: type error.
- A line with an unknown voice or a duplicate id: content check error.
- A line with no recording, or music that was never generated: a warning that names it.

Two more commands answer questions the crew would otherwise guess at. `npm run status` reads the folder and reports where the production stands: each story file's Status line, lines recorded per episode, what is registered and rendered. `npm run doctor` reports what the computer and the folder are missing, with the command that installs it.

## What is deliberately simple

- **Models are built from basic shapes.** No asset pipeline, nothing to download, and a new prop is a few lines of code the crew can write on request.
- **Music is synthesised.** Small and plain, but it belongs to the series and has no licence attached.
- **Text is HTML over the picture.** Balloons stay sharp, wrap properly, and work in any language and script.

## Limits today

- Free local voices need an Apple Silicon Mac. Other computers use ElevenLabs, which needs an API key and sends the dialogue to ElevenLabs.
- Only the 3D look is built; 2D and 2.5D have a place in the structure but no code.
- There are no indoor sets yet.
- The crew cannot hear or watch motion. It checks pictures and transcripts; sound balance, delivery and timing feel still need the Director's eyes and ears.
