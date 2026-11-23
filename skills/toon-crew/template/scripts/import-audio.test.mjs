import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {cleanArgs, plan} from './import-audio.mjs';

const ids = new Map([['e1_a', 'A'], ['e1_b', 'B']]);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'import-'));

describe('import-audio plan', () => {
  it('pairs one id with one file', () => {
    const f = path.join(tmp(), 'take.mp3');
    fs.writeFileSync(f, '');
    expect(plan(['e1_a', f], ids)).toEqual([['e1_a', f]]);
  });

  it('takes every audio file of a folder, named after its line id', () => {
    const d = tmp();
    for (const n of ['e1_a.wav', 'e1_b.MP3', 'notes.txt']) fs.writeFileSync(path.join(d, n), '');
    expect(plan([d], ids).map(([id]) => id)).toEqual(['e1_a', 'e1_b']);
  });

  it('refuses an id that is not in any lines.json', () => {
    const d = tmp();
    fs.writeFileSync(path.join(d, 'nope.wav'), '');
    expect(() => plan([d], ids)).toThrow(/nope/);
  });

  it('explains usage when the arguments make no sense', () => {
    expect(() => plan([], ids)).toThrow(/Usage/);
  });

  it('refuses a folder with no audio', () => {
    expect(() => plan([tmp()], ids)).toThrow(/No audio/);
  });
});

describe('import-audio ffmpeg arguments', () => {
  it('trims silence, normalises loudness and writes 48 kHz stereo', () => {
    const a = cleanArgs('in.mp3', 'out.wav').join(' ');
    expect(a).toContain('silenceremove');
    expect(a).toContain('loudnorm');
    expect(a).toContain('-ar 48000 -ac 2');
  });
});

describe('remotion launcher', () => {
  it('finds the Remotion command line inside node_modules', async () => {
    const {remotionCli} = await import('./remotion.mjs');
    expect(fs.existsSync(remotionCli())).toBe(true);
  });
});
