// Puts a new studio into a folder: copies the template, adds TECH-STACK.md, and makes the links the tools expect
// (AGENTS.md → CLAUDE.md, .claude/agents → agents, .claude/skills → skills).
//
//   node setup-studio.mjs [folder]             set up an EMPTY studio (folder defaults to the current one)
//   node setup-studio.mjs [folder] --sample    keep the sample series the template ships with, to look at
//   node setup-studio.mjs [folder] --dry-run   only say what would be done
//
// A new studio starts empty on purpose: no cast, no places, no episode. A series is the Director's own,
// and a crew that starts from a sample tends to copy it.
//
// It never overwrites: if anything it would write is already there, it lists those files and changes nothing.
// It uses only what comes with Node.js, and works on macOS, Windows and Linux.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(SKILL, 'template');
const TECH_STACK = path.join(SKILL, 'references/tech-stack.md');

// Things that may sit in the template on the author's machine but never belong in a new studio.
const SKIP_NAMES = new Set(['node_modules', 'out', '.remotion', '.raw_voices', '.env', '.DS_Store', 'AGENTS.md']);
const skip = (rel) => {
  const name = path.basename(rel);
  if (SKIP_NAMES.has(name) || name.startsWith('.venv') || name.endsWith('.log')) return true;
  // 3D models are downloaded by whoever uses them; only the licence list travels
  return path.dirname(rel) === path.join('public', 'models') && name !== 'LICENSES.md';
};

/** Every file of the template that belongs in a studio, as paths relative to the template. */
const templateFiles = (dir = '') => {
  const found = [];
  for (const entry of fs.readdirSync(path.join(TEMPLATE, dir), {withFileTypes: true})) {
    const rel = path.join(dir, entry.name);
    if (skip(rel)) continue;
    if (entry.isDirectory()) found.push(...templateFiles(rel));
    else if (entry.isFile()) found.push(rel);
  }
  return found;
};

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const sample = args.includes('--sample');
const unknown = args.filter((a) => a.startsWith('-') && a !== '--dry-run' && a !== '--sample');
const folders = args.filter((a) => !a.startsWith('-'));
if (unknown.length || folders.length > 1) {
  console.error('Usage: node setup-studio.mjs [folder] [--sample] [--dry-run]');
  process.exit(1);
}
const target = path.resolve(folders[0] ?? '.');
const at = (rel) => path.join(target, rel);
const exists = (rel) => fs.lstatSync(at(rel), {throwIfNoEntry: false}) !== undefined;

if (!fs.existsSync(TEMPLATE)) {
  console.error(`The studio template is missing: ${TEMPLATE}`);
  process.exit(1);
}
if (exists('series/series.json')) {
  console.error(`${target} already holds a studio (series/series.json is there). Nothing was changed.`);
  process.exit(1);
}

const files = templateFiles();
const clashes = [...files, 'TECH-STACK.md', 'AGENTS.md'].filter(exists);
if (clashes.length) {
  console.error(`These are already in ${target}, and the studio would overwrite them. Nothing was changed.`);
  for (const rel of clashes.slice(0, 15)) console.error(`  ${rel}`);
  if (clashes.length > 15) console.error(`  … and ${clashes.length - 15} more`);
  console.error('Move them away, or set the studio up in a new, empty subfolder.');
  process.exit(1);
}

/** Links to make: [where, what it points to (relative to where), is it a folder]. */
const LINKS = [
  ['AGENTS.md', 'CLAUDE.md', false],
  ['.claude/agents', '../agents', true],
  ['.claude/skills', '../skills', true],
];

if (dry) {
  console.log(`Would copy ${files.length} files into ${target}, add TECH-STACK.md, ${sample ? 'keep the sample series' : 'empty the sample series out'}, and link:`);
  for (const [from, to] of LINKS) console.log(`  ${from} → ${to}${exists(from) ? '   (already there: would be left alone)' : ''}`);
  console.log('Dry run: nothing was changed.');
  process.exit(0);
}

for (const rel of files) {
  fs.mkdirSync(path.dirname(at(rel)), {recursive: true});
  fs.copyFileSync(path.join(TEMPLATE, rel), at(rel));
}
fs.copyFileSync(TECH_STACK, at('TECH-STACK.md'));

const notes = [];
for (const [from, to, isFolder] of LINKS) {
  if (exists(from)) {
    notes.push(`${from} was already there and was left alone; make sure it points to ${to}.`);
    continue;
  }
  fs.mkdirSync(path.dirname(at(from)), {recursive: true});
  const source = path.resolve(path.dirname(at(from)), to);
  try {
    // a junction needs no special rights on Windows, and takes an absolute path
    if (isFolder && process.platform === 'win32') fs.symlinkSync(source, at(from), 'junction');
    else fs.symlinkSync(to, at(from), isFolder ? 'dir' : 'file');
  } catch {
    // no right to make links (Windows without developer mode): a copy works, but does not follow later edits
    fs.cpSync(source, at(from), {recursive: true});
    notes.push(`${from} is a copy of ${to}, because this computer did not allow a link. Copy it again after changing ${to}.`);
  }
}

// The template carries a sample series so that the engine can be tested and shown. A new studio does not keep it.
if (!sample) {
  const cleared = spawnSync(process.execPath, ['scripts/clear-sample.mjs', '--yes'], {cwd: target, encoding: 'utf8'});
  if (cleared.status !== 0) {
    console.error(`The studio was copied, but the sample series could not be emptied out:\n${cleared.stdout ?? ''}${cleared.stderr ?? ''}`);
    process.exit(1);
  }
}

console.log(`${sample ? 'Studio with the sample series' : 'Empty studio'} set up in ${target}: ${files.length} files copied, TECH-STACK.md and ${LINKS.length} links.`);
for (const note of notes) console.log(`note: ${note}`);
console.log('Next, in that folder: npm install, then npm run doctor, then npm run check.');
