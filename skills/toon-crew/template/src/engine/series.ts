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

/** Everything is designed at 1920 wide; on-screen text scales with the real width. */
export const DESIGN_WIDTH = 1920;
