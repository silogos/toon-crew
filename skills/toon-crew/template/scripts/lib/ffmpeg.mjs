// The ffmpeg and ffprobe that come with Remotion (@remotion/compositor-<platform>), so the studio needs no ffmpeg of
// its own. Remotion's build is small: it decodes and encodes wav, mp3, mp4, ogg, png and jpeg, and has filters such as
// atrim, adelay, amix, volume, aresample and loudnorm, but not silenceremove, aecho, lowpass or tile. Those jobs are
// done in code instead (trimming silence below, the board as a Remotion composition, the echo in the voice kit).
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MODULES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', '@remotion');
const exe = (name) => (process.platform === 'win32' ? `${name}.exe` : name);

/** The folder of Remotion's ffmpeg for this computer, or null before `npm install`. */
export const ffmpegDir = () => {
  if (!fs.existsSync(MODULES)) return null;
  const found = fs.readdirSync(MODULES).find((d) => d.startsWith('compositor-') && fs.existsSync(path.join(MODULES, d, exe('ffmpeg'))));
  return found ? path.join(MODULES, found) : null;
};

/** Environment that lets Remotion's ffmpeg find its own libraries. */
export const ffmpegEnv = (dir = ffmpegDir()) => {
  const env = {...process.env};
  if (!dir) return env;
  const key = process.platform === 'darwin' ? 'DYLD_LIBRARY_PATH' : process.platform === 'win32' ? 'PATH' : 'LD_LIBRARY_PATH';
  env[key] = [dir, env[key]].filter(Boolean).join(path.delimiter);
  return env;
};

/** Paths of ffmpeg and ffprobe (null when Remotion is not installed yet). */
export const ffmpegPaths = () => {
  const dir = ffmpegDir();
  return dir ? {ffmpeg: path.join(dir, exe('ffmpeg')), ffprobe: path.join(dir, exe('ffprobe')), dir} : null;
};

const run = (tool, args, opts = {}) => {
  const p = ffmpegPaths();
  if (!p) return {status: 1, error: new Error('Remotion is not installed yet: run npm install'), stdout: '', stderr: ''};
  return spawnSync(p[tool], args, {...opts, env: ffmpegEnv(p.dir)});
};
export const ffmpeg = (args, opts) => run('ffmpeg', args, opts);
export const ffprobe = (args, opts) => run('ffprobe', args, opts);

/** Length of a media file in seconds, to the millisecond. */
export const seconds = (file) => {
  const r = ffprobe(['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'});
  if (r.status !== 0) throw new Error(`could not read the length of ${file}`);
  return Math.round(parseFloat(r.stdout.trim()) * 1000) / 1000;
};

/** The samples of a 16-bit PCM wav file held in a Buffer (the "data" chunk, found by walking the chunks). */
export const wavSamples = (b) => {
  let at = 12;
  while (at + 8 <= b.length) {
    const id = b.toString('ascii', at, at + 4);
    let size = b.readUInt32LE(at + 4);
    if (id === 'data') {
      if (size === 0 || size === 0xffffffff || at + 8 + size > b.length) size = b.length - at - 8; // written to a pipe: no size
      return new Int16Array(b.buffer.slice(b.byteOffset + at + 8, b.byteOffset + at + 8 + size - (size % 2)));
    }
    at += 8 + size + (size % 2);
  }
  throw new Error('not a wav file');
};

/** Decode any audio file to 16-bit samples at `rate` Hz with `channels` channels (Int16Array, interleaved). */
export const decodeAudio = (file, rate = 48000, channels = 2) => {
  const r = ffmpeg(['-v', 'error', '-i', file, '-f', 'wav', '-acodec', 'pcm_s16le', '-ac', String(channels), '-ar', String(rate), '-'], {maxBuffer: 1 << 30});
  if (r.status !== 0) throw new Error(`could not read ${file}${r.stderr ? `: ${String(r.stderr).trim()}` : ''}`);
  return wavSamples(r.stdout);
};

/**
 * Where the sound starts and ends: the first and last frame louder than `thresholdDb` (default -45 dB, the level the
 * studio has always trimmed at). Returns [startFrame, endFrame) in frames of `channels` samples.
 */
export const soundBounds = (samples, channels = 2, thresholdDb = -45) => {
  const limit = 32768 * 10 ** (thresholdDb / 20);
  const frames = Math.floor(samples.length / channels);
  const loud = (f) => {
    for (let c = 0; c < channels; c++) if (Math.abs(samples[f * channels + c]) > limit) return true;
    return false;
  };
  let start = 0;
  while (start < frames && !loud(start)) start++;
  let end = frames;
  while (end > start && !loud(end - 1)) end--;
  return start < end ? [start, end] : [0, frames];
};

/**
 * Clean a voice recording the studio's way: trim silence at both ends, normalise loudness, 48 kHz stereo wav.
 * Same result as the voice kit's clean() in Python.
 */
export const cleanVoice = (src, dst) => {
  const pcm = decodeAudio(src, 48000, 2);
  const [a, b] = soundBounds(pcm, 2);
  const cut = Buffer.from(pcm.buffer, pcm.byteOffset + a * 4, (b - a) * 4); // raw 16-bit stereo, read back as s16le
  const r = ffmpeg(['-y', '-v', 'error', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', '-acodec', 'pcm_s16le', dst], {input: cut});
  if (r.status !== 0) throw new Error(`could not write ${dst}${r.stderr ? `: ${String(r.stderr).trim()}` : ''}`);
};
