# Contributing

Thanks for helping. Toon Crew has two parts, and most changes touch only one:

- `skills/toon-crew/SKILL.md`, `scripts/setup-studio.mjs` and `references/`: the front door (first meeting, setup).
- `skills/toon-crew/template/`: the studio copied into a user's series folder (engine, scripts, crew rules, recipes). It also carries the sample series, which keeps the engine testable and demonstrable; `setup-studio.mjs` empties it out of a new studio unless `--sample` is given.

## Working on the template

```bash
cd skills/toon-crew/template
npm install
npm run check   # type-check and series consistency
npm test        # engine unit tests
npm run studio  # preview in Remotion Studio (the crew uses `npm run preview`, which runs it in the background)
npm run doctor  # what this computer and folder are missing
```

Keep `npm run check` and `npm test` green. The engine tests must not depend on spoken lines of the sample series, because `npm run clear-sample` removes them.

## Rules of thumb

- Dependencies are pinned to exact versions. Bump them on purpose, in their own commit, and re-render the sample.
- Nothing under `src/` may hard-code a title, size, frame rate or language; it all comes from `series/series.json`.
- Every frame must render the same way every time. Use `seeded()`, never `Math.random()`.
- Do not commit `node_modules`, `out/`, `.venv*` or raw voice takes.
- Scripts share `scripts/lib/` (reading the series folder, the voice environment, finding Chrome). Add to it rather than reading `series.json` or listing `lines.json` files by hand in a new script.
- `scripts/doctor.mjs`, `scripts/status.mjs` and `skills/toon-crew/scripts/setup-studio.mjs` use only what comes with Node.js, because they run before `npm install`.
- **Do not run `npm run voices -- ep01` in the template to try something out:** it records over the sample's committed voices.
- Changes to the crew's behaviour belong in `template/CLAUDE.md`, `template/agents/` or `template/skills/`, written for a Director who is not a programmer.

## Testing the plugin install

From a clean folder, in Claude Code:

```
/plugin marketplace add /path/to/this/repo
/plugin install toon-crew@toon-crew
```

Then run `/toon-crew:toon-crew` in an empty folder and confirm the studio is set up and `npm run check` passes.

The setup step alone can be tried without Claude Code:

```bash
node skills/toon-crew/scripts/setup-studio.mjs /tmp/my-series --dry-run
```
