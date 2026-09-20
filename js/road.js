/* One More Exit — the view through the windshield.
   A pseudo-3D road: segments projected to the horizon, with curves, crests and
   dips, fog, weather, a sun that sets properly, and the cab you're sitting in. */
window.OME_ROAD = (() => {
  const SEG = 200;              // feet per segment
  const ROAD_W = 2000;          // half-width of the roadway
  const DRAW = 260;             // segments drawn ahead
  const CAM_H = 1100;
  const CAM_D = 0.86;           // tan-based depth for a ~100 degree view

  // deterministic noise so the same mile always has the same road and scenery
  const hash = n => {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const curveAt = i => (Math.sin(i / 190) * 2.2 + Math.sin(i / 71) * 1.1 + (hash(i >> 7) - 0.5) * 1.2) * 0.1;
  const hillAt = i => Math.sin(i / 150) * 2200 + Math.sin(i / 47) * 520 + Math.sin(i / 19) * 90;

  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => {
    const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const [r1, g1, b1] = p(c1), [r2, g2, b2] = p(c2);
    return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
  };

  // Sky colour by hour, including a long golden hour and true dark
  function skyColors(hour) {
    const ramp = [
      { h: 0,    top: "#05070f", bot: "#0b1020" },
      { h: 5,    top: "#0a1026", bot: "#1e2540" },
      { h: 6,    top: "#1b3358", bot: "#c97b4e" },
      { h: 7,    top: "#3f74ab", bot: "#e8b98a" },
      { h: 10,   top: "#4e8fc4", bot: "#bcd8e8" },
      { h: 14,   top: "#3f86c6", bot: "#cfe3ee" },
      { h: 17.5, top: "#3a6ea8", bot: "#e8c090" },
      { h: 18.8, top: "#2a4a86", bot: "#e8814a" },
      { h: 19.6, top: "#1a2c5c", bot: "#b0472f" },
      { h: 20.6, top: "#0b1230", bot: "#3c2140" },
      { h: 22,   top: "#070a18", bot: "#12182c" },
      { h: 24,   top: "#05070f", bot: "#0b1020" }
    ];
    for (let i = 0; i < ramp.length - 1; i++) {
      if (hour >= ramp[i].h && hour <= ramp[i + 1].h) {
        const t = (hour - ramp[i].h) / (ramp[i + 1].h - ramp[i].h);
        return { top: mix(ramp[i].top, ramp[i + 1].top, t), bot: mix(ramp[i].bot, ramp[i + 1].bot, t) };
      }
    }
    return { top: "#05070f", bot: "#0b1020" };
  }

  // how bright the world is, 0 night, 1 midday — everything else keys off this
  const daylight = hour => {
    if (hour < 5 || hour > 20.5) return 0.1;     // even night keeps some shape
    if (hour < 6.5) return (hour - 5) / 1.5 * 0.55;
    if (hour < 8) return 0.55 + (hour - 6.5) / 1.5 * 0.45;
    if (hour < 17) return 1;
    if (hour < 19) return 1 - (hour - 17) / 2 * 0.5;
    return 0.5 - (hour - 19) / 1.5 * 0.5;
  };

  const project = (p, camX, camY, camZ, width, height) => {
    const scale = CAM_D / Math.max(1, p.z - camZ);
    p.sx = Math.round(width / 2 + scale * (p.x - camX) * width / 2);
    p.sy = Math.round(height / 2 - scale * (p.y - camY) * height / 2);
    p.sw = Math.round(scale * ROAD_W * width / 2);
    p.scale = scale;
    return p;
  };

  function poly(ctx, x1, y1, w1, x2, y2, w2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2); ctx.lineTo(x1 + w1, y1);
    ctx.closePath(); ctx.fill();
  }

  // ---------------------------------------------------------------- sprites
  function roadsideSprite(ctx, kind, x, y, scale, light, colorSet) {
    const s = Math.max(1, scale);
    ctx.save();
    ctx.translate(x, y);
    const dim = t => mix("#0a0d14", t, 0.4 + light * 0.6);
    if (kind === "saguaro") {
      ctx.fillStyle = dim(colorSet.plant);
      ctx.fillRect(-s * 0.5, -s * 9, s, s * 9);
      ctx.fillRect(-s * 3, -s * 6.4, s * 2.6, s);
      ctx.fillRect(-s * 3, -s * 6.4, s, s * 3.4);
      ctx.fillRect(s * 0.5, -s * 7.4, s * 2.6, s);
      ctx.fillRect(s * 2.1, -s * 7.4, s, s * 4.4);
    } else if (kind === "pine") {
      ctx.fillStyle = dim("#2c4a33");
      for (const [w, h, o] of [[4.2, 6, 0], [3.4, 5, 3], [2.4, 4, 5.6]]) {
        ctx.beginPath();
        ctx.moveTo(0, -s * (h + o)); ctx.lineTo(s * w, -s * o); ctx.lineTo(-s * w, -s * o);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = dim("#3a2d22");
      ctx.fillRect(-s * 0.6, -s * 1.2, s * 1.2, s * 1.2);
    } else if (kind === "pole") {
      ctx.fillStyle = dim("#59544b");
      ctx.fillRect(-s * 0.4, -s * 15, s * 0.8, s * 15);
      ctx.fillRect(-s * 2.6, -s * 14, s * 5.2, s * 0.7);
      ctx.fillRect(-s * 2.2, -s * 12.4, s * 4.4, s * 0.5);
    } else if (kind === "wreck") {
      ctx.fillStyle = dim("#5a5f58");
      ctx.fillRect(-s * 4.5, -s * 3.2, s * 9, s * 2.2);
      ctx.fillRect(-s * 2.4, -s * 5, s * 4.8, s * 2);
      ctx.fillStyle = dim("#22262b");
      ctx.fillRect(-s * 3.4, -s * 1.2, s * 1.8, s * 1.2);
      ctx.fillRect(s * 1.6, -s * 1.2, s * 1.8, s * 1.2);
    } else if (kind === "sign") {
      ctx.fillStyle = dim("#6b7079");
      ctx.fillRect(-s * 0.4, -s * 9, s * 0.8, s * 9);
      ctx.fillStyle = dim("#1d6b3c");
      ctx.fillRect(-s * 5, -s * 14, s * 10, s * 5.4);
      ctx.strokeStyle = dim("#eef3ee"); ctx.lineWidth = Math.max(1, s * 0.4);
      ctx.strokeRect(-s * 4.4, -s * 13.4, s * 8.8, s * 4.2);
    } else if (kind === "billboard") {
      ctx.fillStyle = dim("#4a4640");
      ctx.fillRect(-s * 0.6, -s * 12, s * 1.2, s * 12);
      ctx.fillStyle = dim("#9a8f7a");
      ctx.fillRect(-s * 9, -s * 21, s * 18, s * 9);
      ctx.fillStyle = dim("#6d6558");
      ctx.fillRect(-s * 8, -s * 20, s * 6, s * 3);
    } else if (kind === "barn") {
      ctx.fillStyle = dim("#6b3b34");
      ctx.fillRect(-s * 9, -s * 11, s * 18, s * 11);
      ctx.fillStyle = dim("#4a2a26");
      ctx.beginPath();
      ctx.moveTo(-s * 10, -s * 11); ctx.lineTo(0, -s * 17); ctx.lineTo(s * 10, -s * 11);
      ctx.closePath(); ctx.fill();
    } else if (kind === "stack") {
      ctx.fillStyle = dim("#5b5952");
      ctx.fillRect(-s * 1.6, -s * 26, s * 3.2, s * 26);
      ctx.fillRect(-s * 7, -s * 9, s * 14, s * 9);
    } else if (kind === "corn") {
      ctx.fillStyle = dim("#8a8a42");
      for (let i = -3; i <= 3; i++) ctx.fillRect(i * s * 1.4, -s * 4.5 - (i % 2) * s, s * 0.8, s * 4.5);
    } else if (kind === "marker") {
      ctx.fillStyle = dim("#1d6b3c");
      ctx.fillRect(-s * 1.2, -s * 5, s * 2.4, s * 3.4);
      ctx.fillStyle = dim("#e9efe9");
      ctx.fillRect(-s * 0.3, -s * 1.6, s * 0.6, s * 1.6);
    }
    ctx.restore();
  }

  // pick scenery for a segment, always the same for the same mile
  function spriteFor(i, region) {
    const r = hash(i * 1.37);
    if (r > 0.86) {
      const pick = hash(i * 7.77);
      const by = {
        desert: ["saguaro", "saguaro", "wreck", "sign", "billboard", "pole"],
        mesa: ["saguaro", "pole", "wreck", "sign", "billboard", "pole"],
        plains: ["pole", "pole", "billboard", "wreck", "barn", "sign"],
        farm: ["corn", "barn", "pole", "billboard", "wreck", "sign"],
        rust: ["stack", "pole", "wreck", "billboard", "barn", "sign"],
        hills: ["pine", "pine", "pole", "wreck", "sign", "pine"],
        northeast: ["pine", "pine", "barn", "pole", "sign", "pine"]
      }[region] || ["pole", "wreck", "sign"];
      return { kind: by[Math.floor(pick * by.length)], side: hash(i * 3.11) > 0.5 ? 1 : -1,
               offset: 1.35 + hash(i * 5.19) * 2.6 };
    }
    if (i % 26 === 0) return { kind: "marker", side: 1, offset: 1.18 };
    return null;
  }

  // ---------------------------------------------------------------- main draw
  function draw(ctx, w, h, st) {
    const { mile, hour, region, colors, weather, speedMph, night, onFoot, vehicleCond, wipers } = st;
    const light = daylight(hour);
    const sky = skyColors(hour);
    const camZ = mile * 5280;
    const baseSeg = Math.floor(camZ / SEG);
    const horizonY = h * 0.42;

    // ---- sky ----
    const g = ctx.createLinearGradient(0, 0, 0, horizonY + h * 0.08);
    g.addColorStop(0, sky.top);
    g.addColorStop(1, sky.bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, horizonY + h * 0.09);

    // ---- sun / moon, low and orange at the ends of the day ----
    const arc = (hour - 5.6) / 14.2;                       // 0 sunrise, 1 sunset
    const sunX = w * (1.06 - arc * 1.12);                  // sun sets behind you, rises ahead
    const sunY = horizonY - Math.sin(Math.max(0, Math.min(1, arc)) * Math.PI) * h * 0.42;
    if (light > 0.02 && arc > -0.05 && arc < 1.08) {
      const low = Math.min(1, Math.max(0, 1 - Math.sin(Math.max(0, Math.min(1, arc)) * Math.PI)));
      const col = mix("#fff3c4", "#ff7a33", low);
      const glow = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, h * (0.18 + low * 0.22));
      glow.addColorStop(0, col);
      glow.addColorStop(0.25, `rgba(255,170,90,${0.35 + low * 0.3})`);
      glow.addColorStop(1, "rgba(255,150,80,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, horizonY + h * 0.1);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sunX, sunY, h * (0.028 + low * 0.018), 0, Math.PI * 2); ctx.fill();
    }
    if (night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 90; i++) {
        const sx = (i * 137.5) % w, sy = (i * 61.7) % horizonY;
        ctx.globalAlpha = 0.18 + hash(i) * 0.6;
        ctx.fillRect(sx, sy, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
      const mx = w * 0.18, my = horizonY * 0.3;
      ctx.fillStyle = "#e7e9f2";
      ctx.beginPath(); ctx.arc(mx, my, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = sky.top;
      ctx.beginPath(); ctx.arc(mx + 6, my - 4, 13, 0, Math.PI * 2); ctx.fill();
    }

    // ---- distant ridgeline, drifting with the road ----
    const ridge = mix(colors.ground, sky.bot, 0.55 + (1 - light) * 0.25);
    ctx.fillStyle = mix("#0a0d16", ridge, 0.25 + light * 0.75);
    const drift = (camZ / 900) % 260;
    for (let i = -1; i < 10; i++) {
      const bx = i * 260 - drift;
      const bh = (region === "hills" || region === "northeast" ? 78 : 44) + hash(i + baseSeg / 400 | 0) * 40;
      ctx.beginPath();
      ctx.moveTo(bx, horizonY + 2);
      ctx.lineTo(bx + 80, horizonY - bh);
      ctx.lineTo(bx + 150, horizonY - bh * 0.5);
      ctx.lineTo(bx + 240, horizonY + 2);
      ctx.closePath(); ctx.fill();
    }

    // ---- the road itself ----
    const groundLight = 0.42 + light * 0.58;
    const grass1 = mix("#0a0d14", colors.ground, groundLight);
    const grass2 = mix("#0a0d14", mix(colors.ground, "#000000", 0.18), groundLight);
    const road1 = mix("#0a0d14", "#4a4c52", groundLight);
    const road2 = mix("#0a0d14", "#44464c", groundLight);
    const rumble1 = mix("#0a0d14", "#b8b2a4", groundLight);
    const rumble2 = mix("#0a0d14", "#8d1f1f", groundLight);
    const lane = mix("#0a0d14", "#e8dcb0", groundLight);

    ctx.fillStyle = grass1;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    let x = 0, dx = 0;
    const camY = CAM_H + hillAt(baseSeg);
    let maxY = h;
    const drawn = [];
    for (let n = 0; n < DRAW; n++) {
      const i = baseSeg + n;
      const zNear = i * SEG, zFar = (i + 1) * SEG;
      const p1 = project({ x: x, y: hillAt(i), z: zNear }, 0, camY, camZ, w, h);
      dx += curveAt(i);
      x += dx;
      const p2 = project({ x: x, y: hillAt(i + 1), z: zFar }, 0, camY, camZ, w, h);
      if (p1.z - camZ < CAM_D * 40 || p2.sy >= maxY) continue;
      maxY = p2.sy;
      const even = Math.floor(i / 6) % 2 === 0;
      poly(ctx, p1.sx, p1.sy, w * 2, p2.sx, p2.sy, w * 2, even ? grass1 : grass2);
      poly(ctx, p1.sx, p1.sy, p1.sw * 1.16, p2.sx, p2.sy, p2.sw * 1.16, even ? rumble1 : rumble2);
      poly(ctx, p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw, even ? road1 : road2);
      if (even) {
        poly(ctx, p1.sx, p1.sy, p1.sw * 0.03, p2.sx, p2.sy, p2.sw * 0.03, lane);
        poly(ctx, p1.sx + p1.sw * 0.92, p1.sy, p1.sw * 0.02, p2.sx + p2.sw * 0.92, p2.sy, p2.sw * 0.02, lane);
        poly(ctx, p1.sx - p1.sw * 0.92, p1.sy, p1.sw * 0.02, p2.sx - p2.sw * 0.92, p2.sy, p2.sw * 0.02, lane);
      }
      drawn.push({ i, p: p1 });
    }

    // ---- roadside things, drawn far to near ----
    for (let k = drawn.length - 1; k >= 0; k--) {
      const { i, p } = drawn[k];
      const sp = spriteFor(i, region);
      if (!sp) continue;
      const sx = p.sx + p.sw * sp.offset * sp.side;
      roadsideSprite(ctx, sp.kind, sx, p.sy, p.sw / 42, light, colors);
    }

    // ---- fog / haze toward the horizon ----
    const fogColor = weather === "fog" ? "#b9c3c6" : weather === "dust" ? "#c89b62" : sky.bot;
    const fog = ctx.createLinearGradient(0, horizonY - 10, 0, horizonY + h * 0.3);
    const strength = weather === "fog" ? 0.85 : weather === "dust" ? 0.6 : weather === "rain" ? 0.5 : 0.36;
    fog.addColorStop(0, fogColor);
    fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = strength;
    ctx.fillStyle = fog;
    ctx.fillRect(0, horizonY - 12, w, h * 0.34);
    ctx.globalAlpha = 1;

    // ---- headlights at night ----
    if (night && !onFoot) {
      const beam = ctx.createLinearGradient(0, h, 0, horizonY + h * 0.05);
      beam.addColorStop(0, "rgba(255,240,205,0.30)");
      beam.addColorStop(1, "rgba(255,240,205,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - w * 0.5, h);
      ctx.lineTo(w * 0.5 - w * 0.07, horizonY + h * 0.06);
      ctx.lineTo(w * 0.5 + w * 0.07, horizonY + h * 0.06);
      ctx.lineTo(w * 0.5 + w * 0.5, h);
      ctx.closePath(); ctx.fill();
    }
    return { horizonY, light };
  }

  // ---------------------------------------------------------------- the cab
  function drawCab(ctx, w, h, st) {
    const { speedMph, fuelPct, tempPct, odo, night, weather, wipers, grime, onFoot } = st;
    if (onFoot) return;
    const dashTop = h * 0.76;

    // windshield grime and rain, before the dash covers the bottom
    if (grime > 0.02) {
      ctx.fillStyle = `rgba(120,104,78,${Math.min(0.3, grime * 0.3)})`;
      ctx.fillRect(0, 0, w, dashTop);
    }
    if (weather === "rain") {
      ctx.fillStyle = "rgba(190,210,230,0.5)";
      for (let i = 0; i < 40; i++) {
        const t = (performance.now() / 900 + i * 0.137) % 1;
        const dx = (i * 97) % w, dy = t * dashTop;
        ctx.globalAlpha = 0.35 + (i % 4) * 0.1;
        ctx.beginPath(); ctx.ellipse(dx, dy, 1.6, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (wipers && weather === "rain") {                     // a wiper sweeping across
      const t = (performance.now() / 1100) % 1;
      const ang = Math.sin(t * Math.PI * 2) * 0.75;
      ctx.save();
      ctx.translate(w * 0.34, h * 0.92);
      ctx.rotate(-Math.PI / 2 + ang);
      ctx.strokeStyle = "rgba(18,20,26,0.85)";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(h * 0.62, 0); ctx.stroke();
      ctx.restore();
    }

    // A-pillars and roof edge
    ctx.fillStyle = "#14161c";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w * 0.07, 0); ctx.lineTo(0, h * 0.34); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, 0); ctx.lineTo(w * 0.93, 0); ctx.lineTo(w, h * 0.34); ctx.closePath(); ctx.fill();
    ctx.fillRect(0, 0, w, h * 0.045);

    // rear-view mirror
    ctx.fillStyle = "#1b1e25";
    const mw = w * 0.2, mx = w * 0.5 - mw / 2, my = h * 0.045;
    ctx.fillRect(mx, my, mw, h * 0.075);
    ctx.fillStyle = night ? "#0a0c14" : "#39424e";
    ctx.fillRect(mx + 3, my + 3, mw - 6, h * 0.075 - 6);
    if (night) {                                            // a pair of lights a long way back
      ctx.fillStyle = "rgba(255,230,180,0.5)";
      ctx.fillRect(mx + mw * 0.42, my + h * 0.03, 3, 3);
      ctx.fillRect(mx + mw * 0.53, my + h * 0.03, 3, 3);
    }

    // dashboard
    const dash = ctx.createLinearGradient(0, dashTop, 0, h);
    dash.addColorStop(0, "#1c1f26");
    dash.addColorStop(1, "#0d0f14");
    ctx.fillStyle = dash;
    ctx.beginPath();
    ctx.moveTo(0, dashTop + h * 0.04);
    ctx.quadraticCurveTo(w * 0.5, dashTop - h * 0.035, w, dashTop + h * 0.04);
    ctx.lineTo(w, h); ctx.lineTo(0, h);
    ctx.closePath(); ctx.fill();

    // steering wheel
    ctx.strokeStyle = "#191c23";
    ctx.lineWidth = Math.max(10, w * 0.022);
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 1.2, h * 0.36, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();

    // gauges
    const gaugeY = dashTop + h * 0.1;
    const gauge = (cx, r, frac, label, warn) => {
      ctx.beginPath(); ctx.arc(cx, gaugeY, r, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0c11"; ctx.fill();
      ctx.strokeStyle = "#2c313c"; ctx.lineWidth = 2; ctx.stroke();
      const a0 = Math.PI * 0.78, a1 = Math.PI * 2.22;
      ctx.beginPath(); ctx.arc(cx, gaugeY, r * 0.82, a0, a1);
      ctx.strokeStyle = warn ? "#c8442f" : "#3a4150"; ctx.lineWidth = 3; ctx.stroke();
      const a = a0 + (a1 - a0) * Math.max(0, Math.min(1, frac));
      ctx.beginPath();
      ctx.moveTo(cx, gaugeY);
      ctx.lineTo(cx + Math.cos(a) * r * 0.74, gaugeY + Math.sin(a) * r * 0.74);
      ctx.strokeStyle = warn ? "#ff6a52" : "#e8b04b"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = "#79828f";
      ctx.font = `600 ${Math.round(r * 0.42)}px Overpass, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, cx, gaugeY + r * 1.5);
    };
    const r = Math.min(h * 0.05, w * 0.05);
    gauge(w * 0.5 - r * 3.4, r, speedMph / 100, "MPH", false);
    gauge(w * 0.5, r * 1.25, speedMph / 100, "", false);
    gauge(w * 0.5 + r * 3.4, r, fuelPct / 100, "FUEL", fuelPct < 15);
    gauge(w * 0.5 + r * 6.2, r * 0.8, tempPct, "TEMP", tempPct > 0.82);

    // speed and odometer in the middle gauge
    ctx.fillStyle = "#e8eaee";
    ctx.font = `700 ${Math.round(r * 0.9)}px Overpass, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(Math.round(speedMph)), w * 0.5, gaugeY + r * 0.3);
    ctx.fillStyle = "#5c6673";
    ctx.font = `600 ${Math.round(r * 0.42)}px Overpass, sans-serif`;
    ctx.fillText(Math.round(odo).toLocaleString() + " mi", w * 0.5, gaugeY + r * 1.0);
  }

  return { draw, drawCab, daylight, skyColors };
})();
