// Render a finished video to out/.
//   npm run render -- ep01            → out/ep01-<title>.mp4 (name taken from series/story/ep01-*.md)
//   npm run render -- opening         → out/opening.mp4 (the chosen opening)
// Extra arguments go to `remotion render`, for example --frames=0-120.
import fs from 'node:fs';
import {readSeries} from './lib/series.mjs';
import {remotion} from './remotion.mjs';

const [what, ...rest] = process.argv.slice(2);
if (!what || what.startsWith('-')) {
  console.error('Usage: npm run render -- <episode|opening> [remotion options]   (for example ep01)');
  process.exit(1);
}
const series = readSeries();
let composition = what;
let name = what;
if (what === 'opening') {
  if (!series.opening) {
    console.error('This series has no opening yet.');
    process.exit(1);
  }
  composition = `opening-${series.opening}`;
} else {
  const story = fs.existsSync('series/story') ? fs.readdirSync('series/story').filter((f) => f.startsWith(`${what}-`) && f.endsWith('.md')) : [];
  if (story.length === 1) name = story[0].replace(/\.md$/, '');
}
const out = `out/${name}.mp4`;
const status = remotion(['render', composition, out, ...rest]);
if (status === 0) console.log(`\nrender: ${out}`);
process.exit(status);
