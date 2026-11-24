// Brings Remotion's own guides for agents (github.com/remotion-dev/skills) into this studio's skills/,
// where the crew reads them when it writes Remotion code.
//
//   npm run remotion-guides              download them (or say they are already here)
//   npm run remotion-guides -- --force   download them again
//   npm run remotion-guides -- --check   only say whether they are here
//
// Only the guides that explain Remotion itself are taken: writing markup (animation, timing, audio,
// fonts, 3D, text), captions, searching the Remotion docs, and reading media files. The ones that would
// make a new project, start the preview, render or upgrade packages are left out: in a studio those
// jobs belong to its own commands and recipes (CLAUDE.md).
//
// The guides are Remotion's, under the Remotion license, so they are downloaded into each studio and
// never committed (see .gitignore), like node_modules. The version is fixed below; a newer one is
// taken only by changing COMMIT. Nothing downloaded is run: the files are text for the crew to read.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const REPO = 'remotion-dev/skills';
const COMMIT = '89c8afa3eee9cdd83838ac31979c2ba1384615aa'; // 2026-11-23, Remotion 4.0.546
export const GUIDES = ['remotion-markup', 'remotion-captions', 'remotion-docs', 'remotion-multimedia'];
const MARK = path.join('skills', '.remotion-guides');

export const guidesInstalled = (root = '.') =>
  fs.existsSync(path.join(root, MARK)) && GUIDES.every((g) => fs.existsSync(path.join(root, 'skills', g, 'SKILL.md')));

const main = async () => {
  const args = process.argv.slice(2);
  const here = guidesInstalled() && fs.readFileSync(MARK, 'utf8').includes(COMMIT);
  if (args.includes('--check')) {
    console.log(here ? `Remotion guides: installed (${GUIDES.join(', ')})` : 'Remotion guides: not installed. Run: npm run remotion-guides');
    process.exit(here ? 0 : 1);
  }
  if (here && !args.includes('--force')) {
    console.log(`Remotion guides are already here: ${GUIDES.map((g) => `skills/${g}`).join(', ')}`);
    return;
  }

  const url = `https://codeload.github.com/${REPO}/tar.gz/${COMMIT}`;
  // a stalled network must not hold up setting up the studio
  const signal = AbortSignal.timeout(60_000);
  const res = await fetch(url, {signal}).catch((e) => {
    throw new Error(`Could not reach GitHub to download the Remotion guides (${e.message}). The studio works without them.`);
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${url}. The studio works without the guides.`);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'remotion-guides-'));
  try {
    const archive = path.join(tmp, 'skills.tar.gz');
    const body = await res.arrayBuffer().catch((e) => {
      throw new Error(`The download of the Remotion guides stopped (${e.message}). The studio works without them.`);
    });
    fs.writeFileSync(archive, Buffer.from(body));
    const tar = spawnSync('tar', ['-xzf', archive, '-C', tmp], {stdio: 'inherit'});
    if (tar.status !== 0) throw new Error('Could not unpack the Remotion guides: is `tar` available?');
    const from = path.join(tmp, `skills-${COMMIT}`, 'skills');
    for (const g of GUIDES) {
      if (!fs.existsSync(path.join(from, g, 'SKILL.md'))) throw new Error(`The download has no ${g}; nothing was changed.`);
    }
    for (const g of GUIDES) {
      const to = path.join('skills', g);
      fs.rmSync(to, {recursive: true, force: true});
      fs.cpSync(path.join(from, g), to, {recursive: true});
    }
    fs.writeFileSync(MARK, `${REPO}@${COMMIT}\n${GUIDES.join('\n')}\n`);
    console.log(`Remotion guides installed from ${REPO}@${COMMIT.slice(0, 7)}: ${GUIDES.map((g) => `skills/${g}`).join(', ')}`);
    console.log('They explain Remotion; where they differ from CLAUDE.md or a recipe, CLAUDE.md and the recipe win.');
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
