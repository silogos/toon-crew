import {z} from 'zod';
import raw from '../../series/series.json';

/**
 * The one place the engine learns about the series it is making.
 * Nothing under src/ may hard-code a title, size, frame rate or language.
 */
const schema = z.object({
  /** true only for the sample series the studio ships with */
  sample: z.boolean().optional(),
  title: z.string().min(1),
  /** language the characters speak, as a code the voice check understands (en, id, es, …) */
  language: z.string().min(2),
  /** how voices are recorded: 'local' (open model on an Apple Silicon Mac, the default) 'elevenlabs' (any computer, needs an API key) or 'edge' (free online voices, unofficial, last resort) */
  voiceEngine: z.enum(['local', 'elevenlabs', 'edge']).optional(),
  /** how often the crew stops for the Director's okay: 'step' (after every stage, the default) or 'fast' (once on the whole plan, once on the finished picture) */
  pace: z.enum(['step', 'fast']).optional(),
  /** light up each word in balloons and captions as it is spoken (default true); false shows the whole line plain */
  highlightWords: z.boolean().optional(),
  look: z.enum(['2d', '2.5d', '3d']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive(),
  /** which opening in series/opening is attached to finished episodes; null = none */
  opening: z.string().nullable(),
  /** music by mood: a scene asks for a mood, the engine plays that file under it */
  music: z.record(z.string(), z.object({file: z.string(), volume: z.number().min(0).max(1)})),
});

export type SeriesConfig = z.infer<typeof schema>;
export const SERIES: SeriesConfig = schema.parse(raw);

/** Everything is designed at 1920 on the long side; on-screen text scales with the real frame. */
export const DESIGN_WIDTH = 1920;

/**
 * How much on-screen text is scaled. It follows the LONG side of the frame, so a vertical
 * video (1080x1920) gets text as large as a landscape one: it is watched on a phone held upright,
 * where text scaled by the short side would be too small to read.
 */
export const textScale = (width: number, height: number) => Math.max(width, height) / DESIGN_WIDTH;

/** A vertical frame. Phone apps cover its bottom fifth with their own buttons and captions. */
export const isVertical = (width: number, height: number) => height > width;
