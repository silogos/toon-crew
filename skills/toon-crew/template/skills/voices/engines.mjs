// The voice engines this studio has. Each engine is a skill folder of its own, skills/voices-<name>/, holding
// everything particular to it: engine.json (what it needs, what it can do, how it is recommended), record.py
// (its recorder, run by `npm run voices` through the shared loop in skills/voices/voicelib.py) and SKILL.md (the crew's
// guide). The studio itself names no engine: adding a folder adds an engine, removing it removes one.
// Uses nothing from node_modules, so `npm run doctor` can use it before `npm install`.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SKILLS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every engine, as its engine.json plus `dir` (its folder) and `script` (its recorder). */
export const listEngines = () => {
  if (!fs.existsSync(SKILLS)) return [];
  return fs
    .readdirSync(SKILLS)
    .filter((d) => d.startsWith('voices-') && fs.existsSync(path.join(SKILLS, d, 'engine.json')))
    .sort()
    .map((d) => {
      const dir = path.join(SKILLS, d);
      return {...JSON.parse(fs.readFileSync(path.join(dir, 'engine.json'), 'utf8')), dir, script: path.join(dir, 'record.py')};
    });
};

/** The engine a series names (its own name or an older one in "aliases"), or null. */
export const findEngine = (name) => (name ? listEngines().find((e) => e.name === name || (e.aliases ?? []).includes(name)) ?? null : null);

/** The engine's model setting in .env (only that one value is read), or its default; null for an engine with no models. */
export const engineModel = (engine, root = '.') => {
  if (!engine?.model) return null;
  const f = path.join(root, '.env');
  const re = new RegExp(`^${engine.model.env}=\\s*["']?([\\w.-]+)`, 'm');
  const m = fs.existsSync(f) ? re.exec(fs.readFileSync(f, 'utf8')) : null;
  return m ? m[1] : engine.model.default;
};

/** What the engine can do beyond plain speech, for the model in use: {label, delivery, spoken, unspoken, asks, recordings}. */
export const abilitiesOf = (engine, model = engineModel(engine)) => {
  if (!engine) return null;
  return {label: engine.label, ...(engine.abilities[model] ?? engine.abilities['*'])};
};

/** The names in engine.json "secrets" that .env does not hold yet. Never reads or returns a value. */
export const missingSecrets = (engine, root = '.') => {
  const f = path.join(root, '.env');
  const text = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  return (engine?.secrets ?? []).filter((name) => !new RegExp(`^${name}=\\S+`, 'm').test(text));
};

/** The listener skill (skills/listen-<name>/listener.json, plus `dir`), or null when the studio has none. */
export const findListener = () => {
  if (!fs.existsSync(SKILLS)) return null;
  const d = fs.readdirSync(SKILLS).sort().find((x) => x.startsWith('listen-') && fs.existsSync(path.join(SKILLS, x, 'listener.json')));
  return d ? {...JSON.parse(fs.readFileSync(path.join(SKILLS, d, 'listener.json'), 'utf8')), dir: path.join(SKILLS, d)} : null;
};

/** What the listener installs on this computer. */
export const listenerPackages = (listener = findListener()) =>
  listener ? (process.platform === 'darwin' && process.arch === 'arm64' ? listener.packages['apple-silicon'] : listener.packages.other) ?? [] : [];

/** Whether this computer can run the engine ("apple-silicon" is the only platform rule so far). */
export const runsHere = (engine) => engine?.platform !== 'apple-silicon' || (process.platform === 'darwin' && process.arch === 'arm64');

/** The engines as a choice for the Director: each name, what it is, and when it is recommended. */
export const engineChoices = () => listEngines().map((e) => `\n  "${e.name}": ${e.summary} ${e.recommend}`).join('');

/** What to say when a voice engine is needed and none has been chosen. */
export const noEngineMessage = () =>
  `No voice engine chosen yet. It is the Director's choice, written as "voiceEngine" in series/series.json:${engineChoices()}\n` +
  'Each engine has its guide in skills/voices-<name>/SKILL.md; skills/voices/VOICES-SETUP.md compares them.';

/** What to say for a name that is not an engine of this studio. */
export const unknownEngineMessage = (name) =>
  `series/series.json: "voiceEngine" is "${name}", which is not a voice engine of this studio. Use one of: ${listEngines().map((e) => e.name).join(', ')}.`;
