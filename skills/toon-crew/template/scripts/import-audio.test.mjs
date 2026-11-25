import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {plan} from './import-audio.mjs';
import {soundBounds} from './lib/ffmpeg.mjs';

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

describe('trimming silence', () => {
  it('finds where the sound starts and ends, at -45 dB', () => {
    const quiet = 50; // about -56 dB
    const loud = 8000;
    const s = new Int16Array([quiet, -quiet, 0, 0, loud, -loud, 0, 0, loud, quiet, 0, 0].flatMap((v) => [v, v]));
    expect(soundBounds(s, 2)).toEqual([4, 9]);
  });
  it('keeps everything when nothing is loud', () => {
    expect(soundBounds(new Int16Array(8), 2)).toEqual([0, 4]);
  });
});

describe('remotion launcher', () => {
  it('finds the Remotion command line inside node_modules', async () => {
    const {remotionCli} = await import('./remotion.mjs');
    expect(fs.existsSync(remotionCli())).toBe(true);
  });
});
