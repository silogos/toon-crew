// What a line in lines.json may say, so that a voice engine can say it well, and how the engine's abilities
// (its engine.json, see skills/voices/engines.mjs) apply to it. Nothing here names an engine.
// The voice scripts (Python) follow the same rules: see skills/voices/voicelib.py.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Every vocal sound a line can be ("sound": "cough"), and whether a voice is heard in it ("spoken") or not ("unspoken"). */
export const VOCAL_SOUNDS = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'vocal-sounds.json'), 'utf8'));

/** How a vocal sound is made: by the character's voice, by the studio's synthesiser, or brought in as a recording. */
export const SOUND_METHODS = ['voice', 'synth', 'import'];

/** A voice taken from a real person's recording ("source": "recording"): copied as it is, never designed, remade or instructed. */
export const fromRecording = (voice) => voice?.source === 'recording';

/**
 * How a vocal sound is made with these abilities (abilitiesOf(engine)): the series' own choice (series.json
 * "vocalSounds") first, else the engine's. A recorded voice cannot be asked for a sound (it takes no instruction),
 * so "voice" falls back to synth or import for it.
 */
export const soundMethod = (sound, abilities, chosen = {}, {recordedVoice = false} = {}) => {
  const s = VOCAL_SOUNDS[sound];
  const e = abilities;
  if (!s || !e) return null;
  const how = chosen[sound] ?? e[s.kind];
  return how === 'voice' && recordedVoice ? (s.kind === 'unspoken' ? 'synth' : 'import') : how;
};

/** Problems with series.json "vocalSounds" for this engine: a choice the engine or the studio cannot carry out. */
export const soundChoiceProblems = (chosen, abilities) => {
  const found = [];
  if (chosen === undefined) return found;
  if (typeof chosen !== 'object' || chosen === null || Array.isArray(chosen)) return ['series.json: "vocalSounds" must be an object such as {"laugh": "import"}'];
  const e = abilities;
  for (const [sound, how] of Object.entries(chosen)) {
    const where = `series.json: vocalSounds.${sound}`;
    if (!VOCAL_SOUNDS[sound]) found.push(`${where}: not a vocal sound the studio knows (${Object.keys(VOCAL_SOUNDS).join(', ')})`);
    else if (!SOUND_METHODS.includes(how)) found.push(`${where}: "${how}"; use ${SOUND_METHODS.join(', ')}`);
    else if (how === 'synth' && VOCAL_SOUNDS[sound].kind !== 'unspoken') found.push(`${where}: the studio can only synthesise sounds without a voice in them (${unspokenSounds().join(', ')})`);
    else if (how === 'voice' && e && !e.asks) found.push(`${where}: ${e.label} cannot be asked for a sound; use synth or import`);
  }
  return found;
};

export const unspokenSounds = () => Object.keys(VOCAL_SOUNDS).filter((k) => VOCAL_SOUNDS[k].kind === 'unspoken');

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The text with the series' pronunciation dictionary applied (series/pronunciation.json: {"Siobhan": "Shiv-awn"}).
 * Whole words only, case as written, longest first, in one pass (a replacement is never replaced again).
 */
export const applyPronunciation = (text, dict = {}) => {
  const keys = Object.keys(dict).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!keys.length) return text;
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${keys.map(escape).join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
  return text.replace(re, (m) => dict[m]);
};

/** What the voice is given to say: "say" when the line has one, else the text through the pronunciation dictionary. */
export const spokenText = (line, dict = {}) => line.say ?? applyPronunciation(line.text ?? '', dict);

/** Problems with series/pronunciation.json itself. */
export const pronunciationProblems = (dict) => {
  if (typeof dict !== 'object' || dict === null || Array.isArray(dict)) return ['series/pronunciation.json must be an object such as {"Siobhan": "Shiv-awn"}'];
  return Object.entries(dict)
    .filter(([k, v]) => !k.trim() || typeof v !== 'string' || !v.trim())
    .map(([k]) => `series/pronunciation.json: "${k}" needs a word and how it is said, both non-empty`);
};

/**
 * Things in the text of a spoken line that a voice engine reads badly or not at all.
 * Returns one short message per problem; empty when the line reads well aloud.
 * The text is checked as it will be spoken: "say" is trusted, and the pronunciation dictionary is applied first.
 */
export const readAloudProblems = (line, dict = {}) => {
  if (line.sound || line.say) return [];
  const text = applyPronunciation(line.text ?? '', dict);
  const found = [];
  if (/\p{Nd}/u.test(text)) found.push('has digits: write the number as it is said, or give "say"');
  if (/[*[\](){}<>]/.test(text)) found.push('has brackets or asterisks: a stage direction such as (coughs) is read aloud; make it a line of its own with "sound", or leave it to the picture');
  if (/[%&@#/\\+=~^|_$€£¥]/.test(text)) found.push('has a symbol: write it as a word, or give "say"');
  if (/\p{Extended_Pictographic}/u.test(text)) found.push('has an emoji: the voice cannot say it');
  if (/(^|[^\p{L}])\p{Lu}{2,}(?=[^\p{L}]|$)/u.test(text)) found.push('has a word in capitals (an abbreviation?): give "say", or add it to series/pronunciation.json');
  if (/https?:|www\./i.test(text)) found.push('has a web address: the voice reads it letter by letter');
  return found;
};

/** The "fx" values that change how a line is spoken (by an instruction or a tag); "echo" is added after recording. */
const SPOKEN_FX = ['shout', 'laugh', 'cheer', 'whisper'];

/**
 * Problems with a line's "delivery" (free words for how it is said, in English: "scared, urgent"), and with an "fx"
 * that cannot be carried out. A recorded voice is copied as it is, so neither changes how it speaks.
 */
export const deliveryProblems = (line, abilities, {recordedVoice = false} = {}) => {
  const warnings = [];
  const copied = `voice ${line.voice} is copied from a recording as it is`;
  if (recordedVoice && !line.sound && SPOKEN_FX.includes(line.fx))
    warnings.push(`${copied}: "fx": "${line.fx}" does not change how it is said` + (line.fx === 'shout' ? ' (the balloon still turns red)' : ''));
  if (line.delivery === undefined) return {errors: [], warnings};
  if (typeof line.delivery !== 'string' || !line.delivery.trim()) return {errors: ['"delivery" must be a few words such as "scared, urgent"'], warnings};
  if (line.delivery.length > 60) warnings.push('"delivery" is long; a few words work best ("scared, urgent")');
  if (/[[\]()]/.test(line.delivery)) warnings.push('"delivery" takes plain words; the studio adds the brackets an engine needs');
  if (line.sound) warnings.push('a vocal sound takes no "delivery"; it is ignored');
  else if (recordedVoice) warnings.push(`${copied}; "delivery" is ignored`);
  else if (abilities?.delivery === 'none') warnings.push(`${abilities.label} cannot change how a line is said; "delivery" is ignored`);
  return {errors: [], warnings};
};

/**
 * Problems with voices taken from a real recording ("source": "recording", optional "prompt": {file, text}).
 * The recording IS the voice: series/voice-refs/<code>.wav. The prompt is a short clip in voice-refs/ and exactly
 * what is said in it; with it the engine carries on from the speaker's own words (VoxCPM2's high-fidelity cloning),
 * which keeps their accent and way of speaking. `exists` tells whether a file is there (relative to the series folder).
 */
export const recordedVoiceProblems = (voices, abilities, {exists = (f) => fs.existsSync(f)} = {}) => {
  const errors = [];
  for (const [code, v] of Object.entries(voices)) {
    const where = `voices.json: voice ${code}`;
    if (v.source === undefined) {
      if (v.prompt !== undefined) errors.push(`${where} has a "prompt" but is not "source": "recording"; only a recorded voice takes one`);
      continue;
    }
    if (v.source !== 'recording') {
      errors.push(`${where} has "source" ${JSON.stringify(v.source)}; the only source is "recording" (a real person's voice the Director brought)`);
      continue;
    }
    if (abilities && !abilities.recordings) errors.push(`${where} is a recording, and ${abilities.label} cannot speak in a recorded voice; choose an engine that can (its engine.json says "recordings": true)`);
    if (!exists(`series/voice-refs/${code}.wav`)) errors.push(`${where} is a recording, but series/voice-refs/${code}.wav is missing; a recorded voice is never generated, so put the recording there`);
    if (v.prompt === undefined) continue;
    const p = v.prompt;
    if (typeof p !== 'object' || p === null || typeof p.file !== 'string' || !p.file.trim() || typeof p.text !== 'string' || !p.text.trim())
      errors.push(`${where}: "prompt" must be {"file": "<a clip in series/voice-refs/>", "text": "exactly what is said in it"}`);
    else if (p.file.includes('/') || p.file.includes('\\')) errors.push(`${where}: the prompt "file" is a file name in series/voice-refs/, not a path`);
    else if (!exists(`series/voice-refs/${p.file}`)) errors.push(`${where}: the prompt clip series/voice-refs/${p.file} is missing`);
  }
  return errors;
};

/**
 * The minimum every engine must meet: each character's voice stays the same (it is fixed once) and is its own
 * (no two characters share one). Returns {errors, warnings}.
 * "The same" is already ensured by the recorders (one reference clip, voice id or catalogue voice per character,
 * never remade without the Director); this checks "its own", the way the engine makes voices (engine.json "voices"):
 * "catalogue" (each voice names one, in voices.json under "field"), or "designed" (from description and seed; with
 * "ids", the engine's own voice ids, passed here as `ids`). Without an engine, designed voices are assumed.
 */
export const voiceIdentityProblems = (voices, engine, {ids = {}} = {}) => {
  const errors = [];
  const warnings = [];
  const made = engine?.voices ?? {made: 'designed'};
  const catalogue = made.made === 'catalogue';
  // a recorded voice is its own by its recording; its description and seed make nothing
  const codes = Object.keys(voices).filter((c) => catalogue || !fromRecording(voices[c]));
  /** Groups of voice codes that share a value (codes with no value are left out). */
  const groups = (pick) => {
    const by = new Map();
    for (const c of codes) {
      const k = pick(c);
      if (k === undefined || k === null || k === '') continue;
      by.set(k, [...(by.get(k) ?? []), c]);
    }
    return [...by.values()].filter((g) => g.length > 1);
  };
  const own = 'every character needs a voice of its own';
  if (catalogue) {
    const pick = (c) => voices[c][made.field]?.voice;
    const list = made.list ? ` (${made.list} shows them)` : '';
    for (const c of codes) if (!pick(c)) errors.push(`voices.json: voice ${c} has no ${engine.label} voice; add "${made.field}": {"voice": "<name>"}${list}`);
    for (const g of groups(pick)) errors.push(`voices.json: ${g.join(' and ')} use the same ${engine.label} voice; ${own}`);
  } else {
    for (const g of groups((c) => String(voices[c].description ?? '').trim().toLowerCase())) {
      const seeds = new Set(g.map((c) => String(voices[c].seed)));
      if (seeds.size < g.length) errors.push(`voices.json: ${g.join(' and ')} have the same description and seed, so they would get the same voice; ${own}`);
      else warnings.push(`voices.json: ${g.join(' and ')} have the same description and differ only by seed: listen that they do not sound alike`);
    }
    if (made.ids) for (const g of groups((c) => ids[c]?.[made.ids.field])) errors.push(`${made.ids.file}: ${g.join(' and ')} share one ${engine.label} voice; ${own}`);
  }
  return {errors, warnings};
};
