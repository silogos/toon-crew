// Turns the sample series into the Director's own series. Two ways:
//   npm run clear-sample -- --yes    start empty: no cast, no places, no episodes, no voices (music moods are kept)
//   npm run clear-sample -- --keep   start from the sample: keep everything, only stop calling it the sample
import fs from 'node:fs';
import path from 'node:path';
import {AUDIO_DIR, DURATIONS_FILE, PRONUNCIATION_FILE, TAKES_FILE, WORDS_FILE, episodeNames, lineFiles, readDurations, readJson, readJsonIf, readSeries, writeJson} from './lib/series.mjs';

const SERIES_FILE = 'series/series.json';
const series = readSeries();
if (!series.sample) {
  console.error('This is not the sample series any more (series.json has no "sample": true). Nothing was changed.');
  process.exit(1);
}

const keep = process.argv.includes('--keep');
const yes = process.argv.includes('--yes');
if (keep && yes) {
  console.error('Use either --keep (start from the sample) or --yes (start empty), not both.');
  process.exit(1);
}

if (keep) {
  delete series.sample;
  writeJson(SERIES_FILE, series);
  console.log('The sample is now this series\' starting point: cast, map, episode and voices are kept. Give it its own title in series/series.json, then run `npm run check`.');
  process.exit(0);
}

if (!yes) {
  console.error(
    'This removes the sample cast, map, episode, story files, voices and recordings.\n' +
      'Run again with --yes to go ahead: npm run clear-sample -- --yes\n' +
      'To keep the sample and change it into your own show instead: npm run clear-sample -- --keep',
  );
  process.exit(1);
}

const rm = (p) => fs.rmSync(p, {recursive: true, force: true});
const write = (p, text) => {
  fs.mkdirSync(path.dirname(p), {recursive: true});
  fs.writeFileSync(p, text);
};

// recordings and their lengths: keep music and sound effects, drop spoken lines
const lineIds = new Set(lineFiles().flatMap(({file}) => readJson(file).map((l) => l.id)));
for (const id of lineIds) rm(path.join(AUDIO_DIR, `${id}.wav`));
writeJson(DURATIONS_FILE, Object.fromEntries(Object.entries(readDurations()).filter(([id]) => !lineIds.has(id))));
writeJson(WORDS_FILE, Object.fromEntries(Object.entries(readJsonIf(WORDS_FILE, {})).filter(([id]) => !lineIds.has(id))));
rm(TAKES_FILE);
rm(PRONUNCIATION_FILE);

rm('series/voice-refs');
rm('series/story');
rm('series/opening/lines.json');
for (const ep of episodeNames()) rm(`series/episodes/${ep}`);

write('series/voices.json', '{}\n');
write('series/crew.json', '[]\n');
write('series/cast/index.ts', `import {CastMember} from '../../src/styles/3d/look';\n\n/** The one list of cast members. */\nexport const CAST: CastMember[] = [];\n`);
write(
  'series/world/map.tsx',
  `import {defineMap} from '../../src/styles/3d/world';\n\n// The one map of the series, explained in series/story/world.md.\n// Positions are [east, south] in metres.\nexport const MAP = defineMap({\n  size: [40, 30],\n  ground: '#8fcf7a',\n  roads: [],\n  places: {},\n  viewpoints: {},\n});\n`,
);
write('series/episodes/index.ts', `import {EpisodeDef} from '../../src/engine/episode';\n\n/** The one place episodes are registered. */\nexport const EPISODES: EpisodeDef[] = [];\n`);
write('series/story/00-bible.md', '# Series bible\n\n**Status:** not written yet\n');
write('series/story/world.md', '# The world\n\n**Status:** no places yet\n\nThe map is data in `series/world/map.tsx`; this page explains it in words. To see it: `npm run still -- map`.\n');
write('series/story/lessons.md', '# Lessons\n\n**Status:** read before every stage; add an entry whenever something goes wrong in a way that could happen again.\n\nEach entry: what happened, the cause, what to do next time. Newest at the bottom.\n\n*(No lessons yet. Replace this line with the first entry.)*\n');

delete series.sample;
series.title = 'Untitled Series';
writeJson(SERIES_FILE, series);
console.log('The sample series has been cleared. The studio is empty and ready: run `npm run check`.');
