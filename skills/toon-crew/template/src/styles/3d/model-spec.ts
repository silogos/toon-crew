import {z} from 'zod';
import raw from '../../../series/models.json';
import {POSES, Pose} from './look';

/**
 * What a series says about each .glb model it uses (series/models.json), checked when the studio starts.
 * This file knows nothing about drawing, so it can be tested without a browser.
 */
export const modelSchema = z.object({
  /** path inside public/, for example "models/knight.glb" */
  file: z.string().min(1),
  /** more files with animations for the same skeleton (bone names must match) */
  animationFiles: z.array(z.string().min(1)).optional(),
  /** how tall the character stands in the picture, in metres; the model is scaled to this */
  height: z.number().positive(),
  clips: z.object({
    idle: z.string().min(1),
    walk: z.string().min(1).optional(),
    /** while the character speaks; idle if left out */
    talk: z.string().min(1).optional(),
    /** a clip for a named pose; a pose with no clip plays idle */
    pose: z.partialRecord(z.enum(POSES), z.string().min(1)).optional(),
  }),
});

export type ModelSpec = z.infer<typeof modelSchema>;

export const MODELS: Record<string, ModelSpec> = z.record(z.string(), modelSchema).parse(raw);

/** Every file the given models need, each once. */
export const modelFilesOf = (codes: Array<string | undefined>, models: Record<string, ModelSpec> = MODELS): string[] => {
  const files = new Set<string>();
  for (const code of codes) {
    const spec = code ? models[code] : undefined;
    if (spec) [spec.file, ...(spec.animationFiles ?? [])].forEach((f) => files.add(f));
  }
  return [...files];
};

/** Which animation plays for what the character is doing. Walking wins, then a pose with its own clip, then speaking. */
export const pickClip = (spec: ModelSpec, a: {walking?: boolean; talking?: boolean; pose?: Pose}): string => {
  if (a.walking) return spec.clips.walk ?? spec.clips.idle;
  if (a.pose && a.pose !== 'down') {
    const p = spec.clips.pose?.[a.pose];
    if (p) return p;
  }
  if (a.talking) return spec.clips.talk ?? spec.clips.idle;
  return spec.clips.idle;
};

/** Seconds into a looping clip: by frame number, or at a fixed point of the clip (phase 0 to 1) for review pictures. */
export const clipTime = (a: {frame: number; fps: number; duration: number; phase?: number}): number => {
  const d = a.duration > 0 ? a.duration : 1;
  if (a.phase !== undefined) return Math.min(Math.max(a.phase, 0), 0.999) * d;
  return (a.frame / a.fps) % d;
};
