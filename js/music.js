/* One More Exit — adaptive score.
   Sparse by design: a low drone, a slow pad, and occasional notes. The mood
   follows the road (region, night, trouble), so the music turns ominous on its
   own without ever announcing itself. */
window.OME_MUSIC = (() => {
  let ctx = null, master = null, padBus = null, droneOsc = [], droneGain = null;
  let timer = null, step = 0, mood = "open", on = true, running = false;

  // Each mood: root note, the notes it may play, tempo, and how dark the filter sits.
  const MOODS = {
    open:       { root: 45, scale: [0, 3, 5, 7, 10], beat: 3.2, cutoff: 900, pad: 0.05, bell: 0.05, pulse: 0 },
    lonely:     { root: 43, scale: [0, 2, 3, 7, 10], beat: 3.8, cutoff: 700, pad: 0.055, bell: 0.04, pulse: 0 },
    grim:       { root: 40, scale: [0, 1, 5, 7, 8], beat: 2.6, cutoff: 520, pad: 0.06, bell: 0.03, pulse: 0.18 },
    close:      { root: 41, scale: [0, 3, 5, 8, 10], beat: 3.0, cutoff: 780, pad: 0.05, bell: 0.05, pulse: 0.08 },
    settlement: { root: 48, scale: [0, 4, 7, 9, 11], beat: 2.8, cutoff: 1400, pad: 0.045, bell: 0.06, pulse: 0 },
    night:      { root: 38, scale: [0, 2, 3, 7, 8], beat: 4.2, cutoff: 480, pad: 0.06, bell: 0.035, pulse: 0.1 },
    danger:     { root: 36, scale: [0, 1, 6, 7], beat: 1.6, cutoff: 420, pad: 0.07, bell: 0.02, pulse: 0.3 },
    foot:       { root: 41, scale: [0, 3, 7], beat: 5.0, cutoff: 600, pad: 0.035, bell: 0.03, pulse: 0 }
  };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const warm = ctx.createBiquadFilter(); warm.type = "lowpass"; warm.frequency.value = 5200;
    master.connect(warm); warm.connect(ctx.destination);
    padBus = ctx.createGain(); padBus.gain.value = 1; padBus.connect(master);

    // the drone: two detuned saws an octave apart, always running
    droneGain = ctx.createGain(); droneGain.gain.value = 0.05;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 400; lp.Q.value = 2;
    droneGain.connect(lp); lp.connect(master);
    for (const [mult, det] of [[1, -6], [1, 7], [2, 3]]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = mtof(MOODS[mood].root) * mult;
      o.detune.value = det;
      const g = ctx.createGain(); g.gain.value = mult === 2 ? 0.25 : 0.5;
      o.connect(g); g.connect(droneGain);
      o.start();
      droneOsc.push({ o, mult });
    }
  }

  function note({ f, when, dur, vol, type = "triangle", cutoff = 1200, pan = 0, attack = 0.02 }) {
    const t = when || ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
    const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    o.connect(fl); fl.connect(g);
    if (ctx.createStereoPanner && pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    out.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noiseHit(vol, hp, dur) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(); src.stop(ctx.currentTime + dur + 0.05);
  }

  function beat() {
    if (!ctx || !running) return;
    const M = MOODS[mood] || MOODS.open;
    const t = ctx.currentTime;
    step++;

    // slow pad chord every four beats
    if (step % 4 === 1) {
      const chord = [0, M.scale[2], M.scale[4]];
      chord.forEach((s, i) => {
        note({ f: mtof(M.root + 12 + s), when: t, dur: M.beat * 4.4, vol: M.pad,
               type: "sawtooth", cutoff: M.cutoff, pan: (i - 1) * 0.5, attack: 1.2 });
      });
    }
    // a single note, sometimes
    if (Math.random() < 0.55) {
      const s = M.scale[Math.floor(Math.random() * M.scale.length)];
      const oct = Math.random() < 0.35 ? 24 : 12;
      note({ f: mtof(M.root + oct + s), when: t + Math.random() * 0.4, dur: 2.4, vol: M.bell,
             type: "triangle", cutoff: 2600, pan: (Math.random() - 0.5) * 0.8, attack: 0.01 });
    }
    // a heartbeat in the darker moods
    if (M.pulse && Math.random() < M.pulse * 2) {
      note({ f: mtof(M.root - 12), when: t, dur: 0.5, vol: M.pulse, type: "sine", cutoff: 300, attack: 0.005 });
    }
    if (mood === "danger" && Math.random() < 0.3) noiseHit(0.03, 4000, 0.4);

    timer = setTimeout(beat, M.beat * 1000);
  }

  function retune() {
    if (!ctx) return;
    const M = MOODS[mood] || MOODS.open;
    droneOsc.forEach(d => d.o.frequency.setTargetAtTime(mtof(M.root) * d.mult, ctx.currentTime, 1.5));
    droneGain.gain.setTargetAtTime(mood === "settlement" ? 0.025 : 0.05, ctx.currentTime, 1.5);
  }

  return {
    init,
    get on() { return on; },
    get mood() { return mood; },
    setMood(m) {
      if (!MOODS[m] || m === mood) return;
      mood = m;
      retune();
    },
    start() {
      init();
      if (!ctx) return;
      running = true;
      master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 1.2);
      if (!timer) beat();
    },
    stop() {
      running = false;
      if (master && ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.8);
      clearTimeout(timer); timer = null;
    },
    toggle() {
      on = !on;
      if (master && ctx) master.gain.setTargetAtTime(on && running ? 0.5 : 0, ctx.currentTime, 0.4);
      return on;
    }
  };
})();
