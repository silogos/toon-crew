import React from 'react';
import {Ground, Road} from './blocks';
import type {Shot, TimeOfDay, Vec3} from './stage';

/** A position on the map: [east, south] in metres from the centre of the world. */
export type MapPoint = [number, number];

export type Place = {
  /** the name shown on the labelled map */
  label: string;
  at: MapPoint;
  /** which way its front faces, in degrees: 0 = south, 90 = east, 180 = north, -90 = west */
  facing?: number;
  /** what stands there, built from blocks at the place's own origin, front toward +z */
  build?: (ctx: {time: TimeOfDay}) => React.ReactNode;
};

export type WorldMap<K extends string = string> = {
  /** how much ground the labelled map shows: [east–west, north–south] in metres */
  size: [number, number];
  ground: string;
  places: Record<K, Place>;
  roads?: {from: MapPoint; to: MapPoint; width?: number; color?: string}[];
  /** things that belong to no place: trees along a road, hills in the distance */
  scenery?: (ctx: {time: TimeOfDay}) => React.ReactNode;
  /** named camera positions for looking around the world, in world coordinates */
  viewpoints: Record<string, Shot>;
};

/** Define the one map of a series. Place names become the ids that scenes refer to. */
export const defineMap = <K extends string>(map: WorldMap<K>): WorldMap<K> => map;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Where a point given relative to a place (east/up/south of its origin, before its own turn) is in the world. */
export const inWorld = <K extends string>(map: WorldMap<K>, place: K, local: Vec3 = [0, 0, 0]): Vec3 => {
  const p = map.places[place];
  const a = rad(p.facing ?? 0);
  const [x, y, z] = local;
  return [p.at[0] + x * Math.cos(a) + z * Math.sin(a), y, p.at[1] - x * Math.sin(a) + z * Math.cos(a)];
};

/**
 * The whole world, assembled from the map. Every outdoor scene of a series with one
 * continuous world draws this same component, so what stands behind a place never changes.
 *
 * With `origin`, the world is shifted (and with `turn`, rotated) so that place sits at
 * [0, 0, 0]: the scene can then write simple local coordinates such as "two metres in
 * front of the shop" while the rest of the world stays where the map puts it.
 */
export const World = <K extends string>({
  map,
  time = 'day',
  origin,
  turn = 0,
}: {
  map: WorldMap<K>;
  time?: TimeOfDay;
  origin?: K | MapPoint;
  /** degrees to rotate the world around the origin, so the scene can face any direction */
  turn?: number;
}) => {
  const o: MapPoint = origin === undefined ? [0, 0] : typeof origin === 'string' ? map.places[origin].at : origin;
  return (
    <group rotation={[0, rad(turn), 0]}>
      <group position={[-o[0], 0, -o[1]]}>
        <Ground color={map.ground} />
        {map.roads?.map((r, i) => <Road key={i} {...r} />)}
        {(Object.entries(map.places) as [K, Place][]).map(([id, p]) => (
          <group key={id} position={[p.at[0], 0, p.at[1]]} rotation={[0, rad(p.facing ?? 0), 0]}>
            {p.build?.({time})}
          </group>
        ))}
        {map.scenery?.({time})}
      </group>
    </group>
  );
};
