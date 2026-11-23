import {CastMember, look} from '../../src/styles/3d/look';

// The cast of the series. Who they are and how they speak: series/story/00-bible.md

export const ADA: CastMember = {
  id: 'ada',
  name: 'Ada',
  role: 'A curious nine-year-old who always has a plan',
  bio: 'Bright, quick and a little bossy. Speaks fast when she is excited.',
  look: look({build: 'kid', hair: 'bob', hairColor: '#4a2f22', top: 'stripe', topColor: '#f2994a', topAccent: '#fff3d6', bottom: 'skirt', bottomColor: '#3f5d8a'}),
  signature: {pose: 'hips', expr: 'happy'},
  main: true,
  voice: 'A',
};

export const BEN: CastMember = {
  id: 'ben',
  name: 'Ben',
  role: 'Her careful best friend',
  bio: 'Gentle and a little shy. Notices what everyone else misses.',
  look: look({build: 'kid', skin: '#c98d62', hair: 'curly', hairColor: '#2a1c16', top: 'plain', topColor: '#4fa3a5', bottom: 'shorts', bottomColor: '#5a4a40', glasses: true}),
  signature: {pose: 'hold', expr: 'shy', prop: 'book'},
  main: true,
  voice: 'B',
};

export const ROSA: CastMember = {
  id: 'rosa',
  name: 'Ms Rosa',
  role: 'The shopkeeper on the square',
  bio: 'Warm and unhurried. Knows everyone by name.',
  look: look({build: 'stout', skin: '#e0ac7e', hair: 'bun', hairColor: '#7a7470', top: 'collar', topColor: '#8e6bb0', topAccent: '#f4e9ff', bottom: 'pants', bottomColor: '#4a4458', shoeColor: '#3a3a3a'}),
  signature: {pose: 'wave', expr: 'happy'},
  main: false,
  voice: null,
};

/** The one list of cast members. */
export const CAST: CastMember[] = [ADA, BEN, ROSA];
