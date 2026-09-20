/* One More Exit — the sound of being in the vehicle.
   Engine note rises with speed, tires hum, wind builds, rain drums on the roof.
   Quiet by design: this sits under the music, not on top of it. */
window.OME_AMB = (() => {
  let ctx = null, master, engineOsc = [], engineGain, tireGain, windGain, rainGain, on = true, started = false;

  function noiseBuffer(c) {
    const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function noiseSource(buf, filterType, freq, gainNode) {
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filterType; f.frequency.value = freq;
    src.connect(f); f.connect(gainNode);
    src.start();
    return f;
  }

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(ctx.destination);
    const buf = noiseBuffer(ctx);

    // engine: two saws an octave apart through a lowpass, plus a little grit
    engineGain = ctx.createGain(); engineGain.gain.value = 0;
    const eFilter = ctx.createBiquadFilter();
    eFilter.type = "lowpass"; eFilter.frequency.value = 520; eFilter.Q.value = 3;
    engineGain.connect(eFilter); eFilter.connect(master);
    for (const [mult, type, vol] of [[1, "sawtooth", 0.5], [2, "square", 0.18], [0.5, "sine", 0.4]]) {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = 60 * mult;
      const g = ctx.createGain(); g.gain.value = vol;
      o.connect(g); g.connect(engineGain);
      o.start();
      engineOsc.push({ o, mult });
    }
    tireGain = ctx.createGain(); tireGain.gain.value = 0; tireGain.connect(master);
    noiseSource(buf, "bandpass", 420, tireGain);
    windGain = ctx.createGain(); windGain.gain.value = 0; windGain.connect(master);
    noiseSource(buf, "lowpass", 900, windGain);
    rainGain = ctx.createGain(); rainGain.gain.value = 0; rainGain.connect(master);
    noiseSource(buf, "highpass", 2200, rainGain);
    started = true;
  }

  const ramp = (param, value, time = 0.25) => param.setTargetAtTime(value, ctx.currentTime, time);

  return {
    init,
    get on() { return on; },
    toggle() {
      on = !on;
      if (master) ramp(master.gain, on ? 0.9 : 0, 0.15);
      return on;
    },
    // called every frame with what the vehicle is actually doing
    update({ moving, mph, condition, weather, onFoot, engineLoad }) {
      if (!started || !ctx) return;
      const speed = Math.max(0, mph) / 70;
      if (onFoot || !moving) {
        ramp(engineGain.gain, 0, 0.5);
        ramp(tireGain.gain, onFoot && moving ? 0.008 : 0, 0.5);
        ramp(windGain.gain, 0, 0.5);
      } else {
        // a rough engine is louder and coarser
        const rough = 1 + (1 - condition / 100) * 0.8;
        const rpm = 48 + speed * 66 + (engineLoad || 0) * 12;
        engineOsc.forEach(e => e.o.frequency.setTargetAtTime(rpm * e.mult, ctx.currentTime, 0.2));
        ramp(engineGain.gain, 0.05 * rough, 0.3);
        ramp(tireGain.gain, 0.018 * speed, 0.3);
        ramp(windGain.gain, 0.012 * speed * speed, 0.4);
      }
      ramp(rainGain.gain, weather === "rain" ? 0.05 : weather === "snow" ? 0.012 : 0, 0.8);
    },
    // a single soft thunk for the wipers
    wiper() {
      if (!started || !on) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(140, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.15);
    },
    blinker() {
      if (!started || !on) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.06);
    }
  };
})();
