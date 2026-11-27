# Director's Guide

You are the Director. The crew is an AI working in this folder. You say what you want in plain words; the crew writes, draws, records, and shows you the result. You never need to read code or type a command.

## How a day on set goes

1. Open this folder in Claude Code.
2. Say what you want, in your own words: who is in it and what happens.
3. The crew answers as one of its jobs (Writer, Storyboard Artist, Animator, …) and shows you something to approve.
4. You say **okay**, or say what to change. Nothing moves to the next stage until you say okay.

If you are not sure where things stand, ask: *"Where are we?"* If something on the computer seems broken, ask: *"Check the studio."*

## The five stages

Every new thing, whether an episode, a character or a place, goes through the same stages. Each one ends with the crew waiting for you.

| Stage | What you get | What you decide |
|---|---|---|
| 1. Brief | A few lines: what it is for, how long, who is in it, where it happens | Is this the right idea? |
| 2. Script | The scenes in order, with every line of dialogue | Is the story right? Do the characters sound like themselves? |
| 3. Storyboard | A table of shots: where, when, what the camera sees, who does what, music | Is this how you want it filmed? |
| 4. Production | Pictures from every scene, and the scene playing with voices and music | Does it look and sound right? |
| 5. Final render | One finished video file | Ready to publish? |

Changing your mind is cheapest early. A line changed at the script stage costs nothing; the same line changed after production means recording it again and re-timing the scene.

## In a hurry? The fast track

A new series goes step by step: you okay the idea, the script, the storyboard and the preview, and only then is the video rendered. If you would rather stop less, say *"fast track"*. The crew then stops only twice per episode: once with the whole plan (story, shots, characters, places, voices) in one message, and once with the finished picture before the final video is made. It will still ask before installing anything, spending money, or changing something you already approved. Say *"step by step"* to go back to approving every stage.

## Posting it

After the final video is made, the crew can prepare a cover picture, a title, a caption and tags for posting; just say yes when it offers. If the video is for TikTok, Reels or Shorts, tell the crew at the start so the series is made vertical: turning a finished landscape episode into a vertical one means framing every shot again.

## A formula for every episode

If you want every episode to follow the same beats, tell the crew the beats once, in your own words; which beats and how many is up to you. They are written into the series bible and every episode is built on them, so the audience recognises the show. It is optional, and only you change it. If a beat quotes a real text, such as a verse or a hadith, give the crew the exact words and the source: it will not write them from memory.

## Specialists

If your series has to get something right that a general crew may not (facts, quotations, a subject that needs care, a rule of your own), or if you want one job always handled by its own crew member, ask for a specialist. The crew also offers one when what you ask for points that way; it never adds one without your okay. You say what they must get right, which sources they check against, and at which stage they are consulted. A specialist checks against the sources you gave it and says plainly what it could not verify; it does not replace a person who knows the subject, and you have the last word.

## Things you can ask for

You can use the short command or just say it in your own words.

| You want to… | Say something like | Command |
|---|---|---|
| Start a new episode | "New episode: [what happens in it]." | `/new-episode` |
| Add a character | "I need [who they are], [age], [how they look]." | `/new-character` |
| Change how a character looks | "Give [name] glasses." "Show me [name] in three hair styles." | `/new-character` |
| Add an expression or a pose | "[Name] needs [an expression]." "Can [name] [do a gesture]?" | `/new-character` |
| Use a 3D model you downloaded | "Use this model file for [name]." | `/new-character` |
| Add a place | "Put [a place] at [where on the map]." | `/new-place` |
| Move or change a place | "[Place] should face [other place]." | `/new-place` |
| Build an indoor set (not available yet) | "We need the inside of [place]." | `/new-place` |
| Give a character a voice | "[Name] should sound [how]." | `/voices` |
| Fix a line that sounds wrong | "[Name] mispronounces [word] in scene 2." | `/voices` |
| Add a specialist to the crew | "I want someone who checks [what must be right] against [the sources I trust]." | `/new-agent` |
| Change the music | "Scene 3 needs something tense." "Make a short happy jingle for the title." | `/music` |
| Make or change the opening | "I want a 15-second opening that introduces everyone." | `/opening` |
| See the current state | "Show me scene 2." "Show me the whole cast." "Show me the map." | `/screening` |
| See the whole episode at a glance | "Show me the whole episode in one picture." | `/screening` |
| Watch it move, with sound | "Give me the preview link." | `/screening` |
| Get the finished video | "Render episode 1." | `/render` |
| Get it ready to post | "Make a cover, a title and a caption for episode 1." | `/render` |
| Work faster or slower | "Fast track." "Step by step from here." | |

## Seeing your options

You do not have to know what is possible. Ask the crew to show you:

- *"Show me the cast."* — everyone side by side.
- *"Show me [name]'s expressions."* / *"…poses."* — a reference sheet of one character.
- *"What looks can a character have?"* — body types, hair, clothing, colours, accessories.
- *"Show me the map."* — the world from above, with every place labelled.
- *"Show me the square at night."* — one place, from one viewpoint, at a time of day.
- *"What moods of music do we have?"*

## Watching your work

- **Stills:** the crew puts pictures directly in the conversation.
- **Playing a scene:** ask *"Open the studio."* A preview opens in your browser where you can pick a scene and play it with voices and music.
- **Finished videos** are saved in the `out` folder. The crew tells you the exact file.

## The series bible

*Words in [brackets] stand for your own characters, places and ideas. The studio starts empty; everything in it comes from you.*

At the first meeting the crew writes down the rules of *your* show: who it is for, its tone, how the camera behaves, whether everything happens in one place. This is the series bible. The crew follows it in every episode so the show stays consistent. You can change it whenever you like: *"From now on the camera can follow characters when they run."*

## Good to know

- **Voices are recorded before animation**, because the length of each spoken line sets the timing of the scene.
- **A character's voice is fixed once you approve it.** The crew will not change it without asking, because it would change in every episode.
- **Moving a place on the map affects finished episodes.** The crew will show you before and after.
- **The crew checks its own work** before showing you, and tells you what it did not check.
- If something looks wrong, say what you see: *"The balloon covers [name]'s face in scene 2."* You do not need to know why.
