/** Which music plays when. Pure arithmetic, so it can be tested without rendering. */

export type MoodChange = {at: number; mood: string | null};
export type Stretch = {mood: string; from: number; length: number};

/**
 * Turn the scenes of an episode into stretches of music.
 * A scene plays its starting mood until its script changes it (`t.mood`); neighbouring
 * pieces with the same mood, across scenes too, become one stretch so the music does not restart.
 * Moods the series does not have are left silent.
 */
export const musicStretches = (scenes: {duration: number; music: string | null; moods?: MoodChange[]}[], known: (mood: string) => boolean): Stretch[] => {
  const stretches: Stretch[] = [];
  let offset = 0;
  for (const s of scenes) {
    const changes = [...(s.moods ?? [])].sort((a, b) => a.at - b.at);
    // a change written at the very start simply is the starting mood
    const start = changes.filter((p) => p.at <= 0).pop()?.mood;
    const points = [{at: 0, mood: start === undefined ? s.music : start}, ...changes.filter((p) => p.at > 0 && p.at < s.duration)];
    points.forEach((p, n) => {
      const length = (points[n + 1]?.at ?? s.duration) - p.at;
      if (length <= 0 || !p.mood || !known(p.mood)) return;
      const from = offset + p.at;
      const last = stretches[stretches.length - 1];
      if (last && last.mood === p.mood && last.from + last.length === from) last.length += length;
      else stretches.push({mood: p.mood, from, length});
    });
    offset += s.duration;
  }
  return stretches;
};

/** Fade in and out of one stretch, shortened for a stretch too brief for the usual fades. Returns 0..1. */
export const stretchFade = (f: number, length: number) => {
  const fadeIn = Math.min(20, length / 3);
  const fadeOut = Math.min(30, length / 3);
  if (f < fadeIn) return Math.max(0, f / fadeIn);
  if (f > length - fadeOut) return Math.max(0, (length - f) / fadeOut);
  return 1;
};
