// Builds a tiny .glb by hand (a body and one arm that swings; one animation called "swing").
// Used by the tests so they need no downloaded model. `node scripts/make-test-glb.mjs <path>` writes it to a file.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

export const buildTestGlb = () => {

  const faces = [
    {n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0]}, {n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0]},
    {n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0]}, {n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0]},
    {n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1]}, {n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1]},
  ];
  const pos = [], nor = [], idx = [];
  faces.forEach((f, i) => {
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      for (let k = 0; k < 3; k++) pos.push(0.5 * (f.n[k] + a * f.u[k] + b * f.v[k]));
      nor.push(...f.n);
    }
    const o = i * 4;
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  const half = (t) => [0, 0, Math.sin(t / 2), Math.cos(t / 2)];
  const times = [0, 0.5, 1];
  const rots = [...half(0), ...half(1.4), ...half(0)];

  const f32 = (a) => Buffer.from(new Float32Array(a).buffer);
  const u16 = (a) => Buffer.from(new Uint16Array(a).buffer);
  const parts = [f32(pos), f32(nor), u16(idx), f32(times), f32(rots)];
  const offsets = [];
  let total = 0;
  for (const p of parts) { offsets.push(total); total += p.length; }
  const bin = Buffer.concat(parts);

  const json = {
    asset: {version: '2.0', generator: 'toon-crew spike'},
    scene: 0,
    scenes: [{nodes: [0]}],
    nodes: [
      {name: 'Figure', children: [1, 2]},
      {name: 'Body', mesh: 0, translation: [0, 0.5, 0], scale: [0.5, 0.8, 0.3]},
      {name: 'ArmPivot', translation: [0.38, 0.8, 0], children: [3]},
      {name: 'Arm', mesh: 1, translation: [0, -0.3, 0], scale: [0.14, 0.6, 0.14]},
    ],
    meshes: [
      {primitives: [{attributes: {POSITION: 0, NORMAL: 1}, indices: 2, material: 0}]},
      {primitives: [{attributes: {POSITION: 0, NORMAL: 1}, indices: 2, material: 1}]},
    ],
    materials: [
      {name: 'shirt', pbrMetallicRoughness: {baseColorFactor: [0.95, 0.76, 0.19, 1], metallicFactor: 0, roughnessFactor: 0.8}},
      {name: 'arm', pbrMetallicRoughness: {baseColorFactor: [0.78, 0.54, 0.36, 1], metallicFactor: 0, roughnessFactor: 0.8}},
    ],
    animations: [{name: 'swing', samplers: [{input: 3, output: 4, interpolation: 'LINEAR'}], channels: [{sampler: 0, target: {node: 2, path: 'rotation'}}]}],
    accessors: [
      {bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5]},
      {bufferView: 1, componentType: 5126, count: 24, type: 'VEC3'},
      {bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR'},
      {bufferView: 3, componentType: 5126, count: 3, type: 'SCALAR', min: [0], max: [1]},
      {bufferView: 4, componentType: 5126, count: 3, type: 'VEC4'},
    ],
    bufferViews: [
      {buffer: 0, byteOffset: offsets[0], byteLength: parts[0].length, target: 34962},
      {buffer: 0, byteOffset: offsets[1], byteLength: parts[1].length, target: 34962},
      {buffer: 0, byteOffset: offsets[2], byteLength: parts[2].length, target: 34963},
      {buffer: 0, byteOffset: offsets[3], byteLength: parts[3].length},
      {buffer: 0, byteOffset: offsets[4], byteLength: parts[4].length},
    ],
    buffers: [{byteLength: bin.length}],
  };
  const pad = (b, byte) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4, byte)]);
  const jb = pad(Buffer.from(JSON.stringify(json)), 0x20);
  const bb = pad(bin, 0);
  const head = Buffer.alloc(12);
  head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jb.length + 8 + bb.length, 8);
  const ch = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.write(type, 4, 'latin1'); return h; };
  return Buffer.concat([head, ch(jb.length, 'JSON'), jb, ch(bb.length, 'BIN\0'), bb]);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = process.argv[2] ?? 'test.glb';
  fs.writeFileSync(target, buildTestGlb());
  console.log(`wrote ${target}`);
}
