import {describe, expect, it} from 'vitest';
import {
  VOCAL_SOUNDS,
  applyPronunciation,
  deliveryProblems,
  readAloudProblems,
  recordedVoiceProblems,
  soundChoiceProblems,
  soundMethod,
  spokenText,
  voiceIdentityProblems,
} from './lines.mjs';
import {SOUNDS} from '../../skills/voices/vocal-synth.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {abilitiesOf, findEngine, listEngines} from '../../skills/voices/engines.mjs';

const VOX = findEngine('voxcpm2');
const EL = findEngine('elevenlabs');
const EDGE = findEngine('edge');
const vox = abilitiesOf(VOX, null);
const el3 = abilitiesOf(EL, 'eleven_v3');
const elOther = abilitiesOf(EL, 'eleven_multilingual_v2');
const edge = abilitiesOf(EDGE, null);

const line = (text, extra = {}) => ({id: 'x', voice: 'A', text, ...extra});
const problems = (text, extra = {}, dict) => readAloudProblems(line(text, extra), dict);

describe('readAloudProblems', () => {
  it('passes plain speech in any language', () => {
    expect(problems("Don't worry. I have a plan!")).toEqual([]);
    expect(problems('Jangan khawatir, aku punya rencana.')).toEqual([]);
    expect(problems('مرحبا يا صديقي!')).toEqual([]);
  });
  it('flags what a voice reads badly', () => {
    expect(problems('Wait 5 minutes')[0]).toMatch(/digits/);
    expect(problems('(coughs) Excuse me')[0]).toMatch(/stage direction/);
    expect(problems('*sigh*')[0]).toMatch(/stage direction/);
    expect(problems('50% off')).toHaveLength(2);
    expect(problems('I love it 😍')[0]).toMatch(/emoji/);
    expect(problems('Call the NASA team')[0]).toMatch(/capitals/);
  });
  it('trusts "say" and the pronunciation dictionary, and does not read a vocal sound as speech', () => {
    expect(problems('Wait 5 minutes', {say: 'Wait five minutes'})).toEqual([]);
    expect(problems('Call the NASA team', {}, {NASA: 'Nasa'})).toEqual([]);
    expect(problems('Achoo!', {sound: 'sneeze'})).toEqual([]);
  });
});

describe('pronunciation dictionary', () => {
  const dict = {Ucup: 'U-cup', 'Pak Ucup': 'Pak U-cup', AI: 'A I'};
  it('replaces whole words as written, longest first, once', () => {
    expect(applyPronunciation('Halo Pak Ucup dan Ucup!', dict)).toBe('Halo Pak U-cup dan U-cup!');
    expect(applyPronunciation('Ucupku dan aiu', dict)).toBe('Ucupku dan aiu');
    expect(applyPronunciation('AI itu pintar', {AI: 'A I', A: 'never'})).toBe('A I itu pintar');
  });
  it('gives the voice "say" when there is one', () => {
    expect(spokenText(line('Ucup!', {say: 'Uuucup!'}), dict)).toBe('Uuucup!');
    expect(spokenText(line('Ucup!'), dict)).toBe('U-cup!');
  });
});

describe('voice engines are packages of their own', () => {
  it('finds every engine folder, each with its recorder and its guide', () => {
    const engines = listEngines();
    expect(engines.map((e) => e.name)).toEqual(['edge', 'elevenlabs', 'voxcpm2']);
    for (const e of engines) {
      expect(path.basename(e.dir)).toBe(`voices-${e.name}`);
      expect(fs.existsSync(e.script), e.name).toBe(true);
      expect(fs.existsSync(path.join(e.dir, 'SKILL.md')), e.name).toBe(true);
      expect(e.abilities['*'], e.name).toBeTruthy();
      expect(e.summary && e.recommend && e.label, e.name).toBeTruthy();
    }
  });
  it('still knows a series by the older engine name', () => {
    expect(findEngine('local')?.name).toBe('voxcpm2');
    expect(findEngine('nope')).toBeNull();
    expect(findEngine(null)).toBeNull();
  });
});

describe('vocal sounds on each engine', () => {
  it('has a way to make every sound on every engine and model', () => {
    for (const e of listEngines()) {
      for (const model of Object.keys(e.abilities)) {
        for (const sound of Object.keys(VOCAL_SOUNDS)) expect(['voice', 'synth', 'import'], `${e.name} ${model} ${sound}`).toContain(soundMethod(sound, abilitiesOf(e, model)));
      }
    }
  });
  it('knows how to ask for every sound it asks the voice for, and synthesises what has no voice in it', () => {
    for (const e of listEngines()) {
      for (const model of Object.keys(e.abilities)) {
        for (const sound of Object.keys(VOCAL_SOUNDS)) if (soundMethod(sound, abilitiesOf(e, model)) === 'voice') expect(e.sounds[sound], `${e.name} ${sound}`).toBeTruthy();
      }
    }
    for (const [name, s] of Object.entries(VOCAL_SOUNDS)) {
      expect(EL.sounds[name], name).toMatch(/^\[.+\]$/);
      expect(['spoken', 'unspoken'], name).toContain(s.kind);
      if (s.kind === 'unspoken') expect(SOUNDS[name], name).toBeTypeOf('function');
    }
  });
  it('makes a cough with VoxCPM2 by the synthesiser, and lets the series choose otherwise', () => {
    expect(soundMethod('cough', vox)).toBe('synth');
    expect(soundMethod('laugh', vox)).toBe('voice');
    expect(soundMethod('laugh', vox, {laugh: 'import'})).toBe('import');
    expect(soundMethod('cough', el3)).toBe('voice');
    expect(soundMethod('cough', elOther)).toBe('synth');
  });
  it('refuses a choice that cannot be carried out', () => {
    expect(soundChoiceProblems({laugh: 'synth'}, vox)[0]).toMatch(/only synthesise/);
    expect(soundChoiceProblems({laugh: 'voice'}, edge)[0]).toMatch(/cannot be asked/);
    expect(soundChoiceProblems({burp: 'import'}, vox)[0]).toMatch(/not a vocal sound/);
    expect(soundChoiceProblems({cough: 'import', laugh: 'voice'}, vox)).toEqual([]);
  });
});

describe('delivery', () => {
  it('is a few plain words, and is ignored where the engine cannot use it', () => {
    expect(deliveryProblems(line('Hi', {delivery: 'scared, urgent'}), vox)).toEqual({errors: [], warnings: []});
    expect(deliveryProblems(line('Hi', {delivery: ''}), vox).errors).toHaveLength(1);
    expect(deliveryProblems(line('Hi', {delivery: '[scared]'}), vox).warnings[0]).toMatch(/plain words/);
    expect(deliveryProblems(line('Hi', {delivery: 'sleepy'}), edge).warnings[0]).toMatch(/ignored/);
  });
});

describe('every character has a voice of its own', () => {
  const v = (description, seed, extra = {}) => ({description, sample: 'Hi', seed, ...extra});
  it('refuses two characters that would get the same voice', () => {
    expect(voiceIdentityProblems({A: v('a girl', 1), B: v('A girl ', 1)}, VOX).errors[0]).toMatch(/A and B/);
    expect(voiceIdentityProblems({A: v('a', 1, {edge: {voice: 'x'}}), B: v('b', 2, {edge: {voice: 'x'}})}, EDGE).errors[0]).toMatch(/same edge-tts voice/);
    expect(voiceIdentityProblems({A: v('a', 1), B: v('b', 2)}, EL, {ids: {A: {voice_id: 'q'}, B: {voice_id: 'q'}}}).errors[0]).toMatch(/share one/);
  });
  it('asks to listen when only the seed differs, and passes distinct voices', () => {
    const r = voiceIdentityProblems({A: v('a girl', 1), B: v('a girl', 2)}, VOX);
    expect(r.errors).toEqual([]);
    expect(r.warnings[0]).toMatch(/listen/);
    expect(voiceIdentityProblems({A: v('a girl', 1), B: v('a boy', 1)}, VOX)).toEqual({errors: [], warnings: []});
  });
  it('needs a catalogue voice for every character on edge-tts', () => {
    expect(voiceIdentityProblems({A: v('a', 1)}, EDGE).errors[0]).toMatch(/no edge-tts voice/);
  });
});

describe('a voice taken from a recording', () => {
  const rec = (extra = {}) => ({description: 'recorded voice of a boy', sample: 'Halo', source: 'recording', ...extra});
  const files = (...present) => ({exists: (f) => present.includes(f)});
  it('is accepted with its clip, and with a prompt clip and its words', () => {
    expect(recordedVoiceProblems({U: rec()}, vox, files('series/voice-refs/U.wav'))).toEqual([]);
    const prompt = {file: 'U-prompt.wav', text: 'Esnya rasa durian.'};
    expect(recordedVoiceProblems({U: rec({prompt})}, vox, files('series/voice-refs/U.wav', 'series/voice-refs/U-prompt.wav'))).toEqual([]);
  });
  it('fails without its recording, with a broken prompt, or on an engine that cannot clone it', () => {
    expect(recordedVoiceProblems({U: rec()}, vox, files())[0]).toMatch(/U.wav is missing/);
    expect(recordedVoiceProblems({U: rec({prompt: {file: 'p.wav'}})}, vox, files('series/voice-refs/U.wav'))[0]).toMatch(/exactly what is said/);
    expect(recordedVoiceProblems({U: rec({prompt: {file: 'p.wav', text: 'Hi'}})}, vox, files('series/voice-refs/U.wav'))[0]).toMatch(/p.wav is missing/);
    expect(recordedVoiceProblems({U: rec({prompt: {file: '../p.wav', text: 'Hi'}})}, vox, files('series/voice-refs/U.wav'))[0]).toMatch(/not a path/);
    expect(recordedVoiceProblems({U: rec()}, edge, files('series/voice-refs/U.wav'))[0]).toMatch(/cannot speak in a recorded voice/);
    expect(recordedVoiceProblems({U: rec({source: 'mic'})}, vox, files())[0]).toMatch(/only source/);
    expect(recordedVoiceProblems({A: {description: 'a', sample: 'b', seed: 1, prompt: {file: 'p.wav', text: 'x'}}}, vox, files())[0]).toMatch(/only a recorded voice/);
  });
  it('is copied as it is: no delivery, no spoken fx, and sounds fall back', () => {
    const opts = {recordedVoice: true};
    expect(deliveryProblems(line('Hi', {delivery: 'scared'}), vox, opts).warnings[0]).toMatch(/copied from a recording.*ignored/);
    expect(deliveryProblems(line('Hi', {fx: 'shout'}), vox, opts).warnings[0]).toMatch(/balloon still turns red/);
    expect(deliveryProblems(line('Hi', {fx: 'echo'}), vox, opts).warnings).toEqual([]);
    expect(soundMethod('laugh', vox, {}, opts)).toBe('import');
    expect(soundMethod('cough', vox, {}, opts)).toBe('synth');
    expect(soundMethod('laugh', vox, {laugh: 'voice'}, opts)).toBe('import');
  });
  it('is its own voice by its recording, whatever its description and seed', () => {
    expect(voiceIdentityProblems({U: rec(), V: rec()}, VOX)).toEqual({errors: [], warnings: []});
  });
});
