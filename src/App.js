import React, { useState, useRef } from 'react';
import * as Tone from 'tone';
import { scheduleChords } from './Playback';
import { getTriadForChord, pitchToNoteName } from './chords';
import { generateMidiDataUri } from './midi';
import BeatSequencer from './BeatSequencer';
import './App.css';

function App() {
  const [chordProgression, setChordProgression] = useState([]);
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState('C');
  const [isPlaying, setIsPlaying] = useState(false);
  const stopChordsRef = useRef(null);
  const [noRepeatChords, setNoRepeatChords] = useState(false);
  const [startWithTonic, setStartWithTonic] = useState(false);
  const [loop, setLoop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const beatRef = useRef();

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

  const togglePlayback = async () => {
    if (!isPlaying) {
      const chordsToPlay = chordProgression.map((chord) =>
        getTriadForChord(chord).map((pitch) => pitchToNoteName(pitch))
      );

      setIsLoading(true);

      // Reset Transport so beat and chords start together at time 0
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.bpm.value = bpm;

      // Schedule beat (if steps are set)
      if (beatRef.current?.hasActiveSteps()) {
        beatRef.current.schedule();
      }

      // Schedule chords
      const { stop } = await scheduleChords(
        chordsToPlay,
        bpm,
        loop,
        () => {
          setIsPlaying(false);
          stopChordsRef.current = null;
          beatRef.current?.stop();
        }
      );

      stopChordsRef.current = stop;

      // Start Transport — beat and chords fire together
      Tone.Transport.start();

      setIsPlaying(true);
      setIsLoading(false);

    } else {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (stopChordsRef.current) {
        stopChordsRef.current();
        stopChordsRef.current = null;
      }
      beatRef.current?.stop();
      setIsPlaying(false);
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
          <button
            className={`btn btn-sm ${loop ? 'btn-loop-on' : 'btn-loop-off'}`}
            onClick={() => setLoop(l => !l)}
            disabled={isPlaying}
          >
            {loop ? '⟳ Loop On' : '⟳ Loop'}
          </button>
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
        <BeatSequencer ref={beatRef} bpm={bpm} isPlaying={isPlaying} />
      </div>
    </div>
  );
}

export default App;
