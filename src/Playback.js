// Playback.js
import * as Tone from 'tone';

export async function playChords(chordProgression, bpm, onStop) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { release: 0.2 },
  }).toDestination();

  await Tone.start();
  Tone.Transport.bpm.value = bpm;

  const beatDuration = Tone.Time('1n').toSeconds();
  let eventIds = [];

  for (let i = 0; i < chordProgression.length; i++) {
    const chord = chordProgression[i];
    const eventId = Tone.Transport.scheduleOnce((time) => {
      try {
        synth.triggerAttackRelease(chord, '1n', time);
      } catch (error) {
        console.error("Error playing chord:", error);
      }
    }, `+${i * beatDuration + 0.05}`);
    eventIds.push(eventId);
  }

  const endId = Tone.Transport.scheduleOnce(() => {
    onStop();
    setTimeout(() => disposeSynth(synth), 300);
  }, `+${chordProgression.length * beatDuration + 0.05}`);
  eventIds.push(endId);

  if (Tone.Transport.state !== 'started') {
    Tone.Transport.start();
  }

  return { synth, eventIds };
}

export function stopChords(synth, eventIds) {
  eventIds.forEach(id => Tone.Transport.clear(id));
  disposeSynth(synth);
}

function disposeSynth(synth) {
  synth.releaseAll();
  synth.dispose();
}
