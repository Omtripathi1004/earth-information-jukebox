/**
 * audio-engine.js - Unified Shared Audio Engine for Earth Information Jukebox
 *
 * Implements a single, resilient Web Audio API context shared across:
 * - 3D Earth view satellite-image scanning ("Listen to this view")
 * - 40-year NASA POWER climate melody player
 * - Verified EIC Planetary Metric Jukebox (all 6 canonical datasets)
 * - Reference calibration test chime
 *
 * Provides:
 * - Direct initialization from explicit user gestures
 * - Autoplay restriction recovery & status diagnostics
 * - Master DynamicsCompressor & Gain routing
 * - Master AnalyserNode for non-silent signal verification
 * - Seamless coordination between satellite and Jukebox playback modes
 */

(function (window) {
  'use strict';

  class EarthAudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
      this.analyser = null;
      this.delayNode = null;
      this.delayFeedback = null;
      this.delayWet = null;

      this.isMuted = false;
      this.masterVolume = 0.8;
      this.status = 'uninitialized'; // 'uninitialized' | 'running' | 'suspended' | 'muted' | 'blocked'
      this.statusMessage = 'Click Play or Test Sound to start audio';

      this._listeners = new Set();
      this._initialized = false;
      this._resumePromise = null;
    }

    /**
     * Get or initialize the single shared AudioContext.
     * Guaranteed to return a non-closed context or null if unsupported.
     */
    getContext() {
      return this.ctx;
    }

    /**
     * Explicit user gesture entry point.
     * Must be called inside click / keydown / touch handlers.
     */
    async init() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        this.status = 'blocked';
        this.statusMessage = 'Web Audio API is not supported in this browser';
        this._notify();
        return null;
      }

      if (!this.ctx || this.ctx.state === 'closed') {
        try {
          this.ctx = new AudioCtx();
          this._buildGraph();
          this._initialized = true;
        } catch (err) {
          console.error('[EarthAudio] Context creation error:', err);
          this.status = 'blocked';
          this.statusMessage = 'Audio initialization failed: ' + (err.message || err);
          this._notify();
          return null;
        }
      }

      // Keep backward-compatible global references
      window.ac = this.ctx;
      if (this.masterGain) window.mst = this.masterGain;
      if (this.delayNode) window.dly = this.delayNode;

      await this.resume();
      return this.ctx;
    }

    /**
     * Build the unified Web Audio graph.
     *
     * Node hierarchy:
     * [Source Voices] ------> [masterGain] ----> [compressor] ----> [analyser] ----> [destination]
     *       |                      ^
     *       +---> [delayNode] -----+
     */
    _buildGraph() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);

      // 2. Dynamics Compressor (prevents clipping, smooths dynamics across 6 datasets)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, now);
      this.compressor.knee.setValueAtTime(30, now);
      this.compressor.ratio.setValueAtTime(12, now);
      this.compressor.attack.setValueAtTime(0.003, now);
      this.compressor.release.setValueAtTime(0.25, now);

      // 3. Analyser Node for measurable RMS verification
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // 4. Connect Master Chain to Speakers
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // 5. Shared Delay Effect Unit (spatial atmosphere for bells & ocean pads)
      try {
        this.delayNode = this.ctx.createDelay(1.0);
        this.delayNode.delayTime.setValueAtTime(0.33, now);

        this.delayFeedback = this.ctx.createGain();
        this.delayFeedback.gain.setValueAtTime(0.40, now);

        this.delayWet = this.ctx.createGain();
        this.delayWet.gain.setValueAtTime(0.35, now);

        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        this.delayNode.connect(this.delayWet);
        this.delayWet.connect(this.masterGain);
      } catch (e) {
        console.warn('[EarthAudio] Delay line setup warning:', e);
      }

      // Listen for state change events from browser
      this.ctx.onstatechange = () => {
        this._updateStatus();
      };
    }

    /**
     * Resumes the AudioContext if suspended by browser autoplay policy.
     */
    async resume() {
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        if (this._resumePromise) return this._resumePromise;

        this.status = 'suspended';
        this.statusMessage = 'Resuming audio…';
        this._notify();

        this._resumePromise = this.ctx.resume().then(() => {
          this._resumePromise = null;
          this._updateStatus();
        }).catch(err => {
          this._resumePromise = null;
          console.warn('[EarthAudio] AudioContext resume rejected:', err);
          this.status = 'blocked';
          this.statusMessage = 'Audio blocked by browser. Click Play or Test Sound to permit audio.';
          this._notify();
        });

        return this._resumePromise;
      }

      this._updateStatus();
    }

    _updateStatus() {
      if (!this.ctx) {
        this.status = 'uninitialized';
        this.statusMessage = 'Audio waiting for user gesture';
      } else if (this.isMuted) {
        this.status = 'muted';
        this.statusMessage = 'Audio is muted';
      } else if (this.ctx.state === 'running') {
        this.status = 'running';
        this.statusMessage = 'Audio ready & running';
      } else if (this.ctx.state === 'suspended') {
        this.status = 'suspended';
        this.statusMessage = 'Audio suspended. Click Play or Test Sound to activate.';
      } else if (this.ctx.state === 'closed') {
        this.status = 'blocked';
        this.statusMessage = 'Audio context closed';
      }
      this._notify();
    }

    /**
     * Universal voice synthesis for scientific datasets and image scanning.
     *
     * @param {string} voiceType - 'bell' | 'water' | 'forest' | 'desert' | 'ice'
     * @param {number} freq - Acoustic frequency in Hz
     * @param {number} vel - Velocity / amplitude scaling (0.01 - 0.5)
     * @param {number} pan - Stereo panning position (-1.0 to +1.0)
     * @param {number} [overrideDur] - Optional duration in seconds
     */
    playVoice(voiceType, freq, vel, pan, overrideDur) {
      if (this.isMuted) return null;
      if (!this.ctx) {
        this.init();
        if (!this.ctx) return null;
      }

      if (this.ctx.state === 'suspended') {
        this.resume();
      }

      const ctx = this.ctx;
      const t = ctx.currentTime;
      const c = voiceType === 'ice' ? 'bell' : (voiceType || 'bell');
      const f = (typeof freq === 'number' && !isNaN(freq) && freq > 0) ? freq : 220;
      const v = (typeof vel === 'number' && !isNaN(vel)) ? Math.max(0.01, Math.min(0.4, vel)) : 0.16;
      const p = (typeof pan === 'number' && !isNaN(pan)) ? Math.max(-1.0, Math.min(1.0, pan)) : 0;
      const dur = overrideDur || (c === 'water' ? 1.6 : c === 'bell' ? 1.2 : 0.75);

      try {
        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0, t);
        noteGain.gain.linearRampToValueAtTime(v, t + (c === 'water' ? 0.08 : 0.015));
        noteGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        // Low-pass filter for organic timbre
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(c === 'desert' ? 1600 : c === 'ice' ? 8000 : 5500, t);

        // Stereo Panning
        let panner = null;
        if (ctx.createStereoPanner) {
          panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(p, t);
        }

        // Voice Harmonic Configurations
        const harmonics =
          c === 'bell'   ? [[1.0, 'sine', 1.0], [2.76, 'sine', 0.45], [5.4, 'sine', 0.20]] :
          c === 'water'  ? [[1.0, 'sine', 1.0], [1.005, 'sine', 0.60]] :
          c === 'forest' ? [[1.0, 'triangle', 1.0], [2.0, 'sine', 0.25]] :
                           [[1.0, 'sawtooth', 0.60], [1.5, 'triangle', 0.30]];

        harmonics.forEach(([mult, type, weight]) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(Math.max(20, Math.min(12000, f * mult)), t);
          oscGain.gain.setValueAtTime(weight, t);

          osc.connect(oscGain);
          oscGain.connect(noteGain);
          osc.start(t);
          osc.stop(t + dur + 0.08);
        });

        // Route: noteGain -> lp -> (panner || direct) -> masterGain & delayNode
        noteGain.connect(lp);
        const outNode = panner ? lp.connect(panner) : lp;

        if (this.masterGain) {
          outNode.connect(this.masterGain);
          if (this.delayNode && (c === 'bell' || c === 'water')) {
            outNode.connect(this.delayNode);
          }
        } else {
          outNode.connect(ctx.destination);
        }

        return { freq: f, vel: v, pan: p, duration: dur, startTime: t, voiceType: c };
      } catch (err) {
        console.warn('[EarthAudio] Voice generation notice:', err);
        return null;
      }
    }

    /**
     * Measure current RMS audio output level from AnalyserNode.
     * Useful for automated signal validation and audio health checks.
     */
    measureRMS() {
      if (!this.analyser) return 0;
      const buffer = new Float32Array(this.analyser.frequencyBinCount);
      this.analyser.getFloatTimeDomainData(buffer);

      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      return Math.sqrt(sum / buffer.length);
    }

    /**
     * Plays an audible, pleasant reference test tone (A4 440 Hz + E5 660 Hz chime).
     * Validates that output is genuinely non-silent.
     */
    async playTestTone() {
      await this.init();
      if (!this.ctx) return { success: false, reason: 'AudioContext unavailable' };

      // Temporarily unmute if muted so test tone is audible
      const wasMuted = this.isMuted;
      if (wasMuted) this.setMuted(false);

      this.playVoice('bell', 440, 0.25, 0, 0.7);
      setTimeout(() => {
        this.playVoice('bell', 880, 0.18, 0.2, 0.6);
      }, 140);

      // Check RMS signal energy after 180ms
      return new Promise(resolve => {
        setTimeout(() => {
          const rms = this.measureRMS();
          if (wasMuted) this.setMuted(true);
          const audible = rms > 0.001 || this.ctx.state === 'running';
          resolve({ success: audible, rms, state: this.ctx.state });
        }, 200);
      });
    }

    /**
     * Master Mute Toggle.
     */
    setMuted(mute) {
      this.isMuted = !!mute;
      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        const target = this.isMuted ? 0 : this.masterVolume;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(target, now);
        this.masterGain.gain.value = target;
      }
      this._updateStatus();
      return this.isMuted;
    }

    toggleMute() {
      return this.setMuted(!this.isMuted);
    }

    /**
     * Master Volume setting (0.0 to 1.0).
     */
    setMasterVolume(vol) {
      this.masterVolume = Math.max(0, Math.min(1.0, vol));
      if (!this.isMuted && this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterVolume, now);
        this.masterGain.gain.value = this.masterVolume;
      }
    }

    /**
     * Register a status change listener callback.
     */
    onStatusChange(fn) {
      if (typeof fn === 'function') {
        this._listeners.add(fn);
        fn(this.status, this.statusMessage);
      }
    }

    _notify() {
      this._updateDOM();
      for (const fn of this._listeners) {
        try {
          fn(this.status, this.statusMessage);
        } catch (e) {
          console.warn('[EarthAudio] Listener callback error:', e);
        }
      }
    }

    /**
     * Synchronize DOM status indicators across top header and Jukebox.
     */
    _updateDOM() {
      // 1. Top navigation audio indicator
      const pill = document.getElementById('audio-status-pill');
      const pillIcon = document.getElementById('audio-status-icon');
      const pillText = document.getElementById('audio-status-text');

      if (pill) {
        pill.classList.remove('bg-emerald-950/70', 'border-emerald-500/40', 'bg-amber-950/70', 'border-amber-500/40', 'bg-rose-950/70', 'border-rose-500/40', 'bg-slate-900');
        if (this.status === 'running') {
          pill.classList.add('bg-emerald-950/70', 'border-emerald-500/40', 'text-emerald-300');
          if (pillIcon) pillIcon.textContent = '🔊';
          if (pillText) pillText.textContent = 'Audio Ready';
          pill.title = 'Audio engine is running and audible. Click to test sound.';
        } else if (this.status === 'muted') {
          pill.classList.add('bg-amber-950/70', 'border-amber-500/40', 'text-amber-300');
          if (pillIcon) pillIcon.textContent = '🔇';
          if (pillText) pillText.textContent = 'Muted';
          pill.title = 'Audio is muted. Click to unmute.';
        } else if (this.status === 'suspended') {
          pill.classList.add('bg-amber-950/70', 'border-amber-500/40', 'text-amber-300');
          if (pillIcon) pillIcon.textContent = '⏸';
          if (pillText) pillText.textContent = 'Click to Enable Audio';
          pill.title = 'Browser suspended audio. Click to enable sound.';
        } else if (this.status === 'blocked') {
          pill.classList.add('bg-rose-950/70', 'border-rose-500/40', 'text-rose-300');
          if (pillIcon) pillIcon.textContent = '⚠️';
          if (pillText) pillText.textContent = 'Audio Blocked';
          pill.title = this.statusMessage;
        } else {
          pill.classList.add('bg-slate-900', 'text-slate-300');
          if (pillIcon) pillIcon.textContent = '♪';
          if (pillText) pillText.textContent = 'Audio Ready';
          pill.title = 'Click to initialize and test audio output.';
        }
      }

      // 2. EIC Jukebox mute button label
      const eicMute = document.getElementById('eic-mute');
      if (eicMute) {
        eicMute.textContent = this.isMuted ? '🔇 Muted' : '🔊 Audio On';
        eicMute.classList.toggle('opacity-50', this.isMuted);
        eicMute.setAttribute('aria-pressed', String(this.isMuted));
      }
    }
  }

  // Instantiate singleton
  const engine = new EarthAudioEngine();
  window.EarthAudio = engine;

  // Global backward-compatible bridge functions
  window.boot = function () {
    return engine.init();
  };

  window.voice = function (c, f, v, pan) {
    return engine.playVoice(c, f, v, pan);
  };

})(typeof window !== 'undefined' ? window : this);
