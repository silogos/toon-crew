import React from 'react';
import {Composition} from 'remotion';
import {EPISODES} from '../series/episodes';
import {OPENINGS} from '../series/opening';
import {assemble, makeFull, openingInfo} from './engine/episode';
import {SERIES} from './engine/series';
import {REVIEW} from './styles';

const {width, height, fps} = SERIES;
const size = {width, height, fps};

/**
 * Compositions are built from the series, so adding an episode or an opening
 * never means editing this file.
 *
 *   ep01            the whole video: chosen opening + story
 *   ep01-scene      one story scene with its sound (prop `scene`, from 1)
 *   opening-<name>  one opening version, introducing the first episode
 *   cast, sheet, map, view   review pictures supplied by the series' look
 */
export const Root: React.FC = () => {
  const first = EPISODES[0];
  return (
    <>
      {EPISODES.map((ep) => {
        const full = makeFull(ep, OPENINGS);
        return (
          <React.Fragment key={ep.id}>
            <Composition id={ep.id} component={full.Component} durationInFrames={Math.max(1, full.durationInFrames)} {...size} />
            <Composition
              id={`${ep.id}-scene`}
              component={ep.Scene}
              schema={ep.sceneSchema}
              defaultProps={{scene: 1}}
              durationInFrames={ep.scenes[0]?.duration ?? 1}
              calculateMetadata={({props}) => ({durationInFrames: ep.sceneDuration(props.scene)})}
              {...size}
            />
          </React.Fragment>
        );
      })}
      {first &&
        Object.entries(OPENINGS.versions).map(([name, make]) => {
          const one = assemble([make(openingInfo(first))], [...OPENINGS.lines, ...first.lines]);
          return <Composition key={name} id={`opening-${name}`} component={one.Component} durationInFrames={one.durationInFrames} {...size} />;
        })}
      {REVIEW.map((r) => (
        <Composition key={r.id} id={r.id} component={r.component} schema={r.schema} defaultProps={r.defaultProps} durationInFrames={1} {...size} />
      ))}
    </>
  );
};
