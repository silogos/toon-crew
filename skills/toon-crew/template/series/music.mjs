// The music and sound effects of this series. Each block builds one track and
// hands it to `write(name, track)`; the name is the id scenes and series.json use.
// Run `npm run music` after changing anything here.
export default ({track, add, write, pluck, bell, pad, kick, tick, note}) => {
  /* ---------- mood: cheerful — a bouncy walk, loops every 8 beats ---------- */
  {
    const beat = 0.4;
    const tr = track(16 * beat);
    const tune = ['C5', 'E5', 'G5', 'E5', 'F5', 'A5', 'G5', 'E5', 'D5', 'F5', 'A5', 'F5', 'G5', 'E5', 'D5', 'C5'];
    const bass = ['C3', 'C3', 'F3', 'F3', 'G3', 'G3', 'C3', 'G3'];
    tune.forEach((n, i) => add(tr, i * beat, beat * 1.4, pluck(note(n), 5), {gain: 0.4, pan: 0.2, wrap: true}));
    bass.forEach((n, i) => add(tr, i * 2 * beat, beat * 1.8, pluck(note(n), 3), {gain: 0.5, pan: -0.2, wrap: true}));
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 0) add(tr, i * beat, 0.5, kick, {gain: 0.45});
      if (i % 2 === 1) add(tr, i * beat, 0.2, tick, {gain: 0.18, pan: 0.3});
    }
    write('music_cheerful', tr, 0.85);
  }

  /* ---------- mood: calm — slow bells over a soft pad ---------- */
  {
    const beat = 0.75;
    const tr = track(16 * beat);
    const chords = [['C3', 'G3', 'E4'], ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3']];
    chords.forEach((c, i) => c.forEach((n) => add(tr, i * 4 * beat, 4 * beat, pad(note(n), 4 * beat), {gain: 0.16, wrap: true})));
    const tune = ['E5', 'G5', 'C6', 'G5', 'E5', 'A5', 'C6', 'A5', 'F5', 'A5', 'C6', 'A5', 'D5', 'G5', 'B5', 'G5'];
    tune.forEach((n, i) => add(tr, i * beat, 2.2, bell(note(n), 2.2), {gain: 0.22, pan: i % 2 ? 0.3 : -0.3, wrap: true}));
    write('music_calm', tr, 0.8);
  }

  /* ---------- mood: tense — a low pulse with a restless figure ---------- */
  {
    const beat = 0.3;
    const tr = track(16 * beat);
    for (let i = 0; i < 16; i++) {
      add(tr, i * beat, beat * 1.2, pluck(note(i % 8 < 4 ? 'A2' : 'G2'), 6), {gain: 0.5, pan: -0.1, wrap: true});
      if (i % 4 === 2) add(tr, i * beat, 0.15, tick, {gain: 0.2, pan: 0.3});
    }
    ['A4', 'C5', 'B4', 'C5', 'A4', 'C5', 'Eb5', 'C5'].forEach((n, i) =>
      add(tr, i * 2 * beat, beat * 1.6, pluck(note(n), 7), {gain: 0.3, pan: 0.25, wrap: true}),
    );
    write('music_tense', tr, 0.8);
  }

  /* ---------- sound: a bright chime, for "something worked" ---------- */
  {
    const tr = track(1.4);
    ['C6', 'E6', 'G6'].forEach((n, i) => add(tr, i * 0.09, 1.2, bell(note(n), 3.5), {gain: 0.5, pan: -0.2 + i * 0.2}));
    write('sfx_chime', tr, 0.8);
  }
};
