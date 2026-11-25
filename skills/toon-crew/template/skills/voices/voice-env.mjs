// The Python environment the voice scripts run in, and the engine of the series in it.
// Shared by the voice launcher, the voice setup and `npm run doctor`. What each engine needs is in its own
// engine.json (skills/voices/engines.mjs); nothing here names an engine.
import {findEngine, noEngineMessage, unknownEngineMessage} from './engines.mjs';

export const VENV = '.venv-voices';

/** Path of the Python inside the voice environment (it may not exist yet). */
export const venvPython = () => (process.platform === 'win32' ? `${VENV}/Scripts/python.exe` : `${VENV}/bin/python`);

/** Whether a Python version ("3.12") is one the engine accepts (engine.json "python": {"from", "to"}). */
export const acceptsPython = (engine, version) => {
  if (!version) return false;
  const n = (v) => v.split('.').slice(0, 2).map(Number).reduce((a, b) => a * 100 + b);
  const {from, to} = engine.python ?? {};
  return (!from || n(version) >= n(from)) && (!to || n(version) <= n(to)) && version.startsWith('3.');
};

/** "3.12", or "3.10 or newer": the Python the engine needs, in words. */
export const pythonLabel = (engine) => {
  const {from, to} = engine.python ?? {};
  return from && to ? (from === to ? from : `${from} to ${to}`) : from ? `${from} or newer` : '3';
};

/** The engine the series names. Exits with a plain message when none is chosen or the name is unknown. */
export const engineSpec = (name) => {
  if (!name) {
    console.error(noEngineMessage());
    process.exit(1);
  }
  const engine = findEngine(name);
  if (!engine) {
    console.error(unknownEngineMessage(name));
    process.exit(1);
  }
  return engine;
};
