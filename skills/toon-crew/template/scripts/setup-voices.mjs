// Sets up the voice engine of this series, once: finds a suitable Python, makes .venv-voices and installs
// what the series' engine needs. Works on macOS, Windows and Linux. Says in plain words what is missing.
//
//   npm run voices:setup               do it
//   npm run voices:setup -- --dry-run  only say what would be done
//
// It never prints the API key; it only says whether one is present.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import {readSeries, voiceEngine} from './lib/series.mjs';
import {VENV, engineSpec, hasElevenLabsKey, venvPython} from './lib/voice-env.mjs';

const dry = process.argv.includes('--dry-run');
const engine = voiceEngine(readSeries());
const spec = engineSpec(engine);

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

/** "3.12" when `cmd` is a working Python, else null. */
const pythonVersion = (cmd, pre = []) => {
  const r = spawnSync(cmd, [...pre, '-c', 'import sys;print("%d.%d"%sys.version_info[:2])'], {encoding: 'utf8'});
  return r.status === 0 ? r.stdout.trim() : null;
};
const accepts = (version) => Boolean(version) && spec.python(...version.split('.').map(Number));

if (engine === 'local' && !(process.platform === 'darwin' && os.arch() === 'arm64')) {
  fail(
    'The free local voices need an Apple Silicon Mac, and this computer is not one.\n' +
      'Switch this series to ElevenLabs ("voiceEngine": "elevenlabs" in series/series.json), or carry on with pictures only.',
  );
}

/** A Python that the uv tool manages, which is usually not on the PATH. Null when uv is not there or has none. */
const fromUv = (...version) => {
  const r = spawnSync('uv', ['python', 'find', ...version], {encoding: 'utf8'});
  const found = r.status === 0 ? r.stdout.trim().split('\n')[0] : '';
  return found && fs.existsSync(found) ? found : null;
};

/** Candidate interpreters, most specific first: the PATH, then the places a Python is often installed without being on it. */
const candidates =
  process.platform === 'win32'
    ? [['py', ['-3.12']], ['py', ['-3']], ['python', []]]
    : [['python3.12', []], ['python3', []], ['python', []], ['/opt/homebrew/opt/python@3.12/bin/python3.12', []], ['/usr/local/opt/python@3.12/bin/python3.12', []]];
for (const found of [fromUv('3.12'), fromUv()]) if (found) candidates.push([found, []]);

// an existing environment already has its own Python; only a new one needs a suitable interpreter
const python = venvPython();
const found = candidates.map(([cmd, pre]) => ({cmd, pre, version: pythonVersion(cmd, pre)})).find((c) => accepts(c.version));
if (!found && !fs.existsSync(python)) {
  fail(
    `No Python ${spec.pythonLabel} was found (looked on the PATH, in Homebrew and in uv).\n` +
      'Install it (macOS: brew install python@3.12 · Windows: winget install Python.Python.3.12 · Linux: your package manager), then run this again.',
  );
}

const steps = [];
if (!fs.existsSync(python)) steps.push([found.cmd, [...found.pre, '-m', 'venv', VENV]]);
steps.push([python, ['-m', 'pip', 'install', ...spec.packages]]);

console.log(`Voice engine: ${engine}. Python ${found?.version ?? 'from the existing environment'}. Installing: ${spec.packages.join(', ')}.`);
if (engine === 'local') console.log('The first recording will download two voice models, a few gigabytes in total.');
for (const [cmd, args] of steps) {
  if (dry) console.log(`would run: ${cmd} ${args.join(' ')}`);
  else if (spawnSync(cmd, args, {stdio: 'inherit'}).status !== 0) fail(`That step failed: ${cmd} ${args.join(' ')}`);
}

if (engine === 'elevenlabs') {
  if (!fs.existsSync('.env') && !dry) fs.copyFileSync('.env.example', '.env');
  console.log(
    hasElevenLabsKey()
      ? 'ElevenLabs API key: found in .env.'
      : 'ElevenLabs API key: NOT set yet. Open the file named .env in this folder, paste the key after ELEVENLABS_API_KEY=, save, and tell the crew.',
  );
}
console.log(dry ? 'Dry run: nothing was changed.' : 'Voice engine ready.');
