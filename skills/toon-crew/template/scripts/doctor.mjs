// Says what this computer and this folder have, and what is missing, in one go.
//   npm run doctor            a readable list; exits 1 when something the studio needs is missing
//   npm run doctor -- --json  the same as data
//
// Uses nothing from node_modules, so it also runs before `npm install`
// (and straight from the skill's template folder, before a studio exists).
// It never prints the API key; it only says whether one is present.
import fs from 'node:fs';
import os from 'node:os';
import {findChrome} from './lib/chrome.mjs';
import {guidesInstalled} from './remotion-guides.mjs';
import {readJsonIf, voiceEngine} from './lib/series.mjs';
import {venvPython} from '../skills/voices/voice-env.mjs';
import {findEngine, listEngines, missingSecrets, runsHere} from '../skills/voices/engines.mjs';

const NODE_MIN = 20;

const checks = [];
/** level: 'required' stops the studio, 'recommended' and 'voices' are only reported. */
const add = (level, name, ok, detail, fix) => checks.push({level, name, ok: Boolean(ok), detail, ...(ok || !fix ? {} : {fix})});

const install = (mac, win, linux) => (process.platform === 'darwin' ? mac : process.platform === 'win32' ? win : linux);

// the computer
const nodeMajor = Number(process.versions.node.split('.')[0]);
add('required', 'Node.js', nodeMajor >= NODE_MIN, `${process.versions.node} (needs ${NODE_MIN} or newer)`, install('brew install node', 'winget install OpenJS.NodeJS.LTS', 'install Node.js 20+ with your package manager'));

// ffmpeg is not checked: the studio uses the one that comes with Remotion (scripts/lib/ffmpeg.mjs)

const chrome = findChrome();
add(
  'recommended',
  'Google Chrome',
  chrome,
  chrome ?? 'not found: renders fall back to a bundled browser, which can fail on 3D',
  install('brew install --cask google-chrome', 'winget install Google.Chrome', 'install google-chrome or chromium, or set REMOTION_BROWSER_EXECUTABLE'),
);

// the folder
const series = readJsonIf('series/series.json', null);
if (series) {
  add('required', 'Studio packages', fs.existsSync('node_modules/remotion'), fs.existsSync('node_modules/remotion') ? 'installed' : 'not installed', 'npm install');

  const guides = guidesInstalled();
  add('recommended', 'Remotion guides', guides, guides ? 'installed in skills/' : 'not downloaded: the crew writes Remotion code without them', 'npm run remotion-guides');

  const name = voiceEngine(series);
  const engine = findEngine(name);
  if (!name) {
    add('voices', 'Voice engine', false, 'not chosen yet: only needed to record new lines', `the Director chooses one of: ${listEngines().map((e) => e.name).join(', ')} (skills/voices/VOICES-SETUP.md); write it as "voiceEngine" in series/series.json`);
  } else if (!engine) {
    add('voices', 'Voice engine', false, `"${name}" is not an engine the studio knows`, `set "voiceEngine" to one of: ${listEngines().map((e) => e.name).join(', ')}`);
  } else if (!runsHere(engine)) {
    add('voices', 'Voice engine', false, `${engine.label} needs an Apple Silicon Mac, and this computer is not one`, 'choose another engine with the Director (skills/voices/VOICES-SETUP.md), or bring recordings in with npm run voices:import');
  } else {
    const ready = fs.existsSync(venvPython());
    add('voices', `Voice engine (${engine.name})`, ready, ready ? 'set up' : 'not set up yet: only needed to record new lines', 'npm run voices:setup');
    for (const secret of engine.secrets ?? []) {
      const missing = missingSecrets(engine).includes(secret);
      add('voices', secret, !missing, missing ? 'not in .env yet' : 'present in .env', `the Director pastes it after ${secret}= in the .env file`);
    }
  }
}

const missing = checks.filter((c) => !c.ok && c.level === 'required');
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({platform: process.platform, arch: os.arch(), studio: Boolean(series), ready: missing.length === 0, checks}, null, 2));
} else {
  console.log(`${process.platform} ${os.arch()}${series ? '' : '  (no studio in this folder yet: only the computer was checked)'}`);
  for (const c of checks) {
    const mark = c.ok ? 'ok     ' : c.level === 'required' ? 'MISSING' : 'note   ';
    console.log(`${mark} ${c.name.padEnd(22)} ${c.detail}`);
    if (c.fix) console.log(`${' '.repeat(31)}→ ${c.fix}`);
  }
  console.log(missing.length ? `\n${missing.length} thing(s) the studio needs are missing.` : '\nEverything the studio needs is here.');
}
process.exit(missing.length ? 1 : 0);
