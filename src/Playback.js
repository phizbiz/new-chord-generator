// Playback.js
import * as Tone from 'tone';

export async function playChords(chordProgression, onStop) {
  Tone.Transport.stop();
  Tone.Transport.cancel();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { release: 0.2 },
  }).toDestination();

  await Tone.start();

  let time = 0;
  const beatDuration = Tone.Time('1n').toSeconds();
  let eventIds = [];

  for (const chord of chordProgression) {
    const eventId = Tone.Transport.scheduleOnce(() => {
      try {
        synth.triggerAttackRelease(chord, '1n');
      } catch (error) {
        console.error("Error playing chord:", error);
      }
    }, time);
    eventIds.push(eventId);
    time += beatDuration;
  }

  Tone.Transport.scheduleOnce(() => {
    onStop();
    setTimeout(() => disposeSynth(synth), 300);
  }, time);

  Tone.Transport.start();

  return { synth, eventIds };
}

export function stopChords(synth, eventIds) {
  Tone.Transport.stop();
  Tone.Transport.cancel();
}

function disposeSynth(synth) {
  synth.releaseAll();
  synth.dispose();
}
