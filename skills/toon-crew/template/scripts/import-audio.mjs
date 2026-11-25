// Brings recordings made elsewhere into the studio: cleans them and records their length,
// exactly like the voice engines do. Works with any source (a voice actor, another tool,
// the Director's own voice) and needs nothing but Remotion (its own ffmpeg, scripts/lib/ffmpeg.mjs).
//
//   npm run voices:import -- <line-id> <audio-file>     one line
//   npm run voices:import -- <folder>                   every file named <line-id>.<wav|mp3|m4a|ogg|flac>
//
// The line id must exist in an episode's (or the opening's) lines.json.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {cleanVoice, seconds} from './lib/ffmpeg.mjs';
import {AUDIO_DIR, DURATIONS_FILE, TAKES_FILE, WORDS_FILE, lineFiles, readDurations, readJson, readJsonIf, writeJson} from './lib/series.mjs';

const EXT = /\.(wav|mp3|m4a|ogg|flac|aac)$/i;

/** Every line of the series by id. */
export function knownLines(root = '.') {
  const ids = new Map();
  for (const {file} of lineFiles(root)) for (const l of readJson(file)) ids.set(l.id, l);
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const lines = knownLines();
    const pairs = plan(process.argv.slice(2), lines);
    fs.mkdirSync(AUDIO_DIR, {recursive: true});
    const durations = readDurations();
    const words = readJsonIf(WORDS_FILE, {});
    const takes = readJsonIf(TAKES_FILE, {});
    for (const [id, src] of pairs) {
      const dst = path.join(AUDIO_DIR, `${id}.wav`);
      cleanVoice(src, dst); // trim silence, level the loudness, 48 kHz stereo
      durations[id] = seconds(dst);
      console.log(`ok  ${id.padEnd(16)} ${durations[id].toFixed(2)}s`);
      writeJson(DURATIONS_FILE, durations); // after every line, so an interrupted run loses nothing
      // `npm run voices` keeps a recording brought in here instead of recording the line over it
      takes[id] = {text: lines.get(id).text, by: 'import'};
      writeJson(TAKES_FILE, takes);
      // the word times of an earlier recording no longer fit; `npm run voices:check` hears the new ones
      if (id in words) {
        delete words[id];
        writeJson(WORDS_FILE, words);
      }
    }
    console.log(`${pairs.length} line(s) imported. Their lengths now drive the timing of their scenes.`);
    console.log('Run `npm run voices:check -- <episode>` to check them and to time their words for the highlight.');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
