//midi.js

import MidiWriter from 'midi-writer-js';
import { getTriadForChord, pitchToNoteName } from './chords';

export function generateMidiDataUri(chordProgression, bpm) {
  const track = new MidiWriter.Track();
  track.setTempo(bpm);

  chordProgression.split(" ").forEach((chord) => {
    if (chord) {
      const triad = getTriadForChord(chord);
      const notes = triad.map((pitch) => pitchToNoteName(pitch));
      const chordEvent = new MidiWriter.NoteEvent({
        pitch: notes,
        duration: "4",
      });
      track.addEvent(chordEvent);
    }
  });

  const writer = new MidiWriter.Writer([track]);
  return writer.dataUri();
}
