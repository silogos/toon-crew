import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {animationNames} from './glb.mjs';
import {buildTestGlb} from './make-test-glb.mjs';
import {checkModels} from './models-check.mjs';

/** A studio folder with a tiny model in public/models, optionally listed in LICENSES.md. */
const studio = ({withModel = true, licensed = true} = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'models-'));
  fs.mkdirSync(path.join(root, 'public/models'), {recursive: true});
  if (withModel) fs.writeFileSync(path.join(root, 'public/models/figure.glb'), buildTestGlb());
  if (licensed) fs.writeFileSync(path.join(root, 'public/models/LICENSES.md'), '- figure.glb: made for the tests, CC0\n');
  return root;
};
const spec = (over = {}) => ({file: 'models/figure.glb', height: 1.5, clips: {idle: 'swing'}, ...over});

describe('glb reading', () => {
  it('lists the animations in a .glb', () => {
    const root = studio();
    expect(animationNames(path.join(root, 'public/models/figure.glb'))).toEqual(['swing']);
  });

  it('refuses a file that is not a .glb', () => {
    const root = studio();
    fs.writeFileSync(path.join(root, 'public/models/bad.glb'), 'not a model at all, just text');
    expect(() => animationNames(path.join(root, 'public/models/bad.glb'))).toThrow(/not a \.glb/);
  });
});

describe('checkModels', () => {
  it('passes a model that is there, licensed, with clips that exist', () => {
    const r = checkModels({models: {hero: spec()}, root: studio()});
    expect(r).toEqual({errors: [], warnings: []});
  });

  it('only warns when the file has not been downloaded yet', () => {
    const r = checkModels({models: {hero: spec()}, root: studio({withModel: false})});
    expect(r.errors).toEqual([]);
    expect(r.warnings.join('\n')).toMatch(/not there yet/);
  });

  it('is an error when a clip name does not exist in the files', () => {
    const r = checkModels({models: {hero: spec({clips: {idle: 'swing', walk: 'Walking_A'}})}, root: studio()});
    expect(r.errors.join('\n')).toMatch(/no animation called "Walking_A".*swing/);
  });

  it('looks for clips in the extra animation files too', () => {
    const root = studio();
    fs.writeFileSync(path.join(root, 'public/models/more.glb'), buildTestGlb());
    const r = checkModels({models: {hero: spec({animationFiles: ['models/more.glb'], clips: {idle: 'swing', pose: {wave: 'swing'}}})}, root});
    expect(r.errors).toEqual([]);
  });

  it('warns when the licence is not recorded', () => {
    const r = checkModels({models: {hero: spec()}, root: studio({licensed: false})});
    expect(r.warnings.join('\n')).toMatch(/LICENSES\.md/);
  });

  it('is an error when the settings themselves are incomplete', () => {
    const r = checkModels({models: {a: {height: 1}, b: spec({height: 0}), c: spec({clips: {}})}, root: studio()});
    expect(r.errors.length).toBe(3);
  });
});
