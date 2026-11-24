/**
 * The typeface of all on-screen text: speech balloons, captions, signs and labels.
 *
 * It is Nunito (SIL Open Font License), shipped inside the studio by the `@fontsource/nunito`
 * package, so every machine renders the same letters and nothing is fetched from the internet.
 * Before, the text used whatever rounded font the computer happened to have, and a render on
 * another machine came out in a different face.
 *
 * Remotion waits until every file below has loaded before it draws a frame; a file that cannot
 * load stops the render with an error instead of quietly drawing a fallback.
 *
 * Nunito covers Latin (with Vietnamese and the accented letters of most European languages) and
 * Cyrillic. Arabic script (Arabic, Persian, Urdu, with vowel marks) is drawn in Noto Sans Arabic
 * (SIL Open Font License, `@fontsource/noto-sans-arabic`), shipped the same way. Other scripts —
 * Hebrew, Thai, Chinese, Japanese, Korean and the rest — fall through to the computer's own fonts.
 */
import {loadFont} from '@remotion/fonts';
import cyrillic700 from '@fontsource/nunito/files/nunito-cyrillic-700-normal.woff2';
import cyrillic800 from '@fontsource/nunito/files/nunito-cyrillic-800-normal.woff2';
import cyrillicExt700 from '@fontsource/nunito/files/nunito-cyrillic-ext-700-normal.woff2';
import cyrillicExt800 from '@fontsource/nunito/files/nunito-cyrillic-ext-800-normal.woff2';
import latin700 from '@fontsource/nunito/files/nunito-latin-700-normal.woff2';
import latin800 from '@fontsource/nunito/files/nunito-latin-800-normal.woff2';
import latinExt700 from '@fontsource/nunito/files/nunito-latin-ext-700-normal.woff2';
import latinExt800 from '@fontsource/nunito/files/nunito-latin-ext-800-normal.woff2';
import vietnamese700 from '@fontsource/nunito/files/nunito-vietnamese-700-normal.woff2';
import vietnamese800 from '@fontsource/nunito/files/nunito-vietnamese-800-normal.woff2';
import arabic700 from '@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-700-normal.woff2';
import arabic800 from '@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-800-normal.woff2';

const FAMILY = 'Nunito';
const ARABIC = 'Noto Sans Arabic';

/** Use this for every `fontFamily`. Each letter is drawn by the first font in the list that has it. */
export const FONT = `'${FAMILY}', '${ARABIC}', 'Arial Rounded MT Bold', 'Trebuchet MS', 'Helvetica Neue', sans-serif`;

/** The weights that are loaded. Text is bold (700) or extra bold (800); any other weight would be faked by the browser. */
export const FONT_WEIGHTS = ['700', '800'] as const;

// Which characters each file holds, as Fontsource declares them.
const SUBSETS = [
  {files: [cyrillicExt700, cyrillicExt800], range: 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'},
  {files: [cyrillic700, cyrillic800], range: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'},
  {
    files: [vietnamese700, vietnamese800],
    range: 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
  },
  {
    files: [latinExt700, latinExt800],
    range: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  },
  {
    files: [latin700, latin800],
    range: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  },
];

// Only the Arabic-script part of Noto Sans Arabic: its Latin letters must not stand in for Nunito's.
const ARABIC_SUBSET = {
  family: ARABIC,
  files: [arabic700, arabic800],
  range:
    'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC',
};

for (const {family, files, range} of [...SUBSETS.map((s) => ({family: FAMILY, ...s})), ARABIC_SUBSET]) {
  files.forEach((url, i) => {
    loadFont({family, url, weight: FONT_WEIGHTS[i], unicodeRange: range, display: 'block'}).catch((err) => {
      console.error(`The series font (${family} ${FONT_WEIGHTS[i]}) could not be loaded from ${url}:`, err);
    });
  });
}
