// The Python environment the voice scripts run in, and what each voice engine needs.
// Shared by the voice launcher, the voice setup and `npm run doctor`.
import fs from 'node:fs';

export const VENV = '.venv-voices';

/** Path of the Python inside the voice environment (it may not exist yet). */
export const venvPython = () => (process.platform === 'win32' ? `${VENV}/Scripts/python.exe` : `${VENV}/bin/python`);

/** Per engine: the recording script, the Python it accepts, the packages to install, and what it needs in words. */
export const ENGINES = {
  local: {
    script: 'voices.py',
    python: (major, minor) => major === 3 && minor === 12,
    pythonLabel: '3.12',
    packages: ['mlx-audio', 'mlx-whisper', 'soundfile', 'numpy'],
    needs: 'The local engine needs an Apple Silicon Mac, Python 3.12 and ffmpeg. On any other machine, switch the series to ElevenLabs (see scripts/VOICES-SETUP.md).',
  },
  elevenlabs: {
    script: 'voices_elevenlabs.py',
    python: (major, minor) => major === 3 && minor >= 10,
    pythonLabel: '3.10 or newer',
    packages: ['faster-whisper'],
    needs: 'ElevenLabs needs Python 3.10 or newer, ffmpeg and an ElevenLabs API key in the .env file.',
  },
  edge: {
    script: 'voices_edge.py',
    python: (major, minor) => major === 3 && minor >= 10,
    pythonLabel: '3.10 or newer',
    // pinned to the version this studio was tested with: it follows an online service and breaks across upgrades
    packages: ['edge-tts==7.3.1', 'faster-whisper'],
    needs: 'edge-tts needs Python 3.10 or newer and ffmpeg.',
  },
};

/** The settings of one engine. Exits with a plain message for a name the studio does not know. */
export const engineSpec = (engine) => {
  const spec = ENGINES[engine];
  if (!spec) {
    console.error(`series/series.json: "voiceEngine" is "${engine}". Use one of: ${Object.keys(ENGINES).join(', ')}.`);
    process.exit(1);
  }
  return spec;
};

/** True when .env holds an ElevenLabs API key. Never returns or prints the key itself. */
export const hasElevenLabsKey = () => fs.existsSync('.env') && /^ELEVENLABS_API_KEY=\S+/m.test(fs.readFileSync('.env', 'utf8'));
