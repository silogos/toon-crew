import {defineEpisode} from '../../../src/engine/episode';
import {Line} from '../../../src/engine/lines';
import lines from './lines.json';
import {SCENES} from './scenes';

export const ep01 = defineEpisode({no: 1, title: 'The Lost Book', lines: lines as Line[], scenes: SCENES});
