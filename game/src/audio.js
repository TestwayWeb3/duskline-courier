// Synthesized sound: every effect is built from oscillators and filtered
// noise through the browser's own audio facilities. No audio files.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.ambientNodes = null;
    this.boostNodes = null;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
    this.startAmbientPad();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.context.currentTime, 0.05);
    }
  }

  startAmbientPad() {
    const ctx = this.context;
    const gain = ctx.createGain();
    gain.gain.value = 0.045;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 110;
    const oscB = ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.value = 164.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    oscA.start();
    oscB.start();
    lfo.start();
    this.ambientNodes = { oscA, oscB, lfo, gain };
  }

  tone({ frequency, endFrequency, type = 'sine', duration, volume, delay = 0, attack = 0.01 }) {
    if (!this.context || this.muted) return;
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  noiseBurst({ duration, volume, filterFrequency = 900, delay = 0 }) {
    if (!this.context || this.muted) return;
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }

  playPickup() {
    this.tone({ frequency: 660, type: 'triangle', duration: 0.09, volume: 0.35 });
    this.tone({ frequency: 990, type: 'triangle', duration: 0.12, volume: 0.35, delay: 0.07 });
  }

  playDeliver(combo) {
    const base = 523.25;
    const steps = [0, 4, 7, 12];
    steps.forEach((step, i) => {
      this.tone({
        frequency: base * Math.pow(2, step / 12),
        type: 'triangle',
        duration: 0.16,
        volume: 0.32,
        delay: i * 0.06,
      });
    });
    if (combo >= 3) {
      this.tone({ frequency: base * 2, type: 'sine', duration: 0.3, volume: 0.25, delay: 0.26 });
    }
  }

  playCrash() {
    this.noiseBurst({ duration: 0.35, volume: 0.6, filterFrequency: 700 });
    this.tone({ frequency: 160, endFrequency: 45, type: 'sawtooth', duration: 0.4, volume: 0.4 });
  }

  playExpire() {
    this.tone({ frequency: 392, endFrequency: 311, type: 'triangle', duration: 0.25, volume: 0.25 });
  }

  playTick() {
    this.tone({ frequency: 1200, type: 'square', duration: 0.05, volume: 0.12 });
  }

  playClick() {
    this.tone({ frequency: 740, type: 'triangle', duration: 0.06, volume: 0.25 });
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((frequency, i) => {
      this.tone({ frequency, type: 'triangle', duration: 0.35, volume: 0.3, delay: i * 0.11 });
    });
  }

  playLose() {
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((frequency, i) => {
      this.tone({ frequency, type: 'triangle', duration: 0.4, volume: 0.3, delay: i * 0.16 });
    });
  }

  startBoostHum() {
    if (!this.context || this.muted || this.boostNodes) return;
    const ctx = this.context;
    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.1);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    this.boostNodes = { source, gain };
  }

  stopBoostHum() {
    if (!this.boostNodes || !this.context) return;
    const { source, gain } = this.boostNodes;
    gain.gain.setTargetAtTime(0, this.context.currentTime, 0.08);
    window.setTimeout(() => {
      try {
        source.stop();
      } catch (error) {
        // Already stopped.
      }
    }, 300);
    this.boostNodes = null;
  }
}
