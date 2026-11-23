import {describe, expect, it} from 'vitest';
import {ModelSpec, MODELS, clipTime, modelFilesOf, modelSchema, pickClip} from './model-spec';

const spec: ModelSpec = modelSchema.parse({
  file: 'models/a.glb',
  animationFiles: ['models/anim.glb', 'models/a.glb'],
  height: 1.7,
  clips: {idle: 'Idle', walk: 'Walk', talk: 'Talk', pose: {wave: 'Wave'}},
});

describe('pickClip', () => {
  it('plays idle when nothing is happening', () => {
    expect(pickClip(spec, {})).toBe('Idle');
    expect(pickClip(spec, {pose: 'down'})).toBe('Idle');
  });

  it('walking wins over everything', () => {
    expect(pickClip(spec, {walking: true, talking: true, pose: 'wave'})).toBe('Walk');
  });

  it('a pose with its own clip plays it, one without plays idle', () => {
    expect(pickClip(spec, {pose: 'wave'})).toBe('Wave');
    expect(pickClip(spec, {pose: 'cheer'})).toBe('Idle');
  });

  it('speaking plays the talk clip, or idle when the model has none', () => {
    expect(pickClip(spec, {talking: true})).toBe('Talk');
    expect(pickClip({...spec, clips: {idle: 'Idle'}}, {talking: true, walking: false})).toBe('Idle');
    expect(pickClip({...spec, clips: {idle: 'Idle'}}, {walking: true})).toBe('Idle');
  });
});

describe('model settings', () => {
  it('rejects a height that is not above zero and an unknown pose', () => {
    expect(() => modelSchema.parse({file: 'a.glb', height: 0, clips: {idle: 'x'}})).toThrow();
    expect(() => modelSchema.parse({file: 'a.glb', height: 1, clips: {idle: 'x', pose: {dance: 'y'}}})).toThrow();
  });

  it('series/models.json is valid (empty is fine)', () => {
    expect(typeof MODELS).toBe('object');
  });

  it('lists each file once, and nothing for a character without a model', () => {
    expect(modelFilesOf([undefined, undefined])).toEqual([]);
    expect(modelFilesOf(['hero', undefined, 'hero', 'unknown'], {hero: spec})).toEqual(['models/a.glb', 'models/anim.glb']);
  });
});

describe('clipTime', () => {
  it('follows the frame number and loops', () => {
    expect(clipTime({frame: 15, fps: 30, duration: 2})).toBeCloseTo(0.5);
    expect(clipTime({frame: 75, fps: 30, duration: 2})).toBeCloseTo(0.5);
  });

  it('holds a point of the clip when asked, whatever the frame', () => {
    expect(clipTime({frame: 0, fps: 30, duration: 2, phase: 0.4})).toBeCloseTo(0.8);
    expect(clipTime({frame: 999, fps: 30, duration: 2, phase: 0.4})).toBeCloseTo(0.8);
  });

  it('keeps a phase inside the clip and survives a clip with no length', () => {
    expect(clipTime({frame: 0, fps: 30, duration: 2, phase: 5})).toBeLessThan(2);
    expect(clipTime({frame: 0, fps: 30, duration: 2, phase: -1})).toBe(0);
    expect(clipTime({frame: 30, fps: 30, duration: 0})).toBeCloseTo(0);
  });
});
