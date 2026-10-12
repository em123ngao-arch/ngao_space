/**
 * NGAAN OS — OCEAN AMBIENT SOUNDSCAPE & RELAXATION ENGINE
 * Powered by Web Audio API (Native, Zero External Dependencies)
 * Features:
 *  - Procedural Ocean Waves (Band-pass filtered pink noise modulated by 9s LFO)
 *  - Alpha 432Hz Solfeggio Relaxation Harmonics for focus and deep peace
 *  - Crystal Water Droplet / Bell Chime feedback for tasks
 */

(function () {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  // Ocean Waves Nodes
  let waveGain = null;
  let waveFilter = null;
  let lfoGain = null;
  let lfoOsc = null;
  let noiseNode = null;

  // Alpha 432Hz Harmonics Nodes
  let alphaOsc1 = null;
  let alphaOsc2 = null;
  let alphaGain = null;

  let masterGain = null;
  let isPlaying = false;
  let currentVolume = 0.5;

  function ensureAudioContext() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Generate 5 seconds of seamless pink noise buffer
  function createPinkNoiseBuffer() {
    const bufferSize = audioCtx.sampleRate * 5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  function startOceanSound() {
    ensureAudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // ==========================================
    // 1. Procedural Swelling Waves
    // ==========================================
    const noiseBuffer = createPinkNoiseBuffer();
    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Resonant lowpass filter to mimic heavy water rolling
    waveFilter = audioCtx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(320, audioCtx.currentTime);
    waveFilter.Q.setValueAtTime(3.0, audioCtx.currentTime);

    // Wave swell amplitude gain
    waveGain = audioCtx.createGain();
    waveGain.gain.setValueAtTime(0.001, audioCtx.currentTime);

    // LFO (Low Frequency Oscillator) to rhythmically swell the wave volume and filter
    lfoOsc = audioCtx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(0.11, audioCtx.currentTime); // ~9 second wave cycle

    lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

    lfoOsc.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    // Also modulate filter frequency for crest & foam effect
    const lfoFilterGain = audioCtx.createGain();
    lfoFilterGain.gain.setValueAtTime(260, audioCtx.currentTime);
    lfoOsc.connect(lfoFilterGain);
    lfoFilterGain.connect(waveFilter.frequency);

    noiseNode.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(masterGain);

    noiseNode.start();
    lfoOsc.start();

    // ==========================================
    // 2. Alpha 432Hz Calm Harmonic Pad
    // ==========================================
    alphaOsc1 = audioCtx.createOscillator();
    alphaOsc1.type = 'sine';
    alphaOsc1.frequency.setValueAtTime(216, audioCtx.currentTime); // 432Hz sub-octave

    alphaOsc2 = audioCtx.createOscillator();
    alphaOsc2.type = 'sine';
    alphaOsc2.frequency.setValueAtTime(432, audioCtx.currentTime); // Sacred 432Hz healing tone

    alphaGain = audioCtx.createGain();
    alphaGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    alphaGain.gain.linearRampToValueAtTime(0.022, audioCtx.currentTime + 3.0); // Gentle fade-in

    alphaOsc1.connect(alphaGain);
    alphaOsc2.connect(alphaGain);
    alphaGain.connect(masterGain);

    alphaOsc1.start();
    alphaOsc2.start();

    isPlaying = true;
    updateUIState();
  }

  function stopOceanSound() {
    if (!isPlaying) return;

    if (masterGain && audioCtx) {
      masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      setTimeout(() => {
        try {
          if (noiseNode) noiseNode.stop();
          if (lfoOsc) lfoOsc.stop();
          if (alphaOsc1) alphaOsc1.stop();
          if (alphaOsc2) alphaOsc2.stop();
        } catch (e) {}
        isPlaying = false;
        updateUIState();
      }, 1250);
    } else {
      isPlaying = false;
      updateUIState();
    }
  }

  function toggleOceanSound() {
    if (isPlaying) {
      stopOceanSound();
    } else {
      startOceanSound();
    }
  }

  function setVolume(val) {
    currentVolume = Math.max(0, Math.min(1, val));
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    }
  }

  function updateUIState() {
    const btn = document.getElementById('btn-ocean-sound');
    if (!btn) return;

    if (isPlaying) {
      btn.classList.add('playing');
      btn.innerHTML = `<span class="sound-wave-icon">🌊</span> <span>Biển Sâu 432Hz: Đang bật</span>`;
    } else {
      btn.classList.remove('playing');
      btn.innerHTML = `<span class="sound-wave-icon">🌊</span> <span>Âm thanh Biển Sâu</span>`;
    }
  }

  // Play Crystal Water Drop Chime
  window.playCrystalDrop = function (freq = 784, duration = 0.4) {
    try {
      ensureAudioContext();
      const osc = audioCtx.createOscillator();
      const dropGain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, audioCtx.currentTime + duration * 0.3);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, audioCtx.currentTime + duration);

      dropGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(dropGain);
      dropGain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  // Expose global interface
  window.OceanAudio = {
    toggle: toggleOceanSound,
    setVolume: setVolume,
    playDrop: window.playCrystalDrop,
    isPlaying: () => isPlaying
  };

  // Auto attach on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-ocean-sound');
    if (btn) {
      btn.addEventListener('click', toggleOceanSound);
    }
  });
})();
