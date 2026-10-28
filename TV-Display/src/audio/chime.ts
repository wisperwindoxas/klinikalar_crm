/**
 * Crystal-clear medical acoustic chime (4-tone resonant harmonic bells)
 * Notes: G4 (392.00Hz) -> C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
 * Produces a warm, echoing, luxurious announcement chime.
 */
export const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Resonant chime note frequencies and timings
    const notes = [
      { freq: 392.00, time: 0.00, duration: 0.9, gain: 0.35 }, // G4
      { freq: 523.25, time: 0.20, duration: 1.0, gain: 0.40 }, // C5
      { freq: 659.25, time: 0.40, duration: 1.1, gain: 0.42 }, // E5
      { freq: 783.99, time: 0.65, duration: 1.6, gain: 0.48 }  // G5 (resonant finale)
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const startTime = now + time;

      // 1. Fundamental tone (pure sine)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Acoustic envelope (soft attack, slow ringing exponential decay)
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);

      // 2. Overtone harmonic (bell crystal sparkle at 2x frequency)
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();

      overtoneOsc.type = 'triangle';
      overtoneOsc.frequency.setValueAtTime(freq * 2, startTime);

      overtoneGain.gain.setValueAtTime(0.0001, startTime);
      overtoneGain.gain.linearRampToValueAtTime(gain * 0.18, startTime + 0.015);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.5));

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);

      overtoneOsc.start(startTime);
      overtoneOsc.stop(startTime + (duration * 0.5));
    });
  } catch (e) {
    console.warn('Audio chime playback issue:', e);
  }
};
