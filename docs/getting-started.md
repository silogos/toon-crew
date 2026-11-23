# Getting started

This page takes you from nothing to your first finished episode. You do not need to read code or type commands: you talk, the crew works, and you say okay at each stage.

## Before you start

Only **Claude Code** (the desktop app or the terminal version) and an internet connection. Everything else the studio needs (Node.js, ffmpeg, Google Chrome, Python for voices) is installed **by the crew, after asking you once**. You never have to hunt for downloads. The computer may ask for its password during an install; type it yourself, the crew never will.

For reference, this is what the crew installs:

| Program | Used for |
|---|---|
| Node.js 20+ | Running the studio |
| ffmpeg | Cleaning audio and making the video |
| Google Chrome | Drawing the 3D frames reliably |
| Python | Only for voices on new dialogue |

At the first meeting the crew also asks how voices should be recorded: **free on this computer** (Apple Silicon Mac only) or **ElevenLabs** (a paid online service, any computer). See [Voices](#voices).

## 1. Install

In Claude Code:

```
/plugin marketplace add silogos/toon-crew
```

```
/plugin install toon-crew@toon-crew
```

## 2. Start a series

Open an **empty folder** in Claude Code and type `/toon-crew:toon-crew`, or say *"start a new animated series"*.

The crew holds a **first meeting**. It asks, in one round, with a recommendation for each question:

1. What the show is (a working title and one sentence)
2. Who watches it
3. How long each episode is, and landscape or vertical
4. The language the characters speak
5. The look (only 3D is built today)
6. The house rules of your show: does the camera stay still, is everything in one place

Then it sets up the studio in the folder, checks that everything works, and shows you the sample series "Ada & Ben" so you can see what the crew makes. You then choose: **start empty**, or **start from the sample** and change Ada and Ben into your own cast.

## 3. Make an episode

Say what you want. For example:

> *"New episode: Ada loses her kite and Ben helps her find it. About 40 seconds."*

Every episode goes through five stages, and the crew **stops and waits for your okay** after each:

| Stage | You see | You decide |
|---|---|---|
| 1. Brief | A few lines about the idea | Is this the right idea? |
| 2. Script | Every scene and line of dialogue | Is the story right? |
| 3. Storyboard | A table of shots | Is this how you want it filmed? |
| 4. Production | Pictures of every scene, then the scene playing with voices and music | Does it look and sound right? |
| 5. Final render | One video file in the `out` folder | Ready to publish? |

Changing your mind is cheapest early: a line changed in the script costs nothing, the same line changed after production means re-recording it.

To watch a scene move, say *"Open the studio."* A preview opens in your browser.

## What you can ask for

Use the command or just say it in your own words.

| Command | Use it to |
|---|---|
| `/new-episode` | Start an episode and carry it through all five stages |
| `/new-character` | Add or redesign a character, an expression, a pose or a prop; also a character drawn from a 3D model file you downloaded |
| `/new-place` | Add or change a place on the map |
| `/voices` | Give a character a voice, record lines, fix a mispronunciation |
| `/music` | Background music, a jingle, a sound effect |
| `/opening` | Make or change the title sequence |
| `/screening` | See the current state: a scene, the cast, a character sheet, the map |
| `/render` | Produce the finished video of an approved episode |

Everyday phrases that work: *"Give Ben glasses."* · *"Put a school at the east end of the road."* · *"Scene 3 needs something tense."* · *"Where are we?"* The full list is in the [Director's Guide](../skills/toon-crew/template/DIRECTOR-GUIDE.md), which also lands in your series folder after setup.

## Voices

The length of each spoken line sets the timing of its scene, so voices are recorded **before** animation. There are three engines, chosen once per series (switching later changes every voice):

| | Local (free) | ElevenLabs | edge-tts (last resort) |
|---|---|---|---|
| Runs on | Apple Silicon Mac | Windows, Linux, any Mac | Windows, Linux, any Mac |
| Cost | Free | Your ElevenLabs credits | Free, no account |
| Privacy | Nothing leaves your computer | Each line is sent to ElevenLabs | Each line is sent to Microsoft |
| Voices | Designed from a description | Designed from a description | Picked from a fixed list |
| Reliability | Stable | Official service | Unofficial; may stop working |
| Setup | Python 3.12 | Python 3.10+, API key in `.env` | Python 3.10+ |

The crew explains the choice at the first meeting. For ElevenLabs it walks you through creating an API key, then you open the file named `.env` in your series folder and paste the key there yourself. **Never paste your API key into the chat.** The crew sets up the rest (`npm run voices:setup`) after your okay. Recordings made elsewhere (a voice actor, your own voice) can be brought in with `npm run voices:import`.

## Characters from 3D model files (optional)

By default the crew builds every character from code. If you want a more detailed character, you can bring a `.glb` model with its own animations. You download it yourself and the crew sets it up; see [Characters from 3D model files](models.md) for what you gain (detail, real movement) and what you give up (a painted face has no expressions or moving mouth).

## Continuing later

Open the same folder in Claude Code and say *"Where are we?"* The crew reads the status of each story file, which lines are recorded and what has been rendered (`npm run status`), and tells you where production stands and what comes next.

## Troubleshooting

| Problem | What to do |
|---|---|
| Setup says something is missing | The crew offers to install it; say okay. If you declined, say *"go ahead and install it"* |
| Something stopped working after it worked before | Say *"Check the studio."* The crew runs `npm run doctor`, which lists what the computer and the folder are missing and how to install it |
| Setup says files are in the way | The studio never overwrites. Move those files, or ask the crew to set up in a new, empty subfolder |
| `npm run check` reports an error | Show the crew the exact message; the check names the file and what is wrong |
| *"The voice engine is not set up in this folder yet"* | Only needed for new dialogue. Ask the crew to set up voices; the sample plays without it |
| ElevenLabs says the key was refused, or a plan is needed | Check `ELEVENLABS_API_KEY` in `.env`; voice design and the `eleven_v3` model may need a paid plan |
| A line sounds wrong | Say which line: *"She mispronounces 'Ben' in scene 2."* The crew retakes it |
| A picture looks wrong | Say what you see: *"Ben's balloon covers Ada's face in scene 2."* |

Still stuck? [Open an issue](https://github.com/silogos/toon-crew/issues) with what you asked, what happened, and your OS.

## Going deeper

- [How it works](how-it-works.md): why the crew and the studio are built the way they are
- [Contributing](../CONTRIBUTING.md): working on the template and engine
