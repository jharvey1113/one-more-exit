import io

p = "js/game.js"
s = io.open(p, encoding="utf-8", newline="").read()

def rep(a, b, note):
    global s
    assert s.count(a) == 1, "NO MATCH: " + note
    s = s.replace(a, b)
    print("OK " + note)

# ---- handles for the new modules -------------------------------------------
rep('  const MUS = window.OME_MUSIC;',
    '  const MUS = window.OME_MUSIC;\n  const ROAD = window.OME_ROAD;\n  const AMB = window.OME_AMB || { init(){}, update(){}, toggle:()=>false, wiper(){}, blinker(){} };',
    "module handles")

# ---- gentler world: fuller tank, slower wear, kinder fuel prices ------------
rep("      cash: career.cash, fuelGal: v.tankGal * 0.6,",
    "      cash: career.cash, fuelGal: v.tankGal,",
    "start with a full tank")
rep("      S.vehicle = clamp(S.vehicle - miles * 0.006, 0, 100);",
    "      S.vehicle = clamp(S.vehicle - miles * 0.0022, 0, 100);",
    "slower wear")
rep("      const available = Math.random() < (n.fuelChance != null ? n.fuelChance : 0.6);",
    "      const available = Math.random() < Math.min(1, (n.fuelChance != null ? n.fuelChance : 0.6) + 0.2);",
    "fuel is easier to find")
rep("      const base = 3.4 + (n.kind === \"settlement\" ? 0.6 : 1.5) * Math.random() + S.mile / 2600;",
    "      const base = 3.1 + (n.kind === \"settlement\" ? 0.5 : 1.1) * Math.random() + S.mile / 3400;",
    "gentler prices")

# ---- limping instead of instant stranding ----------------------------------
rep("""    if (!S.onFoot && S.fuelGal <= 0) return stranded("Out of fuel");
    if (!S.onFoot && S.vehicle <= 0) return stranded("The vehicle finally quit");""",
"""    // warnings first, then trouble: nothing dies without telling you
    if (!S.onFoot) {
      const pct = S.fuelGal / veh().tankGal;
      if (pct < 0.12 && !S.warnedFuel) { S.warnedFuel = true; flash("Fuel light. Next town is " + Math.round(nextNode().mile - S.mile) + " miles."); }
      if (pct > 0.25) S.warnedFuel = false;
      if (S.vehicle < 28 && !S.warnedVeh) { S.warnedVeh = true; flash("Something is wrong with the engine. It is telling you about it."); }
      if (S.vehicle > 40) S.warnedVeh = false;
    }
    if (!S.onFoot && S.fuelGal <= 0) return stranded("Out of fuel");
    if (!S.onFoot && S.vehicle <= 0) return stranded("The vehicle finally quit");""",
    "warnings before failure")

# a dying vehicle limps rather than dies outright
rep("      : 58 * (grade() === \"climb\" ? 0.9 : 1) * (S.vehicle < 40 ? 0.8 : 1) * (isNight() ? 0.85 : 1);",
    "      : 58 * (grade() === \"climb\" ? 0.9 : 1) * (S.vehicle < 40 ? 0.72 : 1) * (S.vehicle < 18 ? 0.6 : 1) * (isNight() ? 0.85 : 1);",
    "limp home mode")

# ---- radio -----------------------------------------------------------------
rep("  // ---------------------------------------------------------------- travelers",
"""  // ---------------------------------------------------------------- radio
  const RADIO = window.OME_RADIO;
  function stationsHere() {
    return RADIO.stations.filter(st =>
      st.kind !== "voice" || (S.mile >= (st.from || 0) - 250 && S.mile <= (st.to || 99999)));
  }
  function currentStation() {
    const list = stationsHere();
    return list[Math.min(S.radio || 0, list.length - 1)] || list[0];
  }
  function tune(dir) {
    const list = stationsHere();
    S.radio = (((S.radio || 0) + dir) % list.length + list.length) % list.length;
    const st = currentStation();
    if (st.kind === "music") MUS.start();
    else MUS.stop();
    AMB.blinker();
    renderRadio();
    save();
  }
  function renderRadio() {
    if (!S) return;
    const st = currentStation();
    $("radioName").textContent = `${st.freq}  ${st.name}`;
    $("radioNote").textContent = st.kind === "voice"
      ? `Broadcasting from ahead of you — ${st.host}.`
      : st.blurb || "";
    $("radioLog").replaceChildren(...(S.radioLog || []).slice(-4).reverse().map(line => {
      const d = document.createElement("div");
      d.className = "log-line";
      d.textContent = line;
      return d;
    }));
  }
  function radioTick() {
    if (!S || !S.radio) return;
    const st = currentStation();
    if (!st || st.kind !== "voice") return;
    if (S.mile < (S.nextBroadcast || 0)) return;
    S.nextBroadcast = S.mile + 22 + Math.random() * 34;
    const kinds = ["weather", "fuel", "road", "people", "ordinary"];
    let kind = kinds[Math.floor(Math.random() * kinds.length)];
    if (account.anomaly > 3 && Math.random() < 0.12) kind = "strange";
    const lines = RADIO.reports[kind];
    const line = lines[Math.floor(Math.random() * lines.length)];
    S.radioLog = (S.radioLog || []).concat(`${st.freq} — ${line}`).slice(-12);
    if (kind === "strange") { account.anomaly += 1; saveAccount(); }
    if (kind === "fuel" || kind === "road") S.skills.navigation += 0.2;
    $("radioTicker").textContent = line;
    clearTimeout(radioTick.t);
    radioTick.t = setTimeout(() => { if ($("radioTicker")) $("radioTicker").textContent = ""; }, 14000);
    renderRadio();
  }

  // ---------------------------------------------------------------- travelers""",
    "radio system")

rep("""    maybeEvent();
    if (Math.random() < 0.004) { syncMood(); pushProgress(); }""",
"""    maybeEvent();
    radioTick();
    if (Math.random() < 0.004) { syncMood(); pushProgress(); }""",
    "radio ticks while driving")

# ---- the drive: cab view, gauges, ambience ---------------------------------
rep("""  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    if (travelling) advance(dt);
    draw(dt);
    hud();
    raf = requestAnimationFrame(frame);
  }""",
"""  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    if (travelling) advance(dt);
    draw(dt);
    hud();
    if (S) {
      const mph = !travelling ? 0 : S.onFoot ? 3
        : 58 * (grade() === "climb" ? 0.9 : 1) * (S.vehicle < 40 ? 0.72 : 1) * (isNight() ? 0.85 : 1);
      AMB.update({ moving: travelling, mph, condition: S.vehicle, weather: weatherNow(),
                   onFoot: S.onFoot, engineLoad: grade() === "climb" ? 1 : 0 });
    }
    raf = requestAnimationFrame(frame);
  }""",
    "ambience follows the drive")

start = s.index("  let scroll = 0, weather = { kind:")
end = s.index("  function plantColor(kind) {")
new_draw = '''  let scroll = 0, weather = { kind: "clear", until: 0 }, glint = null;

  function weatherNow() {
    if (!S) return "clear";
    if (S.mile > weather.until) {
      weather.until = S.mile + 90 + Math.random() * 220;
      const r = region(), roll = Math.random();
      weather.kind = r === "desert" || r === "mesa" ? (roll < 0.1 ? "dust" : "clear")
        : r === "plains" ? (roll < 0.18 ? "rain" : "clear")
        : r === "farm" ? (roll < 0.22 ? "rain" : "clear")
        : r === "rust" || r === "hills" ? (roll < 0.2 ? "rain" : roll < 0.27 ? "fog" : "clear")
        : (roll < 0.18 ? "rain" : roll < 0.26 ? "snow" : "clear");
    }
    return weather.kind;
  }

  // The drive is drawn through the windshield: road, world, then the cab.
  function draw(dt) {
    const c = $("road"), ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const hour = S ? (S.minutes % (24 * 60)) / 60 : 17.8;
    const wx = S ? weatherNow() : "clear";
    const mph = !S ? 55 : !travelling ? 0 : S.onFoot ? 3
      : 58 * (grade() === "climb" ? 0.9 : 1) * (S.vehicle < 40 ? 0.72 : 1) * (isNight() ? 0.85 : 1);
    if (travelling && S) scroll += dt * mph;

    const st = {
      mile: S ? S.mile : 0,
      hour,
      region: S ? region() : "desert",
      colors: S ? regionInfo() : C.regions.desert,
      weather: wx,
      speedMph: mph,
      night: S ? isNight() : false,
      onFoot: S ? S.onFoot : false,
      vehicleCond: S ? S.vehicle : 90,
      fuelPct: S ? fuelPct() : 100,
      tempPct: S ? clamp(0.35 + (grade() === "climb" ? 0.3 : 0) + (100 - S.vehicle) / 220, 0, 1) : 0.4,
      odo: S ? S.odo : 0,
      wipers: wx === "rain",
      grime: S ? Math.min(1, (S.grime || 0)) : 0
    };
    ROAD.draw(ctx, w, h, st);

    // weather in front of the glass
    if (wx === "rain" || wx === "snow") {
      const n = wx === "rain" ? 70 : 45;
      ctx.strokeStyle = wx === "rain" ? "rgba(200,215,235,0.4)" : "rgba(255,255,255,0.7)";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < n; i++) {
        const sx = (i * 137 + scroll * (wx === "rain" ? 22 : 5)) % (w + 60) - 30;
        const sy = (i * 71 + scroll * (wx === "rain" ? 42 : 9)) % (h * 0.72);
        if (wx === "rain") { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 4, sy + 13); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, Math.PI * 2); ctx.fill(); }
      }
    }

    if (S && S.onFoot) {
      // on foot the view sits lower and there is no cab
      ctx.fillStyle = "rgba(10,12,18,0.55)";
      ctx.fillRect(0, h * 0.93, w, h * 0.07);
      ctx.fillStyle = "#c9cfd6";
      ctx.font = "700 12px Overpass, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ON FOOT", w / 2, h * 0.975);
    } else {
      ROAD.drawCab(ctx, w, h, st);
    }

    // something on the shoulder worth stopping for
    if (S && !S.onFoot && travelling && !glint && Math.random() < 0.0012) {
      glint = { x: w * (0.62 + Math.random() * 0.3), y: h * (0.55 + Math.random() * 0.08), life: 2.6 };
    }
    if (glint) {
      glint.life -= dt;
      glint.x += dt * 90;
      glint.y += dt * 30;
      if (glint.life <= 0) glint = null;
      else {
        const pulse = 0.5 + Math.sin(performance.now() / 150) * 0.5;
        ctx.fillStyle = `rgba(255,228,150,${pulse})`;
        ctx.beginPath(); ctx.arc(glint.x, glint.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath(); ctx.arc(glint.x, glint.y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (S && wx !== "clear") {
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(8, 8, 72, 21);
      ctx.fillStyle = "#eef1ec";
      ctx.font = "700 11px Overpass, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(wx.toUpperCase(), 15, 22);
    }
  }

  $("road").addEventListener("click", e => {
    if (!S || !glint || S.done) return;
    const r = $("road").getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (Math.hypot(x - glint.x, y - glint.y) > 40) return;
    glint = null;
    stopTravel();
    const finds = [
      { item: "tape", text: "A half-used roll of duct tape in a toolbox nobody closed." },
      { item: "oil", text: "Two quarts of oil, still sealed, under a seat." },
      { item: "jerky", text: "A gas-station bag with jerky in it. The date is smudged." },
      { item: "flashlight", text: "A flashlight. The batteries are even good." },
      { item: "water", text: "Four bottles of water in a cooler, still cold-ish." },
      { item: null, text: "Broken glass, a shoe, and a receipt from a gas station in a town you haven't reached yet." }
    ];
    const find = finds[Math.floor(Math.random() * finds.length)];
    S.minutes += 12;
    if (find.item && bulkUsed() + 1 <= cargoCap()) addItem(find.item);
    else if (find.item) flash("No room to carry it.");
    if (!find.item) { account.anomaly += 1; saveAccount(); }
    $("eventTitle").textContent = "ON THE SHOULDER";
    $("eventText").textContent = "You pull over for something bright in the weeds.";
    $("eventOutcome").textContent = find.text;
    $("eventChoices").replaceChildren();
    $("eventClose").hidden = false;
    $("eventCard").hidden = false;
    save();
  });

'''
s = s[:start] + new_draw + s[end:]

# ---- windshield grime, and cleaning it at a stop ----------------------------
rep("      S.energy = clamp(S.energy - mins * (S.onFoot ? 0.09 : 0.05), 0, 100);",
    "      S.grime = Math.min(1, (S.grime || 0) + miles * 0.0016);\n      S.energy = clamp(S.energy - mins * (S.onFoot ? 0.09 : 0.05), 0, 100);",
    "grime builds up")
rep('''    acts.push(action("Sleep in the vehicle — free",''',
'''    if (!S.onFoot && (S.grime || 0) > 0.25) {
      acts.push(action("Clean the windshield", "Bugs, dust and three states of road film.", true, () => {
        S.grime = 0; S.minutes += 10; flash("You can see again."); refreshStop(n);
      }));
    }
    acts.push(action("Sleep in the vehicle — free",''',
    "clean the windshield")

# ---- wiring for the radio controls and audio toggle -------------------------
rep('''  $("btnLog").addEventListener("click", renderLog);''',
'''  $("btnLog").addEventListener("click", renderLog);
  $("btnRadio").addEventListener("click", () => {
    const panel = $("radioPanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderRadio();
  });
  $("btnTuneDown").addEventListener("click", () => tune(-1));
  $("btnTuneUp").addEventListener("click", () => tune(1));
  $("btnAmb").addEventListener("click", () => {
    const on = AMB.toggle();
    $("btnAmb").textContent = on ? "Engine on" : "Engine off";
    $("btnAmb").setAttribute("aria-pressed", String(on));
  });''',
    "radio and engine buttons")

rep('''    show("travel");
    MUS.start(); syncMood();
    save();
    setTravel(true);''',
'''    show("travel");
    AMB.init();
    MUS.start(); syncMood();
    renderRadio();
    save();
    setTravel(true);''',
    "start the cab audio")

io.open(p, "w", encoding="utf-8", newline="").write(s)
print("wired")
