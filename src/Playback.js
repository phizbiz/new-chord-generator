// Playback.js
import * as Tone from 'tone';

// Schedules chords at absolute Transport time 0+. Caller must start Transport.
export async function scheduleChords(chordProgression, bpm, onStop) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { release: 0.2 },
  }).toDestination();

  await Tone.start();
  Tone.Transport.bpm.value = bpm;

  const beatDuration = Tone.Time('1n').toSeconds();
  let time = 0;
  let eventIds = [];

  for (const chord of chordProgression) {
    const eventId = Tone.Transport.scheduleOnce((t) => {
      try {
        synth.triggerAttackRelease(chord, '1n', t);
      } catch (error) {
        console.error("Error playing chord:", error);
      }
    }, time);
    eventIds.push(eventId);
    time += beatDuration;
  }

  const endId = Tone.Transport.scheduleOnce(() => {
    onStop();
    setTimeout(() => disposeSynth(synth), 300);
  }, time);
  eventIds.push(endId);

  return { synth, eventIds };
}

export function stopChords(synth, eventIds) {
  if (eventIds) eventIds.forEach(id => Tone.Transport.clear(id));
  if (synth) disposeSynth(synth);
}

function disposeSynth(synth) {
  synth.releaseAll();
  synth.dispose();
}
