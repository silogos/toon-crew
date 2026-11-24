import durations from '../audio-durations.json';
import {SERIES} from './series';

const DUR = durations as Record<string, number>;

/** Length of a recorded sound in frames. A sound with no recording yet counts as one second. */
export const framesOf = (id: string) => Math.ceil((DUR[id] ?? 1) * SERIES.fps);
export const hasRecording = (id: string) => id in DUR;

/** One spoken line placed in a scene. All values are frames from the start of the scene. */
export type Cue = {
  id: string;
  start: number;
  speechEnd: number;
  end: number;
  /** false: a narration line the picture shows itself (a message card), so no caption is added */
  caption?: boolean;
};
/** One sound effect placed in a scene. */
export type Sound = {id: string; at: number; volume: number};

export type SayOptions = {
  /** silence before the line, after the previous one (default 8) */
  gap?: number;
  /** how long the balloon stays after the voice stops (default 15) */
  hold?: number;
  /** start at this exact frame instead of after the previous line */
  at?: number;
  /** do not push later lines back: this line overlaps what follows */
  overlap?: boolean;
  /** false for a narration line the picture shows itself, such as a `MessageCard`: no caption at the bottom */
  caption?: boolean;
};

/**
 * Lays out a scene in time. Each `say` is placed after the previous line using the
 * real length of its recording, so mouths, balloons and sound can never drift apart.
 * Record the voices first, then time the scene.
 */
export class Timeline {
  private cursor = 0;
  readonly cues: Cue[] = [];
  readonly sounds: Sound[] = [];
  /** changes of music mood inside the scene, in the order they were written */
  readonly moods: {at: number; mood: string | null}[] = [];

  /** Place a spoken line and get back when it starts and ends. */
  say(id: string, {gap = 8, hold = 15, at, overlap = false, caption}: SayOptions = {}): Cue {
    const start = at ?? this.cursor + gap;
    const speechEnd = start + framesOf(id);
    const cue: Cue = {id, start, speechEnd, end: speechEnd + hold, ...(caption === false ? {caption} : {})};
    this.cues.push(cue);
    if (!overlap) this.cursor = Math.max(this.cursor, speechEnd);
    return cue;
  }

  /** Place a sound effect at a frame. Returns the frame, handy for syncing an action to it. */
  play(id: string, at: number, volume = 1): number {
    this.sounds.push({id, at, volume});
    return at;
  }

  /** Leave a pause: the next line starts at least `frames` later. Returns the new position. */
  wait(frames: number): number {
    this.cursor += frames;
    return this.cursor;
  }

  /** Make sure the next line does not start before `frame`. Returns the new position. */
  until(frame: number): number {
    this.cursor = Math.max(this.cursor, frame);
    return this.cursor;
  }

  /**
   * Mark a camera cut `pause` frames after the last line ends. Balloons of the lines
   * so far are gone by then, so nothing from the old shot lingers in the new one.
   * Returns the frame of the cut.
   */
  cut(pause = 8): number {
    const at = this.until(this.cursor + pause);
    for (const c of this.cues) if (c.end > at) c.end = at;
    return at;
  }

  /**
   * Change the music mood from here on (or from `at`): a mood from series.json, or null for silence.
   * The scene starts in the mood given to `defineScene`. Returns the frame of the change.
   */
  mood(mood: string | null, at: number = this.cursor): number {
    this.moods.push({at, mood});
    return at;
  }

  /** Where the next line would start. */
  get now(): number {
    return this.cursor;
  }

  /** The frame by which every line, balloon and sound has finished. */
  get end(): number {
    return Math.max(
      this.cursor,
      ...this.cues.map((c) => c.end),
      ...this.sounds.map((s) => s.at + framesOf(s.id)),
    );
  }
}
