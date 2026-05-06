import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as Tone from 'tone';

const STEPS = 8;

const initialGrid = {
  kick:  Array(STEPS).fill(false),
  snare: Array(STEPS).fill(false),
  hihat: Array(STEPS).fill(false),
};

const rows = [
  { label: 'Kick',   key: 'kick' },
  { label: 'Snare',  key: 'snare' },
  { label: 'Hi-Hat', key: 'hihat' },
];

function buildSynths() {
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).toDestination();

  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.03 },
  }).toDestination();
  snare.volume.value = -4;

  const hihat = new Tone.MetalSynth({
    frequency: 400,
    envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).toDestination();
  hihat.volume.value = -10;

  return { kick, snare, hihat };
}

const BeatSequencer = forwardRef(({ bpm, isPlaying }, ref) => {
  const [grid, setGrid] = useState(initialGrid);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const gridRef = useRef(grid);
  const seqRef = useRef(null);
  const synthsRef = useRef(null);

  useEffect(() => { gridRef.current = grid; }, [grid]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // Stop local playback when App.js takes control
  useEffect(() => {
    if (isPlaying && localPlaying) {
      setLocalPlaying(false);
    }
  }, [isPlaying]);

  const scheduleSequence = () => {
    const synths = buildSynths();
    synthsRef.current = synths;
    const { kick, snare, hihat } = synths;

    const seq = new Tone.Sequence((time, step) => {
      const g = gridRef.current;
      if (g.kick[step])  kick.triggerAttackRelease('C1', '8n', time);
      if (g.snare[step]) snare.triggerAttackRelease('8n', time);
      if (g.hihat[step]) hihat.triggerAttackRelease('16n', time);
      try {
        Tone.getDraw().schedule(() => setActiveStep(step), time);
      } catch (_) {
        setActiveStep(step);
      }
    }, [0, 1, 2, 3, 4, 5, 6, 7], '8n');

    seq.start(0);
    seqRef.current = seq;
  };

  const teardownSequence = () => {
    if (seqRef.current) {
      seqRef.current.stop();
      seqRef.current.dispose();
      seqRef.current = null;
    }
    if (synthsRef.current) {
      Object.values(synthsRef.current).forEach(s => s.dispose());
      synthsRef.current = null;
    }
    setActiveStep(-1);
  };

  // Ref API for App.js coordination
  useImperativeHandle(ref, () => ({
    hasActiveSteps: () => Object.values(gridRef.current).some(row => row.some(Boolean)),
    schedule: scheduleSequence,
    stop: () => {
      teardownSequence();
      setLocalPlaying(false);
    },
  }));

  // Standalone Play Beat button
  const toggleLocalPlay = async () => {
    if (localPlaying) {
      teardownSequence();
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setLocalPlaying(false);
    } else {
      await Tone.start();
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.loop = false;
      Tone.Transport.bpm.value = bpm;
      scheduleSequence();
      Tone.Transport.start();
      setLocalPlaying(true);
    }
  };

  const toggleStep = (drum, i) => {
    setGrid(prev => {
      const next = { ...prev, [drum]: [...prev[drum]] };
      next[drum][i] = !next[drum][i];
      return next;
    });
  };

  const playing = isPlaying || localPlaying;

  return (
    <div className="sequencer">
      <div className="sequencer-header">
        <h2 className="sequencer-title">Beat Sequencer</h2>
        <button
          className={`btn btn-sm ${localPlaying ? 'btn-danger' : 'btn-secondary'}`}
          onClick={toggleLocalPlay}
          disabled={isPlaying}
        >
          {localPlaying ? 'Stop Beat' : 'Play Beat'}
        </button>
      </div>

      <div className="sequencer-grid">
        {rows.map(({ label, key }) => (
          <div key={key} className="sequencer-row">
            <span className="drum-label">{label}</span>
            <div className="steps">
              {grid[key].map((on, i) => (
                <button
                  key={i}
                  className={`step ${on ? 'step-on' : ''} ${activeStep === i && playing ? 'step-active' : ''}`}
                  onClick={() => toggleStep(key, i)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default BeatSequencer;
