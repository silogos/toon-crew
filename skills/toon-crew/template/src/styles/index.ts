import {SERIES} from '../engine/series';
import {REVIEW as REVIEW_3D, ReviewComposition} from './3d/review';

/** Review compositions of the series' look. A new look registers its own here. */
const BY_LOOK: Record<typeof SERIES.look, ReviewComposition[]> = {
  '2d': [],
  '2.5d': [],
  '3d': REVIEW_3D,
};
export const REVIEW = BY_LOOK[SERIES.look];
