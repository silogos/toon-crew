import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, Series, interpolate, staticFile} from 'remotion';
import {z} from 'zod';
import {Line, LinesProvider, isNarration} from './lines';
import {Caption} from './overlay';
import {SceneDef} from './scene';
import {SERIES} from './series';
import {framesOf, hasRecording} from './timeline';

const audio = (id: string) => staticFile(`audio/${id}.wav`);

/**
 * Turn a list of scenes into one playable piece: scenes in order, every line's
 * recording at its cue, narration captions, sound effects, and mood music that
 * steps back while someone is speaking.
 */
export const assemble = (scenes: SceneDef[], lines: Line[]) => {
  const offsets: number[] = [];
  let total = 0;
  for (const s of scenes) {
    offsets.push(total);
    total += s.duration;
  }

  const speech = scenes.flatMap((s, i) => s.cues.map((c) => [offsets[i] + c.start, offsets[i] + c.speechEnd] as const));
  const speaking = (f: number) => speech.some(([a, b]) => f >= a - 3 && f < b + 6);

  // neighbouring scenes with the same mood share one stretch of music
  const stretches: {mood: string; from: number; length: number}[] = [];
  scenes.forEach((s, i) => {
    if (!s.music || !SERIES.music[s.music]) return;
    const last = stretches[stretches.length - 1];
    if (last && last.mood === s.music && last.from + last.length === offsets[i]) last.length += s.duration;
    else stretches.push({mood: s.music, from: offsets[i], length: s.duration});
  });

  const Component: React.FC = () => (
    <LinesProvider lines={lines}>
      <AbsoluteFill style={{background: 'black'}}>
        <Series>
          {scenes.map((s, i) => (
            <Series.Sequence key={i} durationInFrames={s.duration}>
              <s.Component />
              <AbsoluteFill>
                {s.cues.filter((c) => isNarration(c.id)).map((c) => (
                  <Caption key={c.id} cue={c} />
                ))}
              </AbsoluteFill>
            </Series.Sequence>
          ))}
        </Series>

        {stretches.map((m, i) => {
          const {file, volume} = SERIES.music[m.mood];
          return (
            <Sequence key={`m${i}`} from={m.from} durationInFrames={m.length} layout="none">
              <Html5Audio
                src={audio(file)}
                loop
                volume={(f) => {
                  const fade = interpolate(f, [0, 20, m.length - 30, m.length], [0, 1, 1, 0], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  return volume * fade * (speaking(m.from + f) ? 0.45 : 1);
                }}
              />
            </Sequence>
          );
        })}

        {scenes.flatMap((s, i) =>
          // a line with no recording yet has nothing to play: it counts as one second of silence
          s.cues.filter((c) => hasRecording(c.id)).map((c, j) => (
            <Sequence key={`v${i}-${j}`} from={offsets[i] + c.start} durationInFrames={framesOf(c.id) + 10} layout="none">
              <Html5Audio src={audio(c.id)} />
            </Sequence>
          )),
        )}

        {scenes.flatMap((s, i) =>
          s.sounds.filter((x) => hasRecording(x.id)).map((x, j) => (
            <Sequence key={`s${i}-${j}`} from={offsets[i] + x.at} durationInFrames={framesOf(x.id) + 10} layout="none">
              <Html5Audio src={audio(x.id)} volume={(f) => x.volume * (speaking(offsets[i] + x.at + f) ? 0.4 : 1)} />
            </Sequence>
          )),
        )}
      </AbsoluteFill>
    </LinesProvider>
  );

  return {Component, durationInFrames: total};
};

export type EpisodeDef = ReturnType<typeof defineEpisode>;

/**
 * One episode: its number, title, lines and story scenes. The opening is not part
 * of it; `makeFull` puts the series opening in front when the whole video is built.
 * Episode 1 has the id `ep01` and lives in `series/episodes/ep01/`. Scenes count from 1.
 */
export const defineEpisode = ({no, title, lines, scenes}: {no: number; title: string; lines: Line[]; scenes: SceneDef[]}) => {
  const id = `ep${String(no).padStart(2, '0')}`;
  // each scene is assembled on its own so its preview has dialogue, sound and music
  const players = scenes.map((s) => assemble([s], lines).Component);
  const sceneSchema = z.object({scene: z.number().int().min(1).max(Math.max(1, scenes.length))});
  const Scene: React.FC<z.infer<typeof sceneSchema>> = ({scene}) => {
    const Player = players[scene - 1];
    if (!Player) throw new Error(`${id} has scenes 1 to ${scenes.length}; there is no scene ${scene}.`);
    return <Player />;
  };
  const sceneDuration = (scene: number) => {
    if (!scenes[scene - 1]) throw new Error(`${id} has scenes 1 to ${scenes.length}; there is no scene ${scene}.`);
    return scenes[scene - 1].duration;
  };
  return {id, no, title, lines, scenes, Scene, sceneSchema, sceneDuration};
};

/** What an opening is told about the episode it introduces. */
export type OpeningInfo = {no: number; title: string; /** id of the narrator's line reading the episode title */ titleLineId: string};
export type OpeningMaker = (info: OpeningInfo) => SceneDef;
export type OpeningSet = {versions: Record<string, OpeningMaker>; lines: Line[]};

export const openingInfo = (ep: {id: string; no: number; title: string}): OpeningInfo => ({
  no: ep.no,
  title: ep.title,
  titleLineId: `op_${ep.id}_n`,
});

/** The whole video of an episode: the chosen opening, if the series has one, then the story. */
export const makeFull = (ep: EpisodeDef, openings: OpeningSet) => {
  const make = SERIES.opening ? openings.versions[SERIES.opening] : undefined;
  const scenes = make ? [make(openingInfo(ep)), ...ep.scenes] : ep.scenes;
  return assemble(scenes, [...openings.lines, ...ep.lines]);
};
