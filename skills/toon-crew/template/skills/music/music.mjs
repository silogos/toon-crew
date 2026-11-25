// Generate the series' music and sound effects from series/music.mjs.
//   npm run music              everything
//   npm run music -- chime     only files whose name contains the word (others are left untouched)
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {AUDIO_DIR, DURATIONS_FILE, readDurations, writeJson} from '../../scripts/lib/series.mjs';
import * as kit from './music-kit.mjs';

const only = process.argv.slice(2);
const written = {};

/** Called by the series for each finished track; the name becomes the file name and the id. */
const write = (name, tr, peak = 0.9) => {
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`"${name}": names use lowercase letters, digits and underscores only`);
  if (only.length && !only.some((w) => name.includes(w))) return;
  fs.mkdirSync(AUDIO_DIR, {recursive: true});
  fs.writeFileSync(path.join(AUDIO_DIR, `${name}.wav`), kit.toWav(tr, peak));
  written[name] = Number((tr.L.length / kit.SR).toFixed(3));
  console.log(`${name.padEnd(24)} ${written[name].toFixed(1)}s`);
};

const source = path.resolve('series/music.mjs');
if (!fs.existsSync(source)) {
  console.error('series/music.mjs not found: that is where this series defines its music and sound effects.');
  process.exit(1);
}
const compose = (await import(pathToFileURL(source).href)).default;
compose({...kit, write});

if (!Object.keys(written).length) {
  console.error(only.length ? `No track name contains: ${only.join(', ')}` : 'series/music.mjs wrote no tracks.');
  process.exit(1);
}
writeJson(DURATIONS_FILE, {...readDurations(), ...written});
