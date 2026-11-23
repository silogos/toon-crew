// Runs the Remotion command line with the same Node that runs this script.
// `npx` cannot be started directly on Windows (it is a .cmd file), so every script goes through here.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

/** Path of the Remotion CLI entry file inside this studio's node_modules. */
export const remotionCli = () => {
  const pkg = require.resolve('@remotion/cli/package.json');
  const bin = JSON.parse(fs.readFileSync(pkg, 'utf8')).bin;
  return path.join(path.dirname(pkg), typeof bin === 'string' ? bin : bin.remotion);
};

/** Run `remotion <args>` and return its exit status. */
export const remotion = (args) => spawnSync(process.execPath, [remotionCli(), ...args], {stdio: 'inherit'}).status ?? 1;
