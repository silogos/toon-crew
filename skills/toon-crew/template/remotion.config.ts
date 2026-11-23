import {Config} from '@remotion/cli/config';
// @ts-ignore: a plain script shared with `npm run doctor`; it has no type declarations
import {findChrome} from './scripts/lib/chrome.mjs';

// Use an installed Chrome or Chromium when there is one: the bundled headless
// browser is unreliable for WebGL on some machines, and does not exist at all on Linux ARM.
const chrome = findChrome();
if (chrome) Config.setBrowserExecutable(chrome);

// 3D looks need a GPU renderer; ANGLE is the most stable choice.
Config.setChromiumOpenGlRenderer('angle');
Config.setEntryPoint('src/index.ts');
