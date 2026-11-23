import React, {createContext, useContext} from 'react';

/** One line of dialogue or narration, as written in an episode's lines.json. */
export type Line = {
  /** e<episode>_s<scene>_<voice><n>; an id ending in `_n` is narration */
  id: string;
  /** a voice code from series/voices.json */
  voice: string;
  /** what the balloon or caption shows */
  text: string;
  /** how to pronounce it, when that differs from the text */
  say?: string;
  /** delivery: shout, laugh, cheer, whisper, echo */
  fx?: string;
};

export const isNarration = (id: string) => id.endsWith('_n');

const LinesContext = createContext<Record<string, Line>>({});

export const LinesProvider: React.FC<{lines: Line[]; children: React.ReactNode}> = ({lines, children}) => (
  <LinesContext.Provider value={Object.fromEntries(lines.map((l) => [l.id, l]))}>{children}</LinesContext.Provider>
);

/** The line behind a cue. Missing lines show their id so the gap is visible in a still. */
export const useLine = (id: string): Line => {
  const lines = useContext(LinesContext);
  return lines[id] ?? {id, voice: '?', text: `[${id}]`};
};
