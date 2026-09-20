/* One More Exit — the road, and everything standing beside it.

   The world behind the road lives in scene.js and the vehicle lives in
   vehicle.js. This file owns the part with perspective in it: the asphalt,
   the paint on it, the shoulder, the guardrail, the poles and signs and trees
   going by, and the traffic you meet. Anything here will use artwork from
   /assets if the file is there and paint itself if it isn't.

   The public shape of this module has not changed: draw / drawCab / grade. */
window.OME_ROAD = (() => {
  const SEG = 200, ROAD_W = 1520, CAM_D = 0.78, CAM_H = 980, DRAW = 300;
  const S = window.OME_SCENE, A = window.OME_ASSETS, TH = window.OME_THEMES;
  const { mix, shade, hash } = S;
  const clamp01 = v => Math.max(0, Math.min(1, v));

  const curveAt = i => (Math.sin(i / 190) * 2.2 + Math.sin(i / 71) * 1.1 + (hash(i >> 7) - 0.5) * 1.2) * 0.1;
  const hillAt = i => Math.sin(i / 150) * 2200 + Math.sin(i / 47) * 520 + Math.sin(i / 19) * 90;
  const seamAt = i => i % 9 === 0;

  // ---------------------------------------------------------------- props
  // Each kind is drawn from its base point, sized by how close it is. Every
  // one checks for artwork first: assets/props/<theme>/<kind>.webp
  function prop(ctx, kind, x, y, s, light, theme, night) {
    if (s < 0.16) return;
    const img = A.get(`props/${theme.dir}/${kind}`) || A.get(`props/common/${kind}`);
    if (img) {
      const hgt = s * 26, wid = hgt * (img.width / img.height);
      ctx.drawImage(img, x - wid / 2, y - hgt, wid, hgt);
      return;
    }
    const lit = c => mix("#0a0d14", c, 0.32 + light * 0.68);
    const dusk = light < 0.34;
    ctx.save();
    ctx.translate(x, y);
    switch (kind) {
      case "saguaro":
        ctx.fillStyle = lit("#4a6b40");
        ctx.fillRect(-s * 0.6, -s * 11, s * 1.2, s * 11);
        ctx.fillRect(-s * 3.4, -s * 7.6, s * 2.9, s * 1.2);
        ctx.fillRect(-s * 3.4, -s * 7.6, s * 1.2, s * 3.9);
        ctx.fillRect(s * 0.5, -s * 8.6, s * 2.9, s * 1.2);
        ctx.fillRect(s * 2.2, -s * 8.6, s * 1.2, s * 5);
        ctx.fillStyle = lit("#6b9159");
        ctx.fillRect(-s * 0.6, -s * 11, s * 0.34, s * 11);
        break;
      case "ocotillo":
        ctx.strokeStyle = lit("#5d6b3f"); ctx.lineWidth = Math.max(0.6, s * 0.22);
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(i * s * 1.2, -s * 5, i * s * 2.6, -s * 9 - Math.abs(i) * s);
          ctx.stroke();
        }
        break;
      case "pine": case "hardwood": {
        const conifer = kind === "pine";
        const hh = s * (conifer ? 13 : 10);
        ctx.fillStyle = lit("#3b2d22");
        ctx.fillRect(-s * 0.5, -hh * 0.3, s, hh * 0.3);
        if (conifer) {
          for (const [ww, top, base] of [[3.6, 1, 0.34], [2.9, 0.72, 0.6], [2.1, 0.48, 0.82]]) {
            ctx.fillStyle = lit(top > 0.6 ? "#2c4a35" : "#33553c");
            ctx.beginPath();
            ctx.moveTo(0, -hh * top - s * 1.5);
            ctx.lineTo(s * ww, -hh * base); ctx.lineTo(-s * ww, -hh * base);
            ctx.closePath(); ctx.fill();
          }
        } else {
          ctx.fillStyle = lit("#42603c");
          ctx.beginPath(); ctx.ellipse(0, -hh * 0.72, s * 3.4, hh * 0.46, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = lit("#4f6f45");
          ctx.beginPath(); ctx.ellipse(-s * 1, -hh * 0.85, s * 2, hh * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case "treeline": {
        ctx.fillStyle = lit("#39533c");
        ctx.beginPath(); ctx.moveTo(-s * 14, 0);
        for (let i = -14; i <= 14; i += 2) {
          ctx.lineTo(s * i, -s * (4 + hash(i * 3.3 + x) * 4.5));
        }
        ctx.lineTo(s * 14, 0); ctx.closePath(); ctx.fill();
        break;
      }
      case "pole": case "pylon": {
        const tall = kind === "pylon" ? 26 : 18;
        ctx.fillStyle = lit("#5b564b");
        ctx.fillRect(-s * 0.5, -s * tall, s, s * tall);
        ctx.fillRect(-s * 3.2, -s * (tall - 1.2), s * 6.4, s * 0.8);
        ctx.fillRect(-s * 2.5, -s * (tall - 3), s * 5, s * 0.6);
        ctx.strokeStyle = lit("#23262a"); ctx.lineWidth = Math.max(0.5, s * 0.15);
        ctx.beginPath(); ctx.moveTo(-s * 2.8, -s * (tall - 1.4));
        ctx.quadraticCurveTo(s * 24, -s * (tall - 4.4), s * 52, -s * (tall - 1.4));
        ctx.stroke();
        break;
      }
      case "windmill":
        ctx.strokeStyle = lit("#6a6055"); ctx.lineWidth = Math.max(0.6, s * 0.3);
        ctx.beginPath(); ctx.moveTo(-s * 1.6, 0); ctx.lineTo(0, -s * 12);
        ctx.lineTo(s * 1.6, 0); ctx.stroke();
        ctx.fillStyle = lit("#8a8172");
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + performance.now() / 2600;
          ctx.beginPath(); ctx.moveTo(0, -s * 12);
          ctx.lineTo(Math.cos(a) * s * 2.6, -s * 12 + Math.sin(a) * s * 2.6);
          ctx.lineTo(Math.cos(a + 0.4) * s * 2.6, -s * 12 + Math.sin(a + 0.4) * s * 2.6);
          ctx.closePath(); ctx.fill();
        }
        break;
      case "tank":
        ctx.fillStyle = lit("#8d8a7a");
        ctx.fillRect(-s * 3, -s * 6, s * 6, s * 4);
        ctx.fillRect(-s * 0.4, -s * 2, s * 0.8, s * 2);
        break;
      case "grain": case "silo":
        ctx.fillStyle = lit("#b4ac9a");
        ctx.fillRect(-s * 2.2, -s * 15, s * 4.4, s * 15);
        ctx.fillStyle = lit("#8f8778");
        ctx.beginPath(); ctx.moveTo(-s * 2.4, -s * 15); ctx.lineTo(0, -s * 17.4);
        ctx.lineTo(s * 2.4, -s * 15); ctx.closePath(); ctx.fill();
        break;
      case "barn":
        ctx.fillStyle = lit("#6d3a33"); ctx.fillRect(-s * 9, -s * 11, s * 18, s * 11);
        ctx.fillStyle = lit("#4b2a25");
        ctx.beginPath(); ctx.moveTo(-s * 10, -s * 11); ctx.lineTo(0, -s * 17);
        ctx.lineTo(s * 10, -s * 11); ctx.closePath(); ctx.fill();
        ctx.fillStyle = lit("#31201c"); ctx.fillRect(-s * 2, -s * 6, s * 4, s * 6);
        break;
      case "warehouse": case "motel":
        ctx.fillStyle = lit(kind === "motel" ? "#8b8377" : "#6c7076");
        ctx.fillRect(-s * 11, -s * 8, s * 22, s * 8);
        ctx.fillStyle = lit("#4e5359"); ctx.fillRect(-s * 11, -s * 9, s * 22, s * 1.2);
        if (kind === "motel" && dusk) {
          ctx.fillStyle = "rgba(255,196,110,0.85)";
          ctx.fillRect(s * 6, -s * 16, s * 1.4, s * 8);
          ctx.fillRect(s * 4, -s * 17.5, s * 5.4, s * 3);
        }
        break;
      case "stack":
        ctx.fillStyle = lit("#5d5b54");
        ctx.fillRect(-s * 1.8, -s * 28, s * 3.6, s * 28);
        ctx.fillRect(-s * 7.5, -s * 10, s * 15, s * 10);
        ctx.globalAlpha = 0.3; ctx.fillStyle = "#b9bec4";
        ctx.beginPath(); ctx.ellipse(s * 1, -s * 31, s * 4, s * 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case "corn":
        ctx.fillStyle = lit("#8d8a3f");
        for (let i = -5; i <= 5; i++) ctx.fillRect(i * s * 1.5, -s * (4.6 + (i % 3) * 0.6), s * 0.9, s * 5.2);
        break;
      case "rockcut":
        ctx.fillStyle = lit("#6a655c");
        ctx.beginPath(); ctx.moveTo(-s * 6, 0);
        for (let i = -6; i <= 6; i += 2) ctx.lineTo(s * i, -s * (5 + hash(i + x) * 6));
        ctx.lineTo(s * 6, 0); ctx.closePath(); ctx.fill();
        break;
      case "stonewall":
        ctx.fillStyle = lit("#7c7a71");
        for (let i = -6; i <= 6; i++) ctx.fillRect(i * s * 1.6, -s * (1.6 + hash(i * 2 + x) * 0.9), s * 1.5, s * 1.7);
        break;
      case "steeple":
        ctx.fillStyle = lit("#e6e6df"); ctx.fillRect(-s * 1.4, -s * 14, s * 2.8, s * 14);
        ctx.beginPath(); ctx.moveTo(-s * 1.8, -s * 14); ctx.lineTo(0, -s * 19);
        ctx.lineTo(s * 1.8, -s * 14); ctx.closePath(); ctx.fill();
        break;
      case "stump":
        ctx.fillStyle = lit("#4a3a2c"); ctx.fillRect(-s * 1.4, -s * 2.4, s * 2.8, s * 2.4);
        break;
      case "juniper": case "scrub":
        ctx.fillStyle = lit(kind === "juniper" ? "#4d6046" : "#7b7d4b");
        ctx.beginPath(); ctx.ellipse(0, -s * 1.6, s * 2.4, s * 1.7, 0, 0, Math.PI * 2); ctx.fill();
        break;
      case "wreck":
        ctx.fillStyle = lit("#5a5f58");
        ctx.fillRect(-s * 5, -s * 3.4, s * 10, s * 2.4);
        ctx.fillRect(-s * 2.6, -s * 5.4, s * 5.2, s * 2.2);
        ctx.fillStyle = lit("#7d4c34"); ctx.fillRect(-s * 5, -s * 2.2, s * 10, s * 0.6);
        break;
      case "billboard":
        ctx.fillStyle = lit("#4a4640");
        ctx.fillRect(-s * 0.8, -s * 13, s * 1.6, s * 13);
        ctx.fillStyle = lit("#9c917c"); ctx.fillRect(-s * 10, -s * 22, s * 20, s * 9.6);
        ctx.fillStyle = lit("#6f6759"); ctx.fillRect(-s * 8.8, -s * 20.6, s * 7.4, s * 3.2);
        if (dusk) {
          ctx.globalAlpha = 0.35; ctx.fillStyle = "#ffd89a";
          ctx.fillRect(-s * 10, -s * 22, s * 20, s * 9.6); ctx.globalAlpha = 1;
        }
        break;
      case "sign": {
        ctx.fillStyle = lit("#6d727a"); ctx.fillRect(-s * 0.5, -s * 10, s, s * 10);
        const face = dusk ? "#2a7d4c" : "#1d6b3c";
        ctx.fillStyle = lit(face); ctx.fillRect(-s * 5.6, -s * 15.6, s * 11.2, s * 5.8);
        ctx.strokeStyle = dusk ? "#f4fff6" : lit("#eef3ee");
        ctx.lineWidth = Math.max(0.6, s * 0.4);
        ctx.strokeRect(-s * 5, -s * 15, s * 10, s * 4.6);
        break;
      }
      default: {                                   // marker post
        ctx.fillStyle = lit("#1d6b3c"); ctx.fillRect(-s * 1.2, -s * 5, s * 2.4, s * 3.4);
        ctx.fillStyle = dusk ? "#fdfdf6" : lit("#e9efe9"); ctx.fillRect(-s * 0.3, -s * 1.6, s * 0.6, s * 1.6);
      }
    }
    ctx.restore();
  }

  // What stands where. Deterministic per segment, so the same mile always
  // looks like itself — which is what makes a repeated thing readable later.
  function propAt(i, theme) {
    const r = hash(i * 1.37);
    const dens = 0.72 + (1 - theme.density) * 0.18;
    if (r > dens) {
      const veg = theme.veg;
      const kind = hash(i * 7.77) < 0.72
        ? veg[Math.floor(hash(i * 9.1) * veg.length)]
        : ["sign", "billboard", "wreck", "pole"][Math.floor(hash(i * 4.3) * 4)];
      return { kind, side: hash(i * 3.11) > 0.5 ? 1 : -1, offset: 1.5 + hash(i * 5.19) * 3.2 };
    }
    if (i % 26 === 0) return { kind: "marker", side: 1, offset: 1.15 };
    return null;
  }

  // ------------------------------------------------------------- traffic
  // A few vehicles sharing the country with you. Oncoming ones come at you in
  // the far lane; the ones ahead show taillights and pull away slowly.
  let traffic = [];
  function updateTraffic(camZ, dt, theme, night) {
    if (traffic.length < (A.quality.v < 0.8 ? 2 : theme.density > 0.6 ? 4 : 3) && Math.random() < 0.012) {
      const oncoming = Math.random() < 0.62;
      traffic.push({
        z: camZ + (oncoming ? 34000 + Math.random() * 26000 : 6000 + Math.random() * 16000),
        oncoming, speed: oncoming ? -(70 + Math.random() * 40) : 6 + Math.random() * 22,
        big: Math.random() < 0.35, seed: Math.random() * 100
      });
    }
    for (const v of traffic) v.z += v.speed * dt * 88;
    traffic = traffic.filter(v => v.z > camZ - 2000 && v.z < camZ + 90000);
  }

  function drawTraffic(ctx, project, camZ, x0, light, night) {
    for (const v of traffic) {
      const n = Math.floor((v.z - camZ) / SEG);
      if (n < 1 || n > DRAW) continue;
      const p = project({ x: x0[Math.min(x0.length - 1, n)] || 0, y: hillAt(Math.floor(v.z / SEG)), z: v.z });
      if (!isFinite(p.sx) || p.sw < 0.4) continue;
      const s = p.sw / 42, lane = v.oncoming ? -0.5 : 0.5;
      const x = p.sx + p.sw * lane, y = p.sy;
      const body = v.big ? 11 : 7, hgt = v.big ? 9 : 5;
      if (night) {
        const glow = ctx.createRadialGradient(x, y - s * hgt * 0.4, 1, x, y - s * hgt * 0.4, s * (v.oncoming ? 26 : 14));
        glow.addColorStop(0, v.oncoming ? "rgba(255,242,214,0.75)" : "rgba(255,70,50,0.5)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(x - s * 28, y - s * 24, s * 56, s * 34);
        ctx.fillStyle = v.oncoming ? "#fff6dd" : "#ff5a3c";
        ctx.fillRect(x - s * body * 0.42, y - s * hgt * 0.55, s * 1.8, s * 1.4);
        ctx.fillRect(x + s * body * 0.24, y - s * hgt * 0.55, s * 1.8, s * 1.4);
      } else {
        ctx.fillStyle = mix("#0c0f14", v.big ? "#8e9299" : "#6f7a85", 0.3 + light * 0.6);
        ctx.fillRect(x - s * body / 2, y - s * hgt, s * body, s * hgt * 0.72);
        ctx.fillRect(x - s * body * 0.32, y - s * hgt * 1.3, s * body * 0.64, s * hgt * 0.4);
        ctx.globalAlpha = 0.22; ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(x, y, s * body * 0.6, s * 1.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // ------------------------------------------------------------ the road
  function roadway(ctx, w, h, env, res) {
    const { camZ, sway, pitch, weather, theme } = env;
    const light = res.light, night = light < 0.34;
    const wet = weather === "rain";
    const themeA = theme.b && theme.t > 0.5 ? theme.b : theme.a;
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

    const gl = 0.4 + light * 0.6;
    const asphaltBase = wet ? mix("#0a0d14", "#3a4049", gl) : mix("#0a0d14", "#4b4d53", gl);
    const paint = night ? "#fdf6d8" : mix("#0a0d14", "#ded1a4", gl);   // retroreflective at night
    const shoulderCol = mix("#0a0d14", mix(themeA.ground, "#cfc5b2", 0.4), gl);
    const railCol = mix("#0a0d14", "#9aa0a6", gl);
    const rails = ["hills", "northeast", "rust", "urban", "az_pines"].includes(themeA.id);

    let x = 0, dx = 0, maxY = h;
    const xs = [], drawn = [];
    for (let n = 0; n < DRAW; n++) {
      const i = baseSeg + n;
      xs.push(x);
      const p1 = project({ x, y: hillAt(i), z: i * SEG });
      dx += curveAt(i); x += dx;
      const p2 = project({ x, y: hillAt(i + 1), z: (i + 1) * SEG });
      if (p2.sy >= maxY || p1.z - camZ < 1) continue;
      maxY = p2.sy;
      if (n > 40 && p1.sw < 0.9) break;        // past here it is all one pixel

      const even = Math.floor(i / 6) % 2 === 0;
      const far = p1.sw < 2.4;                 // too small to be anything but shape
      // at night the beam falls off with distance, and everything it reaches
      // — asphalt, shoulder, paint — is brighter than everything it doesn't
      const beam = night ? clamp01(1.3 - n / 24) : 1;
      poly(p1.sx, p1.sy, p1.sw * 1.5, p2.sx, p2.sy, p2.sw * 1.5,
           night ? shade(shoulderCol, beam * 0.3) : shoulderCol);
      const patch = hash(i * 3.77);
      let asph = patch > 0.93 ? shade(asphaltBase, -0.3)
               : patch < 0.07 ? shade(asphaltBase, 0.08)
               : (even ? asphaltBase : shade(asphaltBase, -0.05));
      if (night) asph = shade(asph, beam * 0.26);
      if (!far) poly(p1.sx, p1.sy, p1.sw * 1.14, p2.sx, p2.sy, p2.sw * 1.14, mix(asph, "#bab4a6", even ? 0.5 : 0.18));
      poly(p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw, asph);
      if (far) { drawn.push({ i, p: p1 }); continue; }
      if (p1.sw > 26) {
        poly(p1.sx - p1.sw * 0.46, p1.sy, p1.sw * 0.18, p2.sx - p2.sw * 0.46, p2.sy, p2.sw * 0.18, shade(asph, 0.06));
        poly(p1.sx + p1.sw * 0.46, p1.sy, p1.sw * 0.18, p2.sx + p2.sw * 0.46, p2.sy, p2.sw * 0.18, shade(asph, 0.06));
        poly(p1.sx, p1.sy, p1.sw * 0.1, p2.sx, p2.sy, p2.sw * 0.1, shade(asph, -0.12));
        if (seamAt(i)) poly(p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw * 0.99, shade(asph, -0.22));
      }
      // lane paint — under headlights at night it is the brightest thing out there
      const dash = night ? mix(asph, paint, 0.35 + beam * 0.65) : paint;
      if (even) poly(p1.sx, p1.sy, p1.sw * 0.028, p2.sx, p2.sy, p2.sw * 0.028,
                     hash(i * 5.3) > 0.82 ? mix(dash, asph, 0.5) : dash);
      poly(p1.sx + p1.sw * 0.93, p1.sy, p1.sw * 0.024, p2.sx + p2.sw * 0.93, p2.sy, p2.sw * 0.024, dash);
      poly(p1.sx - p1.sw * 0.93, p1.sy, p1.sw * 0.024, p2.sx - p2.sw * 0.93, p2.sy, p2.sw * 0.024, dash);
      drawn.push({ i, p: p1 });

      if (rails && p1.sw > 3 && i % 2 === 0) {     // guardrail on the outside
        const gx = p1.sx + p1.sw * 1.34, gy = p1.sy;
        ctx.fillStyle = railCol;
        ctx.fillRect(gx - p1.sw * 0.02, gy - p1.sw * 0.12, p1.sw * 0.05, p1.sw * 0.12);
        ctx.fillRect(gx - p1.sw * 0.09, gy - p1.sw * 0.13, p1.sw * 0.2, p1.sw * 0.045);
      }
    }

    // roadside things, far to near, each casting a shadow away from the sun
    const sunLeft = res.sun && res.sun.arc > 0.5;
    for (let k = drawn.length - 1; k >= 0; k--) {
      const { i, p } = drawn[k];
      const sp = propAt(i, themeA);
      if (!sp) continue;
      const px = p.sx + p.sw * sp.offset * sp.side, s = p.sw / 42;
      if (s > 0.3 && light > 0.32) {
        ctx.globalAlpha = 0.22 * light;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(px + s * (sunLeft ? 7 : -7), p.sy, s * 7, s * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      prop(ctx, sp.kind, px, p.sy, s, light, themeA, night);
    }

    drawTraffic(ctx, project, camZ, xs, light, night);

    if (night && !env.onFoot) {                    // your own headlights
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const pool = ctx.createRadialGradient(w * 0.5 + sway * 40, h * 0.96, h * 0.02,
                                            w * 0.5 + sway * 40, h * 0.96, h * 0.62);
      pool.addColorStop(0, "rgba(255,234,186,0.4)");
      pool.addColorStop(0.35, "rgba(255,226,172,0.16)");
      pool.addColorStop(1, "rgba(255,226,172,0)");
      ctx.fillStyle = pool;
      ctx.fillRect(0, env.horizon, w, h - env.horizon);
      const cone = ctx.createLinearGradient(0, h, 0, env.horizon + h * 0.03);
      cone.addColorStop(0, "rgba(255,238,200,0.16)");
      cone.addColorStop(0.5, "rgba(255,238,200,0.05)");
      cone.addColorStop(1, "rgba(255,238,200,0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(w * 0.02, h);
      ctx.lineTo(w * 0.43 + sway * 60, env.horizon + h * 0.05);
      ctx.lineTo(w * 0.57 + sway * 60, env.horizon + h * 0.05);
      ctx.lineTo(w * 0.98, h);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (wet) wetSheen(ctx, w, h, env, light);
  }

  function wetSheen(ctx, w, h, env, light) {
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 18; i++) {
      const t = hash(i * 9.1 + Math.floor(env.camZ / 4000));
      const y = env.horizon + Math.pow(t, 1.6) * (h - env.horizon);
      const len = (y - env.horizon) / (h - env.horizon) * h * 0.16 + 4;
      const cx = w * 0.5 + (hash(i * 4.4) - 0.5) * w * 0.5 * ((y - env.horizon) / (h - env.horizon) + 0.25);
      const g = ctx.createLinearGradient(cx, y, cx, y + len);
      g.addColorStop(0, light < 0.34 ? "rgba(255,230,180,0.5)" : "rgba(206,222,240,0.32)");
      g.addColorStop(1, "rgba(255,230,180,0)");
      ctx.fillStyle = g; ctx.fillRect(cx - 1.7, y, 3.4, len);
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ assembly
  let lastDraw = 0;
  function draw(ctx, w, h, st) {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastDraw) / 1000) || 0.016;
    if (lastDraw) A.quality.note(now - lastDraw);   // let the device set its own detail
    lastDraw = now;

    const themeMix = TH.at(st.mile || 0);
    const env = {
      hour: st.hour, camZ: st.camZ != null ? st.camZ : (st.mile || 0) * 5280,
      sway: st.sway || 0, pitch: st.pitch || 0, weather: st.weather || "clear",
      mile: st.mile || 0, onFoot: st.onFoot, urban: st.urban || 0,
      theme: themeMix, horizon: h * (0.42 + (st.pitch || 0))
    };
    const res = S.sky(ctx, w, h, env);
    S.terrain(ctx, w, h, env, res);
    const themeA = env.theme.b && env.theme.t > 0.5 ? env.theme.b : env.theme.a;
    updateTraffic(env.camZ, dt, themeA, res.light < 0.34);
    roadway(ctx, w, h, env, res);
    S.air(ctx, w, h, env, res);
    S.precipitation(ctx, w, h, env, res);
    S.foreground(ctx, w, h, env, res);
    return { horizon: env.horizon, light: res.light, theme: themeA };
  }

  const drawCab = (ctx, w, h, st) => window.OME_VEHICLE.draw(ctx, w, h, st);

  // film grain and vignette, last of all
  let grainTile = null;
  function noiseTile() {
    if (grainTile) return grainTile;
    const n = 128, c = document.createElement("canvas");
    c.width = c.height = n;
    const g = c.getContext("2d"), img = g.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const v = 108 + Math.random() * 40;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return (grainTile = c);
  }
  function grade(ctx, w, h, night) {
    const tile = A.get("effects/grain") || noiseTile();
    const ox = Math.floor(Math.random() * 128), oy = Math.floor(Math.random() * 128);
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.15;
    for (let y = -oy; y < h; y += 128) for (let x = -ox; x < w; x += 128) ctx.drawImage(tile, x, y);
    ctx.restore();
    const vig = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.26, w / 2, h * 0.5, h);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, night ? "rgba(0,0,0,0.66)" : "rgba(0,0,0,0.4)");
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
  }

  return { draw, drawCab, grade, grain: noiseTile, daylight: S.daylight,
           curveAt, hillAt, seamAt, prop, SEG };
})();
