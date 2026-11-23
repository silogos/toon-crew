// Render still pictures for review, saved under out/stills/.
//   npm run still -- ep01 2 60        scene 2, frame 60 → out/stills/ep01/s2-f60.png (scenes count from 1)
//   npm run still -- ep01 2 0,60,120  several frames of one scene in one go
//   npm run still -- ep01 2           frame 30
//   npm run still -- ep01 board       the whole episode at a glance: 8 moments in one picture → out/stills/ep01/board.png
//   npm run still -- ep01 board 12    the same with 12 moments
//   npm run still -- opening 120      the chosen opening → out/stills/opening-<name>-f120.png (frames may be a list too)
//   npm run still -- opening <name> 120   a named opening version
//   npm run still -- cast             every cast member → out/stills/cast.png
//   npm run still -- sheet <id> expressions|poses   → out/stills/cast/<id>-<mode>.png
//   npm run still -- sheet <id> clips               a character drawn from a .glb model: every animation, part-way through
//   npm run still -- map              the world from above, labelled → out/stills/map.png
//   npm run still -- view <viewpoint> <time>        → out/stills/world/<viewpoint>-<time>.png
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {readSeries} from './lib/series.mjs';
import {remotion, remotionCli} from './remotion.mjs';

const DEFAULT_FRAME = '30';
const FRAMES = /^\d+(,\d+)*$/;

const usage = (msg) => {
  if (msg) console.error(msg);
  console.error('Usage: npm run still -- <episode> <scene> [frames] | <episode> board [moments] | opening [name] [frames] | cast | sheet <id> <expressions|poses|clips> | map | view <viewpoint> <time>\n       frames is one number or a list such as 0,60,120');
  process.exit(1);
};

/** Render one picture; returns the exit status. */
const still = (composition, out, props, frame = 0) => {
  const args = ['still', composition, out, `--frame=${frame}`];
  if (props) args.push(`--props=${JSON.stringify(props)}`);
  return remotion(args);
};

/** Render every picture of a plan, stop at the first failure, and list what was made. */
const run = (plan) => {
  const made = [];
  let status = 0;
  for (const {composition, out, props, frame} of plan) {
    status = still(composition, out, props, frame);
    if (status !== 0) break;
    made.push(out);
  }
  if (made.length) console.log(`\n${made.map((out) => `still: ${out}`).join('\n')}`);
  if (status !== 0 && plan.length > 1) console.error(`Stopped after ${made.length} of ${plan.length} pictures.`);
  process.exit(status);
};

/**
 * The whole episode in one picture: `count` moments spread evenly from start to end, side by side.
 * One render for all of them, so it is much quicker than the same number of single stills.
 */
const board = (ep, count) => {
  const listed = spawnSync(process.execPath, [remotionCli(), 'compositions'], {encoding: 'utf8'});
  const total = Number((listed.stdout ?? '').match(new RegExp(`^${ep}\\s+\\d+\\s+\\S+\\s+(\\d+)`, 'm'))?.[1]);
  if (!total) {
    console.error(`${listed.stdout ?? ''}${listed.stderr ?? ''}\nCould not find the length of "${ep}". Is the episode registered in series/episodes/index.ts?`);
    process.exit(1);
  }
  const every = Math.max(1, Math.ceil(total / count));
  const first = Math.min(total - 1, Math.floor(every / 2));
  const dir = `out/stills/${ep}/board`;
  const out = `out/stills/${ep}/board.png`;
  fs.rmSync(dir, {recursive: true, force: true});
  let status = remotion(['render', ep, dir, '--sequence', `--every-nth-frame=${every}`, `--frames=${first}-${total - 1}`, '--image-format=jpeg', '--log=error']);
  if (status !== 0) process.exit(status);

  // Remotion pads the numbers to the width of the largest, so give them one fixed name pattern in order
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^element-\d+\.jpeg$/.test(f))
    .sort((x, y) => Number(x.match(/\d+/)[0]) - Number(y.match(/\d+/)[0]));
  files.forEach((f, i) => fs.renameSync(`${dir}/${f}`, `${dir}/moment-${String(i).padStart(3, '0')}.jpeg`));
  const vertical = series.height > series.width;
  const columns = Math.min(files.length, vertical ? 6 : 4);
  const rows = Math.ceil(files.length / columns);
  const cell = vertical ? 300 : 480;
  const made = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-start_number', '0', '-i', `${dir}/moment-%03d.jpeg`, '-vf', `scale=${cell}:-2,tile=${columns}x${rows}:padding=6:color=white`, '-frames:v', '1', out], {stdio: 'inherit'});
  if (made.error || made.status !== 0) {
    console.error(`The pictures are in ${dir}, but they could not be joined into one: ffmpeg ${made.error ? 'was not found' : 'failed'}.`);
    process.exit(1);
  }
  fs.rmSync(dir, {recursive: true, force: true});
  const moments = files.map((_, i) => first + i * every);
  console.log(`\nstill: ${out}`);
  console.log(`${files.length} moments, left to right${rows > 1 ? ' and top to bottom' : ''}, at frames ${moments.join(', ')} of ${total} (${(total / series.fps).toFixed(1)} s).`);
  process.exit(0);
};

/** "0,60,120" → [0, 60, 120], without repeats. */
const frames = (text) => {
  if (!FRAMES.test(text)) usage(`"${text}" is not a frame number or a list of them (for example 60 or 0,60,120).`);
  return [...new Set(text.split(',').map(Number))];
};

const [what, a, b] = process.argv.slice(2);
if (!what) usage();
const series = readSeries();

if (/^ep\d+$/.test(what)) {
  if (a === 'board') {
    if (b !== undefined && !/^\d+$/.test(b)) usage(`"${b}" is not a number of moments (for example: npm run still -- ${what} board 12).`);
    board(what, Math.min(40, Math.max(2, Number(b ?? 8))));
  }
  if (!/^\d+$/.test(a ?? '')) usage(`Name the scene number, for example: npm run still -- ${what} 1`);
  run(frames(b ?? DEFAULT_FRAME).map((frame) => ({composition: `${what}-scene`, out: `out/stills/${what}/s${a}-f${frame}.png`, props: {scene: Number(a)}, frame})));
} else if (what === 'opening') {
  const named = a && !FRAMES.test(a);
  const name = named ? a : series.opening;
  if (!name) usage('This series has no opening yet.');
  run(frames((named ? b : a) ?? DEFAULT_FRAME).map((frame) => ({composition: `opening-${name}`, out: `out/stills/opening-${name}-f${frame}.png`, frame})));
} else if (what === 'cast' || what === 'map') {
  run([{composition: what, out: `out/stills/${what}.png`}]);
} else if (what === 'sheet') {
  if (!a) usage('Name the cast member, for example: npm run still -- sheet <id> expressions');
  const mode = b ?? 'expressions';
  if (!['expressions', 'poses', 'clips'].includes(mode)) usage(`Unknown sheet "${mode}". Use expressions, poses or clips.`);
  run([{composition: 'sheet', out: `out/stills/cast/${a}-${mode}.png`, props: {id: a, mode}}]);
} else if (what === 'view') {
  if (!a) usage('Name the viewpoint, for example: npm run still -- view square day');
  const time = b ?? 'day';
  run([{composition: 'view', out: `out/stills/world/${a}-${time}.png`, props: {from: a, time}}]);
} else {
  usage(`Unknown target "${what}".`);
}
