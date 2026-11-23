// Where an installed Chrome or Chromium may be. Used by the render configuration and by `npm run doctor`,
// so both always agree on which browser draws the frames.
import fs from 'node:fs';

/** REMOTION_BROWSER_EXECUTABLE (full path to a Chrome or Chromium) wins over the search below. */
export const chromeCandidates = () => [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];

/** Path of the first browser that exists, or undefined. */
export const findChrome = () => chromeCandidates().find((p) => p && fs.existsSync(p));
