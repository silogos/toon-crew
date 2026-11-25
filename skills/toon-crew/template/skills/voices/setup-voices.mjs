// Sets up the voice engine of this series, once: finds a suitable Python, makes .venv-voices and installs
// what the series' engine needs. Works on macOS, Windows and Linux. Says in plain words what is missing.
//
//   npm run voices:setup               do it
//   npm run voices:setup -- --dry-run  only say what would be done
//
// What the engine needs (Python, packages, platform, secrets) is in its engine.json (skills/voices-<name>/), and what
// the listener needs in its listener.json (skills/listen-<name>/). ffmpeg comes with Remotion.
// It never prints a key; it only says whether one is present.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {readSeries, voiceEngine} from '../../scripts/lib/series.mjs';
import {VENV, acceptsPython, engineSpec, pythonLabel, venvPython} from './voice-env.mjs';
import {findListener, listEngines, listenerPackages, missingSecrets, runsHere} from './engines.mjs';

const dry = process.argv.includes('--dry-run');
const spec = engineSpec(voiceEngine(readSeries()));

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

/** "3.12" when `cmd` is a working Python, else null. */
const pythonVersion = (cmd, pre = []) => {
  const r = spawnSync(cmd, [...pre, '-c', 'import sys;print("%d.%d"%sys.version_info[:2])'], {encoding: 'utf8'});
  return r.status === 0 ? r.stdout.trim() : null;
};
const accepts = (version) => acceptsPython(spec, version);

if (!runsHere(spec)) {
  const others = listEngines().filter((e) => e.name !== spec.name && runsHere(e)).map((e) => e.name);
  fail(
    `${spec.label} needs an Apple Silicon Mac, and this computer is not one.\n` +
      `Choose another engine with the Director (${others.join(', ')}; skills/voices/VOICES-SETUP.md compares them), or carry on with pictures only.`,
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
    `No Python ${pythonLabel(spec)} was found (looked on the PATH, in Homebrew and in uv).\n` +
      'Install it (macOS: brew install python@3.12 · Windows: winget install Python.Python.3.12 · Linux: your package manager), then run this again.',
  );
}

const steps = [];
if (!fs.existsSync(python)) steps.push([found.cmd, [...found.pre, '-m', 'venv', VENV]]);
const listener = findListener();
const packages = [...spec.packages, ...listenerPackages(listener)];
if (packages.length) steps.push([python, ['-m', 'pip', 'install', ...packages]]);

console.log(`Voice engine: ${spec.name}. Listener: ${listener?.label ?? 'none (takes are kept unchecked)'}. Python ${found?.version ?? 'from the existing environment'}. Installing: ${packages.join(', ') || 'nothing'}.`);
if (spec.setupNote) console.log(spec.setupNote);
if (listener?.setupNote) console.log(listener.setupNote);
for (const [cmd, args] of steps) {
  if (dry) console.log(`would run: ${cmd} ${args.join(' ')}`);
  else if (spawnSync(cmd, args, {stdio: 'inherit'}).status !== 0) fail(`That step failed: ${cmd} ${args.join(' ')}`);
}

if (spec.secrets?.length) {
  if (!fs.existsSync('.env') && fs.existsSync('.env.example') && !dry) fs.copyFileSync('.env.example', '.env');
  for (const secret of spec.secrets) {
    console.log(
      missingSecrets(spec).includes(secret)
        ? `${secret}: NOT set yet. Open the file named .env in this folder, paste it after ${secret}=, save, and tell the crew.`
        : `${secret}: found in .env.`,
    );
  }
}
console.log(dry ? 'Dry run: nothing was changed.' : 'Voice engine ready.');
