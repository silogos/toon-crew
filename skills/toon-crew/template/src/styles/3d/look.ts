import type React from 'react';
import type models from '../../../series/models.json';
import type voices from '../../../series/voices.json';

/**
 * Everything a character can look like and do in the 3D look.
 *
 * These lists are the neutral core shared by every series. Each list has a matching
 * table of drawings in character.tsx, typed as a Record over the list, so adding a name
 * here without drawing it fails `npm run check`. Clothing or objects that belong to one
 * series only are added by that series as `accessories` or custom props, not here.
 */
export const BUILDS = ['kid', 'adult', 'stout'] as const;
export const HAIRS = ['none', 'short', 'spiky', 'bob', 'long', 'bun', 'curly'] as const;
export const TOPS = ['plain', 'stripe', 'collar', 'dress'] as const;
export const BOTTOMS = ['shorts', 'pants', 'skirt'] as const;
export const EXPRESSIONS = ['neutral', 'happy', 'laugh', 'smirk', 'shy', 'thinking', 'surprised', 'scared', 'worried', 'sad', 'cry', 'angry'] as const;
export const POSES = ['down', 'wave', 'point', 'hips', 'cheer', 'think', 'shrug', 'cover', 'hold', 'reach'] as const;
export const PROPS = ['none', 'book', 'ball', 'stick', 'cup', 'basket', 'flower'] as const;

export type Build = (typeof BUILDS)[number];
export type Hair = (typeof HAIRS)[number];
export type Top = (typeof TOPS)[number];
export type Bottom = (typeof BOTTOMS)[number];
export type Expression = (typeof EXPRESSIONS)[number];
export type Pose = (typeof POSES)[number];
export type PropKind = (typeof PROPS)[number];

/** Something a series adds to a character: a hat, a scarf, a badge. Drawn at the named part of the body. */
export type Accessory = {on: 'head' | 'body' | 'hand'; node: React.ReactNode};

export type CharacterLook = {
  build: Build;
  skin: string;
  hair: Hair;
  hairColor: string;
  top: Top;
  topColor: string;
  /** second colour: stripes, collar and buttons */
  topAccent: string;
  bottom: Bottom;
  bottomColor: string;
  shoeColor: string;
  glasses: boolean;
  blush: boolean;
  /** a small nose (off by default) */
  nose?: boolean;
  /** larger ears with an inner ear (off by default) */
  bigEars?: boolean;
  /** colour of the sole of the shoes (default off-white) */
  shoeSole?: string;
  accessories?: Accessory[];
};

export const DEFAULT_LOOK: CharacterLook = {
  build: 'kid',
  skin: '#f2c9a0',
  hair: 'short',
  hairColor: '#3b2a20',
  top: 'plain',
  topColor: '#e85d5d',
  topAccent: '#ffffff',
  bottom: 'shorts',
  bottomColor: '#3f5d8a',
  shoeColor: '#f4f4f4',
  glasses: false,
  blush: true,
};

/** Fill in a look from the defaults, so a cast entry only states what is particular to the character. */
export const look = (l: Partial<CharacterLook>): CharacterLook => ({...DEFAULT_LOOK, ...l});

/** What a character is doing at a moment. A scene sets these per frame. */
export type CharacterAction = {
  expr?: Expression;
  pose?: Pose;
  /** a core prop by name, or a series' own object to hold */
  prop?: PropKind | React.ReactNode;
  /** mouth moves */
  talking?: boolean;
  /** legs and arms swing as in walking */
  walking?: boolean;
  /** head turn, -1 (their right) to 1 (their left) */
  lookX?: number;
  /** head nod, -1 (up) to 1 (down) */
  lookY?: number;
};

/** A voice code defined in series/voices.json. Naming one that does not exist fails `npm run check`. */
export type VoiceCode = keyof typeof voices;

/** A model code defined in series/models.json. Naming one that does not exist fails `npm run check`. */
export type ModelCode = keyof typeof models;

export type CastMember = {
  /** short lowercase id used in commands, e.g. `npm run still -- sheet <id> poses` */
  id: string;
  name: string;
  /** one line: who they are in the story */
  role: string;
  bio: string;
  look: CharacterLook;
  /** how they stand when introduced: the pose, expression and prop that sum them up */
  signature: CharacterAction;
  /** main cast appear in line-ups and openings; others are occasional */
  main: boolean;
  /** null for a character who never speaks */
  voice: VoiceCode | null;
  /** optional: draw this character from a .glb model (defined in series/models.json) instead of from code */
  model?: ModelCode;
};
