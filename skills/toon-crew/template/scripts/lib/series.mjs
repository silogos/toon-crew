// What every script needs to know about the series folder: where things are and how to read them.
// Paths are relative to the series folder (the folder the npm scripts run in) unless a root is given.
import fs from 'node:fs';
import path from 'node:path';

export const AUDIO_DIR = 'public/audio';
export const DURATIONS_FILE = 'src/audio-durations.json';
/** When each word of a recorded line is heard (written by the voice scripts and voices:check). */
export const WORDS_FILE = 'src/audio-words.json';
/** What each line was recorded from (text, how it was said, which voice), so unchanged lines are not recorded again. */
export const TAKES_FILE = 'src/audio-takes.json';
/** The series' pronunciation dictionary: {"word as written": "how it is said"}. */
export const PRONUNCIATION_FILE = 'series/pronunciation.json';

export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** A JSON file, or `fallback` when it does not exist. */
export const readJsonIf = (file, fallback) => (fs.existsSync(file) ? readJson(file) : fallback);

export const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

/** series/series.json. Exits with a plain message when this folder is not a studio. */
export const readSeries = (root = '.') => {
  const file = path.join(root, 'series/series.json');
  if (!fs.existsSync(file)) {
    console.error('series/series.json not found: run this from the series folder (the one that holds CLAUDE.md and series/).');
    process.exit(1);
  }
  return readJson(file);
};

/** The name of the series' voice engine as written in series.json, or null while the Director has not chosen one
 * (there is no default). skills/voices/engines.mjs turns it into the engine. */
export const voiceEngine = (series) => series.voiceEngine ?? null;

/** Names of the episode folders (ep01, ep02, …), in order. */
export const episodeNames = (root = '.') => {
  const dir = path.join(root, 'series/episodes');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, {withFileTypes: true})
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
};

/** Every lines.json that exists: one per episode, plus the opening's. Each as {name, file}. */
export const lineFiles = (root = '.') =>
  [
    ...episodeNames(root).map((name) => ({name, file: path.join(root, 'series/episodes', name, 'lines.json')})),
    {name: 'opening', file: path.join(root, 'series/opening/lines.json')},
  ].filter((f) => fs.existsSync(f.file));

export const readDurations = (root = '.') => readJsonIf(path.join(root, DURATIONS_FILE), {});

/** True when a line (or a music track) has both its file and its length. */
export const isRecorded = (id, durations, root = '.') =>
  fs.existsSync(path.join(root, AUDIO_DIR, `${id}.wav`)) && durations[id] !== undefined;

/** The text after "**Status:**" near the top of a story file, or null when it has none. */
export const statusOf = (file) => {
  const head = fs.readFileSync(file, 'utf8').split('\n').slice(0, 12);
  for (const line of head) {
    const m = line.match(/^\*\*Status:\*\*\s*(.*)$/);
    if (m) return m[1].trim();
  }
  return null;
};
