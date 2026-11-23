// Checks the series content that the TypeScript compiler cannot see.
// Errors stop `npm run check`; warnings are things to know about.
import fs from 'node:fs';
import path from 'node:path';
import {AUDIO_DIR, isRecorded, lineFiles, readDurations, readJson, readJsonIf, readSeries} from './lib/series.mjs';
import {checkModels} from './models-check.mjs';

const errors = [];
const warnings = [];

const series = readSeries();
const voices = readJsonIf('series/voices.json', {});
const durations = readDurations();

for (const [code, v] of Object.entries(voices)) {
  for (const key of ['description', 'sample', 'seed']) {
    if (v[key] === undefined || v[key] === '') errors.push(`voices.json: voice ${code} has no "${key}"`);
  }
}

const seen = new Map();
for (const {file} of lineFiles()) {
  for (const line of readJson(file)) {
    const where = `${file}: ${line.id ?? '(no id)'}`;
    if (!line.id || !line.voice || !line.text) {
      errors.push(`${where}: every line needs id, voice and text`);
      continue;
    }
    if (!/^[a-z0-9_]+$/.test(line.id)) errors.push(`${where}: ids use lowercase letters, digits and underscores only`);
    if (seen.has(line.id)) errors.push(`${where}: id already used in ${seen.get(line.id)}`);
    seen.set(line.id, file);
    if (!voices[line.voice]) errors.push(`${where}: voice "${line.voice}" is not defined in series/voices.json`);
    if (!isRecorded(line.id, durations)) warnings.push(`${where}: not recorded yet (plays as one second of silence)`);
  }
}

for (const [mood, m] of Object.entries(series.music ?? {})) {
  if (!fs.existsSync(path.join(AUDIO_DIR, `${m.file}.wav`))) warnings.push(`series.json: music for mood "${mood}" (${m.file}.wav) has not been generated`);
}

// models drawn from .glb files
if (fs.existsSync('series/models.json')) {
  const found = checkModels({models: readJson('series/models.json')});
  errors.push(...found.errors);
  warnings.push(...found.warnings);
}

// the studio must not know the series: no title in engine, looks or scripts
const title = series.title;
const scan = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else if (/\.(tsx?|mjs|py)$/.test(e.name) && fs.readFileSync(p, 'utf8').includes(title)) {
      errors.push(`${p}: names the series title; read it from series.json instead`);
    }
  }
};
// 'Untitled Series' is the placeholder an empty studio starts with, not a real title
if (title && title.length > 3 && title !== 'Untitled Series') {
  scan('src');
  scan('scripts');
}

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
console.log(`series check: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
