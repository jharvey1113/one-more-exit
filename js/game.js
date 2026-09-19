/* One More Exit — engine.
   Logic only. Everything the player reads lives in content.js.
   Saves to localStorage for now; the same shapes are meant to move to Supabase. */
(() => {
  const C = window.OME_CONTENT;
  const $ = id => document.getElementById(id);
  const SAVE_KEY = "ome-save-v1";
  const ACCOUNT_KEY = "ome-account-v1";

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    clear(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // Account survives individual trips — this is where the long game will live.
  let account = store.get(ACCOUNT_KEY) || {
    travelerLevel: 1, xp: 0, trips: 0, arrivals: 0, milesLifetime: 0,
    achievements: [], souvenirs: [], flags: [], anomaly: 0, memorials: []
  };
  const saveAccount = () => store.set(ACCOUNT_KEY, account);

  let S = null;              // current trip state
  let travelling = false, speed = 1, lastFrame = 0, raf = 0;

  // ---------------------------------------------------------------- helpers
  const node = id => C.route.nodes.find(n => n.id === id);
  const destMile = () => C.route.nodes[C.route.nodes.length - 1].mile;
  const veh = () => C.vehicles.find(v => v.id === S.vehicleId);
  const gallons = () => S.fuelGal;
  const fuelPct = () => clamp(Math.round((S.fuelGal / veh().tankGal) * 100), 0, 100);
  const bulkUsed = () => Object.entries(S.inventory).reduce((sum, [id, n]) => {
    const it = C.items.find(i => i.id === id);
    return sum + (it ? it.bulk * n : 0);
  }, 0);
  const has = id => (S.inventory[id] || 0) > 0;
  const clockText = () => {
    const mins = Math.round(S.minutes) % (24 * 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  const isNight = () => {
    const h = (Math.round(S.minutes) % (24 * 60)) / 60;
    return h < 6 || h >= 19;
  };
  const season = () => ["winter", "winter", "spring", "spring", "spring", "summer",
                        "summer", "summer", "fall", "fall", "fall", "winter"][new Date().getMonth()];
  // elevation gain over the next few miles decides climbs and descents
  function grade() {
    const ns = C.route.nodes;
    let prev = ns[0], next = ns[ns.length - 1];
    for (let i = 0; i < ns.length - 1; i++) {
      if (S.mile >= ns[i].mile && S.mile < ns[i + 1].mile) { prev = ns[i]; next = ns[i + 1]; break; }
    }
    const d = next.elevation - prev.elevation;
    return d > 400 ? "climb" : d < -400 ? "descend" : "flat";
  }
  const nextNode = () => C.route.nodes.find(n => n.mile > S.mile + 0.01) || C.route.nodes[C.route.nodes.length - 1];
  const atNode = () => C.route.nodes.find(n => Math.abs(n.mile - S.mile) < 0.6);

  // ---------------------------------------------------------------- audio (small and optional)
  const audio = (() => {
    let ctx = null, engine = null, gain = null, on = store.get("ome-sound") !== false;
    function init() {
      if (ctx || !on) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      engine = ctx.createBufferSource(); engine.buffer = buf; engine.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
      engine.connect(lp); lp.connect(gain); engine.start();
    }
    function blip(f, f2, dur, vol, type) {
      if (!ctx || !on) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, ctx.currentTime);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + dur);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur + 0.02);
    }
    return {
      init,
      get on() { return on; },
      toggle() {
        on = !on; store.set("ome-sound", on);
        if (!on && gain) gain.gain.value = 0;
        if (on) init();
        return on;
      },
      road(active) { if (gain && ctx) gain.gain.setTargetAtTime(active && on ? 0.05 : 0, ctx.currentTime, 0.3); },
      tick() { blip(1200, 900, 0.03, 0.05, "square"); },
      good() { blip(660, 990, 0.18, 0.09, "triangle"); },
      bad() { blip(220, 120, 0.3, 0.1, "sawtooth"); },
      pump() { blip(300, 300, 0.4, 0.04, "square"); }
    };
  })();

  // ---------------------------------------------------------------- screens
  const screens = ["title", "create", "outfit", "travel", "stop", "summary", "log"];
  function show(name) {
    screens.forEach(s => { const el = $("screen-" + s); if (el) el.hidden = s !== name; });
    if (name !== "travel") stopTravel();
  }

  // ---------------------------------------------------------------- new trip
  function startCreate() {
    show("create");
    $("careerList").replaceChildren(...C.careers.map(c => optionCard(c.name, c.perk, `$${c.cash} to start`, () => {
      pick.career = c.id; refreshCreate();
    }, () => pick.career === c.id)));
    $("vehicleList").replaceChildren(...C.vehicles.map(v => optionCard(
      v.name, v.blurb, `${v.mpg} mpg · ${v.tankGal} gal · ${v.cargo} cu ft · reliability ${Math.round(v.reliability * 100)}%`,
      () => { pick.vehicle = v.id; refreshCreate(); }, () => pick.vehicle === v.id)));
    refreshCreate();
  }
  const pick = { career: "teacher", vehicle: "ranger" };
  function refreshCreate() {
    [...document.querySelectorAll("#careerList .card")].forEach((el, i) =>
      el.classList.toggle("on", C.careers[i].id === pick.career));
    [...document.querySelectorAll("#vehicleList .card")].forEach((el, i) =>
      el.classList.toggle("on", C.vehicles[i].id === pick.vehicle));
  }
  function optionCard(title, desc, meta, onClick) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "card";
    b.innerHTML = `<span class="card-title"></span><span class="card-desc"></span><span class="card-meta"></span>`;
    b.querySelector(".card-title").textContent = title;
    b.querySelector(".card-desc").textContent = desc;
    b.querySelector(".card-meta").textContent = meta;
    b.addEventListener("click", onClick);
    return b;
  }

  function beginTrip() {
    const name = ($("travelerName").value || "").trim().slice(0, 18) || "Traveler";
    const career = C.careers.find(c => c.id === pick.career);
    const v = C.vehicles.find(x => x.id === pick.vehicle);
    S = {
      name, career: career.id, vehicleId: v.id,
      skills: Object.assign({ mechanical: 0, navigation: 0, firstAid: 0, cooking: 0, social: 0, outdoors: 0 }, career.skills),
      cash: career.cash, fuelGal: v.tankGal * 0.55, food: 2, water: 0,
      health: 100, energy: 100, stress: 10, vehicle: 88,
      mile: 0, minutes: 8 * 60, inventory: {}, log: [], souvenirs: [],
      seen: {}, spent: 0, fuelUsed: 0, events: 0, started: Date.now(), done: false
    };
    show("outfit");
    renderShop();
  }

  // ---------------------------------------------------------------- outfitting
  function renderShop() {
    const v = veh();
    $("shopCash").textContent = "$" + S.cash;
    $("shopBulk").textContent = `${bulkUsed()} / ${v.cargo} cu ft`;
    $("shopList").replaceChildren(...C.items.map(it => {
      const owned = S.inventory[it.id] || 0;
      const row = document.createElement("div");
      row.className = "shop-row";
      row.innerHTML = `<span class="shop-name"></span><span class="shop-use"></span>
        <span class="shop-price"></span>
        <span class="shop-buttons">
          <button type="button" class="mini" data-act="sell">−</button>
          <b class="owned"></b>
          <button type="button" class="mini" data-act="buy">+</button>
        </span>`;
      row.querySelector(".shop-name").textContent = it.name;
      row.querySelector(".shop-use").textContent = it.use;
      row.querySelector(".shop-price").textContent = `$${it.price} · ${it.bulk} cu ft`;
      row.querySelector(".owned").textContent = owned;
      row.querySelector('[data-act="buy"]').addEventListener("click", () => {
        if (S.cash < it.price) return flash("Not enough cash.");
        if (bulkUsed() + it.bulk > v.cargo) return flash("No room left in the vehicle.");
        S.cash -= it.price; S.spent += it.price;
        S.inventory[it.id] = owned + 1;
        audio.tick(); renderShop();
      });
      row.querySelector('[data-act="sell"]').addEventListener("click", () => {
        if (!owned) return;
        S.cash += it.price; S.spent -= it.price;
        S.inventory[it.id] = owned - 1;
        if (!S.inventory[it.id]) delete S.inventory[it.id];
        renderShop();
      });
      return row;
    }));
    const fuelCost = Math.round((veh().tankGal - S.fuelGal) * 3.79);
    $("shopFuel").textContent = `Top off the tank — $${fuelCost} (${fuelPct()}% now)`;
    $("shopFuel").disabled = S.cash < fuelCost || fuelPct() > 98;
  }
  function flash(msg) {
    const el = $("flash");
    el.textContent = msg; el.classList.add("on");
    clearTimeout(flash.t); flash.t = setTimeout(() => el.classList.remove("on"), 1800);
  }

  // ---------------------------------------------------------------- travel
  function launch() {
    if (bulkUsed() >= veh().cargo) award("loaded");
    logLine(`Left Phoenix at ${clockText()} with $${S.cash} and ${fuelPct()}% of a tank.`);
    show("travel");
    save();
    setTravel(true);
  }

  function setTravel(go) {
    travelling = go;
    audio.init(); audio.road(go);
    $("btnGo").textContent = go ? "Pause" : "Drive";
    if (go) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
    else cancelAnimationFrame(raf);
  }
  const stopTravel = () => { travelling = false; audio.road(false); cancelAnimationFrame(raf); };

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    if (travelling) advance(dt);
    drawRoad(dt);
    hud();
    raf = requestAnimationFrame(frame);
  }

  // one second of real time = one minute of trip time at 1x
  function advance(dt) {
    const mph = 65 * (grade() === "climb" ? 0.92 : 1) * (S.vehicle < 40 ? 0.8 : 1);
    const mins = dt * 60 * speed;
    const miles = (mph / 60) * mins;
    S.minutes += mins;
    S.mile += miles;
    S.lifetimeMiles = (S.lifetimeMiles || 0) + miles;

    const mpg = veh().mpg * (grade() === "climb" ? 0.78 : grade() === "descend" ? 1.15 : 1)
              * (S.vehicle < 50 ? 0.9 : 1);
    const used = miles / mpg;
    S.fuelGal = Math.max(0, S.fuelGal - used);
    S.fuelUsed += used;

    S.energy = clamp(S.energy - mins * 0.055, 0, 100);
    S.health = clamp(S.health - (S.energy < 15 ? mins * 0.02 : 0), 0, 100);
    S.stress = clamp(S.stress + (S.energy < 25 ? mins * 0.03 : -mins * 0.004), 0, 100);
    S.vehicle = clamp(S.vehicle - miles * 0.012, 0, 100);

    if (S.fuelGal <= 0) return fail("Out of fuel", "The engine quits mid-hill and you coast onto the shoulder in total silence.");
    if (S.health <= 0) return fail("Hospitalized", "You make it as far as an urgent care in a strip mall, which is further than some.");
    if (S.vehicle <= 0) return fail("Vehicle destroyed", "Something expensive lets go, and the trip ends beside a guardrail.");

    if (S.mile >= destMile()) return arrive();

    const nn = nextNode();
    if (nn && S.mile >= nn.mile - 0.05 && !S.seen["node_" + nn.id]) {
      S.seen["node_" + nn.id] = true;
      S.mile = nn.mile;
      openStop(nn);
      return;
    }
    maybeEvent();
  }

  // ---------------------------------------------------------------- event engine
  function ctxNow(extra) {
    return Object.assign({
      mile: S.mile, night: isNight(), daytime: !isNight(), anomaly: account.anomaly,
      grade: grade(), season: season(), energy: S.energy, vehicle: S.vehicle,
      services: (atNode() || {}).services || [], stopped: false
    }, extra || {});
  }
  function eligible(ev, ctx) {
    const r = ev.requires || {};
    if (S.seen[ev.id] && (ev.cooldown || 40) > 900) return false;
    if (S.seen[ev.id]) return false;                       // once per trip in the slice
    if (r.minMile != null && ctx.mile < r.minMile) return false;
    if (r.maxMile != null && ctx.mile > r.maxMile) return false;
    if (r.night && !ctx.night) return false;
    if (r.daytime && !ctx.daytime) return false;
    if (r.grade && r.grade !== ctx.grade) return false;
    if (r.season && r.season !== ctx.season) return false;
    if (r.minAnomaly != null && ctx.anomaly < r.minAnomaly) return false;
    if (r.maxEnergy != null && ctx.energy > r.maxEnergy) return false;
    if (r.items && !r.items.every(has)) return false;
    if (r.stopped && !ctx.stopped) return false;
    if (r.service && !(ctx.services || []).includes(r.service)) return false;
    return true;
  }
  function pickWeighted(list) {
    const total = list.reduce((s, x) => s + (x.w || x.weight || 1), 0);
    let roll = Math.random() * total;
    for (const x of list) { roll -= (x.w || x.weight || 1); if (roll <= 0) return x; }
    return list[list.length - 1];
  }
  function maybeEvent() {
    if (S.mile - (S.lastEventMile || -6) < 4.5) return;    // breathing room between events
    if (Math.random() > 0.06) return;
    const ctx = ctxNow();
    const pool = C.events.filter(e => eligible(e, ctx) && !(e.requires || {}).stopped && !(e.requires || {}).service);
    if (!pool.length) return;
    fireEvent(pickWeighted(pool), ctx);
  }
  function fireEvent(ev, ctx) {
    S.seen[ev.id] = true;
    S.lastEventMile = S.mile;
    S.events++;
    stopTravel();
    const card = $("eventCard");
    $("eventTitle").textContent = ev.title;
    $("eventText").textContent = ev.text;
    $("eventOutcome").textContent = "";
    $("eventClose").hidden = true;
    const choices = ev.choices.filter(ch => {
      const r = ch.requires || {};
      if (r.items && !r.items.every(has)) return false;
      if (r.skillMin && !Object.entries(r.skillMin).every(([k, v]) => (S.skills[k] || 0) >= v)) return false;
      if (r.service && !(ctx.services || []).includes(r.service)) return false;
      return true;
    });
    $("eventChoices").replaceChildren(...choices.map(ch => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "choice";
      b.textContent = ch.label;
      b.addEventListener("click", () => resolveChoice(ev, ch));
      return b;
    }));
    card.hidden = false;
    audio.tick();
  }
  function resolveChoice(ev, ch) {
    const out = pickWeighted(ch.outcomes);
    applyEffects(out.effects || {});
    $("eventChoices").replaceChildren();
    $("eventOutcome").textContent = out.text;
    $("eventClose").hidden = false;
    logLine(`${ev.title} — ${ch.label}`);
    save();
    hud();
  }
  function closeEvent() {
    $("eventCard").hidden = true;
    if (!S.done) setTravel(true);
  }

  function applyEffects(e) {
    if (e.cash) S.cash += e.cash;
    if (e.cash && e.cash < 0) S.spent += -e.cash;
    if (e.fillRate) {                                       // fill the tank at $/gal
      const need = veh().tankGal - S.fuelGal;
      const cost = Math.min(S.cash, Math.round(need * e.fillRate));
      S.fuelGal += cost / e.fillRate; S.cash -= cost; S.spent += cost;
    }
    if (e.fuelGal) S.fuelGal = clamp(S.fuelGal + e.fuelGal, 0, veh().tankGal);
    if (e.time) S.minutes += e.time;
    if (e.miles) S.mile = Math.max(0, S.mile - 0);           // detour miles cost fuel, not progress
    if (e.miles) { S.fuelGal = Math.max(0, S.fuelGal - e.miles / veh().mpg); S.fuelUsed += e.miles / veh().mpg; }
    if (e.health) S.health = clamp(S.health + e.health * (S.career === "nurse" && e.health < 0 ? 0.6 : 1), 0, 100);
    if (e.energy) S.energy = clamp(S.energy + e.energy, 0, 100);
    if (e.stress) S.stress = clamp(S.stress + e.stress * (S.career === "teacher" && e.stress > 0 ? 0.8 : 1), 0, 100);
    if (e.vehicle) S.vehicle = clamp(S.vehicle + e.vehicle, 0, 100);
    if (e.food) S.food = Math.max(0, S.food + e.food);
    if (e.skill) for (const [k, v] of Object.entries(e.skill)) S.skills[k] = (S.skills[k] || 0) + v;
    if (e.addItem) S.inventory[e.addItem] = (S.inventory[e.addItem] || 0) + 1;
    if (e.removeItem && S.inventory[e.removeItem]) {
      S.inventory[e.removeItem]--;
      if (!S.inventory[e.removeItem]) delete S.inventory[e.removeItem];
    }
    if (e.useItem && has(e.useItem)) {
      S.inventory[e.useItem]--;
      if (!S.inventory[e.useItem]) delete S.inventory[e.useItem];
      S.vehicle = clamp(S.vehicle + 4, 0, 100);
    }
    if (e.souvenir) { S.souvenirs.push(e.souvenir); if (!account.souvenirs.includes(e.souvenir)) account.souvenirs.push(e.souvenir); }
    if (e.flag && !account.flags.includes(e.flag)) account.flags.push(e.flag);
    if (e.anomaly) account.anomaly += e.anomaly;
    if (e.achievement) award(e.achievement);
    saveAccount();
  }

  function award(id) {
    if (account.achievements.includes(id)) return;
    account.achievements.push(id);
    saveAccount();
    const a = C.achievements.find(x => x.id === id);
    if (a) { flash(`Achievement: ${a.name}`); audio.good(); }
  }

  // ---------------------------------------------------------------- stops
  function openStop(n) {
    stopTravel();
    show("stop");
    $("stopName").textContent = n.name;
    $("stopMeta").textContent = `Mile ${n.mile} · ${n.elevation.toLocaleString()} ft · ${clockText()}`
      + (n.blurb ? ` · ${n.blurb}` : "");
    const acts = [];
    const price = (3.39 + (n.elevation > 5000 ? 0.35 : 0) + (n.kind === "exit" ? 0.25 : 0));
    if (n.services.includes("fuel")) {
      const need = veh().tankGal - S.fuelGal;
      const cost = Math.round(need * price);
      acts.push(action(`Fill the tank — $${cost}`, `$${price.toFixed(2)}/gal · tank at ${fuelPct()}%`,
        cost <= S.cash && need > 0.3, () => {
          S.cash -= cost; S.spent += cost; S.fuelGal = veh().tankGal; S.minutes += 10;
          audio.pump(); logLine(`Fueled up at ${n.name} for $${cost}.`); refreshStop(n);
        }));
      const half = Math.round(Math.min(S.cash, need * price * 0.5));
      if (half > 0) acts.push(action(`Put in $${half}`, "Just enough to keep moving.", S.cash >= half, () => {
        S.cash -= half; S.spent += half; S.fuelGal = clamp(S.fuelGal + half / price, 0, veh().tankGal);
        S.minutes += 7; audio.pump(); refreshStop(n);
      }));
    }
    if (n.services.includes("food")) {
      acts.push(action("Buy road food — $14", "Two sandwiches and something fried.", S.cash >= 14, () => {
        S.cash -= 14; S.spent += 14; S.food += 2; S.health = clamp(S.health + 5, 0, 100);
        S.stress = clamp(S.stress - 5, 0, 100); S.minutes += 20; refreshStop(n);
      }));
    }
    if (n.services.includes("repair")) {
      const cost = Math.round((100 - S.vehicle) * 4.2 * (S.career === "mechanic" ? 0.75 : 1));
      acts.push(action(`Repair shop — $${cost}`, `Vehicle at ${Math.round(S.vehicle)}%.`,
        S.cash >= cost && S.vehicle < 97, () => {
          S.cash -= cost; S.spent += cost; S.vehicle = 97; S.minutes += 75;
          S.skills.mechanical += 1; logLine(`Repairs at ${n.name}: $${cost}.`); refreshStop(n);
        }));
    }
    if (has("tools") && S.vehicle < 80) {
      acts.push(action("Work on it yourself", `Mechanical ${S.skills.mechanical}. Takes time, costs nothing.`, true, () => {
        const gain = 6 + S.skills.mechanical * 3;
        S.vehicle = clamp(S.vehicle + gain, 0, 100); S.minutes += 40; S.energy -= 8;
        S.skills.mechanical += 1; flash(`Vehicle +${gain}%`); refreshStop(n);
      }));
    }
    if (n.services.includes("rest")) {
      acts.push(action("Nap in the vehicle — free", "Twenty minutes, questionable neck position.", true, () => {
        S.energy = clamp(S.energy + 30, 0, 100); S.stress = clamp(S.stress - 8, 0, 100);
        S.minutes += 30; award("luxury"); refreshStop(n);
      }));
      if (n.services.includes("food")) {
        acts.push(action("Motel room — $78", "A real bed and a loud air conditioner.", S.cash >= 78, () => {
          S.cash -= 78; S.spent += 78; S.energy = 100; S.health = clamp(S.health + 10, 0, 100);
          S.stress = clamp(S.stress - 20, 0, 100); S.minutes += 8 * 60; refreshStop(n);
        }));
      }
    }
    if (has("snacks")) {
      acts.push(action("Eat from your own supplies", "Cheaper than everything here.", true, () => {
        S.inventory.snacks--; if (!S.inventory.snacks) delete S.inventory.snacks;
        S.food += 1; S.health = clamp(S.health + 4, 0, 100); S.minutes += 10;
        S.skills.cooking += 1; refreshStop(n);
      }));
    }
    $("stopActions").replaceChildren(...acts);
    // a stop can trigger its own events (the attendant, the dead battery)
    const ctx = ctxNow({ stopped: true, services: n.services });
    const pool = C.events.filter(e => eligible(e, ctx) && ((e.requires || {}).stopped || (e.requires || {}).service));
    if (pool.length && Math.random() < 0.55) setTimeout(() => fireEvent(pickWeighted(pool), ctx), 400);
    save();
    hud();
  }
  function refreshStop(n) { openStop(n); }
  function action(label, sub, enabled, fn) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "action";
    b.innerHTML = `<span class="action-label"></span><span class="action-sub"></span>`;
    b.querySelector(".action-label").textContent = label;
    b.querySelector(".action-sub").textContent = sub;
    b.disabled = !enabled;
    b.addEventListener("click", fn);
    return b;
  }
  function leaveStop() {
    show("travel");
    S.mile += 0.6;
    setTravel(true);
    save();
  }

  // ---------------------------------------------------------------- end of trip
  function score() {
    return Math.round(
      S.mile * 3 + S.cash * 0.6 + S.vehicle * 4 + S.health * 3 + (100 - S.stress) * 2 +
      S.souvenirs.length * 40 + S.events * 15
    );
  }
  function arrive() {
    S.done = true; stopTravel();
    account.trips++; account.arrivals++;
    account.milesLifetime += Math.round(S.mile);
    account.xp += 120 + Math.round(S.mile);
    account.travelerLevel = 1 + Math.floor(account.xp / 600);
    if (S.fuelGal < 1) award("thrifty");
    award("arrived");
    saveAccount();
    summary(true, "FLAGSTAFF", "You come around the last curve and the San Francisco Peaks are just there, with snow on them, like a postcard nobody sent you.");
  }
  function fail(title, text) {
    S.done = true; stopTravel();
    account.trips++;
    account.milesLifetime += Math.round(S.mile);
    account.xp += 40 + Math.round(S.mile * 0.5);
    account.memorials.push({
      name: S.name, miles: Math.round(S.mile), cause: title,
      spent: Math.round(S.spent), when: new Date().toLocaleDateString()
    });
    saveAccount();
    summary(false, title, text);
  }
  function summary(ok, title, text) {
    show("summary");
    $("sumTitle").textContent = ok ? "YOU MADE IT" : title.toUpperCase();
    $("sumTitle").className = ok ? "sum-title good" : "sum-title bad";
    $("sumText").textContent = text;
    const hours = Math.floor((S.minutes - 8 * 60) / 60), mins = Math.round((S.minutes - 8 * 60) % 60);
    const rows = [
      ["Miles traveled", Math.round(S.mile) + " of " + destMile()],
      ["Time on the road", `${hours}h ${mins}m`],
      ["Money spent", "$" + Math.round(S.spent)],
      ["Cash left", "$" + Math.round(S.cash)],
      ["Fuel used", S.fuelUsed.toFixed(1) + " gal"],
      ["Events encountered", S.events],
      ["Vehicle condition", Math.round(S.vehicle) + "%"],
      ["Health", Math.round(S.health)],
      ["Souvenirs", S.souvenirs.length ? S.souvenirs.join(", ") : "none"],
      ["Final score", score()]
    ];
    $("sumRows").replaceChildren(...rows.map(([k, v]) => {
      const d = document.createElement("div");
      d.className = "sum-row";
      d.innerHTML = `<span></span><b></b>`;
      d.children[0].textContent = k; d.children[1].textContent = v;
      return d;
    }));
    if (!ok) {
      const m = document.createElement("p");
      m.className = "memorial";
      m.textContent = `HERE LIES THE DREAM OF REACHING FLAGSTAFF — ${S.name} made it ${Math.round(S.mile)} miles, spent $${Math.round(S.spent)}, and was ultimately defeated by: ${title.toLowerCase()}.`;
      $("sumRows").append(m);
    }
    store.clear(SAVE_KEY);
    renderAccount();
    audio[ok ? "good" : "bad"]();
  }

  // ---------------------------------------------------------------- HUD + art
  function hud() {
    if (!S) return;
    $("hudMiles").textContent = Math.max(0, Math.round(destMile() - S.mile));
    $("hudFuel").textContent = fuelPct() + "%";
    $("hudCash").textContent = "$" + Math.round(S.cash);
    $("hudHealth").textContent = Math.round(S.health);
    $("hudEnergy").textContent = Math.round(S.energy);
    $("hudVehicle").textContent = Math.round(S.vehicle) + "%";
    $("hudStress").textContent = Math.round(S.stress);
    $("hudClock").textContent = clockText();
    $("hudNext").textContent = nextNode() ? `${nextNode().name} in ${Math.max(0, Math.round(nextNode().mile - S.mile))} mi` : "";
    $("hudFuelBar").style.width = fuelPct() + "%";
    $("hudFuelBar").className = "bar-fill" + (fuelPct() < 20 ? " warn" : "");
  }

  const cv = () => $("road");
  let scroll = 0;
  function drawRoad(dt) {
    const c = cv(), ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const p = S ? S.mile / destMile() : 0;
    const night = S ? isNight() : false;
    scroll += (travelling ? dt * 260 * speed : 0);

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    if (night) { sky.addColorStop(0, "#0b1030"); sky.addColorStop(1, "#242a52"); }
    else if (p < 0.45) { sky.addColorStop(0, "#5fb0e5"); sky.addColorStop(1, "#ffd9a0"); }
    else { sky.addColorStop(0, "#2f7fc2"); sky.addColorStop(1, "#cfe7f5"); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    if (night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % w, y = (i * 53) % (h * 0.5);
        ctx.globalAlpha = 0.3 + ((i * 7) % 10) / 20;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;
    }

    // far mesas / mountains
    const horizon = h * 0.62;
    ctx.fillStyle = night ? "#161b3a" : p < 0.5 ? "#c98a5e" : "#6d7f8c";
    for (let i = -1; i < 8; i++) {
      const bx = ((i * 220) - (scroll * 0.12) % 220) + 0;
      const bh = 40 + ((i * 37) % 55);
      ctx.beginPath();
      ctx.moveTo(bx, horizon);
      ctx.lineTo(bx + 60, horizon - bh);
      ctx.lineTo(bx + 120, horizon - bh * 0.6);
      ctx.lineTo(bx + 190, horizon);
      ctx.closePath(); ctx.fill();
    }

    // ground
    ctx.fillStyle = night ? "#1d2033" : p < 0.45 ? "#d9a066" : p < 0.75 ? "#b08f5d" : "#5d7a52";
    ctx.fillRect(0, horizon, w, h - horizon);

    // roadside plants: saguaros low, junipers mid, pines up top
    const kind = p < 0.4 ? "saguaro" : p < 0.72 ? "juniper" : "pine";
    for (let i = -1; i < 10; i++) {
      const x = ((i * 150) - (scroll * 0.55) % 150);
      const y = horizon + 6 + ((i * 29) % 12);
      ctx.fillStyle = night ? "#10131f" : kind === "saguaro" ? "#4d7a43" : kind === "juniper" ? "#4a6b46" : "#274d34";
      if (kind === "saguaro") {
        ctx.fillRect(x, y - 34, 7, 34);
        ctx.fillRect(x - 10, y - 26, 10, 5); ctx.fillRect(x - 10, y - 26, 5, 14);
        ctx.fillRect(x + 7, y - 30, 10, 5); ctx.fillRect(x + 12, y - 30, 5, 18);
      } else if (kind === "juniper") {
        ctx.beginPath(); ctx.arc(x, y - 14, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - 2, y - 8, 4, 10);
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y - 44); ctx.lineTo(x + 14, y); ctx.lineTo(x - 14, y);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(x - 2, y, 4, 6);
      }
    }

    // road
    const roadTop = h * 0.72;
    ctx.fillStyle = night ? "#22242e" : "#4a4a52";
    ctx.fillRect(0, roadTop, w, h - roadTop);
    ctx.fillStyle = night ? "#3a3d4a" : "#6b6b74";
    ctx.fillRect(0, roadTop, w, 3);
    ctx.fillStyle = "#f0e2b6";
    const dash = 46, gap = 34, y = h * 0.86;
    for (let x = -((scroll * 1.6) % (dash + gap)); x < w; x += dash + gap) ctx.fillRect(x, y, dash, 5);

    // the vehicle
    const bob = travelling ? Math.sin(scroll / 18) * 1.2 : 0;
    drawTruck(ctx, w * 0.42, h * 0.8 + bob, night);
  }

  function drawTruck(ctx, x, y, night) {
    const s = 1.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.ellipse(0, 26 * s, 42 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    const body = "#c8442f", dark = "#93301f";
    ctx.fillStyle = body;
    ctx.fillRect(-40 * s, 2 * s, 78 * s, 16 * s);            // bed + body
    ctx.fillRect(-14 * s, -12 * s, 34 * s, 16 * s);          // cab
    ctx.fillStyle = dark;
    ctx.fillRect(-40 * s, 14 * s, 78 * s, 4 * s);
    ctx.fillStyle = night ? "#2b3550" : "#9fd2e8";           // glass
    ctx.fillRect(-10 * s, -9 * s, 13 * s, 11 * s);
    ctx.fillRect(6 * s, -9 * s, 11 * s, 11 * s);
    ctx.fillStyle = "#1b1b22";                                // wheels
    for (const wx of [-26, 24]) {
      ctx.beginPath(); ctx.arc(wx * s, 20 * s, 7.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#565663";
      ctx.beginPath(); ctx.arc(wx * s, 20 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#1b1b22";
    }
    if (night) {                                              // headlight cone
      const g = ctx.createLinearGradient(40 * s, 6 * s, 150 * s, 6 * s);
      g.addColorStop(0, "rgba(255,240,190,0.5)");
      g.addColorStop(1, "rgba(255,240,190,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(38 * s, 2 * s); ctx.lineTo(150 * s, -12 * s); ctx.lineTo(150 * s, 26 * s); ctx.lineTo(38 * s, 12 * s);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- log, account, save
  function logLine(text) {
    S.log.push(`${clockText()} · mile ${Math.round(S.mile)} — ${text}`);
    if (S.log.length > 200) S.log.shift();
  }
  function renderLog() {
    show("log");
    $("logList").replaceChildren(...S.log.slice().reverse().map(l => {
      const d = document.createElement("div"); d.className = "log-line"; d.textContent = l; return d;
    }));
  }
  function renderAccount() {
    $("accLevel").textContent = account.travelerLevel;
    $("accTrips").textContent = `${account.arrivals} / ${account.trips}`;
    $("accMiles").textContent = account.milesLifetime.toLocaleString();
    const earned = C.achievements.filter(a => account.achievements.includes(a.id));
    $("accAch").replaceChildren(...C.achievements.map(a => {
      const got = account.achievements.includes(a.id);
      const d = document.createElement("div");
      d.className = "ach" + (got ? " got" : "");
      d.innerHTML = `<b></b><span></span>`;
      d.children[0].textContent = got ? a.name : "· · ·";
      d.children[1].textContent = got ? a.desc : "Not yet discovered";
      return d;
    }));
    $("accAchCount").textContent = `${earned.length} / ${C.achievements.length}`;
    $("accMemorials").replaceChildren(...account.memorials.slice(-5).reverse().map(m => {
      const d = document.createElement("div");
      d.className = "log-line";
      d.textContent = `${m.name} — ${m.miles} miles, $${m.spent} spent, ${m.cause.toLowerCase()} (${m.when})`;
      return d;
    }));
  }
  const save = () => { if (S && !S.done) store.set(SAVE_KEY, S); };

  function resume() {
    const s = store.get(SAVE_KEY);
    if (!s) return false;
    S = s;
    show("travel");
    hud();
    setTravel(false);
    flash("Trip resumed. Press Drive when you're ready.");
    return true;
  }

  // ---------------------------------------------------------------- wiring
  $("btnNew").addEventListener("click", () => { store.clear(SAVE_KEY); startCreate(); });
  $("btnResume").addEventListener("click", () => resume());
  $("btnAccount").addEventListener("click", () => { renderAccount(); $("accountPanel").hidden = !$("accountPanel").hidden; });
  $("btnBegin").addEventListener("click", beginTrip);
  $("btnBackTitle").addEventListener("click", () => show("title"));
  $("shopFuel").addEventListener("click", () => {
    const cost = Math.round((veh().tankGal - S.fuelGal) * 3.79);
    if (S.cash < cost) return;
    S.cash -= cost; S.spent += cost; S.fuelGal = veh().tankGal;
    audio.pump(); renderShop();
  });
  $("btnLaunch").addEventListener("click", launch);
  $("btnGo").addEventListener("click", () => setTravel(!travelling));
  $("btnSpeed").addEventListener("click", () => {
    speed = speed === 1 ? 3 : speed === 3 ? 8 : 1;
    $("btnSpeed").textContent = speed + "×";
  });
  $("btnLog").addEventListener("click", renderLog);
  $("btnLogBack").addEventListener("click", () => { show("travel"); hud(); });
  $("eventClose").addEventListener("click", closeEvent);
  $("btnLeaveStop").addEventListener("click", leaveStop);
  $("btnSumHome").addEventListener("click", () => { S = null; show("title"); refreshTitle(); });
  $("btnSound").addEventListener("click", () => {
    const on = audio.toggle();
    $("btnSound").setAttribute("aria-pressed", String(on));
    $("btnSound").textContent = on ? "Sound on" : "Sound off";
  });

  function refreshTitle() {
    $("btnResume").hidden = !store.get(SAVE_KEY);
    renderAccount();
  }

  // boot
  refreshTitle();
  show("title");
  drawRoad(0);
  window.addEventListener("resize", () => drawRoad(0));
  window.OME = { get state() { return S; }, get account() { return account; }, beginTrip, launch, setTravel, fireEvent, C };
})();
