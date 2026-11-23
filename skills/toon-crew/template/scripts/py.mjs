// Runs one of the Python voice scripts inside the series' voice environment,
// and says plainly what to do when that environment has not been set up yet.
// The recording script depends on the series' voice engine (series.json "voiceEngine").
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {readSeries, voiceEngine} from './lib/series.mjs';
import {engineSpec, venvPython} from './lib/voice-env.mjs';

const [asked, ...args] = process.argv.slice(2);
const spec = engineSpec(voiceEngine(readSeries()));
const script = asked === 'voices.py' ? spec.script : asked;

const python = venvPython();
if (!fs.existsSync(python)) {
  console.error(
    [
      'The voice engine is not set up in this folder yet.',
      'Everything else (pictures, stills, renders with the voices already recorded) works without it.',
      `To record or check voices, set it up once: npm run voices:setup (details in scripts/VOICES-SETUP.md). ${spec.needs}`,
    ].join('\n'),
  );
  process.exit(1);
}
const r = spawnSync(python, [`scripts/${script}`, ...args], {stdio: 'inherit'});
process.exit(r.status ?? 1);
