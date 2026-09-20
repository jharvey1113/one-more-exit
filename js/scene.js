/* One More Exit — the world behind the road.

   Six bands of country, each moving at its own speed: sky, weather, far
   terrain, middle distance, roadside, and the foreground that whips past the
   edge of the frame. Every band asks the asset layer for artwork first and
   paints itself only if there isn't any, so this file is both the placeholder
   art and the frame that finished art hangs on.

   Aerial perspective does most of the work: the further a band is, the more it
   is mixed into the haze colour of the sky it sits against. That single rule
   is what makes flat shapes read as distance. */
window.OME_SCENE = (() => {
  const A = window.OME_ASSETS;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  // Accepts #abc, #aabbcc and rgb()/rgba() — anything else reads as black
  // rather than poisoning a gradient with NaN.
  const parse = c => {
    if (typeof c !== "string") return [0, 0, 0];
    if (c[0] === "#") {
      const hex = c.length === 4 ? c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c.slice(1, 7);
      const n = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
      return n.map(v => isFinite(v) ? v : 0);
    }
    const n = (c.match(/-?\d+/g) || []).slice(0, 3).map(Number);
    return [n[0] || 0, n[1] || 0, n[2] || 0];
  };
  const mix = (a, b, t) => {
    const [r1, g1, b1] = parse(a), [r2, g2, b2] = parse(b);
    return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
  };
  const shade = (c, t) => t < 0 ? mix(c, "#05070c", -t) : mix(c, "#ffffff", t);
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const noise = (x, s) => {                       // smooth 1D value noise
    const i = Math.floor(x / s), f = (x / s) - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i), hash(i + 1), u);
  };

  // ------------------------------------------------------------------ sky
  const SKY = [
    { h: 0,    c: ["#05070f", "#080b16", "#0d1220"] },
    { h: 4.3,  c: ["#070b1c", "#0d1430", "#1b2442"] },
    { h: 5.5,  c: ["#122a52", "#4a3f63", "#b06a52"] },   // dawn
    { h: 6.4,  c: ["#1d4a80", "#7d7f9c", "#e09a6a"] },
    { h: 7.6,  c: ["#2f6099", "#87a2bd", "#e8c39a"] },
    { h: 10,   c: ["#2b6aab", "#6ea0c8", "#c9dfee"] },
    { h: 13,   c: ["#25659f", "#6fa3cf", "#cfe3ee"] },
    { h: 16,   c: ["#2f6ea8", "#84a6c4", "#dcc79e"] },
    { h: 17.8, c: ["#2b5f9c", "#8f8fa4", "#e8b382"] },   // golden hour
    { h: 18.8, c: ["#25457c", "#7a5f77", "#e79355"] },
    { h: 19.6, c: ["#182a55", "#4c3a5e", "#cc5f33"] },   // sunset
    { h: 20.3, c: ["#0e1738", "#2a2144", "#7a2f36"] },
    { h: 21.2, c: ["#080e26", "#141633", "#2e1b33"] },
    { h: 22.5, c: ["#06091a", "#0a0f22", "#141a2e"] },
    { h: 24,   c: ["#05070f", "#080b16", "#0d1220"] }
  ];
  function skyStops(hour) {
    for (let i = 0; i < SKY.length - 1; i++) {
      if (hour >= SKY[i].h && hour <= SKY[i + 1].h) {
        const t = (hour - SKY[i].h) / (SKY[i + 1].h - SKY[i].h);
        return SKY[i].c.map((c, k) => mix(c, SKY[i + 1].c[k], t));
      }
    }
    return SKY[0].c;
  }
  function daylight(hour) {
    if (hour < 4.6 || hour > 20.8) return 0.07;
    if (hour < 6.4) return 0.07 + (hour - 4.6) / 1.8 * 0.48;
    if (hour < 8) return 0.55 + (hour - 6.4) / 1.6 * 0.45;
    if (hour < 16.6) return 1;
    if (hour < 19) return 1 - (hour - 16.6) / 2.4 * 0.5;
    return 0.5 - (hour - 19) / 1.8 * 0.43;
  }
  // Where the sun is across the windshield, and how low. Driving east means
  // the sun rises ahead of you and sets in the mirror.
  function sunAt(hour, w, h, horizon) {
    const arc = (hour - 5.4) / 14.6;
    const up = Math.sin(clamp01(arc) * Math.PI);
    return { arc, up, low: 1 - up, visible: arc > -0.08 && arc < 1.1 && daylight(hour) > 0.1,
             x: w * (1.06 - arc * 1.12), y: horizon - up * h * 0.5 };
  }

  // --------------------------------------------------------------- weather
  // Presentation only — the game says "rain" and this decides whether that
  // rain has a thunderhead in it and where the lightning goes.
  let flash = 0, flashAt = 0;
  function stormy(kind, mile) { return kind === "rain" && hash(Math.floor(mile / 60)) > 0.55; }

  function sky(ctx, w, h, env) {
    const { hour, weather, mile } = env;
    const horizon = env.horizon;
    const stops = skyStops(hour);
    const light = daylight(hour);
    const storm = stormy(weather, mile);
    const overcast = weather === "rain" || weather === "snow" || weather === "fog" ? (storm ? 0.75 : 0.5) : 0;

    const g = ctx.createLinearGradient(0, 0, 0, horizon + h * 0.12);
    stops.forEach((c, i) => {
      const dull = overcast ? mix(c, storm ? "#2a2c33" : "#525a63", overcast * 0.8) : c;
      g.addColorStop(i / (stops.length - 1), dull);
    });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, horizon + h * 0.14);

    if (light < 0.32 && overcast < 0.4) stars(ctx, w, horizon, light, env.sway);
    const sun = sunAt(hour, w, h, horizon);
    if (sun.visible && overcast < 0.65) celestial(ctx, w, h, horizon, sun, overcast, env.sway);
    else if (light <= 0.32 && overcast < 0.5) moon(ctx, w, h, horizon, stops[0], env.sway);
    clouds(ctx, w, h, horizon, env, sun, overcast, storm);
    if (storm) lightning(ctx, w, h, horizon, env);
    return { stops, light, sun, storm, overcast };
  }

  function stars(ctx, w, horizon, light, sway) {
    const fade = Math.max(0, 1 - light * 3.2);
    for (let i = 0; i < A.count(130); i++) {
      const sx = ((hash(i * 3.1) * w + (sway || 0) * 16) % w + w) % w;
      const sy = hash(i * 7.3) * horizon * 0.92;
      ctx.globalAlpha = (0.1 + hash(i * 11.7) * 0.6) * fade;
      ctx.fillStyle = hash(i * 2.2) > 0.9 ? "#cfe0ff" : "#ffffff";
      const s = hash(i) > 0.94 ? 1.9 : 1.1;
      ctx.fillRect(sx, sy, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function celestial(ctx, w, h, horizon, sun, overcast, sway) {
    const x = sun.x + (sway || 0) * 30, y = sun.y;
    const core = mix("#fff8dc", "#ff7434", Math.pow(sun.low, 1.3) * 0.9);
    const rgba = (c, a) => c.replace("rgb(", "rgba(").replace(")", `,${a})`);
    const disc = h * (0.016 + sun.low * 0.014);
    // a tight disc, a close halo, and a wide low-strength bloom
    const halo = ctx.createRadialGradient(x, y, disc * 0.6, x, y, disc * 4.5);
    halo.addColorStop(0, rgba(core, 0.85 * (1 - overcast)));
    halo.addColorStop(1, rgba(core, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(x - disc * 5, y - disc * 5, disc * 10, disc * 10);
    const bloom = ctx.createRadialGradient(x, y, disc, x, y, h * (0.3 + sun.low * 0.34));
    bloom.addColorStop(0, rgba(core, (0.22 + sun.low * 0.16) * (1 - overcast)));
    bloom.addColorStop(0.45, rgba(mix(core, "#ff6a20", 0.5), 0.07 * (1 - overcast)));
    bloom.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, horizon + h * 0.22);
    if (sun.low > 0.45) {                            // glare smeared along the glass
      const streak = ctx.createLinearGradient(x - w * 0.5, y, x + w * 0.5, y);
      streak.addColorStop(0, "rgba(0,0,0,0)");
      streak.addColorStop(0.5, rgba(core, (sun.low - 0.45) * 0.28 * (1 - overcast)));
      streak.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = streak;
      ctx.fillRect(0, y - h * 0.018, w, h * 0.036);
    }
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, disc, 0, Math.PI * 2);
    ctx.fill();
  }

  function moon(ctx, w, h, horizon, night, sway) {
    const x = w * 0.22 + (sway || 0) * 22, y = horizon * 0.3;
    const g = ctx.createRadialGradient(x, y, 2, x, y, h * 0.2);
    g.addColorStop(0, "rgba(214,226,248,0.42)");
    g.addColorStop(1, "rgba(214,226,248,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, horizon);
    ctx.fillStyle = "#e9ecf5";
    ctx.beginPath(); ctx.arc(x, y, h * 0.026, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = night;
    ctx.beginPath(); ctx.arc(x + h * 0.012, y - h * 0.009, h * 0.023, 0, Math.PI * 2); ctx.fill();
  }

  // Cloud decks: two layers at different speeds, lit from the sun's side.
  function clouds(ctx, w, h, horizon, env, sun, overcast, storm) {
    if (A.drawStrip(ctx, A.get("weather/clouds_high"), env.camZ / 9000, 0, w, horizon * 0.7, 0.55)) {
      A.drawStrip(ctx, A.get("weather/clouds_low"), env.camZ / 4200, horizon * 0.1, w, horizon * 0.7, 0.6);
      return;
    }
    const light = daylight(env.hour);
    const tint = sun.low > 0.55 ? mix("#ffd9a8", "#ff8a4a", sun.low - 0.4) : "#ffffff";
    // Clouds stack up toward the horizon the way they do over open country:
    // small and flat far away, taller and softer overhead.
    const count = A.count(overcast ? 13 : 8);
    for (let layer = 0; layer < 2; layer++) {
      const speed = layer ? 4200 : 9000;
      for (let i = 0; i < count; i++) {
        const seed = i * 5.9 + layer * 31 + Math.floor(env.camZ / 2600000);
        const depth = hash(seed * 2);                   // 0 overhead, 1 at the horizon
        const cy = horizon * (0.1 + Math.pow(depth, 0.6) * (layer ? 0.78 : 0.55));
        const near = 1 - depth * 0.7;
        const cw = w * (0.08 + hash(seed * 3) * 0.16) * near * (layer ? 1.2 : 0.9);
        const ch = horizon * (0.012 + hash(seed * 4) * 0.028) * near * (storm ? 2.2 : 1);
        const cx = ((hash(seed) * 1.6 - 0.3) * w + env.camZ / speed + (env.sway || 0) * (layer ? 30 : 16)) % (w * 1.8) - w * 0.4;
        const body = storm ? mix("#30353e", tint, 0.1 * light)
                   : overcast ? mix("#767d87", tint, 0.28 * light)
                   : mix("#f4f7fb", tint, 0.42);
        ctx.globalAlpha = ((storm ? 0.46 : overcast ? 0.32 : 0.13) + hash(seed * 6) * 0.14) * (0.5 + near * 0.5);
        ctx.fillStyle = body;
        for (let k = -2; k <= 2; k++) {                 // a ragged run of puffs
          const kw = cw * (0.2 + hash(seed * 7 + k) * 0.3);
          const kh = ch * (0.5 + hash(seed * 11 + k) * 0.8);
          ctx.beginPath();
          ctx.ellipse(cx + k * cw * 0.3, cy + Math.abs(k) * ch * 0.16, kw, kh, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha *= 0.55;                        // sun catching the top
        ctx.fillStyle = shade(body, 0.26);
        ctx.beginPath();
        ctx.ellipse(cx - cw * 0.12, cy - ch * 0.45, cw * 0.32, ch * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function lightning(ctx, w, h, horizon, env) {
    const now = performance.now();
    if (now - flashAt > 4200 && Math.random() < 0.02) { flashAt = now; flash = 1; }
    flash = Math.max(0, flash - 0.06);
    if (flash <= 0) return;
    const x = w * (0.2 + hash(Math.floor(flashAt)) * 0.6);
    const g = ctx.createRadialGradient(x, horizon * 0.35, 4, x, horizon * 0.35, h * 0.55);
    g.addColorStop(0, `rgba(226,236,255,${0.5 * flash})`);
    g.addColorStop(1, "rgba(226,236,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, horizon + h * 0.2);
  }

  // ----------------------------------------------------------- the terrain
  // Three bands. Each takes its colour from the theme, then gets mixed toward
  // the haze by depth — near ground reads solid, far ridges read like weather.
  function terrain(ctx, w, h, env, res) {
    const { theme, horizon } = env;
    const light = res.light;
    const hazeCol = airColour(env, res);
    const T = (k) => theme.b ? mix(theme.a[k], theme.b[k], theme.t) : theme.a[k];
    const arche = theme.b && theme.t > 0.5 ? theme.b.terrain : theme.a.terrain;
    const dir = theme.b && theme.t > 0.5 ? theme.b.dir : theme.a.dir;
    const urban = env.urban || 0;

    // How much land stands up depends on where you are: the Alleghenies get
    // twice the vertical of the Texas panhandle, which is the whole point.
    const RELIEF = { mountains: 1.6, hills: 1.5, forest: 1.15, mesas: 1.25, city: 1.05, plains: 0.62, farm: 0.6 };
    const relief = RELIEF[arche] || 1;
    const bands = [
      { key: "far",  col: T("far"),  depth: 0.6,  speed: 5200, height: 0.2 * relief,  art: `environments/${dir}/far` },
      { key: "mid",  col: T("mid"),  depth: 0.36, speed: 2400, height: 0.12 * relief, art: `environments/${dir}/mid` },
      { key: "near", col: T("near"), depth: 0.14, speed: 1000, height: 0.06 * relief, art: `environments/${dir}/near` }
    ];
    for (const band of bands) {
      const img = A.get(band.art);
      const top = horizon - h * band.height;
      if (img) {
        A.drawStrip(ctx, img, -env.camZ / band.speed, top, w, h * band.height + 2, 1);
        if (band.depth > 0.1) {                    // aerial perspective over art
          ctx.globalAlpha = band.depth * 0.75;
          ctx.fillStyle = hazeCol;
          ctx.fillRect(0, top, w, h * band.height + 2);
          ctx.globalAlpha = 1;
        }
        continue;
      }
      paintBand(ctx, w, h, env, res, {
        arche, col: mix(band.col, hazeCol, band.depth * 0.85),
        rim: mix(band.col, res.sun && res.sun.low > 0.4 ? "#ffb070" : "#e8f0ff", 0.35),
        speed: band.speed, height: band.height, depth: band.depth, urban
      });
    }
    groundPlane(ctx, w, h, env, res, T("ground"), hazeCol);
  }

  // The colour distance is made of. Everything far away is mixed toward this,
  // and because it leans on the sky rather than the ground, the land separates
  // into layers instead of becoming one wash of the same colour.
  function airColour(env, res) {
    const { weather, theme } = env;
    const themeHaze = theme.b ? mix(theme.a.haze, theme.b.haze, theme.t) : theme.a.haze;
    const base = weather === "fog" ? "#c2cbcd"
      : weather === "dust" ? (theme.b ? mix(theme.a.dust, theme.b.dust, theme.t) : theme.a.dust)
      : weather === "snow" ? "#d7dee4"
      : res.storm ? "#4a515c"
      : themeHaze;
    const lit = shade(base, -0.5 + res.light * 0.55);
    return mix(lit, res.stops[2], 0.62);       // mostly sky, which is what haze is
  }

  // One silhouette band, painted as a filled path with a vertical gradient and
  // a lit top edge. Shape comes from the archetype.
  function paintBand(ctx, w, h, env, res, o) {
    const horizon = env.horizon;
    const base = horizon + 2;
    const top = h * o.height;
    const off = env.camZ / o.speed + (env.sway || 0) * (40 * (1 - o.depth));
    const step = o.arche === "city" ? 18 : o.arche === "mesas" ? 22 : 9;
    const g = ctx.createLinearGradient(0, base - top, 0, base);
    g.addColorStop(0, shade(o.col, 0.1));
    g.addColorStop(1, shade(o.col, -0.25));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-10, base);
    const pts = [];
    for (let x = -10; x <= w + 20; x += step) {
      const wx = x + off;
      let y = base;
      // Three octaves of noise: the big shape, the ridges on it, the rocks.
      // The periods are fractions of the viewport, so a phone sees the same
      // country a laptop does instead of one enormous smooth hill.
      const P = Math.max(240, w);
      const ridge = (a, b, c) => noise(wx, P * a) * 0.62 + noise(wx, P * b) * 0.26 + noise(wx, P * c) * 0.12;
      switch (o.arche) {
        case "mountains":
          y = base - top * (0.3 + ridge(0.8, 0.26, 0.08) * 0.95);
          break;
        case "mesas": {
          const span = Math.max(150, P * 0.5);
          const b = Math.floor((wx + 4000) / span);
          const plateau = 0.4 + hash(b) * 0.55;
          const inBlock = (((wx + 4000) % span) / span);
          y = base - top * (inBlock > 0.12 && inBlock < 0.88 ? plateau : plateau * 0.25 + noise(wx, P * 0.2) * 0.15);
          break;
        }
        case "plains":
          y = base - top * (0.08 + ridge(1.6, 0.5, 0.14) * 0.34);
          break;
        case "forest":                              // a mass of crowns, not a line
          y = base - top * (0.28 + noise(wx, P * 0.42) * 0.36 + hash(Math.floor(wx / 7)) * 0.42);
          break;
        case "farm":                                // flat, with a windbreak now and then
          y = base - top * (0.1 + noise(wx, P * 1.1) * 0.22 + (hash(Math.floor(wx / (P * 0.2))) > 0.78 ? 0.6 : 0.04));
          break;
        case "hills":
          y = base - top * (0.3 + ridge(0.62, 0.2, 0.07) * 0.92);
          break;
        case "city": {
          const b = Math.floor((wx + 2000) / Math.max(30, P * 0.075));
          const tall = hash(b * 3.1);
          y = base - top * (0.14 + hash(b) * (tall > 0.86 ? 1 : tall > 0.6 ? 0.55 : 0.28));
          break;
        }
        default: y = base - top * 0.3;
      }
      pts.push([x, y]);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 20, base); ctx.closePath(); ctx.fill();

    // lit rim along the skyline, on the side the sun is on
    if (res.light > 0.15 && o.depth < 0.7) {
      ctx.strokeStyle = o.rim;
      ctx.globalAlpha = 0.28 * (1 - o.depth) * res.light;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (o.urban > 0.02 && o.depth < 0.45) cityOverlay(ctx, w, h, env, res, o);
  }

  // Towns announce themselves before you reach them: water towers, stacks,
  // a grain elevator, a motel sign that is on at night.
  function cityOverlay(ctx, w, h, env, res, o) {
    const base = env.horizon + 2, off = env.camZ / o.speed;
    ctx.globalAlpha = Math.min(1, o.urban) * 0.9;
    for (let i = 0; i < 9; i++) {
      const seed = i * 4.7 + Math.floor(env.camZ / 90000);
      const x = ((hash(seed) * w * 1.4 - off * 0.2) % (w * 1.4) + w * 1.4) % (w * 1.4) - w * 0.2;
      const bh = h * o.height * (0.4 + hash(seed * 2) * 0.9);
      const bw = 8 + hash(seed * 3) * 26;
      ctx.fillStyle = shade(o.col, -0.3);
      ctx.fillRect(x, base - bh, bw, bh);
      if (hash(seed * 5) > 0.7) {                  // a stack or a tower
        ctx.fillRect(x + bw * 0.4, base - bh * 1.5, 3, bh * 0.5);
      }
      if (res.light < 0.35) {                      // lit windows
        ctx.fillStyle = "rgba(255,214,140,0.55)";
        for (let k = 0; k < 4; k++) {
          if (hash(seed * 7 + k) > 0.55) ctx.fillRect(x + 2 + (k % 2) * 5, base - bh + 4 + Math.floor(k / 2) * 7, 2.5, 3);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // The ground the road sits on, with grain that scrolls at road speed.
  function groundPlane(ctx, w, h, env, res, ground, hazeCol) {
    const horizon = env.horizon;
    // The ground darkens toward the car — that value run is most of what sells
    // the distance between here and the horizon.
    const lit = mix(shade(ground, -0.5 + res.light * 0.6), hazeCol, 0.08);
    const g = ctx.createLinearGradient(0, horizon, 0, h);
    g.addColorStop(0, mix(lit, hazeCol, 0.46));     // meets the near band's value
    g.addColorStop(0.14, mix(lit, hazeCol, 0.2));
    g.addColorStop(0.45, lit);
    g.addColorStop(1, shade(lit, -0.38));
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, w, h - horizon);

    const shift = (env.camZ / 24) % 1009;
    const pale = new Path2D(), dark = new Path2D();
    for (let i = 0; i < A.count(620); i++) {
      const t = hash(i * 1.7);
      const y = horizon + Math.pow(t, 2.2) * (h - horizon);
      const x = ((hash(i * 3.3) * w * 1.4) + shift * (0.12 + t * 1.7)) % (w * 1.4) - w * 0.2;
      const s = 0.5 + (y - horizon) / (h - horizon) * 2.3;
      (hash(i * 7.7) > 0.5 ? pale : dark).rect(x, y, s, s * 0.7);
    }
    ctx.globalAlpha = 0.1 * (0.4 + res.light * 0.6);
    ctx.fillStyle = "#ffffff"; ctx.fill(pale);
    ctx.fillStyle = "#000000"; ctx.fill(dark);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------- the air
  // Haze sitting on the horizon, and whatever is falling through it.
  function air(ctx, w, h, env, res) {
    const col = airColour(env, res);
    const strength = env.weather === "fog" ? 0.9 : env.weather === "dust" ? 0.66
                   : env.weather === "snow" ? 0.5 : res.storm ? 0.58
                   : env.weather === "rain" ? 0.48 : 0.34;
    const g = ctx.createLinearGradient(0, env.horizon - h * 0.05, 0, env.horizon + h * 0.32);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = strength;
    ctx.fillStyle = g;
    ctx.fillRect(0, env.horizon - h * 0.06, w, h * 0.4);
    ctx.globalAlpha = 1;

    if (env.weather === "fog") {                   // banks that drift past
      for (let i = 0; i < 5; i++) {
        const seed = i * 8.3 + Math.floor(env.camZ / 30000);
        const y = env.horizon + (i / 5) * (h - env.horizon) * 0.7;
        const x = ((hash(seed) * w * 2 + env.camZ / (300 + i * 260)) % (w * 2)) - w * 0.5;
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(x, y, w * (0.4 + hash(seed * 2) * 0.4), h * 0.045, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (res.light > 0.85 && (env.theme.a.humid < 0.2) && env.weather === "clear") heat(ctx, w, h, env);
  }

  function heat(ctx, w, h, env) {                  // shimmer off hot asphalt
    for (let i = 0; i < 18; i++) {
      ctx.globalAlpha = 0.04 - i * 0.0018;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(w * 0.16 + Math.sin(i * 0.9 + env.camZ / 700) * 16, env.horizon + 4 + i * 1.8, w * 0.68, 1.4);
    }
    ctx.globalAlpha = 1;
  }

  // Rain, snow and dust, drawn in front of the land and behind the glass.
  function precipitation(ctx, w, h, env, res) {
    const t = performance.now();
    if (env.weather === "rain") {
      const sheets = A.quality.v < 0.8 ? 1 : res.storm ? 3 : 2;
      ctx.strokeStyle = res.light < 0.3 ? "rgba(210,225,250,0.45)" : "rgba(214,228,244,0.38)";
      for (let layer = 0; layer < sheets; layer++) {
        const n = A.count(34 + layer * 16), speed = 900 + layer * 900, len = 10 + layer * 9;
        ctx.lineWidth = 0.8 + layer * 0.5;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = (hash(i * 3.3 + layer) * w * 1.2 + t / 9 * (1 + layer)) % (w * 1.2) - w * 0.1;
          const y = (hash(i * 7.1 + layer) * h + t / speed * h * 3.4) % h;
          ctx.moveTo(x, y); ctx.lineTo(x - 3 - layer, y + len);
        }
        ctx.stroke();
      }
    } else if (env.weather === "snow") {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < A.count(70); i++) {
        const drift = Math.sin(t / 1400 + i) * 22;
        const x = (hash(i * 2.7) * w + drift + t / 90) % w;
        const y = (hash(i * 5.9) * h + t / 22) % h;
        const r = 1 + hash(i) * 2.2;
        ctx.globalAlpha = 0.35 + hash(i * 3) * 0.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (env.weather === "dust") {
      for (let i = 0; i < 26; i++) {
        const y = env.horizon + hash(i * 4.1) * (h - env.horizon) * 0.9;
        const x = (hash(i * 6.3) * w * 1.3 + t / 60 * (1 + hash(i))) % (w * 1.3) - w * 0.15;
        ctx.globalAlpha = 0.05 + hash(i * 2.2) * 0.1;
        ctx.fillStyle = env.theme.a.dust;
        ctx.beginPath();
        ctx.ellipse(x, y, 40 + hash(i * 9) * 130, 4 + hash(i * 5) * 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  // The very front of the frame: whatever is close enough to blur past.
  function foreground(ctx, w, h, env, res) {
    const img = A.get(`environments/${env.theme.a.dir}/foreground`);
    if (img) { A.drawStrip(ctx, img, -env.camZ / 90, h * 0.82, w, h * 0.18, 0.9); return; }
    const dens = env.theme.a.density;
    if (dens < 0.2) return;
    const off = env.camZ / 60;
    ctx.fillStyle = shade(env.theme.a.near, -0.6 + res.light * 0.25);
    for (let i = 0; i < 12; i++) {
      const period = w * 1.6;
      const x = ((hash(i * 5.3) * period - off) % period + period) % period - w * 0.3;
      if (x > w * 0.2 && x < w * 0.8) continue;   // only the edges, never the road
      const hgt = h * (0.05 + hash(i * 2.1) * 0.12) * dens;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + 6, h - hgt * 0.7, x + hash(i) * 14 - 7, h - hgt);
      ctx.quadraticCurveTo(x + 10, h - hgt * 0.4, x + 16, h);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return { sky, terrain, air, precipitation, foreground, skyStops, daylight, sunAt,
           airColour, stormy, mix, shade, hash, noise, parse };
})();
