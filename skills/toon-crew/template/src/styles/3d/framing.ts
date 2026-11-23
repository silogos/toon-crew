import {SERIES} from '../../engine/series';
import type {Shot, Vec3} from './stage';

/** Someone or something the shot must show whole: where it stands and how tall it is. */
export type Subject = {position: Vec3; height: number};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => {
  const n = Math.hypot(...a) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};

/** The camera's sideways and upward directions for a camera that looks back along `toward`. */
export const cameraAxes = (toward: Vec3) => {
  const d = unit(toward);
  const right = unit(cross([0, 1, 0], d));
  return {d, right, up: cross(d, right)};
};

/**
 * A shot that shows every subject whole, whatever the shape of the frame.
 *
 * The camera stands in the direction `toward` from the subjects (default: south of them and
 * slightly above, looking north) and backs away until everyone fits, top to bottom and side to
 * side. In a vertical series the same call simply ends up further back, so a two-shot written
 * this way never cuts a character in half.
 *
 *   frameShot([{position: ada, height: 1.2}, {position: ben, height: 1.25}])
 *   frameShot([speaker], {margin: 1.15, toward: [0.4, 0.1, 1]})   // a closer single, from the right
 *
 *   margin   room around the subjects: 1 = touching the edges, 1.3 = comfortable (default)
 *   fov      lens angle in degrees, top to bottom (default 35)
 *   headroom metres kept free above the tallest head, where the speech balloon goes (default 0.45)
 *   lift     how far above the middle of the frame the group sits: 0 = centred, 0.3 = clearly in the
 *            upper half. Default: 0 in a landscape frame; in a vertical one, about a third of
 *            the height the group leaves unused, because the bottom fifth is covered by the phone app.
 *   aspect   width / height of the frame (default: the series')
 */
export const frameShot = (subjects: Subject[], {toward = [0, 0.12, 1], fov = 35, margin = 1.3, headroom = 0.45, lift, aspect = SERIES.width / SERIES.height}: {toward?: Vec3; fov?: number; margin?: number; headroom?: number; lift?: number; aspect?: number} = {}): Shot => {
  const points: Vec3[] = subjects.flatMap((s) => [s.position, [s.position[0], s.position[1] + s.height + headroom, s.position[2]] as Vec3]);
  const lo = [0, 1, 2].map((i) => Math.min(...points.map((p) => p[i])));
  const hi = [0, 1, 2].map((i) => Math.max(...points.map((p) => p[i])));
  const centre: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const {d, right, up} = cameraAxes(toward);

  // half a body's width, so shoulders and a raised arm are inside too
  const BODY = 0.4;
  const halfW = Math.max(...points.map((p) => Math.abs(dot(sub(p, centre), right)))) + BODY;
  const halfH = Math.max(...points.map((p) => Math.abs(dot(sub(p, centre), up)))) + BODY * 0.25;
  const nearest = Math.max(...points.map((p) => dot(sub(p, centre), d)));

  const t = Math.tan((fov * Math.PI) / 360);
  // In a vertical frame a group is usually limited by the width and has height to spare; left centred it
  // floats in the middle with empty ground below. By default, move it up by about a third of that spare room.
  const fitWide = (halfW * margin) / (t * aspect);
  const spare = Math.max(0, 1 - (halfH * margin) / (t * Math.max(fitWide, (halfH * margin) / t)));
  const raise = Math.min(Math.max(lift ?? (aspect < 1 ? spare * 0.35 : 0), -0.6), 0.6);
  // a lifted group has less room above it, so the camera backs away a little more
  const distance = Math.max((halfH * margin) / (t * (1 - Math.abs(raise))), (halfW * margin) / (t * aspect)) + nearest;
  // aim below the group to make it sit higher in the frame
  const drop = raise * t * (distance - nearest);
  const to: Vec3 = [centre[0] - up[0] * drop, centre[1] - up[1] * drop, centre[2] - up[2] * drop];
  return {from: [to[0] + d[0] * distance, to[1] + d[1] * distance, to[2] + d[2] * distance], to, fov};
};
