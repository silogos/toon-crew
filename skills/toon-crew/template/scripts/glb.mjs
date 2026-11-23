// Reads what is inside a .glb or .gltf file without drawing it: the names of its animations.
import fs from 'node:fs';

/** The JSON part of a glTF file (the model's description). Throws a readable message for anything else. */
export const readGlbJson = (file) => {
  const buf = fs.readFileSync(file);
  if (file.toLowerCase().endsWith('.gltf')) return JSON.parse(buf.toString('utf8'));
  if (buf.length < 20 || buf.toString('latin1', 0, 4) !== 'glTF') throw new Error(`${file} is not a .glb file`);
  const jsonLength = buf.readUInt32LE(12);
  if (buf.toString('latin1', 16, 20) !== 'JSON') throw new Error(`${file} has no JSON part`);
  return JSON.parse(buf.toString('utf8', 20, 20 + jsonLength));
};

/** Names of the animations in the file, in order. */
export const animationNames = (file) => (readGlbJson(file).animations ?? []).map((a) => a.name).filter(Boolean);
