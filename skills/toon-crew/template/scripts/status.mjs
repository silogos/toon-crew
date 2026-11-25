// Where the production stands, read from the folder itself: the series, each story file's Status line,
// and for every episode how many lines are recorded, whether it is registered and whether it has been rendered.
//   npm run status            a readable report
//   npm run status -- --json  the same as data
//
// It reports facts only. What is approved is what the Status lines say; the Director decides the rest.
import fs from 'node:fs';
import path from 'node:path';
import {episodeNames, isRecorded, lineFiles, readDurations, readJson, readSeries, statusOf, voiceEngine} from './lib/series.mjs';
import {findEngine} from '../skills/voices/engines.mjs';

const STORY = 'series/story';
const series = readSeries();
const durations = readDurations();

const storyFiles = fs.existsSync(STORY) ? fs.readdirSync(STORY).filter((f) => f.endsWith('.md')).sort() : [];
const story = storyFiles.map((file) => ({file: `${STORY}/${file}`, status: statusOf(path.join(STORY, file))}));

const registry = fs.existsSync('series/episodes/index.ts') ? fs.readFileSync('series/episodes/index.ts', 'utf8') : '';
const renders = fs.existsSync('out') ? fs.readdirSync('out').filter((f) => f.endsWith('.mp4')) : [];

/** Recorded and missing line ids of one lines.json. */
const recording = (file) => {
  const ids = readJson(file).map((l) => l.id);
  const missing = ids.filter((id) => !isRecorded(id, durations));
  return {lines: ids.length, recorded: ids.length - missing.length, missing};
};
const linesOf = Object.fromEntries(lineFiles().map(({name, file}) => [name, recording(file)]));

// an episode exists as soon as it has a story file or a folder, whichever comes first
const names = [...new Set([...episodeNames(), ...storyFiles.map((f) => f.match(/^(ep\d+)-/)?.[1]).filter(Boolean)])].sort();
const episodes = names.map((name) => {
  const storyFile = storyFiles.find((f) => f.startsWith(`${name}-`));
  return {
    name,
    story: storyFile ? `${STORY}/${storyFile}` : null,
    status: storyFile ? statusOf(path.join(STORY, storyFile)) : null,
    ...(linesOf[name] ?? {lines: 0, recorded: 0, missing: []}),
    registered: new RegExp(`\\b${name}\\b`).test(registry),
    // render.mjs names the file after the story file, so a leftover render of another story with the same number does not count
    rendered: renders.filter((f) => f === `${name}.mp4` || (storyFile ? f === storyFile.replace(/\.md$/, '.mp4') : f.startsWith(`${name}-`))).map((f) => `out/${f}`),
  };
});

// the preview the crew started with `npm run preview`, if its process is still there
const previewState = fs.existsSync('out/.preview.json') ? readJson('out/.preview.json') : null;
const previewAlive = (() => {
  try {
    return Boolean(previewState) && process.kill(previewState.pid, 0);
  } catch {
    return false;
  }
})();

const report = {
  title: series.title,
  sample: Boolean(series.sample),
  language: series.language,
  look: series.look,
  size: `${series.width}x${series.height} at ${series.fps} fps`,
  // the engine's own name (an older name such as "local" is shown as the engine it means)
  voiceEngine: findEngine(voiceEngine(series))?.name ?? voiceEngine(series),
  pace: series.pace ?? 'step',
  preview: previewAlive ? previewState.url : null,
  crew: fs.existsSync('series/crew.json') ? readJson('series/crew.json') : [],
  opening: series.opening,
  openingLines: linesOf.opening ?? null,
  moods: Object.keys(series.music ?? {}),
  episodes,
  // episodes are listed above; lessons.md is a notebook, not a stage of the production
  story: story.filter((s) => !/\/ep\d+-/.test(s.file) && !s.file.endsWith('/lessons.md')),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const none = '(no Status line)';
console.log(`${report.title}${report.sample ? '  — this is still the SAMPLE series' : ''}`);
console.log(`${report.look} · ${report.size} · language ${report.language} · voices: ${report.voiceEngine ?? 'engine not chosen'} · opening: ${report.opening ?? 'none'}`);
console.log(`pace: ${report.pace === 'fast' ? 'fast track (one okay on the plan, one on the finished picture)' : 'step by step (an okay after every stage)'}`);
console.log(`preview: ${report.preview ? `running at ${report.preview}` : 'not running (npm run preview starts it and prints the links)'}`);
if (report.crew.length) console.log(`extra crew: ${report.crew.map((c) => `${c.job} (${c.agent}; ${c.kind ?? 'checks'} at ${(c.stages ?? []).join(', ')}${c.blocks ? '; can stop the work' : ''})`).join(' · ')}`);
console.log(`music moods: ${report.moods.join(', ') || 'none'}`);

console.log('\nEpisodes');
if (!episodes.length) console.log('  none yet');
for (const ep of episodes) {
  console.log(`  ${ep.name}  ${ep.status ?? (ep.story ? none : '(no story file yet)')}`);
  const facts = [
    ep.lines ? `lines recorded ${ep.recorded}/${ep.lines}` : 'no lines yet',
    ep.registered ? 'registered' : 'not registered in series/episodes/index.ts',
    ep.rendered.length ? `rendered: ${ep.rendered.join(', ')}` : 'not rendered in this folder',
  ];
  console.log(`        ${facts.join(' · ')}`);
  if (ep.missing.length) console.log(`        not recorded: ${ep.missing.join(', ')}`);
}

console.log('\nStory files');
if (!report.story.length) console.log('  none yet');
for (const s of report.story) console.log(`  ${path.basename(s.file).padEnd(18)} ${s.status ?? none}`);
if (report.openingLines) console.log(`\nOpening lines recorded ${report.openingLines.recorded}/${report.openingLines.lines}`);
