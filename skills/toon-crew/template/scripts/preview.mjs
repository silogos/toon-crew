// Makes sure the preview (Remotion Studio) is running in the background and prints its links.
//
//   npm run preview            start it if it is not running, print the link of every episode
//   npm run preview -- ep01    the same, but only the link of that episode's scene preview
//   npm run preview -- stop    stop it
//   npm run preview -- --attached [ep01]   run it in THIS process and stay: for a session that can run a
//                              command as a background task, so the preview is listed there and can be stopped there
//
// Safe to run again and again: a preview that is already up is reused, never started twice.
// The preview belongs to the agent session that started it (Claude Code and the like): when that
// session ends, the preview stops by itself. Started by a person in a terminal, it runs until stopped.
// Remotion Studio can quit by itself while the crew works (it happened in a trial); a small keeper process
// starts it again on the same address, so a link given to the Director stays good. A studio that someone
// stopped on purpose is NOT started again: killing the server stops the preview for good.
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

/**
 * The agent session this command runs under: the nearest process above us that is a coding agent.
 * The preview is tied to it. Returns its pid, or null when a person ran the command (or on Windows,
 * where the chain of processes is not looked up).
 */
const ownerSession = () => {
  if (process.platform === 'win32') return null;
  let pid = process.ppid;
  for (let depth = 0; depth < 12 && pid > 1; depth++) {
    const row = spawnSync('ps', ['-o', 'ppid=,comm=', '-p', String(pid)], {encoding: 'utf8'}).stdout?.trim();
    const found = row?.match(/^(\d+)\s+(.*)$/);
    if (!found) return null;
    if (/^(claude|codex|cursor|gemini|opencode|aider)/i.test(found[2].split('/').pop())) return pid;
    pid = Number(found[1]);
  }
  return null;
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
  const owner = ownerSession();
  const child = spawn(process.execPath, [process.argv[1], '--keep', String(port), String(owner ?? 0)], {
    detached: true,
    stdio: ['ignore', log, log],
    windowsHide: true,
  });
  child.unref();
  const state = {pid: child.pid, port, url, owner};
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

/**
 * The keeper: run the studio on `port`, and again each time it quits, until told to stop
 * or until the session that owns it (`owner`, a pid, or 0 for none) has ended.
 */
const keep = (port, owner = 0) => {
  let studio = null;
  let stopping = false;
  let quickExits = 0;
  const finish = (why) => {
    stopping = true;
    if (why) console.log(why);
    studio?.kill();
    // only clear the note if it is still ours: a newer preview may have replaced it
    if (readJsonIf(STATE, null)?.pid === process.pid) fs.rmSync(STATE, {force: true});
    process.exit(0);
  };
  if (owner) setInterval(() => !alive(owner) && finish('The session that started the preview has ended; stopping the preview.'), 3000).unref();
  const run = () => {
    const began = Date.now();
    studio = spawn(process.execPath, [remotionCli(), 'studio', `--port=${port}`, '--no-open'], {stdio: 'inherit', windowsHide: true});
    studio.on('exit', (code, signal) => {
      if (stopping) return;
      // Someone stopped the studio on purpose (a kill, a task manager, another session): respect that and
      // stop too. Only a studio that quit by itself is started again.
      if (signal) return finish(`The preview was stopped from outside (${signal}); not starting it again.`);
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
  for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(signal, () => finish());
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

const args = process.argv.slice(2);
const attached = args.includes('--attached');
const [arg, keepPort, keepOwner] = args.filter((a) => a !== '--attached');
readSeries();

/** Print the links of a running preview. */
const report = (state, how) => {
  const episodes = episodeNames();
  console.log(`Preview ${how}: ${state.url}`);
  for (const ep of arg ? [arg] : episodes) {
    console.log(`  ${ep}, one scene at a time (pick the scene number under Props): ${state.url}/${ep}-scene`);
    console.log(`  ${ep}, the whole video: ${state.url}/${ep}`);
  }
  console.log(`  review pictures: ${['cast', 'sheet', 'map', 'view'].map((id) => `${state.url}/${id}`).join('  ')}`);
  console.log(
    state.owner
      ? 'Give the Director these links when asking for a review. It stops by itself when this session ends, or with: npm run preview -- stop'
      : 'Give the Director these links when asking for a review. It runs until stopped with: npm run preview -- stop',
  );
};

if (arg === '--keep') {
  keep(Number(keepPort), Number(keepOwner ?? 0));
} else if (arg === 'stop') {
  await stop();
} else {
  const episodes = episodeNames();
  if (arg && !episodes.includes(arg)) {
    console.error(`There is no episode "${arg}". Episodes: ${episodes.join(', ') || 'none yet'}.`);
    process.exit(1);
  }
  const before = await running();
  if (before) {
    report(before, 'already running');
  } else if (attached) {
    // run the studio in this very process, so whoever started us (a background task of the session) holds it
    const port = await freePort();
    const state = {pid: process.pid, port, url: `http://localhost:${port}`, owner: ownerSession()};
    fs.mkdirSync('out', {recursive: true});
    writeJson(STATE, state);
    keep(port, state.owner ?? 0);
    const deadline = Date.now() + START_TIMEOUT_MS;
    while (Date.now() < deadline && !(await answers(state.url))) await new Promise((r) => setTimeout(r, 500));
    report(state, 'started (attached: it runs as long as this command does)');
  } else {
    report(await start(), 'started');
  }
}
