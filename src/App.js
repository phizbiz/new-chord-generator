import React, { useState } from 'react';
import { playChords, stopChords } from './Playback';
import { getPitchForChord, getTriadForChord, pitchToNoteName } from './chords';
import { generateMidiDataUri } from './midi';
import './App.css';

function App() {
  const [chordProgression, setChordProgression] = useState('');
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState('C');
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState(null);
  const [eventIds, setEventIds] = useState(null);
  const [noRepeatChords, setNoRepeatChords] = useState(false);
  const [startWithTonic, setStartWithTonic] = useState(false);

  const chords = {
    C: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    D: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
    E: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
    F: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
    G: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
    A: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
    B: ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
  };

  const progressionLength = 4;

  const generateChordProgression = () => {
    let newProgression = '';
    let previousChords = new Set();
  
    for (let i = 0; i < progressionLength; i++) {
      let randomIndex;
      let currentChord;
  
      if (i === 0 && startWithTonic) {
        randomIndex = 0;
        currentChord = chords[key][randomIndex];
      } else {
        do {
          randomIndex = Math.floor(Math.random() * chords[key].length);
          currentChord = chords[key][randomIndex];
        } while (noRepeatChords && previousChords.has(currentChord) && previousChords.size < chords[key].length);
      }
  
      previousChords.add(currentChord);
      newProgression += currentChord + ' ';
    }
  
    setChordProgression(newProgression);
  };
  
  
  

  const downloadMidi = () => {
    const midiDataUri = generateMidiDataUri(chordProgression, bpm);
    const link = document.createElement("a");
    link.href = midiDataUri;
    link.download = "chord-progression.mid";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      const chordsToPlay = chordProgression.split(' ').map((chord) => {
        return getTriadForChord(chord).map((pitch) => pitchToNoteName(pitch));
      });

      setIsPlaying(true);
      playChords(chordsToPlay, () => {
        setIsPlaying(false);
        setSynth(null);
      }).then(({ synth: synthInstance, eventIds: eventIdsInstance }) => {
        setSynth(synthInstance);
        setEventIds(eventIdsInstance);
      });

    } else {
      setIsPlaying(false);
      if (synth) {
        stopChords(synth, eventIds);
        setSynth(null);
        setEventIds(null);
      }
    }
  };

  // App.js

// ...

return (
  <div className="App">
    <h1>Chord Progression Generator</h1>
    <h1><pre>{chordProgression}</pre></h1>
    <div className="key-bpm">
      <div>
        <label>Key:</label>
        <select value={key} onChange={(e) => setKey(e.target.value)}>
          {Object.keys(chords).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>BPM:</label>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
        />
      </div>
    </div>
    {/* <h2>Chord Progression</h2> */}
    <div className="options">
      <div>
        <label>
          <input
            type="checkbox"
            checked={noRepeatChords}
            onChange={(e) => setNoRepeatChords(e.target.checked)}
          />
          No Repeat Chords
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={startWithTonic}
            onChange={(e) => setStartWithTonic(e.target.checked)}
          />
          Start with Tonic
        </label>
      </div>
    </div>
    <button onClick={generateChordProgression}>Generate Chord Progression</button>
    <div className="play-download">
      <button onClick={togglePlayback}>{isPlaying ? 'Stop' : 'Play'}</button>
      <button onClick={downloadMidi}>Download MIDI</button>
    </div>
    
  </div>
);

// ...

}

export default App;
