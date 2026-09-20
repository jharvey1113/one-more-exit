/* One More Exit — the view through the windshield.
   A pseudo-3D road with sun bloom, layered haze, ground grain, worn asphalt,
   cast shadows, weather on the glass, film grain, and a cab that moves with
   the road: sway through curves, dip over crests, a jolt across the seams. */
window.OME_ROAD = (() => {
  const SEG = 200, ROAD_W = 2000, CAM_D = 0.86, CAM_H = 1150, DRAW = 300;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const parse = c => c[0] === "#"
    ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
    : (c.match(/-?\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  const mix = (a, b, t) => {
    const [r1, g1, b1] = parse(a), [r2, g2, b2] = parse(b);
    return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
  };
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const curveAt = i => (Math.sin(i / 190) * 2.2 + Math.sin(i / 71) * 1.1 + (hash(i >> 7) - 0.5) * 1.2) * 0.1;
  const hillAt = i => Math.sin(i / 150) * 2200 + Math.sin(i / 47) * 520 + Math.sin(i / 19) * 90;
  const seamAt = i => i % 9 === 0;

  // ---------------------------------------------------------------- light
  function skyStops(hour) {
    const ramp = [
      { h: 0,    c: ["#05070f", "#080b16", "#0d1220"] },
      { h: 4.6,  c: ["#070b1c", "#0d1430", "#1b2442"] },
      { h: 6,    c: ["#16305c", "#6a4a68", "#c97b4e"] },
      { h: 7,    c: ["#2f6099", "#87a2bd", "#e8b98a"] },
      { h: 9,    c: ["#2f6ea8", "#6ea0c8", "#c6dcea"] },
      { h: 13,   c: ["#2a6cb0", "#6fa3cf", "#cfe3ee"] },
      { h: 16.5, c: ["#2f6ea8", "#84a6c4", "#dcc79e"] },
      { h: 18.3, c: ["#27548f", "#8a6a7a", "#e8a463"] },
      { h: 19.2, c: ["#1c2b4e", "#5b4a6e", "#e07a42"] },
      { h: 19.9, c: ["#131c38", "#3b2c4e", "#a8492c"] },
      { h: 20.8, c: ["#0a1026", "#1a1a33", "#3c2140"] },
      { h: 22,   c: ["#06091a", "#0a0f22", "#141a2e"] },
      { h: 24,   c: ["#05070f", "#080b16", "#0d1220"] }
    ];
    for (let i = 0; i < ramp.length - 1; i++) {
      if (hour >= ramp[i].h && hour <= ramp[i + 1].h) {
        const t = (hour - ramp[i].h) / (ramp[i + 1].h - ramp[i].h);
        return ramp[i].c.map((c, k) => mix(c, ramp[i + 1].c[k], t));
      }
    }
    return ramp[0].c;
  }
  const daylight = hour => {
    if (hour < 4.8 || hour > 20.6) return 0.08;
    if (hour < 6.6) return 0.08 + (hour - 4.8) / 1.8 * 0.5;
    if (hour < 8) return 0.58 + (hour - 6.6) / 1.4 * 0.42;
    if (hour < 16.8) return 1;
    if (hour < 19) return 1 - (hour - 16.8) / 2.2 * 0.48;
    return 0.52 - (hour - 19) / 1.6 * 0.44;
  };

  // ---------------------------------------------------------------- roadside
  function sprite(ctx, kind, x, y, s, light) {
    if (s < 0.2) return;
    const dim = c => mix("#0a0d14", c, 0.36 + light * 0.64);
    ctx.save(); ctx.translate(x, y);
    if (kind === "saguaro") {
      ctx.fillStyle = dim("#4a6b40");
      ctx.fillRect(-s * 0.55, -s * 10, s * 1.1, s * 10);
      ctx.fillRect(-s * 3.2, -s * 7, s * 2.7, s * 1.1);
      ctx.fillRect(-s * 3.2, -s * 7, s * 1.1, s * 3.6);
      ctx.fillRect(s * 0.5, -s * 8, s * 2.7, s * 1.1);
      ctx.fillRect(s * 2.1, -s * 8, s * 1.1, s * 4.6);
      ctx.fillStyle = dim("#638a55"); ctx.fillRect(-s * 0.55, -s * 10, s * 0.32, s * 10);
    } else if (kind === "pine") {
      for (const [ww, hh, o] of [[4.4, 6.4, 0], [3.5, 5.2, 3.2], [2.5, 4.2, 6]]) {
        ctx.fillStyle = dim(o ? "#31513a" : "#25422f");
        ctx.beginPath();
        ctx.moveTo(0, -s * (hh + o)); ctx.lineTo(s * ww, -s * o); ctx.lineTo(-s * ww, -s * o);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = dim("#3a2d22"); ctx.fillRect(-s * 0.6, -s * 1.4, s * 1.2, s * 1.4);
    } else if (kind === "pole") {
      ctx.fillStyle = dim("#585349");
      ctx.fillRect(-s * 0.45, -s * 17, s * 0.9, s * 17);
      ctx.fillRect(-s * 3, -s * 16, s * 6, s * 0.8);
      ctx.fillRect(-s * 2.4, -s * 14, s * 4.8, s * 0.6);
      ctx.strokeStyle = dim("#2a2a2a"); ctx.lineWidth = Math.max(0.5, s * 0.16);
      ctx.beginPath(); ctx.moveTo(-s * 2.6, -s * 15.4);
      ctx.quadraticCurveTo(s * 22, -s * 12, s * 48, -s * 15.4); ctx.stroke();
    } else if (kind === "wreck") {
      ctx.fillStyle = dim("#585d56");
      ctx.fillRect(-s * 5, -s * 3.4, s * 10, s * 2.4);
      ctx.fillRect(-s * 2.6, -s * 5.4, s * 5.2, s * 2.2);
      ctx.fillStyle = dim("#7a4a33"); ctx.fillRect(-s * 5, -s * 2.2, s * 10, s * 0.6);
      ctx.fillStyle = dim("#1d2126");
      ctx.fillRect(-s * 3.8, -s * 1.2, s * 2, s * 1.2);
      ctx.fillRect(s * 1.8, -s * 1.2, s * 2, s * 1.2);
    } else if (kind === "sign") {
      ctx.fillStyle = dim("#6b7079"); ctx.fillRect(-s * 0.45, -s * 10, s * 0.9, s * 10);
      ctx.fillStyle = dim("#1d6b3c"); ctx.fillRect(-s * 5.5, -s * 15.5, s * 11, s * 5.8);
      ctx.strokeStyle = dim("#eef3ee"); ctx.lineWidth = Math.max(0.6, s * 0.42);
      ctx.strokeRect(-s * 4.9, -s * 14.9, s * 9.8, s * 4.6);
    } else if (kind === "billboard") {
      ctx.fillStyle = dim("#4a4640"); ctx.fillRect(-s * 0.7, -s * 13, s * 1.4, s * 13);
      ctx.fillStyle = dim("#9a8f7a"); ctx.fillRect(-s * 9.5, -s * 22, s * 19, s * 9.5);
      ctx.fillStyle = dim("#6d6558"); ctx.fillRect(-s * 8.4, -s * 20.6, s * 7, s * 3.2);
    } else if (kind === "barn") {
      ctx.fillStyle = dim("#6b3b34"); ctx.fillRect(-s * 9, -s * 11, s * 18, s * 11);
      ctx.fillStyle = dim("#4a2a26");
      ctx.beginPath(); ctx.moveTo(-s * 10, -s * 11); ctx.lineTo(0, -s * 17.5); ctx.lineTo(s * 10, -s * 11);
      ctx.closePath(); ctx.fill();
    } else if (kind === "stack") {
      ctx.fillStyle = dim("#5b5952");
      ctx.fillRect(-s * 1.7, -s * 27, s * 3.4, s * 27);
      ctx.fillRect(-s * 7, -s * 9.5, s * 14, s * 9.5);
    } else if (kind === "corn") {
      ctx.fillStyle = dim("#8a8a42");
      for (let i = -3; i <= 3; i++) ctx.fillRect(i * s * 1.4, -s * 4.8 - (i % 2) * s, s * 0.85, s * 4.8);
    } else if (kind === "marker") {
      ctx.fillStyle = dim("#1d6b3c"); ctx.fillRect(-s * 1.2, -s * 5, s * 2.4, s * 3.4);
      ctx.fillStyle = dim("#e9efe9"); ctx.fillRect(-s * 0.3, -s * 1.6, s * 0.6, s * 1.6);
    } else {
      ctx.fillStyle = dim("#7d7f4a");
      ctx.beginPath(); ctx.ellipse(0, -s * 1.4, s * 2.2, s * 1.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  const PLANTS = {
    desert: ["saguaro", "saguaro", "scrub", "wreck", "sign", "billboard", "pole"],
    mesa: ["saguaro", "scrub", "pole", "wreck", "sign", "billboard"],
    plains: ["pole", "pole", "billboard", "wreck", "barn", "sign", "scrub"],
    farm: ["corn", "barn", "pole", "billboard", "wreck", "sign"],
    rust: ["stack", "pole", "wreck", "billboard", "barn", "sign"],
    hills: ["pine", "pine", "pole", "wreck", "sign", "pine"],
    northeast: ["pine", "pine", "barn", "pole", "sign", "pine"]
  };
  function spriteFor(i, region) {
    const r = hash(i * 1.37);
    if (r > 0.83) {
      const list = PLANTS[region] || PLANTS.plains;
      return { kind: list[Math.floor(hash(i * 7.77) * list.length)],
               side: hash(i * 3.11) > 0.5 ? 1 : -1, offset: 1.4 + hash(i * 5.19) * 2.9 };
    }
    if (i % 26 === 0) return { kind: "marker", side: 1, offset: 1.2 };
    return null;
  }

  // ---------------------------------------------------------------- the world
  function draw(ctx, w, h, st) {
    const { hour, region, colors, weather, onFoot } = st;
    const sway = st.sway || 0, pitch = st.pitch || 0;
    const camZ = st.camZ != null ? st.camZ : st.mile * 5280;
    const light = daylight(hour);
    const sky = skyStops(hour);
    const horizon = h * (0.42 + pitch);

    const g = ctx.createLinearGradient(0, 0, 0, horizon + h * 0.12);
    sky.forEach((c, i) => g.addColorStop(i / (sky.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, horizon + h * 0.14);

    if (light < 0.3) {                                   // stars
      const fade = Math.max(0, 1 - light * 3);
      for (let i = 0; i < 150; i++) {
        const sx = (hash(i * 3.1) * w + sway * 18 + w) % w, sy = hash(i * 7.3) * horizon * 0.95;
        ctx.globalAlpha = (0.12 + hash(i * 11.7) * 0.6) * fade;
        ctx.fillStyle = "#fff";
        const size = hash(i) > 0.93 ? 2 : 1.2;
        ctx.fillRect(sx, sy, size, size);
      }
      ctx.globalAlpha = 1;
    }

    const arc = (hour - 5.6) / 14.2;                     // where the sun sits
    const up = Math.sin(clamp01(arc) * Math.PI);
    const tint = hour < 8 ? "#ffb070" : hour > 16.8 ? "#ff9152" : "#f2f6ff";

    for (let i = 0; i < 12; i++) {                       // clouds
      const seed = i * 5.9 + Math.floor(camZ / 1400000);
      const cy = horizon * (0.12 + hash(seed * 2) * 0.55);
      const cw = w * (0.12 + hash(seed * 3) * 0.28), ch = horizon * (0.028 + hash(seed * 4) * 0.045);
      const cx = ((hash(seed) * 1.5 - 0.25) * w + camZ / 6400 + sway * 26) % (w * 1.7) - w * 0.35;
      const storm = weather === "rain" || weather === "snow";
      ctx.globalAlpha = (storm ? 0.4 : 0.14) + hash(seed * 6) * 0.2;
      ctx.fillStyle = storm ? mix("#2b3038", tint, 0.2 * light) : mix("#ffffff", tint, 0.55);
      ctx.beginPath(); ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (light > 0.12 && arc > -0.06 && arc < 1.08) {     // sun, with bloom
      const sx = w * (1.04 - arc * 1.1) + sway * 30, sy = horizon - up * h * 0.46;
      const low = 1 - up;
      const core = mix("#fff6d0", "#ff7a33", low * 0.85);
      const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, h * (0.3 + low * 0.3));
      glow.addColorStop(0, core);
      glow.addColorStop(0.08, core);
      glow.addColorStop(0.3, `rgba(255,${Math.round(180 - low * 60)},${Math.round(110 - low * 50)},${0.32 + low * 0.3})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, horizon + h * 0.16);
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(sx, sy, h * (0.024 + low * 0.016), 0, Math.PI * 2); ctx.fill();
    } else if (light <= 0.3) {                           // moon
      const mx = w * 0.2 + sway * 24, my = horizon * 0.32;
      const glow = ctx.createRadialGradient(mx, my, 2, mx, my, h * 0.18);
      glow.addColorStop(0, "rgba(220,228,245,0.5)");
      glow.addColorStop(1, "rgba(220,228,245,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, horizon);
      ctx.fillStyle = "#e7e9f2";
      ctx.beginPath(); ctx.arc(mx, my, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = sky[0];
      ctx.beginPath(); ctx.arc(mx + 6, my - 4, 11, 0, Math.PI * 2); ctx.fill();
    }

    // three ridgelines, each one hazier than the last
    const tall = region === "hills" || region === "northeast" ? 1.5
               : region === "rust" || region === "farm" ? 0.55 : 1;
    for (let layer = 2; layer >= 0; layer--) {
      const haze = 0.66 - layer * 0.18;
      ctx.fillStyle = mix(mix("#0a0d16", colors.ground, 0.28 + light * 0.72), sky[sky.length - 1], haze);
      const span = 170 + layer * 130;
      const drift = ((camZ / (1500 + layer * 1900)) + sway * (6 - layer * 2)) % span;
      ctx.beginPath(); ctx.moveTo(-span, horizon + 3);
      for (let i = -1; i < Math.ceil(w / span) + 2; i++) {
        const bx = i * span - drift, seed = i + layer * 41 + Math.floor(camZ / 260000);
        const bh = (16 + layer * 15 + hash(seed) * 50) * tall * (1 - layer * 0.1);
        const sh = 0.28 + hash(seed * 1.7) * 0.42;
        ctx.lineTo(bx, horizon + 3);
        ctx.lineTo(bx + span * sh, horizon - bh);
        ctx.lineTo(bx + span * (sh + 0.2), horizon - bh * (0.55 + hash(seed * 2.3) * 0.35));
        ctx.lineTo(bx + span, horizon + 3);
      }
      ctx.lineTo(w + span, horizon + 3); ctx.closePath(); ctx.fill();
    }

    const gg = ctx.createLinearGradient(0, horizon, 0, h);   // ground
    gg.addColorStop(0, mix(mix("#0a0d14", colors.ground, 0.35 + light * 0.65), sky[sky.length - 1], 0.45));
    gg.addColorStop(0.35, mix("#0a0d14", colors.ground, 0.4 + light * 0.6));
    gg.addColorStop(1, mix("#0a0d14", mix(colors.ground, "#000000", 0.18), 0.45 + light * 0.55));
    ctx.fillStyle = gg; ctx.fillRect(0, horizon, w, h - horizon);

    // stones and scrub — two paths, not a thousand state changes
    const grainShift = (camZ / 26) % 997;
    const pale = new Path2D(), dark = new Path2D();
    for (let i = 0; i < 700; i++) {
      const t = hash(i * 1.7);
      const y = horizon + Math.pow(t, 2.1) * (h - horizon);
      const x = ((hash(i * 3.3) * w * 1.4) + grainShift * (0.15 + t * 1.6)) % (w * 1.4) - w * 0.2;
      const size = 0.5 + (y - horizon) / (h - horizon) * 2.2;
      (hash(i * 7.7) > 0.5 ? pale : dark).rect(x, y, size, size * 0.7);
    }
    ctx.globalAlpha = 0.1 * (0.35 + light * 0.65);
    ctx.fillStyle = "#ffffff"; ctx.fill(pale);
    ctx.fillStyle = "#000000"; ctx.fill(dark);
    ctx.globalAlpha = 1;

    // ---- the road itself ----
    const baseSeg = Math.floor(camZ / SEG);
    const camY = CAM_H + hillAt(baseSeg);
    const project = p => {
      const scale = CAM_D / Math.max(1, p.z - camZ);
      p.sx = w / 2 + scale * (p.x - sway * 420) * w / 2;
      p.sy = h * (0.5 + pitch) - scale * (p.y - camY) * h / 2;
      p.sw = scale * ROAD_W * w / 2;
      return p;
    };
    const poly = (x1, y1, w1, x2, y2, w2, c) => {
      ctx.fillStyle = c; ctx.beginPath();
      ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2);
      ctx.lineTo(x2 + w2, y2); ctx.lineTo(x1 + w1, y1);
      ctx.closePath(); ctx.fill();
    };
    const gl = 0.42 + light * 0.58;
    const wet = weather === "rain";
    const asphaltBase = wet ? mix("#0a0d14", "#3c414a", gl) : mix("#0a0d14", "#4a4c52", gl);
    const laneCol = mix("#0a0d14", "#ddd0a2", gl);
    const shoulder = mix("#0a0d14", mix(colors.ground, "#cfc5b2", 0.45), gl);
    let x = 0, dx = 0, maxY = h;
    const drawn = [];
    for (let n = 0; n < DRAW; n++) {
      const i = baseSeg + n;
      const p1 = project({ x, y: hillAt(i), z: i * SEG });
      dx += curveAt(i); x += dx;
      const p2 = project({ x, y: hillAt(i + 1), z: (i + 1) * SEG });
      if (p2.sy >= maxY || p1.z - camZ < 1) continue;
      maxY = p2.sy;
      if (n > 60 && p1.sw < 0.4) break;         // past here it's all one pixel
      const even = Math.floor(i / 6) % 2 === 0;
      poly(p1.sx, p1.sy, p1.sw * 1.45, p2.sx, p2.sy, p2.sw * 1.45, shoulder);
      const patch = hash(i * 3.77);
      const asph = patch > 0.93 ? mix(asphaltBase, "#000000", 0.3)
                 : patch < 0.07 ? mix(asphaltBase, "#ffffff", 0.08)
                 : (even ? asphaltBase : mix(asphaltBase, "#000000", 0.05));
      poly(p1.sx, p1.sy, p1.sw * 1.12, p2.sx, p2.sy, p2.sw * 1.12, mix(asph, "#b8b2a4", even ? 0.5 : 0.18));
      poly(p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw, asph);
      // polished wheel tracks, an oil strip down the middle, seams across —
      // only close enough to see, where they're worth the pixels
      if (p1.sw > 26) {
        poly(p1.sx - p1.sw * 0.46, p1.sy, p1.sw * 0.18, p2.sx - p2.sw * 0.46, p2.sy, p2.sw * 0.18, mix(asph, "#ffffff", 0.06));
        poly(p1.sx + p1.sw * 0.46, p1.sy, p1.sw * 0.18, p2.sx + p2.sw * 0.46, p2.sy, p2.sw * 0.18, mix(asph, "#ffffff", 0.06));
        poly(p1.sx, p1.sy, p1.sw * 0.1, p2.sx, p2.sy, p2.sw * 0.1, mix(asph, "#000000", 0.12));
        if (seamAt(i)) poly(p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw * 0.99, mix(asph, "#000000", 0.22));
      }
      if (even) poly(p1.sx, p1.sy, p1.sw * 0.028, p2.sx, p2.sy, p2.sw * 0.028,
                     hash(i * 5.3) > 0.8 ? mix(laneCol, asph, 0.55) : laneCol);
      poly(p1.sx + p1.sw * 0.93, p1.sy, p1.sw * 0.022, p2.sx + p2.sw * 0.93, p2.sy, p2.sw * 0.022, laneCol);
      poly(p1.sx - p1.sw * 0.93, p1.sy, p1.sw * 0.022, p2.sx - p2.sw * 0.93, p2.sy, p2.sw * 0.022, laneCol);
      drawn.push({ i, p: p1 });
    }

    // roadside, far to near, each thing throwing a shadow away from the sun
    const sunLeft = arc > 0.5;
    for (let k = drawn.length - 1; k >= 0; k--) {
      const { i, p } = drawn[k];
      const sp = spriteFor(i, region);
      if (!sp) continue;
      const sx = p.sx + p.sw * sp.offset * sp.side, s = p.sw / 42;
      if (s > 0.3 && light > 0.3) {
        ctx.globalAlpha = 0.2 * light;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(sx + s * (sunLeft ? 7 : -7), p.sy, s * 7, s * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      sprite(ctx, sp.kind, sx, p.sy, s, light);
    }

    const hazeCol = weather === "fog" ? "#b9c3c6" : weather === "dust" ? "#c89b62"
                  : weather === "rain" ? mix("#4d5560", sky[2], 0.4) : sky[sky.length - 1];
    const fg = ctx.createLinearGradient(0, horizon - 16, 0, horizon + h * 0.34);
    fg.addColorStop(0, hazeCol); fg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = weather === "fog" ? 0.88 : weather === "dust" ? 0.62
                    : weather === "rain" ? 0.55 : 0.4;
    ctx.fillStyle = fg; ctx.fillRect(0, horizon - 18, w, h * 0.38);
    ctx.globalAlpha = 1;

    if (light > 0.8 && (region === "desert" || region === "mesa" || region === "plains")) {
      for (let i = 0; i < 20; i++) {                      // heat off the asphalt
        ctx.globalAlpha = 0.045 - i * 0.0018;
        ctx.fillStyle = "#fff";
        ctx.fillRect(w * 0.18 + Math.sin(i + camZ / 900) * 14, horizon + 5 + i * 1.7, w * 0.64, 1.3);
      }
      ctx.globalAlpha = 1;
    }

    if (light < 0.32 && !onFoot) {                        // headlights
      const beam = ctx.createLinearGradient(0, h, 0, horizon + h * 0.04);
      beam.addColorStop(0, "rgba(255,238,200,0.3)");
      beam.addColorStop(1, "rgba(255,238,200,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, h); ctx.lineTo(w * 0.42 + sway * 60, horizon + h * 0.06);
      ctx.lineTo(w * 0.58 + sway * 60, horizon + h * 0.06); ctx.lineTo(w, h);
      ctx.closePath(); ctx.fill();
    }
    if (wet) {                                            // light running on water
      ctx.globalAlpha = 0.42;
      for (let i = 0; i < 20; i++) {
        const t = hash(i * 9.1 + Math.floor(camZ / 4000));
        const y = horizon + Math.pow(t, 1.6) * (h - horizon);
        const len = (y - horizon) / (h - horizon) * h * 0.15 + 4;
        const cx = w * 0.5 + (hash(i * 4.4) - 0.5) * w * 0.5 * ((y - horizon) / (h - horizon) + 0.25);
        const grad = ctx.createLinearGradient(cx, y, cx, y + len);
        grad.addColorStop(0, light < 0.32 ? "rgba(255,230,180,0.5)" : "rgba(210,225,240,0.35)");
        grad.addColorStop(1, "rgba(255,230,180,0)");
        ctx.fillStyle = grad; ctx.fillRect(cx - 1.6, y, 3.2, len);
      }
      ctx.globalAlpha = 1;
    }
    return { horizon, light };
  }

  // ---------------------------------------------------------------- the cab
  function drawCab(ctx, w, h, st) {
    const { speedMph, fuelPct, tempPct, odo, night, weather, onFoot } = st;
    if (onFoot) return;
    const grime = st.grime || 0, pitch = st.pitch || 0, sway = st.sway || 0;
    const dashTop = h * (0.74 + pitch * 0.5);

    if (grime > 0.02) {                                   // miles on the glass
      const gr = ctx.createLinearGradient(0, 0, 0, dashTop);
      gr.addColorStop(0, `rgba(150,130,96,${grime * 0.12})`);
      gr.addColorStop(0.7, `rgba(150,130,96,${grime * 0.22})`);
      gr.addColorStop(1, `rgba(120,104,78,${grime * 0.32})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, dashTop);
      for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = (0.04 + hash(i * 4.2) * 0.1) * grime;
        ctx.fillStyle = "#cbbfa0";
        ctx.beginPath();
        ctx.ellipse(hash(i * 2.2) * w, hash(i * 6.6) * dashTop * 0.9,
                    1 + hash(i) * 2.2, 0.8 + hash(i * 3) * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (weather === "rain") {                             // beads, and a wiper
      const t = performance.now();
      for (let i = 0; i < 60; i++) {
        const bx = hash(i * 1.9) * w, by = (hash(i * 5.3) * dashTop + (t / 60) * (0.3 + hash(i) * 1.6)) % dashTop;
        const r = 1.2 + hash(i * 7.1) * 3;
        const gr = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0.2, bx, by, r);
        gr.addColorStop(0, "rgba(255,255,255,0.45)");
        gr.addColorStop(0.6, "rgba(190,210,235,0.24)");
        gr.addColorStop(1, "rgba(190,210,235,0.04)");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
      }
      const ang = Math.sin((t / 1100) * Math.PI * 2) * 0.62;
      ctx.save();
      ctx.translate(w * 0.36, h * 0.96);
      ctx.rotate(-Math.PI / 2 + ang);
      const streak = ctx.createLinearGradient(0, -7, 0, 7);
      streak.addColorStop(0, "rgba(255,255,255,0)");
      streak.addColorStop(0.5, "rgba(255,255,255,0.08)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = streak; ctx.fillRect(0, -8, h * 0.72, 16);
      ctx.fillStyle = "rgba(16,18,24,0.55)"; ctx.fillRect(h * 0.1, -1.6, h * 0.56, 3.2);
      ctx.restore();
    }

    ctx.fillStyle = "#12141a";                            // pillars and roof
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.075, 0); ctx.lineTo(0, h * 0.34); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w * 0.925, 0); ctx.lineTo(w, h * 0.34); ctx.closePath(); ctx.fill();
    const roof = ctx.createLinearGradient(0, 0, 0, h * 0.06);
    roof.addColorStop(0, "#0c0e12"); roof.addColorStop(1, "#191c23");
    ctx.fillStyle = roof; ctx.fillRect(0, 0, w, h * 0.05);
    const mw = w * 0.19, mx = w * 0.5 - mw / 2 + sway * 10, my = h * 0.05;
    ctx.fillStyle = "#1a1d24"; ctx.fillRect(mx, my, mw, h * 0.072);
    ctx.fillStyle = night ? "#0b0e16" : "#3d4753";
    ctx.fillRect(mx + 3, my + 3, mw - 6, h * 0.072 - 6);
    if (night) {
      ctx.fillStyle = "rgba(255,225,170,0.5)";
      ctx.fillRect(mx + mw * 0.44, my + h * 0.03, 3, 3);
      ctx.fillRect(mx + mw * 0.54, my + h * 0.03, 3, 3);
    }

    const dash = ctx.createLinearGradient(0, dashTop - h * 0.04, 0, h);
    dash.addColorStop(0, "#22262f"); dash.addColorStop(0.35, "#171a21"); dash.addColorStop(1, "#0a0c10");
    ctx.fillStyle = dash;
    ctx.beginPath();
    ctx.moveTo(0, dashTop + h * 0.03);
    ctx.quadraticCurveTo(w * 0.5, dashTop - h * 0.05, w, dashTop + h * 0.03);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.06;                               // dash reflected in glass
    ctx.fillStyle = "#8fa0b5";
    ctx.beginPath();
    ctx.moveTo(w * 0.1, dashTop - h * 0.03);
    ctx.quadraticCurveTo(w * 0.5, dashTop - h * 0.15, w * 0.9, dashTop - h * 0.03);
    ctx.quadraticCurveTo(w * 0.5, dashTop - h * 0.06, w * 0.1, dashTop - h * 0.03);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();                                           // wheel, turning with you
    ctx.translate(w * 0.5, h * 1.2);
    ctx.rotate(sway * 0.1);
    ctx.strokeStyle = "#15181e"; ctx.lineWidth = Math.max(12, w * 0.024);
    ctx.beginPath(); ctx.arc(0, 0, h * 0.36, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    ctx.strokeStyle = "rgba(120,110,95,0.2)"; ctx.lineWidth = 1.1;
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * 1.2 + (Math.PI * 0.6) * (i / 23);
      const rx = Math.cos(a) * h * 0.36, ry = Math.sin(a) * h * 0.36;
      ctx.beginPath(); ctx.moveTo(rx, ry - 5); ctx.lineTo(rx, ry + 5); ctx.stroke();
    }
    ctx.restore();

    const gy = dashTop + h * 0.1, r = Math.min(h * 0.05, w * 0.05);
    const gauge = (cx, rr, frac, label, warn) => {
      const face = ctx.createRadialGradient(cx - rr * 0.3, gy - rr * 0.35, rr * 0.1, cx, gy, rr);
      face.addColorStop(0, "#1b2029"); face.addColorStop(1, "#080a0e");
      ctx.beginPath(); ctx.arc(cx, gy, rr, 0, Math.PI * 2); ctx.fillStyle = face; ctx.fill();
      ctx.strokeStyle = "#333a47"; ctx.lineWidth = 2; ctx.stroke();
      const a0 = Math.PI * 0.78, a1 = Math.PI * 2.22;
      for (let i = 0; i <= 10; i++) {
        const a = a0 + (a1 - a0) * (i / 10);
        ctx.strokeStyle = (i > 7 && warn) ? "#c8442f" : "#4a5261";
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * rr * 0.84, gy + Math.sin(a) * rr * 0.84);
        ctx.lineTo(cx + Math.cos(a) * rr * 0.68, gy + Math.sin(a) * rr * 0.68);
        ctx.stroke();
      }
      const a = a0 + (a1 - a0) * clamp01(frac);
      ctx.strokeStyle = warn ? "#ff6a52" : "#e8b04b"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx, gy);
      ctx.lineTo(cx + Math.cos(a) * rr * 0.76, gy + Math.sin(a) * rr * 0.76); ctx.stroke();
      ctx.fillStyle = "#e8b04b";
      ctx.beginPath(); ctx.arc(cx, gy, rr * 0.08, 0, Math.PI * 2); ctx.fill();
      if (label) {
        ctx.fillStyle = "#6b7583"; ctx.font = `600 ${Math.round(rr * 0.4)}px Overpass, sans-serif`;
        ctx.textAlign = "center"; ctx.fillText(label, cx, gy + rr * 1.5);
      }
    };
    gauge(w * 0.5 - r * 3.3, r, speedMph / 100, "MPH", false);
    gauge(w * 0.5, r * 1.24, speedMph / 100, "", false);
    gauge(w * 0.5 + r * 3.3, r, fuelPct / 100, "FUEL", fuelPct < 16);
    gauge(w * 0.5 + r * 6, r * 0.78, tempPct, "TEMP", tempPct > 0.8);
    ctx.fillStyle = "#e8eaee"; ctx.font = `700 ${Math.round(r * 0.9)}px Overpass, sans-serif`;
    ctx.textAlign = "center"; ctx.fillText(String(Math.round(speedMph)), w * 0.5, gy + r * 0.3);
    ctx.fillStyle = "#59626f"; ctx.font = `600 ${Math.round(r * 0.4)}px Overpass, sans-serif`;
    ctx.fillText(Math.round(odo).toLocaleString() + " mi", w * 0.5, gy + r * 0.95);
    if (night) {
      const glow = ctx.createRadialGradient(w * 0.5, gy, r * 0.5, w * 0.5, gy, r * 8);
      glow.addColorStop(0, "rgba(232,176,75,0.1)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, dashTop - h * 0.05, w, h * 0.35);
    }
  }

  // film grain and vignette, last of all. The grain is one small noise tile,
  // made once and thrown down at a different offset every frame.
  let grainTile = null;
  function noiseTile() {
    if (grainTile) return grainTile;
    const n = 128, c = document.createElement("canvas");
    c.width = c.height = n;
    const g = c.getContext("2d"), img = g.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const v = 108 + Math.random() * 40;     // a whisper either side of neutral
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return (grainTile = c);
  }
  function grade(ctx, w, h, night) {
    const tile = noiseTile();
    const ox = Math.floor(Math.random() * 128), oy = Math.floor(Math.random() * 128);
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.16;
    for (let y = -oy; y < h; y += 128) for (let x = -ox; x < w; x += 128) ctx.drawImage(tile, x, y);
    ctx.restore();
    const vig = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.25, w / 2, h * 0.5, h);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, night ? "rgba(0,0,0,0.68)" : "rgba(0,0,0,0.4)");
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
  }

  return { draw, drawCab, grade, daylight, curveAt, hillAt, seamAt, SEG };
})();
