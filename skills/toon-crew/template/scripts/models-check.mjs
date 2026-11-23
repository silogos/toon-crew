// Checks series/models.json against the files in public/: errors for mistakes in the series' own settings,
// warnings for files that are not there yet (they are downloaded by the Director, not shipped).
import fs from 'node:fs';
import path from 'node:path';
import {animationNames} from './glb.mjs';

/** @param {{models: Record<string, any>, root?: string}} opts */
export const checkModels = ({models, root = '.'}) => {
  const errors = [];
  const warnings = [];
  const pub = (f) => path.join(root, 'public', f);
  const licenseFile = pub('models/LICENSES.md');
  const licenses = fs.existsSync(licenseFile) ? fs.readFileSync(licenseFile, 'utf8').toLowerCase() : '';

  for (const [code, spec] of Object.entries(models ?? {})) {
    const where = `models.json: model ${code}`;
    if (!spec || typeof spec.file !== 'string' || !spec.file) {
      errors.push(`${where} has no "file"`);
      continue;
    }
    if (!(spec.height > 0)) errors.push(`${where} needs a "height" in metres, above zero`);
    if (!spec.clips || typeof spec.clips.idle !== 'string') {
      errors.push(`${where} needs "clips": {"idle": "<animation name>"}`);
      continue;
    }

    const files = [spec.file, ...(spec.animationFiles ?? [])];
    const missing = files.filter((f) => !fs.existsSync(pub(f)));
    for (const f of missing) warnings.push(`${where}: public/${f} is not there yet (download it; see public/models/LICENSES.md)`);

    if (!missing.length) {
      const names = new Set();
      let readable = true;
      for (const f of files) {
        try {
          animationNames(pub(f)).forEach((n) => names.add(n));
        } catch (e) {
          errors.push(`${where}: ${e.message}`);
          readable = false;
        }
      }
      if (readable) {
        const wanted = [spec.clips.idle, spec.clips.walk, spec.clips.talk, ...Object.values(spec.clips.pose ?? {})].filter(Boolean);
        for (const n of new Set(wanted)) {
          if (!names.has(n)) errors.push(`${where}: no animation called "${n}". The files have: ${[...names].join(', ') || 'none'}`);
        }
      }
    }

    if (!licenses.includes(path.basename(spec.file).toLowerCase())) {
      warnings.push(`${where}: public/models/LICENSES.md does not say where ${path.basename(spec.file)} comes from and under which licence`);
    }
  }
  return {errors, warnings};
};
