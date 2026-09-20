/* One More Exit — the vehicle you are actually in.

   Two views of the same drive, because on a phone they do different jobs:

     cockpit — the default. You are behind the glass of the vehicle you chose,
               with its own dash, mirror and gauges. The road fills the frame,
               which is what a small screen wants.
     chase   — over the back of the vehicle, so you can see the thing you have
               been keeping alive: body, wheels, lights, load in the bed.

   Both look for artwork first:
     assets/vehicles/<id>/cockpit   — dash and pillars, glass area transparent
     assets/vehicles/<id>/rear      — the vehicle from behind, transparent
   and paint a stand-in when it isn't there. */
window.OME_VEHICLE = (() => {
  const A = window.OME_ASSETS, S = window.OME_SCENE;
  const { mix, shade, hash } = S;
  const clamp01 = v => Math.max(0, Math.min(1, v));

  // Body shapes, until real artwork arrives. Proportions matter more than
  // detail here — a Suburban should read as a Suburban at a glance.
  const BODY = {
    ranger:   { kind: "truck", w: 1,    h: 0.78, paint: "#8c3f33", roof: 0.52 },
    civic:    { kind: "car",   w: 0.88, h: 0.66, paint: "#5c6a76", roof: 0.6 },
    voyager:  { kind: "van",   w: 1.02, h: 0.92, paint: "#7a7f86", roof: 0.82 },
    suburban: { kind: "suv",   w: 1.12, h: 0.96, paint: "#2f3a42", roof: 0.78 },
    diesel:   { kind: "car",   w: 0.95, h: 0.7,  paint: "#c6bda4", roof: 0.58 },
    wagon:    { kind: "wagon", w: 0.95, h: 0.78, paint: "#7d3f36", roof: 0.72 },
    bronco:   { kind: "suv",   w: 1.05, h: 0.9,  paint: "#2d5a4a", roof: 0.72 },
    moto:     { kind: "moto",  w: 0.36, h: 0.62, paint: "#3a3f45", roof: 0 }
  };
  const bodyOf = id => BODY[id] || BODY.ranger;

  function draw(ctx, w, h, st) {
    if (st.onFoot) return onFoot(ctx, w, h, st);
    return st.view === "chase" ? chase(ctx, w, h, st) : cockpit(ctx, w, h, st);
  }

  // ---------------------------------------------------------------- chase
  function chase(ctx, w, h, st) {
    const b = bodyOf(st.vehicleId);
    const night = st.night, light = night ? 0.2 : 1;
    const t = performance.now();
    // the body rides on its springs: a slow float plus whatever the road did
    const bob = Math.sin(t / 640) * h * 0.004 + Math.sin(t / 211) * h * 0.0016
              + (st.pitch || 0) * h * 0.5;
    const lean = (st.sway || 0) * 0.12;
    const scale = Math.min(w * 0.33, h * 0.46);
    const cx = w / 2 + (st.sway || 0) * w * 0.06;
    const cy = h * 0.8 + bob;

    ctx.save();
    ctx.globalAlpha = 0.3;                          // contact shadow
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(cx, cy + scale * 0.03, scale * b.w * 0.56, scale * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const img = A.get(`vehicles/${st.vehicleId}/rear`);
    ctx.translate(cx, cy);
    ctx.rotate(lean * 0.1);
    if (img) {
      const hh = scale * b.h * 1.2, ww = hh * (img.width / img.height);
      ctx.drawImage(img, -ww / 2, -hh, ww, hh);
    } else {
      paintRear(ctx, scale, b, st, night);
    }
    ctx.restore();

    if (night) {                                    // what the headlights do ahead
      const g = ctx.createLinearGradient(0, h * 0.55, 0, h);
      g.addColorStop(0, "rgba(255,238,200,0.16)");
      g.addColorStop(1, "rgba(255,238,200,0)");
      ctx.fillStyle = g; ctx.fillRect(0, h * 0.5, w, h * 0.5);
    }
    if (st.weather === "rain") spray(ctx, w, h, cx, cy, scale);
    return { view: "chase" };
  }

  function paintRear(ctx, s, b, st, night) {
    const wear = clamp01(1 - (st.vehicleCond || 90) / 100);
    const paint = mix(b.paint, "#6a6257", wear * 0.45);
    const body = night ? shade(paint, -0.55) : paint;
    const W = s * b.w, H = s * b.h;

    if (b.kind === "moto") {
      ctx.fillStyle = shade(body, -0.2);
      ctx.fillRect(-W * 0.5, -H * 0.9, W, H * 0.55);
      ctx.fillStyle = "#15181d";
      ctx.beginPath(); ctx.ellipse(0, -H * 0.16, W * 0.34, H * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = night ? "#ff4a32" : "#8e2a20";
      ctx.fillRect(-W * 0.16, -H * 0.82, W * 0.32, H * 0.1);
      return;
    }
    // wheels first, so the body sits over them
    ctx.fillStyle = "#14171c";
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx * W * 0.46, -H * 0.12, W * 0.11, H * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // lower body
    const g = ctx.createLinearGradient(0, -H, 0, 0);
    g.addColorStop(0, shade(body, 0.16));
    g.addColorStop(0.55, body);
    g.addColorStop(1, shade(body, -0.35));
    ctx.fillStyle = g;
    roundRect(ctx, -W * 0.52, -H * 0.72, W * 1.04, H * 0.66, s * 0.03);
    // cab / roof
    const roofH = H * b.roof;
    ctx.fillStyle = shade(body, 0.06);
    const topW = b.kind === "truck" ? W * 0.74 : W * 0.92;
    roundRect(ctx, -topW / 2, -H * 0.72 - roofH * 0.62, topW, roofH * 0.66, s * 0.025);
    // back glass
    ctx.fillStyle = night ? "rgba(18,22,30,0.9)" : "rgba(120,138,150,0.55)";
    roundRect(ctx, -topW * 0.4, -H * 0.72 - roofH * 0.52, topW * 0.8, roofH * 0.4, s * 0.015);
    if (b.kind === "truck") {                        // a bed with something in it
      ctx.fillStyle = shade(body, -0.28);
      ctx.fillRect(-W * 0.5, -H * 0.72, W, H * 0.1);
      ctx.fillStyle = mix("#6b6253", "#3a352c", 0.5);
      ctx.fillRect(-W * 0.3, -H * 0.86, W * 0.34, H * 0.16);
      ctx.fillRect(W * 0.04, -H * 0.8, W * 0.22, H * 0.1);
    }
    // lights
    const tail = night ? "#ff3a22" : "#8e2a1e";
    for (const sx of [-1, 1]) {
      const lx = sx * W * 0.4 - (sx > 0 ? 0 : W * 0.12);
      ctx.fillStyle = shade(body, -0.45);                 // housing
      ctx.fillRect(lx - W * 0.012, -H * 0.55 - H * 0.012, W * 0.144, H * 0.104);
      ctx.fillStyle = tail;
      ctx.fillRect(lx, -H * 0.55, W * 0.12, H * 0.08);
    }
    if (night) {
      for (const sx of [-1, 1]) {
        const gl = ctx.createRadialGradient(sx * W * 0.4, -H * 0.51, 1, sx * W * 0.4, -H * 0.51, W * 0.19);
        gl.addColorStop(0, "rgba(255,60,38,0.42)");
        gl.addColorStop(1, "rgba(255,60,38,0)");
        ctx.fillStyle = gl;
        ctx.fillRect(sx * W * 0.4 - W * 0.2, -H * 0.72, W * 0.4, H * 0.42);
      }
    }
    if (wear > 0.35) {                               // rust and a mismatched panel
      ctx.globalAlpha = wear * 0.4;
      ctx.fillStyle = "#6b3a1f";
      ctx.fillRect(-W * 0.5, -H * 0.24, W * 0.3, H * 0.12);
      ctx.fillRect(W * 0.18, -H * 0.2, W * 0.24, H * 0.08);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(230,236,240,0.7)";         // plate
    ctx.fillRect(-W * 0.09, -H * 0.4, W * 0.18, H * 0.1);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }

  function spray(ctx, w, h, cx, cy, s) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#cdd7de";
    for (let i = 0; i < 14; i++) {
      const t = (performance.now() / 260 + i) % 6;
      ctx.beginPath();
      ctx.ellipse(cx + (hash(i) - 0.5) * s * 1.3, cy - t * s * 0.05, s * (0.06 + t * 0.03), s * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // -------------------------------------------------------------- cockpit
  function cockpit(ctx, w, h, st) {
    const b = bodyOf(st.vehicleId);
    const grime = st.grime || 0, pitch = st.pitch || 0, sway = st.sway || 0;
    const dashTop = h * (0.74 + pitch * 0.5);
    const night = st.night;

    if (grime > 0.02) glassGrime(ctx, w, dashTop, grime);
    if (st.weather === "rain") rainGlass(ctx, w, h, dashTop);
    if (st.weather === "snow") snowGlass(ctx, w, dashTop);

    const art = A.get(`vehicles/${st.vehicleId}/cockpit`);
    if (art) {
      ctx.drawImage(art, 0, h - art.height * (w / art.width), w, art.height * (w / art.width));
    } else {
      paintCockpit(ctx, w, h, st, b, dashTop, sway, night);
    }
    gauges(ctx, w, h, st, dashTop, night);
    return { view: "cockpit" };
  }

  function paintCockpit(ctx, w, h, st, b, dashTop, sway, night) {
    const trim = b.kind === "truck" || b.kind === "suv" ? "#20242c" : "#1b1f26";
    ctx.fillStyle = mix(trim, "#000000", 0.35);      // pillars
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.08, 0); ctx.lineTo(0, h * 0.36); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w * 0.92, 0); ctx.lineTo(w, h * 0.36); ctx.closePath(); ctx.fill();
    const roof = ctx.createLinearGradient(0, 0, 0, h * 0.07);
    roof.addColorStop(0, "#0b0d11"); roof.addColorStop(1, mix(trim, "#000000", 0.1));
    ctx.fillStyle = roof; ctx.fillRect(0, 0, w, h * 0.055);

    const mw = w * 0.2, mx = w * 0.5 - mw / 2 + sway * 10, my = h * 0.055;
    ctx.fillStyle = mix(trim, "#000000", 0.2);
    roundRect(ctx, mx, my, mw, h * 0.075, 5);
    ctx.fillStyle = night ? "#0a0e15" : "#3f4a56";
    roundRect(ctx, mx + 3, my + 3, mw - 6, h * 0.075 - 6, 4);
    if (night) {
      ctx.fillStyle = "rgba(255,225,170,0.5)";
      ctx.fillRect(mx + mw * 0.42, my + h * 0.032, 3, 3);
      ctx.fillRect(mx + mw * 0.56, my + h * 0.032, 3, 3);
    }

    const dash = ctx.createLinearGradient(0, dashTop - h * 0.05, 0, h);
    dash.addColorStop(0, shade(trim, 0.12));
    dash.addColorStop(0.35, trim);
    dash.addColorStop(1, "#090b0f");
    ctx.fillStyle = dash;
    ctx.beginPath();
    ctx.moveTo(0, dashTop + h * 0.03);
    ctx.quadraticCurveTo(w * 0.5, dashTop - h * 0.05, w, dashTop + h * 0.03);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    ctx.globalAlpha = 0.07;                          // dash reflected in the glass
    ctx.fillStyle = "#93a5ba";
    ctx.beginPath();
    ctx.moveTo(w * 0.08, dashTop - h * 0.03);
    ctx.quadraticCurveTo(w * 0.5, dashTop - h * 0.16, w * 0.92, dashTop - h * 0.03);
    ctx.quadraticCurveTo(w * 0.5, dashTop - h * 0.06, w * 0.08, dashTop - h * 0.03);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();                                      // wheel turns with the road
    ctx.translate(w * 0.5, h * 1.19);
    ctx.rotate(sway * 0.1);
    ctx.strokeStyle = shade(trim, -0.4);
    ctx.lineWidth = Math.max(12, w * 0.026);
    ctx.beginPath(); ctx.arc(0, 0, h * 0.35, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    ctx.strokeStyle = "rgba(128,116,98,0.18)"; ctx.lineWidth = 1.1;
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * 1.2 + Math.PI * 0.6 * (i / 21);
      const rx = Math.cos(a) * h * 0.35, ry = Math.sin(a) * h * 0.35;
      ctx.beginPath(); ctx.moveTo(rx, ry - 5); ctx.lineTo(rx, ry + 5); ctx.stroke();
    }
    ctx.restore();
  }

  function gauges(ctx, w, h, st, dashTop, night) {
    const gy = dashTop + h * 0.1, r = Math.min(h * 0.05, w * 0.05);
    const face = (cx, rr, frac, label, warn) => {
      const f = ctx.createRadialGradient(cx - rr * 0.3, gy - rr * 0.35, rr * 0.1, cx, gy, rr);
      f.addColorStop(0, "#1c212a"); f.addColorStop(1, "#070a0e");
      ctx.beginPath(); ctx.arc(cx, gy, rr, 0, Math.PI * 2); ctx.fillStyle = f; ctx.fill();
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
        ctx.fillStyle = "#6b7583";
        ctx.font = `600 ${Math.round(rr * 0.4)}px Overpass, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(label, cx, gy + rr * 1.5);
      }
    };
    face(w * 0.5 - r * 3.3, r, st.speedMph / 100, "MPH", false);
    face(w * 0.5, r * 1.24, st.speedMph / 100, "", false);
    face(w * 0.5 + r * 3.3, r, st.fuelPct / 100, "FUEL", st.fuelPct < 16);
    face(w * 0.5 + r * 6, r * 0.78, st.tempPct, "TEMP", st.tempPct > 0.8);
    ctx.fillStyle = "#e8eaee";
    ctx.font = `700 ${Math.round(r * 0.9)}px Overpass, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(Math.round(st.speedMph)), w * 0.5, gy + r * 0.3);
    ctx.fillStyle = "#59626f";
    ctx.font = `600 ${Math.round(r * 0.4)}px Overpass, sans-serif`;
    ctx.fillText(Math.round(st.odo).toLocaleString() + " mi", w * 0.5, gy + r * 0.95);
    if (night) {
      const glow = ctx.createRadialGradient(w * 0.5, gy, r * 0.5, w * 0.5, gy, r * 8);
      glow.addColorStop(0, "rgba(232,176,75,0.11)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, dashTop - h * 0.06, w, h * 0.36);
    }
  }

  // ----------------------------------------------------------- the glass
  function glassGrime(ctx, w, bottom, grime) {
    const g = ctx.createLinearGradient(0, 0, 0, bottom);
    g.addColorStop(0, `rgba(150,130,96,${grime * 0.12})`);
    g.addColorStop(0.7, `rgba(150,130,96,${grime * 0.22})`);
    g.addColorStop(1, `rgba(120,104,78,${grime * 0.32})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, bottom);
    for (let i = 0; i < A.count(40); i++) {
      ctx.globalAlpha = (0.04 + hash(i * 4.2) * 0.1) * grime;
      ctx.fillStyle = "#cbbfa0";
      ctx.beginPath();
      ctx.ellipse(hash(i * 2.2) * w, hash(i * 6.6) * bottom * 0.9,
                  1 + hash(i) * 2.2, 0.8 + hash(i * 3) * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // One bead, drawn once into a little canvas and stamped everywhere after.
  // A gradient per drop per frame is the kind of thing that kills a phone.
  let beadSprite = null;
  function bead() {
    if (beadSprite) return beadSprite;
    const n = 24, c = document.createElement("canvas");
    c.width = c.height = n;
    const g2 = c.getContext("2d");
    const r = n / 2;
    const g = g2.createRadialGradient(r * 0.7, r * 0.7, 0.5, r, r, r);
    g.addColorStop(0, "rgba(255,255,255,0.5)");
    g.addColorStop(0.6, "rgba(190,210,235,0.26)");
    g.addColorStop(1, "rgba(190,210,235,0)");
    g2.fillStyle = g;
    g2.beginPath(); g2.arc(r, r, r, 0, Math.PI * 2); g2.fill();
    return (beadSprite = c);
  }

  function rainGlass(ctx, w, h, bottom) {
    const t = performance.now();
    const sprite = bead();
    for (let i = 0; i < A.count(48); i++) {
      const bx = hash(i * 1.9) * w;
      const by = (hash(i * 5.3) * bottom + (t / 60) * (0.3 + hash(i) * 1.6)) % bottom;
      const r = 2.4 + hash(i * 7.1) * 6;
      ctx.drawImage(sprite, bx - r / 2, by - r / 2, r, r);
    }
    const ang = Math.sin((t / 1100) * Math.PI * 2) * 0.62;   // one wiper, sweeping
    ctx.save();
    ctx.translate(w * 0.36, h * 0.96);
    ctx.rotate(-Math.PI / 2 + ang);
    const streak = ctx.createLinearGradient(0, -7, 0, 7);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.5, "rgba(255,255,255,0.07)");
    streak.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = streak; ctx.fillRect(0, -8, h * 0.72, 16);
    ctx.fillStyle = "rgba(16,18,24,0.5)";
    ctx.fillRect(h * 0.1, -1.6, h * 0.56, 3.2);
    ctx.restore();
  }

  function snowGlass(ctx, w, bottom) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#e9eef3";
    for (let i = 0; i < A.count(24); i++) {
      const x = hash(i * 3.7) * w, y = hash(i * 8.1) * bottom;
      ctx.beginPath(); ctx.arc(x, y, 1 + hash(i) * 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function onFoot(ctx, w, h, st) {
    ctx.fillStyle = "rgba(10,12,18,0.5)";
    ctx.fillRect(0, h * 0.93, w, h * 0.07);
    ctx.fillStyle = "#c9cfd6";
    ctx.font = "700 12px Overpass, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ON FOOT", w / 2, h * 0.975);
    return { view: "foot" };
  }

  return { draw, chase, cockpit, bodyOf, BODY };
})();
