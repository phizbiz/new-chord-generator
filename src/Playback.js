// Playback.js
import * as Tone from 'tone';

export async function playChords(chordProgression, onStop) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { release: 0.2 },
  }).toDestination();

  await Tone.start();

  const totalTime = chordProgression.filter(chord => chord.length > 0).length * Tone.Time('1n').toSeconds();
  let time = Tone.now();
  let eventIds = [];

  for (const chord of chordProgression) {
    if (chord.length > 0) {
      const eventId = Tone.Transport.scheduleOnce(() => {
        try {
          synth.triggerAttackRelease(chord, '1n');
        } catch (error) {
          console.error("Error playing chord:", error);
        }
      }, time);
      eventIds.push(eventId);
    }
    time += Tone.Time('1n').toSeconds();
  }

  Tone.Transport.scheduleOnce(() => {
    onStop();
    setTimeout(() => disposeSynth(synth), 300); // Add a short delay before disposing of the synth
  }, time);

  Tone.Transport.start();

  return { synth, eventIds };
}

export function stopChords(synth, eventIds) {
  Tone.Transport.pause();
  Tone.Transport.seconds = 0;
}

function disposeSynth(synth) {
  synth.releaseAll();
  synth.dispose();
}
