// Runs one of the Python voice scripts inside the series' voice environment,
// and says plainly what to do when that environment has not been set up yet.
// `npm run voices` runs the recorder of the series' voice engine (skills/voices-<name>/record.py); `voices:check`
// runs check_voices.py from this folder. Both find the shared code (voicelib.py, here) through PYTHONPATH, and use
// the ffmpeg that comes with Remotion (TOON_FFMPEG, TOON_FFPROBE), so no other ffmpeg is needed.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readSeries, voiceEngine} from '../../scripts/lib/series.mjs';
import {engineSpec, venvPython} from './voice-env.mjs';
import {ffmpegEnv, ffmpegPaths} from '../../scripts/lib/ffmpeg.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const [asked, ...args] = process.argv.slice(2);
const spec = engineSpec(voiceEngine(readSeries()));
const script = asked === 'record' ? path.relative('.', spec.script) : path.relative('.', path.join(HERE, asked));

const python = venvPython();
if (!fs.existsSync(python)) {
  console.error(
    [
      'The voice engine is not set up in this folder yet.',
      'Everything else (pictures, stills, renders with the voices already recorded) works without it.',
      `To record or check voices, set it up once: npm run voices:setup (details in skills/voices/VOICES-SETUP.md). ${spec.needs}`,
    ].join('\n'),
  );
  process.exit(1);
}
const tools = ffmpegPaths();
if (!tools) {
  console.error('Remotion is not installed in this folder yet (it brings the ffmpeg the voice scripts use): run npm install.');
  process.exit(1);
}
const env = {
  ...ffmpegEnv(tools.dir),
  TOON_FFMPEG: tools.ffmpeg,
  TOON_FFPROBE: tools.ffprobe,
  PYTHONPATH: [HERE, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
};
const r = spawnSync(python, [script, ...args], {stdio: 'inherit', env});
process.exit(r.status ?? 1);
