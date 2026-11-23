// Makes sure the preview (Remotion Studio) is running in the background and prints its links.
//
//   npm run preview            start it if it is not running, print the link of every episode
//   npm run preview -- ep01    the same, but only the link of that episode's scene preview
//   npm run preview -- stop    stop it
//
// Safe to run again and again: a preview that is already up is reused, never started twice.
// Remotion Studio can quit while the crew works (it happened in a trial); a small keeper process
// starts it again on the same address, so a link given to the Director stays good.
// `npm run studio` still exists for a person who wants it in the foreground of their own terminal.
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import {episodeNames, readJsonIf, readSeries, writeJson} from './lib/series.mjs';
import {remotionCli} from './remotion.mjs';

const STATE = 'out/.preview.json';
const LOG = 'out/preview.log';
const FIRST_PORT = 3000;
const START_TIMEOUT_MS = 90_000;

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const answers = async (url) => {
  try {
    const res = await fetch(url, {signal: AbortSignal.timeout(3000)});
    return res.ok;
  } catch {
    return false;
  }
};

const portFree = (port) =>
  new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port);
  });

const freePort = async () => {
  for (let port = FIRST_PORT; port < FIRST_PORT + 50; port++) if (await portFree(port)) return port;
  throw new Error(`no free port between ${FIRST_PORT} and ${FIRST_PORT + 49}`);
};

/** The preview this folder started earlier, if it is still up. */
const running = async () => {
  const state = readJsonIf(STATE, null);
  if (!state || !alive(state.pid) || !(await answers(state.url))) return null;
  return state;
};

const start = async () => {
  const port = await freePort();
  const url = `http://localhost:${port}`;
  fs.mkdirSync('out', {recursive: true});
  const log = fs.openSync(LOG, 'w');
  // the keeper is this same script; it runs the studio and starts it again whenever it quits
  const child = spawn(process.execPath, [process.argv[1], '--keep', String(port)], {
    detached: true,
    stdio: ['ignore', log, log],
    windowsHide: true,
  });
  child.unref();
  const state = {pid: child.pid, port, url};
  writeJson(STATE, state);

  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await answers(url)) return state;
    if (!alive(child.pid)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  fs.rmSync(STATE, {force: true});
  if (alive(child.pid)) end(child.pid);
  console.error(`The preview did not start. Its messages are in ${LOG}:\n`);
  console.error(fs.readFileSync(LOG, 'utf8').split('\n').slice(-15).join('\n'));
  process.exit(1);
};

/** End a process and whatever it started. */
const end = (pid) => {
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {stdio: 'ignore'});
  else process.kill(pid);
};

/** The keeper: run the studio on `port`, and again each time it quits, until told to stop. */
const keep = (port) => {
  let studio = null;
  let stopping = false;
  let quickExits = 0;
  const run = () => {
    const began = Date.now();
    studio = spawn(process.execPath, [remotionCli(), 'studio', `--port=${port}`, '--no-open'], {stdio: 'inherit', windowsHide: true});
    studio.on('exit', () => {
      if (stopping) return;
      // a studio that keeps dying at once has a real problem (a broken file, a taken port): give up and leave the log
      quickExits = Date.now() - began < 15_000 ? quickExits + 1 : 0;
      if (quickExits >= 4) {
        console.error('The preview stopped four times in a row right after starting; not trying again.');
        process.exit(1);
      }
      console.log('The preview quit; starting it again.');
      setTimeout(run, 1000);
    });
  };
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      stopping = true;
      studio?.kill();
      process.exit(0);
    });
  }
  run();
};

const stop = async () => {
  const state = readJsonIf(STATE, null);
  if (state && alive(state.pid)) {
    end(state.pid);
    console.log('Preview stopped.');
  } else {
    console.log('The preview was not running.');
  }
  fs.rmSync(STATE, {force: true});
};

const [arg, keepPort] = process.argv.slice(2);
readSeries();

if (arg === '--keep') {
  keep(Number(keepPort));
} else if (arg === 'stop') {
  await stop();
} else {
  const episodes = episodeNames();
  if (arg && !episodes.includes(arg)) {
    console.error(`There is no episode "${arg}". Episodes: ${episodes.join(', ') || 'none yet'}.`);
    process.exit(1);
  }
  const before = await running();
  const state = before ?? (await start());
  console.log(`Preview ${before ? 'already running' : 'started'}: ${state.url}`);
  for (const ep of arg ? [arg] : episodes) {
    console.log(`  ${ep}, one scene at a time (pick the scene number under Props): ${state.url}/${ep}-scene`);
    console.log(`  ${ep}, the whole video: ${state.url}/${ep}`);
  }
  console.log(`  review pictures: ${['cast', 'sheet', 'map', 'view'].map((id) => `${state.url}/${id}`).join('  ')}`);
  console.log('Give the Director these links when asking for a review. Stop it with: npm run preview -- stop');
}
