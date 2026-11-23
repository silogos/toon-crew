// Brings recordings made elsewhere into the studio: cleans them and records their length,
// exactly like the voice engines do. Works with any source (a voice actor, another tool,
// the Director's own voice) and needs only ffmpeg.
//
//   npm run voices:import -- <line-id> <audio-file>     one line
//   npm run voices:import -- <folder>                   every file named <line-id>.<wav|mp3|m4a|ogg|flac>
//
// The line id must exist in an episode's (or the opening's) lines.json.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {AUDIO_DIR, DURATIONS_FILE, lineFiles, readDurations, readJson, writeJson} from './lib/series.mjs';

const EXT = /\.(wav|mp3|m4a|ogg|flac|aac)$/i;
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';

/** Ids of every spoken line in the series, with the voice that speaks them. */
export function knownLines(root = '.') {
  const ids = new Map();
  for (const {file} of lineFiles(root)) for (const l of readJson(file)) ids.set(l.id, l.voice);
  return ids;
}

/** Pairs of [line id, file] from the command line arguments. Throws a readable message on bad input. */
export function plan(args, ids) {
  const pairs = [];
  if (args.length === 2 && !fs.statSync(args[1], {throwIfNoEntry: false})?.isDirectory() && fs.existsSync(args[1])) {
    pairs.push([args[0], args[1]]);
  } else if (args.length === 1 && fs.statSync(args[0], {throwIfNoEntry: false})?.isDirectory()) {
    for (const f of fs.readdirSync(args[0]).sort()) if (EXT.test(f)) pairs.push([f.replace(EXT, ''), path.join(args[0], f)]);
  } else {
    throw new Error('Usage: npm run voices:import -- <line-id> <audio-file>   or   npm run voices:import -- <folder>');
  }
  const unknown = pairs.filter(([id]) => !ids.has(id)).map(([id]) => id);
  if (unknown.length) throw new Error(`No such line id in any lines.json: ${unknown.join(', ')}`);
  if (!pairs.length) throw new Error('No audio files found.');
  return pairs;
}

export const cleanArgs = (src, dst) => [
  '-y', '-v', 'error', '-i', src, '-af', `${TRIM},loudnorm=I=-16:TP=-1.5:LRA=11`, '-ar', '48000', '-ac', '2', dst,
];

const seconds = (file) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'});
  if (r.status !== 0) throw new Error('ffprobe failed: is ffmpeg installed?');
  return Math.round(parseFloat(r.stdout.trim()) * 1000) / 1000;
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const pairs = plan(process.argv.slice(2), knownLines());
    fs.mkdirSync(AUDIO_DIR, {recursive: true});
    const durations = readDurations();
    for (const [id, src] of pairs) {
      const dst = path.join(AUDIO_DIR, `${id}.wav`);
      const r = spawnSync('ffmpeg', cleanArgs(src, dst), {stdio: 'inherit'});
      if (r.status !== 0) throw new Error(`ffmpeg could not read ${src}`);
      durations[id] = seconds(dst);
      console.log(`ok  ${id.padEnd(16)} ${durations[id].toFixed(2)}s`);
      writeJson(DURATIONS_FILE, durations); // after every line, so an interrupted run loses nothing
    }
    console.log(`${pairs.length} line(s) imported. Their lengths now drive the timing of their scenes.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
