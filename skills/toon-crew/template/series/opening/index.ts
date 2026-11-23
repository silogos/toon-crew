import {OpeningSet} from '../../src/engine/episode';

/**
 * The openings of this series. `versions` maps a name to a function that builds
 * the opening scene for one episode; series.json `opening` names the one in use.
 * `lines` are the opening's own spoken lines (series/opening/lines.json).
 */
export const OPENINGS: OpeningSet = {versions: {}, lines: []};
