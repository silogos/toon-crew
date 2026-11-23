import React from 'react';
import {Bench, Bush, Fence, House, Lamp, Patch, Pond, Rock, Shop, Tree} from '../../src/styles/3d/blocks';
import {defineMap} from '../../src/styles/3d/world';

// The one map of the series, explained in series/story/world.md.
//
// A small square: a road runs east–west, two houses stand north of it,
// the shop and the pond are south of it. Positions are [east, south] in metres.

export const MAP = defineMap({
  size: [44, 30],
  ground: '#8fcf7a',
  roads: [
    {from: [-24, 0], to: [24, 0], width: 3.2},
    {from: [0, 0], to: [0, 9], width: 2.2},
  ],
  places: {
    square: {
      label: 'Square',
      at: [0, 3.2],
      build: ({time}) => (
        <>
          <Patch size={[7, 4.4]} color="#e6d6ae" />
          <Bench position={[-2.2, 0, -1.2]} />
          <Lamp position={[2.9, 0, -1.6]} time={time} />
        </>
      ),
    },
    red_house: {
      label: 'Red house',
      at: [-8, -6],
      build: ({time}) => (
        <>
          <House time={time} roof="#c2553f" />
          <Fence position={[-3.4, 0, 3.4]} length={2.4} />
          <Fence position={[1, 0, 3.4]} length={2.4} />
          <Bush position={[3.4, 0, 1.2]} />
        </>
      ),
    },
    blue_house: {
      label: 'Blue house',
      at: [8, -6],
      build: ({time}) => (
        <>
          <House time={time} wall="#eef3f7" roof="#4f7fb0" door="#c2553f" w={5.6} />
          <Tree position={[-4.4, 0, 0.6]} h={4.6} />
        </>
      ),
    },
    shop: {
      label: 'Shop',
      at: [9, 6.5],
      facing: -90,
      build: ({time}) => <Shop time={time} />,
    },
    pond: {
      label: 'Pond',
      at: [-9, 8],
      build: () => (
        <>
          <Pond />
          <Rock position={[2.9, 0, -1.4]} />
          <Rock position={[-3.1, 0, 1.2]} r={0.25} />
          <Bush position={[-2.4, 0, -2.4]} r={0.6} />
        </>
      ),
    },
  },
  scenery: ({time}) => (
    <>
      <Tree position={[-17, 0, -4]} kind="pine" h={5.5} />
      <Tree position={[-15, 0, -8]} kind="pine" h={4.6} />
      <Tree position={[17, 0, -5]} h={5} />
      <Tree position={[0, 0, -9]} h={5.4} />
      <Tree position={[16, 0, 11]} kind="pine" h={5} />
      <Tree position={[-18, 0, 5]} h={4.4} />
      <Lamp position={[-11, 0, 2]} time={time} />
      <Lamp position={[13, 0, -2]} time={time} />
    </>
  ),
  viewpoints: {
    square: {from: [0, 2.2, 13], to: [0, 1.2, 0], fov: 40},
    street: {from: [-16, 2, 2.5], to: [4, 1.5, -2], fov: 40},
    shop: {from: [-1, 2, 11], to: [9, 1.3, 6.5], fov: 40},
    pond: {from: [-2, 2.4, 13], to: [-9, 0.5, 8], fov: 40},
    houses: {from: [0, 3.2, 11], to: [0, 1.8, -6], fov: 50},
  },
});
