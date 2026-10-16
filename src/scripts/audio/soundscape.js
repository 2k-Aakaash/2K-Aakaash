// Procedural soundscape (Web Audio API). Nothing is downloaded and nothing plays until the
// visitor turns sound on: the AudioContext is only created inside that gesture.
//
//   master ─ compressor ─ destination
//     ├─ ambient bus: stereo drone + wind (non-spatial), and one spatial emitter per region
//     └─ interface bus: arrival chimes (spatial), open/close and hover cues
//
// Spatial sources use PannerNode with HRTF panning and the listener follows the camera, so
// regions are heard from where they sit in the world. Output is stereo/binaural; the browser
// decides how that reaches the device. Nothing here claims surround or Dolby output.

const STORE = 'aakaash:sound';
const DEFAULTS = { enabled: false, volume: 0.6, ambient: true, interaction: true };

function loadPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORE, JSON.stringify(prefs));
  } catch {
    /* private mode: preferences just won't persist */
  }
}

export function audioSupported() {
  return typeof window.AudioContext === 'function' || typeof window.webkitAudioContext === 'function';
}

// Region voices: a pair of soft partials per region, tuned to one A-minor-pentatonic field
// so overlapping regions never clash.
const VOICES = {
  home: [220, 329.63],
  about: [261.63, 392],
  work: [293.66, 440],
  skills: [329.63, 493.88],
  journey: [392, 587.33],
  contact: [440, 659.25],
};

export function createSoundscape() {
  const prefs = loadPrefs();
  const listeners = new Set();
  let ctx = null;
  let master;
  let ambientBus;
  let uiBus;
  let reverb;
  let noiseBuffer;
  const emitters = new Map();
  let lastHover = 0;
  let pendingStart = false;
  let failed = false;

  const notify = () => listeners.forEach((fn) => fn(state()));

  function state() {
    return {
      ...prefs,
      supported: audioSupported() && !failed,
      running: !!ctx && ctx.state === 'running',
      waiting: prefs.enabled && (!ctx || ctx.state !== 'running'),
      output: outputDescription(),
    };
  }

  function outputDescription() {
    if (!ctx) return 'Stereo, spatialised for headphones';
    const channels = ctx.destination.maxChannelCount;
    return channels > 2
      ? `Spatialised stereo (your device reports ${channels} output channels; the browser handles the mix)`
      : 'Stereo, spatialised for headphones';
  }

  function impulse(seconds) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    return buffer;
  }

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'playback' });
    ctx.addEventListener('statechange', notify);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(compressor).connect(ctx.destination);

    ambientBus = ctx.createGain();
    ambientBus.gain.value = prefs.ambient ? 1 : 0;
    ambientBus.connect(master);
    uiBus = ctx.createGain();
    uiBus.gain.value = prefs.interaction ? 1 : 0;
    uiBus.connect(master);

    reverb = ctx.createConvolver();
    reverb.buffer = impulse(3.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    reverb.connect(wet).connect(master);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuffer.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    drone();
    wind();
  }

  function lfo(freq, depth, target) {
    const o = ctx.createOscillator();
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = depth;
    o.connect(g).connect(target);
    o.start();
  }

  function drone() {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.6;
    lfo(0.045, 160, filter.frequency);
    const gain = ctx.createGain();
    gain.gain.value = 0.085;
    filter.connect(gain).connect(ambientBus);
    gain.connect(reverb);
    [
      [55, 'sine', -4],
      [82.41, 'triangle', 3],
      [110, 'sine', 6],
    ].forEach(([f, type, detune]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = detune;
      o.connect(filter);
      o.start();
    });
  }

  function wind() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 520;
    band.Q.value = 0.8;
    lfo(0.03, 260, band.frequency);
    const pan = ctx.createStereoPanner();
    lfo(0.02, 0.7, pan.pan);
    const gain = ctx.createGain();
    gain.gain.value = 0.022;
    src.connect(band).connect(pan).connect(gain).connect(ambientBus);
    src.start();
  }

  function panner(pos) {
    const p = ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 24;
    p.rolloffFactor = 1.3;
    p.maxDistance = 600;
    setPosition(p, pos);
    return p;
  }

  function setPosition(p, { x, y, z }) {
    if (p.positionX) {
      p.positionX.value = x;
      p.positionY.value = y;
      p.positionZ.value = z;
    } else p.setPosition(x, y, z);
  }

  function addEmitter(key, pos) {
    const freqs = VOICES[key] || VOICES.home;
    const p = panner(pos);
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    lfo(0.07 + Math.random() * 0.05, 0.03, gain.gain);
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = i ? 4 : -3;
      const g = ctx.createGain();
      g.gain.value = i ? 0.35 : 0.6;
      o.connect(g).connect(gain);
      o.start();
    });
    gain.connect(p).connect(ambientBus);
    p.connect(reverb);
    emitters.set(key, p);
  }

  function ramp(param, value, seconds) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }

  async function start() {
    try {
      if (!ctx) build();
      await ctx.resume();
      ramp(master.gain, prefs.volume * 0.9, 1.6);
      pendingStart = false;
    } catch {
      failed = true;
      prefs.enabled = false;
    }
    notify();
  }

  // A preference saved as "on" can only resume after the visitor interacts with the page.
  function armResume() {
    if (pendingStart) return;
    pendingStart = true;
    const go = () => {
      window.removeEventListener('pointerdown', go, true);
      window.removeEventListener('keydown', go, true);
      if (prefs.enabled) start();
    };
    window.addEventListener('pointerdown', go, true);
    window.addEventListener('keydown', go, true);
  }

  function chime(pos, base = 660) {
    if (!ctx || ctx.state !== 'running' || !prefs.interaction) return;
    const now = ctx.currentTime;
    const p = pos ? panner(pos) : null;
    const out = ctx.createGain();
    out.gain.value = 0.11;
    if (p) out.connect(p).connect(uiBus);
    else out.connect(uiBus);
    out.connect(reverb);
    [1, 1.5, 2.01].forEach((ratio, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.5 / (i + 1), now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.4 - i * 0.5);
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + 2.5);
    });
  }

  function tick(freq, length, level) {
    if (!ctx || ctx.state !== 'running' || !prefs.interaction) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, now + length);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + length);
    o.connect(g).connect(uiBus);
    o.start(now);
    o.stop(now + length + 0.05);
  }

  if (prefs.enabled && audioSupported()) armResume();

  return {
    get state() {
      return state();
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(state());
      return () => listeners.delete(fn);
    },
    /** Must be called from a user gesture when turning on. */
    async setEnabled(on) {
      prefs.enabled = on;
      savePrefs(prefs);
      if (on) await start();
      else if (ctx) {
        ramp(master.gain, 0, 0.12);
        setTimeout(() => {
          if (!prefs.enabled) ctx.suspend().then(notify);
        }, 200);
      }
      notify();
    },
    setVolume(v) {
      prefs.volume = v;
      savePrefs(prefs);
      if (ctx && prefs.enabled) ramp(master.gain, v * 0.9, 0.15);
      notify();
    },
    setCategory(name, on) {
      prefs[name] = on;
      savePrefs(prefs);
      const bus = name === 'ambient' ? ambientBus : uiBus;
      if (ctx && bus) ramp(bus.gain, on ? 1 : 0, 0.25);
      notify();
    },
    /** Register region emitters (world positions). Safe to call before audio starts. */
    setEmitters(list) {
      const apply = () => list.forEach(({ key, position }) => !emitters.has(key) && addEmitter(key, position));
      if (ctx) apply();
      else {
        const wait = this.subscribe((s) => {
          if (s.running) {
            apply();
            wait();
          }
        });
      }
    },
    /** Called every frame with the world camera. */
    updateListener(camera) {
      if (!ctx || ctx.state !== 'running') return;
      const l = ctx.listener;
      const e = camera.matrixWorld.elements;
      const { x, y, z } = camera.position;
      if (l.positionX) {
        const t = ctx.currentTime;
        l.positionX.setTargetAtTime(x, t, 0.05);
        l.positionY.setTargetAtTime(y, t, 0.05);
        l.positionZ.setTargetAtTime(z, t, 0.05);
        l.forwardX.setTargetAtTime(-e[8], t, 0.05);
        l.forwardY.setTargetAtTime(-e[9], t, 0.05);
        l.forwardZ.setTargetAtTime(-e[10], t, 0.05);
        l.upX.setTargetAtTime(e[4], t, 0.05);
        l.upY.setTargetAtTime(e[5], t, 0.05);
        l.upZ.setTargetAtTime(e[6], t, 0.05);
      } else {
        l.setPosition(x, y, z);
        l.setOrientation(-e[8], -e[9], -e[10], e[4], e[5], e[6]);
      }
    },
    arrive(position, index) {
      chime(position, [523.25, 587.33, 659.25, 783.99, 880][index % 5]);
    },
    open() {
      tick(880, 0.18, 0.08);
    },
    close() {
      tick(520, 0.16, 0.06);
    },
    hover() {
      const now = performance.now();
      if (now - lastHover < 450) return;
      lastHover = now;
      tick(1320, 0.09, 0.025);
    },
  };
}
