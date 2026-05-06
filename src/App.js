import React, { useState } from 'react';
import { playChords, stopChords } from './Playback';
import { getTriadForChord, pitchToNoteName } from './chords';
import { generateMidiDataUri } from './midi';
import BeatSequencer from './BeatSequencer';
import './App.css';

function App() {
  const [chordProgression, setChordProgression] = useState([]);
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState('C');
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState(null);
  const [eventIds, setEventIds] = useState(null);
  const [noRepeatChords, setNoRepeatChords] = useState(false);
  const [startWithTonic, setStartWithTonic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    let newProgression = [];
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
      newProgression.push(currentChord);
    }

    setChordProgression(newProgression);
  };

  const downloadMidi = () => {
    const midiDataUri = generateMidiDataUri(chordProgression.join(' ') + ' ', bpm);
    const link = document.createElement("a");
    link.href = midiDataUri;
    link.download = "chord-progression.mid";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      const chordsToPlay = chordProgression.map((chord) =>
        getTriadForChord(chord).map((pitch) => pitchToNoteName(pitch))
      );

      setIsLoading(true);
      playChords(chordsToPlay, bpm, () => {
        setIsPlaying(false);
        setSynth(null);
        setIsLoading(false);
      }).then(({ synth: synthInstance, eventIds: eventIdsInstance }) => {
        setIsPlaying(true);
        setSynth(synthInstance);
        setEventIds(eventIdsInstance);
        setIsLoading(false);
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

  return (
    <div className="app">
      <div className="card">
        <h1 className="title">Chord Progression Generator</h1>

        <div className="chord-display">
          {chordProgression.length === 0 ? (
            <span className="chord-placeholder">Hit generate to get started</span>
          ) : (
            chordProgression.map((chord, i) => (
              <div key={i} className="chord-pill">{chord}</div>
            ))
          )}
        </div>

        <div className="controls-row">
          <div className="control-group">
            <label>Key</label>
            <select value={key} onChange={(e) => setKey(e.target.value)}>
              {Object.keys(chords).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>BPM</label>
            <input
              type="number"
              value={bpm}
              min="40"
              max="240"
              onChange={(e) => setBpm(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="options-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={noRepeatChords}
              onChange={(e) => setNoRepeatChords(e.target.checked)}
            />
            No Repeat Chords
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={startWithTonic}
              onChange={(e) => setStartWithTonic(e.target.checked)}
            />
            Start with Tonic
          </label>
        </div>

        <button className="btn btn-primary" onClick={generateChordProgression}>
          Generate
        </button>

        <div className="action-row">
          <button
            className={`btn ${isPlaying ? 'btn-danger' : 'btn-secondary'}`}
            onClick={togglePlayback}
            disabled={chordProgression.length === 0 || isLoading}
          >
            {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={downloadMidi}
            disabled={chordProgression.length === 0}
          >
            Download MIDI
          </button>
        </div>

        <div className="divider" />
        <BeatSequencer bpm={bpm} />
      </div>
    </div>
  );
}

export default App;
