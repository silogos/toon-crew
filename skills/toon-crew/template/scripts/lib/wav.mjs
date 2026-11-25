// Writing a stereo track as a wav file: shared by every tool that makes audio in code (music, vocal sounds).

/** Encode a track ({L, R} Float32Arrays at `rate` Hz) as a 16-bit stereo WAV, normalised to `peak`. */
export const toWav = (tr, peak = 0.9, rate = 44100) => {
  const n = tr.L.length;
  let max = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(tr.L[i]), Math.abs(tr.R[i]));
  const k = max > 0 ? peak / max : 1;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  const s16 = (v) => Math.round(Math.max(-1, Math.min(1, v * k)) * 32767);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(s16(tr.L[i]), 44 + i * 4);
    buf.writeInt16LE(s16(tr.R[i]), 46 + i * 4);
  }
  return buf;
};
