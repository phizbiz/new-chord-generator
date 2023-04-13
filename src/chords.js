//chords.js

export function getPitchForChord(chord) {
    const rootNotes = {
      "C": 60,
      "D": 62,
      "E": 64,
      "F": 65,
      "G": 67,
      "A": 69,
      "B": 71,
    };
  
    const chordToInterval = {
      "": 0,
      "m": 0,
      "dim": 0,
      "M": 4,
      "aug": 4,
    };
  
    const rootNote = rootNotes[chord[0]];
    const interval = chordToInterval[chord.slice(1)];
  
    return rootNote + interval;
  }
  
  export function getTriadForChord(chord) {
    const rootNote = getPitchForChord(chord);
    const majorThird = rootNote + 4;
    const minorThird = rootNote + 3;
    const perfectFifth = rootNote + 7;
  
    if (chord.endsWith("m")) {
      return [rootNote, minorThird, perfectFifth];
    } else if (chord.endsWith("dim")) {
      return [rootNote, minorThird, perfectFifth - 1];
    } else if (chord.endsWith("aug")) {
      return [rootNote, majorThird, perfectFifth + 1];
    } else {
      return [rootNote, majorThird, perfectFifth];
    }
  }
  
  export function pitchToNoteName(pitch) {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = noteNames[pitch % 12];
    return noteName + octave;
  }
  