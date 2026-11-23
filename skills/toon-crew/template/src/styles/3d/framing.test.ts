import {describe, expect, it} from 'vitest';
import {Subject, cameraAxes, frameShot} from './framing';
import type {Vec3} from './stage';

/** Where a point lands in the frame: -1..1 across and -1..1 up, when it is inside. */
const onScreen = (p: Vec3, shot: {from: Vec3; to: Vec3; fov?: number}, aspect: number) => {
  const toward: Vec3 = [shot.from[0] - shot.to[0], shot.from[1] - shot.to[1], shot.from[2] - shot.to[2]];
  const {d, right, up} = cameraAxes(toward);
  const v: Vec3 = [p[0] - shot.from[0], p[1] - shot.from[1], p[2] - shot.from[2]];
  const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const depth = -dot(v, d);
  const t = Math.tan(((shot.fov ?? 35) * Math.PI) / 360);
  return {x: dot(v, right) / (depth * t * aspect), y: dot(v, up) / (depth * t), depth};
};

const two: Subject[] = [
  {position: [-1.4, 0, 0.3], height: 1.2},
  {position: [1.6, 0, -0.4], height: 1.25},
];

describe('frameShot', () => {
  for (const [name, aspect] of [['landscape', 16 / 9], ['vertical', 9 / 16], ['square', 1]] as const) {
    it(`shows every subject whole in a ${name} frame`, () => {
      const shot = frameShot(two, {aspect});
      for (const s of two) {
        for (const p of [s.position, [s.position[0], s.position[1] + s.height, s.position[2]] as Vec3]) {
          const q = onScreen(p, shot, aspect);
          expect(q.depth).toBeGreaterThan(0);
          expect(Math.abs(q.x)).toBeLessThan(0.9);
          expect(Math.abs(q.y)).toBeLessThan(0.9);
        }
      }
    });
  }

  it('stands further back in a vertical frame than in a landscape one for a wide group', () => {
    const dist = (aspect: number) => {
      const s = frameShot(two, {aspect});
      return Math.hypot(s.from[0] - s.to[0], s.from[1] - s.to[1], s.from[2] - s.to[2]);
    };
    expect(dist(9 / 16)).toBeGreaterThan(dist(16 / 9));
  });

  it('lift moves the group into the upper half without losing anyone', () => {
    const aspect = 9 / 16;
    const shot = frameShot(two, {aspect, lift: 0.3});
    const ys: number[] = [];
    for (const s of two) {
      for (const p of [s.position, [s.position[0], s.position[1] + s.height, s.position[2]] as Vec3]) {
        const q = onScreen(p, shot, aspect);
        expect(Math.abs(q.x)).toBeLessThan(0.95);
        expect(Math.abs(q.y)).toBeLessThan(0.95);
        ys.push(q.y);
      }
    }
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeGreaterThan(0.15);
  });

  it('a smaller margin comes closer, and the camera stands where `toward` says', () => {
    const one: Subject[] = [{position: [0, 0, 0], height: 1.2}];
    const near = frameShot(one, {margin: 1.05, aspect: 16 / 9});
    const far = frameShot(one, {margin: 1.6, aspect: 16 / 9});
    expect(near.from[2]).toBeLessThan(far.from[2]);
    expect(frameShot(one, {toward: [1, 0, 0], aspect: 16 / 9}).from[0]).toBeGreaterThan(1);
  });
});
