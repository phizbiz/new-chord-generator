// Playback.js
import * as Tone from 'tone';

// Schedules chords at absolute Transport time 0+. Caller must start Transport.
// Returns { synth, stop } where stop() cleans everything up.
export async function scheduleChords(chordProgression, bpm, loop, onStop) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { release: 0.2 },
  }).toDestination();

  Tone.Transport.bpm.value = bpm;

  const beatDuration = Tone.Time('1n').toSeconds();
  const totalDuration = chordProgression.length * beatDuration;

  // Tone.Part loops with the Transport — unlike scheduleOnce which fires only once
  const part = new Tone.Part((time, chord) => {
    try {
      synth.triggerAttackRelease(chord, '1n', time);
    } catch (error) {
      console.error("Error playing chord:", error);
    }
  }, chordProgression.map((chord, i) => [i * beatDuration, chord]));

  if (loop) {
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = totalDuration;
  } else {
    Tone.Transport.loop = false;
  }

  part.start(0);

  let endEventId = null;
  if (!loop) {
    endEventId = Tone.Transport.scheduleOnce(() => {
      onStop();
      setTimeout(() => { part.dispose(); disposeSynth(synth); }, 300);
    }, totalDuration);
  }

  const stop = () => {
    Tone.Transport.loop = false;
    if (endEventId !== null) Tone.Transport.clear(endEventId);
    part.stop();
    part.dispose();
    disposeSynth(synth);
  };

  return { synth, stop };
}

function disposeSynth(synth) {
  synth.releaseAll();
  synth.dispose();
}
