/* One More Exit — engine.
   Phoenix to Boston. Logic only; everything the player reads is in content.js. */
(() => {
  const C = window.OME_CONTENT;
  const MUS = window.OME_MUSIC;
  const ROAD = window.OME_ROAD;
  const AMB = window.OME_AMB || { init(){}, update(){}, toggle:()=>false, wiper(){}, blinker(){} };
  // if the sync script is missing or blocked, the game plays on, locally
  const SYNC = window.OME_SYNC || { enabled: false, group: "family",
    load: async () => null, push: async () => {}, board: async () => [] };
  const $ = id => document.getElementById(id);
  const SAVE_KEY = "ome-save-v2";
  const ACCOUNT_KEY = "ome-account-v2";

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    clear(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  let account = store.get(ACCOUNT_KEY) || {
    travelerLevel: 1, xp: 0, runs: 0, arrivals: 0, milesLifetime: 0, bestMile: 0,
    achievements: [], souvenirs: [], flags: [], anomaly: 0, memorials: [], checkpoints: []
  };
  const saveAccount = () => store.set(ACCOUNT_KEY, account);

  let S = null, travelling = false, speed = 1, lastFrame = 0, raf = 0, pendingLot = null;

  // ---------------------------------------------------------------- helpers
  const nodes = () => C.route.nodes;
  const destMile = () => nodes()[nodes().length - 1].mile;
  const veh = () => C.vehicles.find(v => v.id === S.vehicleId) || C.vehicles[0];
  const fuelPct = () => S.onFoot ? 0 : clamp(Math.round((S.fuelGal / veh().tankGal) * 100), 0, 100);
  const cargoCap = () => (S.onFoot ? 6 : veh().cargo);
  const bulkUsed = () => Object.entries(S.inventory).reduce((sum, [id, n]) => {
    const it = C.items.find(i => i.id === id);
    return sum + (it ? it.bulk * n : 0);
  }, 0);
  const has = id => (S.inventory[id] || 0) > 0;
  const addItem = id => { S.inventory[id] = (S.inventory[id] || 0) + 1; };
  const dropItem = id => { if (S.inventory[id]) { S.inventory[id]--; if (!S.inventory[id]) delete S.inventory[id]; } };
  const clockText = () => {
    const mins = Math.round(S.minutes) % (24 * 60);
    const h = Math.floor(mins / 60), m = mins % 60, ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  const dayNum = () => Math.floor(S.minutes / (24 * 60)) + 1;
  const isNight = () => { const h = (S.minutes % (24 * 60)) / 60; return h < 5.5 || h >= 19.5; };
  const nextNode = () => nodes().find(n => n.mile > S.mile + 0.01) || nodes()[nodes().length - 1];
  const prevNode = () => [...nodes()].reverse().find(n => n.mile <= S.mile) || nodes()[0];
  const region = () => prevNode().region;
  const regionInfo = () => C.regions[region()] || C.regions.desert;
  function grade() {
    const p = prevNode(), n = nextNode();
    const climbRegions = { desert: 1, mesa: 1, hills: 1 };
    if (!climbRegions[p.region]) return "flat";
    const f = (S.mile - p.mile) / Math.max(1, n.mile - p.mile);
    return f < 0.5 ? "climb" : "descend";
  }

  // the score follows the road on its own
  function moodNow(danger) {
    if (danger) return "danger";
    if (S.onFoot) return "foot";
    if (isNight()) return "night";
    if (S.fuelGal / veh().tankGal < 0.12 || S.vehicle < 25 || S.health < 35) return "danger";
    return regionInfo().mood;
  }
  const syncMood = (danger) => MUS.setMood(moodNow(danger));

  // ---------------------------------------------------------------- screens
  const screens = ["title", "create", "outfit", "travel", "stop", "summary", "log", "lot"];
  function show(name) {
    screens.forEach(s => { const el = $("screen-" + s); if (el) el.hidden = s !== name; });
    if (name !== "travel") stopTravel();
  }
  function flash(msg) {
    const el = $("flash");
    el.textContent = msg; el.classList.add("on");
    clearTimeout(flash.t); flash.t = setTimeout(() => el.classList.remove("on"), 2200);
  }

  // ---------------------------------------------------------------- character
  const pick = { career: "trucker", vehicle: "ranger" };
  function startCreate() {
    show("create");
    $("careerList").replaceChildren(...C.careers.map(c =>
      optionCard(c.name, c.perk, `$${c.cash} to start`, () => { pick.career = c.id; refreshCreate(); })));
    $("vehicleList").replaceChildren(...C.vehicles.slice(0, 4).map(v =>
      optionCard(v.name, v.blurb, `${v.mpg} mpg · ${v.tankGal} gal · ${v.cargo} cu ft`,
        () => { pick.vehicle = v.id; refreshCreate(); })));
    refreshCreate();
  }
  function refreshCreate() {
    [...$("careerList").children].forEach((el, i) => el.classList.toggle("on", C.careers[i].id === pick.career));
    [...$("vehicleList").children].forEach((el, i) => el.classList.toggle("on", C.vehicles[i].id === pick.vehicle));
  }
  function optionCard(title, desc, meta, onClick) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "card";
    for (const [cls, text] of [["card-title", title], ["card-desc", desc], ["card-meta", meta]]) {
      const s = document.createElement("span"); s.className = cls; s.textContent = text; b.append(s);
    }
    b.addEventListener("click", onClick);
    return b;
  }

  function beginRun() {
    const name = ($("travelerName").value || "").trim().slice(0, 18) || "Traveler";
    store.set("ome-name", name);
    pushProgress(true);
    const career = C.careers.find(c => c.id === pick.career);
    const v = C.vehicles.find(x => x.id === pick.vehicle);
    S = {
      name, career: career.id, vehicleId: v.id, vehicleName: v.name,
      skills: Object.assign({ mechanical: 0, navigation: 0, firstAid: 0, cooking: 0, social: 0, outdoors: 0 }, career.skills),
      cash: career.cash, fuelGal: v.tankGal,
      health: 100, energy: 100, stress: 10, vehicle: 86,
      mile: 0, minutes: 8 * 60, inventory: { water: 1, food: 1 },
      log: [], souvenirs: [], seen: {}, spent: 0, fuelUsed: 0, events: 0,
      onFoot: false, footMiles: 0, odo: 0, done: false, visits: {}
    };
    show("outfit");
    renderShop();
  }

  // ---------------------------------------------------------------- shop
  function renderShop(inTown) {
    const cap = cargoCap();
    $("shopCash").textContent = "$" + Math.round(S.cash);
    $("shopBulk").textContent = `${bulkUsed()} / ${cap} cu ft`;
    $("shopList").replaceChildren(...C.items.map(it => {
      const owned = S.inventory[it.id] || 0;
      const row = document.createElement("div");
      row.className = "shop-row";
      const name = document.createElement("span"); name.className = "shop-name"; name.textContent = it.name;
      const use = document.createElement("span"); use.className = "shop-use"; use.textContent = it.use;
      const price = document.createElement("span"); price.className = "shop-price";
      price.textContent = `$${it.price} · ${it.bulk} cu ft`;
      const btns = document.createElement("span"); btns.className = "shop-buttons";
      const minus = document.createElement("button"); minus.type = "button"; minus.className = "mini"; minus.textContent = "−";
      const count = document.createElement("b"); count.className = "owned"; count.textContent = owned;
      const plus = document.createElement("button"); plus.type = "button"; plus.className = "mini"; plus.textContent = "+";
      plus.addEventListener("click", () => {
        if (S.cash < it.price) return flash("Not enough money.");
        if (bulkUsed() + it.bulk > cap) return flash("Nowhere to put it.");
        S.cash -= it.price; S.spent += it.price; addItem(it.id);
        renderShop(inTown);
      });
      minus.addEventListener("click", () => {
        if (!owned) return;
        S.cash += Math.round(it.price * (inTown ? 0.6 : 1)); dropItem(it.id);
        renderShop(inTown);
      });
      btns.append(minus, count, plus);
      row.append(name, use, price, btns);
      return row;
    }));
    const fill = Math.round((veh().tankGal - S.fuelGal) * 3.1);
    $("shopFuel").hidden = S.onFoot;
    $("shopFuel").disabled = S.cash < fill || fuelPct() > 98;
    $("shopFuelLabel").textContent = `Fill the tank — $${fill}`;
    $("shopFuelSub").textContent = `$3.10/gal in Phoenix, which is as cheap as it will ever be. Tank at ${fuelPct()}%.`;
  }

  function launch() {
    pushProgress(true);
    logLine(`Left Phoenix at ${clockText()} with $${Math.round(S.cash)} and ${fuelPct()}% of a tank. Boston is ${destMile()} miles away.`);
    show("travel");
    AMB.init();
    MUS.start(); syncMood();
    renderRadio();
    save();
    setTravel(true);
  }

  // ---------------------------------------------------------------- travel
  function setTravel(go) {
    travelling = go;
    $("btnGo").textContent = go ? "Pause" : (S.onFoot ? "Walk" : "Drive");
    if (go) { MUS.start(); lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
    else cancelAnimationFrame(raf);
  }
  const stopTravel = () => { travelling = false; cancelAnimationFrame(raf); };

  function frame(now) {
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
  }

  function advance(dt) {
    const mins = dt * 60 * speed;
    const mph = S.onFoot ? 3
      : 58 * (grade() === "climb" ? 0.9 : 1) * (S.vehicle < 40 ? 0.72 : 1) * (S.vehicle < 18 ? 0.62 : 1) * (isNight() ? 0.85 : 1);
    const miles = (mph / 60) * mins;
    S.minutes += mins;
    S.mile += miles;
    S.odo += miles;
    if (S.onFoot) S.footMiles += miles;
    if (S.footMiles >= 20) award("long_walk");

    if (!S.onFoot) {
      const mpg = veh().mpg * (grade() === "climb" ? 0.8 : grade() === "descend" ? 1.12 : 1) * (S.vehicle < 50 ? 0.9 : 1);
      const used = miles / mpg;
      S.fuelGal = Math.max(0, S.fuelGal - used);
      S.fuelUsed += used;
      S.vehicle = clamp(S.vehicle - miles * 0.0022, 0, 100);
    }
    S.grime = Math.min(1, (S.grime || 0) + miles * 0.0016);
    S.energy = clamp(S.energy - mins * (S.onFoot ? 0.07 : 0.035), 0, 100);
    S.health = clamp(S.health - (S.energy < 12 ? mins * 0.012 : 0) - (S.onFoot ? mins * 0.003 : 0), 0, 100);
    S.stress = clamp(S.stress + (S.energy < 25 ? mins * 0.02 : -mins * 0.004), 0, 100);

    if (!S.onFoot) {                       // warnings first: nothing dies without telling you
      const pct = S.fuelGal / veh().tankGal;
      if (pct < 0.12 && !S.warnedFuel) {
        S.warnedFuel = true;
        flash("Fuel light. Next town is " + Math.max(1, Math.round(nextNode().mile - S.mile)) + " miles.");
      }
      if (pct > 0.25) S.warnedFuel = false;
      if (S.vehicle < 28 && !S.warnedVeh) {
        S.warnedVeh = true;
        flash("Something under the hood is telling you about itself.");
      }
      if (S.vehicle > 40) S.warnedVeh = false;
    }
    if (!S.onFoot && S.fuelGal <= 0) {
      if (has("jerry") && (S.jerryFuel || 0) > 0) {        // use what you carried
        const pour = Math.min(veh().tankGal * 0.5, S.jerryFuel);
        S.jerryFuel -= pour; S.fuelGal += pour; S.minutes += 15;
        flash("You pour in the cans. That buys you " + Math.round(pour * veh().mpg) + " miles.");
      } else if (!S.beggedFuel) {                          // one roadside rescue per run
        S.beggedFuel = true;
        stopTravel();
        S.minutes += 55;
        const price = 60 + Math.round(Math.random() * 60);
        $("eventTitle").textContent = "THE ENGINE GOES QUIET";
        $("eventText").textContent = "You coast onto the shoulder with the wheel gone heavy. After the better part of an hour, a flatbed slows down. The driver has a drum in the back and no particular hurry.";
        $("eventChoices").replaceChildren();
        $("eventOutcome").textContent = "";
        const choice = (label, fn) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "choice"; b.textContent = label;
          b.addEventListener("click", fn);
          $("eventChoices").append(b);
        };
        choice(`Buy five gallons — $${price}`, () => {
          if (S.cash < price) { flash("You don't have it."); return; }
          S.cash -= price; S.spent += price; S.fuelGal += 5;
          $("eventChoices").replaceChildren();
          $("eventOutcome").textContent = "He funnels it in, waves off the thanks, and is gone before you get his name.";
          $("eventClose").hidden = false;
        });
        choice("Trade something for it", () => {
          const tradable = ["jerky", "tools", "radio", "blanket", "mug"].find(has);
          $("eventChoices").replaceChildren();
          if (tradable) {
            dropItem(tradable); S.fuelGal += 4;
            $("eventOutcome").textContent = "He looks it over, shrugs, and pumps four gallons. Out here that is a fair trade and you both know it.";
          } else {
            $("eventOutcome").textContent = "You have nothing he wants. He is sorry about it, and he means it, and he leaves.";
          }
          $("eventClose").hidden = false;
        });
        choice("Walk from here", () => {
          $("eventCard").hidden = true;
          goOnFoot();
          show("travel"); setTravel(true);
        });
        $("eventClose").hidden = true;
        $("eventCard").hidden = false;
        return;
      } else return stranded("Out of fuel");
    }
    if (!S.onFoot && S.vehicle <= 0) return stranded("The vehicle finally quit");
    if (S.health <= 0) return over("You didn't make it", "Somewhere in the middle of the country, a long way from both coasts.");
    if (S.mile >= destMile()) return arrive();

    // catch any town we have reached or driven past, however big the time step
    const due = nodes().find(n => n.mile > 0 && n.mile <= S.mile && !S.visits[n.id]);
    if (due) {
      S.visits[due.id] = true;
      S.mile = due.mile;
      return openStop(due);
    }
    maybeEvent();
    radioTick();
    if (Math.random() < 0.004) { syncMood(); pushProgress(); }
  }

  // ---------------------------------------------------------------- events
  function ctxNow(extra) {
    return Object.assign({
      mile: S.mile, night: isNight(), daytime: !isNight(), anomaly: account.anomaly,
      grade: grade(), region: region(), energy: S.energy, vehicle: S.vehicle,
      fuelPct: fuelPct(), onFoot: S.onFoot, services: [], stopped: false
    }, extra || {});
  }
  function eligible(ev, c) {
    const r = ev.requires || {};
    if (S.seen[ev.id]) return false;
    if (r.minMile != null && c.mile < r.minMile) return false;
    if (r.maxMile != null && c.mile > r.maxMile) return false;
    if (r.region && r.region !== c.region) return false;
    if (r.night && !c.night) return false;
    if (r.daytime && !c.daytime) return false;
    if (r.grade && r.grade !== c.grade) return false;
    if (r.minAnomaly != null && c.anomaly < r.minAnomaly) return false;
    if (r.maxEnergy != null && c.energy > r.maxEnergy) return false;
    if (r.maxVehicle != null && c.vehicle > r.maxVehicle) return false;
    if (r.maxFuelPct != null && c.fuelPct > r.maxFuelPct) return false;
    if (r.onFoot && !c.onFoot) return false;
    if (!r.onFoot && c.onFoot && !r.stopped) return false;
    if (r.items && !r.items.every(has)) return false;
    if (r.stopped && !c.stopped) return false;
    if (r.service && !(c.services || []).includes(r.service)) return false;
    if (r.flag && !account.flags.includes(r.flag)) return false;
    if (r.notFlag && account.flags.includes(r.notFlag)) return false;
    return true;
  }
  const pickWeighted = list => {
    const total = list.reduce((s, x) => s + (x.w || x.weight || 1), 0);
    let roll = Math.random() * total;
    for (const x of list) { roll -= (x.w || x.weight || 1); if (roll <= 0) return x; }
    return list[list.length - 1];
  };
  // Encounters are paced by distance, not by frames, so speed never floods you.
  function maybeEvent() {
    if (!$("eventCard").hidden) return;
    if (S.nextEventMile == null) S.nextEventMile = S.mile + 25 + Math.random() * 45;
    if (S.mile < S.nextEventMile) return;
    S.nextEventMile = S.mile + 30 + Math.random() * 50;
    const c = ctxNow();
    const pool = C.events.filter(e => eligible(e, c) && !(e.requires || {}).stopped && !(e.requires || {}).service);
    if (pool.length) fireEvent(pickWeighted(pool), c);
  }
  function fireEvent(ev, c) {
    S.seen[ev.id] = true;
    S.events++;
    stopTravel();
    MUS.setMood(/414|BACK AGAIN|LIGHTS BEHIND|ROAD IS CLOSED|SOMETHING IN THE ROAD/.test(ev.title) ? "danger" : moodNow());
    $("eventTitle").textContent = ev.title;
    $("eventText").textContent = ev.text;
    $("eventOutcome").textContent = "";
    $("eventClose").hidden = true;
    const choices = ev.choices.filter(ch => {
      const r = ch.requires || {};
      if (r.items && !r.items.every(has)) return false;
      if (r.skillMin && !Object.entries(r.skillMin).every(([k, v]) => (S.skills[k] || 0) >= v)) return false;
      return true;
    });
    $("eventChoices").replaceChildren(...choices.map(ch => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "choice"; b.textContent = ch.label;
      b.addEventListener("click", () => resolveChoice(ev, ch));
      return b;
    }));
    $("eventCard").hidden = false;
  }
  function resolveChoice(ev, ch) {
    const out = pickWeighted(ch.outcomes);
    applyEffects(out.effects || {});
    $("eventChoices").replaceChildren();
    $("eventOutcome").textContent = out.text;
    $("eventClose").hidden = false;
    logLine(`${ev.title} — ${ch.label}`);
    save(); hud();
  }
  function closeEvent() {
    $("eventCard").hidden = true;
    syncMood();
    if (S.done) return;
    if (pendingLot) { const n = pendingLot; pendingLot = null; return openLot(n); }
    if (!$("screen-stop").hidden) return;
    setTravel(true);
  }

  function applyEffects(e) {
    if (e.cash) { S.cash += e.cash; if (e.cash < 0) S.spent += -e.cash; }
    if (e.fuelPrice) {                       // a chance to buy at a quoted price
      const need = veh().tankGal - S.fuelGal;
      const spend = Math.min(S.cash, Math.round(need * e.fuelPrice));
      S.fuelGal = clamp(S.fuelGal + spend / e.fuelPrice, 0, veh().tankGal);
      S.cash -= spend; S.spent += spend;
    }
    if (e.fuelGal) S.fuelGal = e.fuelGal < -50 ? 0 : clamp(S.fuelGal + e.fuelGal, 0, veh().tankGal);
    if (e.fuelBurn) S.fuelGal = Math.max(0, S.fuelGal - e.fuelBurn);
    if (e.fuelSave) S.fuelGal = clamp(S.fuelGal + e.fuelSave, 0, veh().tankGal);
    if (e.milesFree) S.mile += e.milesFree;
    if (e.time) S.minutes += e.time;
    if (e.health) S.health = clamp(S.health + e.health * (S.career === "nurse" && e.health < 0 ? 0.6 : 1), 0, 100);
    if (e.energy) S.energy = clamp(S.energy + e.energy, 0, 100);
    if (e.stress) S.stress = clamp(S.stress + e.stress * (S.career === "teacher" && e.stress > 0 ? 0.8 : 1), 0, 100);
    if (e.vehicle) S.vehicle = clamp(S.vehicle + e.vehicle, 0, 100);
    if (e.repairFull) {
      const want = Math.round((100 - S.vehicle) * 5);
      const pay = Math.min(want, Math.max(0, S.cash));
      S.cash -= pay; S.spent += pay;
      S.vehicle = clamp(S.vehicle + (96 - S.vehicle) * (want ? pay / want : 1), 0, 100);
    }
    if (e.repairHalf) S.vehicle = clamp(S.vehicle + (100 - S.vehicle) / 2, 0, 100);
    if (e.food) addItem("food");
    if (e.skill) for (const [k, v] of Object.entries(e.skill)) S.skills[k] = (S.skills[k] || 0) + v;
    if (e.addItem) addItem(e.addItem);
    if (e.addItem2) addItem(e.addItem2);
    if (e.removeItem) dropItem(e.removeItem);
    if (e.useItem && has(e.useItem)) { dropItem(e.useItem); S.vehicle = clamp(S.vehicle + 5, 0, 100); }
    if (e.giveVehicle) {
      S.onFoot = false; S.vehicleId = e.giveVehicle;
      S.vehicleName = C.vehicles.find(v => v.id === e.giveVehicle).name;
      S.vehicle = e.vehicleCond || 45;
      S.fuelGal = clamp(S.fuelGal, 0, veh().tankGal);
      S.footMiles = 0;
    }
    if (e.souvenir) {
      S.souvenirs.push(e.souvenir);
      if (!account.souvenirs.includes(e.souvenir)) account.souvenirs.push(e.souvenir);
    }
    if (e.flag && !account.flags.includes(e.flag)) account.flags.push(e.flag);
    if (e.anomaly) account.anomaly += e.anomaly;
    if (e.achievement) award(e.achievement);
    S.cash = Math.max(0, S.cash);
    if (e.openLot) pendingLot = prevNode();
    saveAccount();
  }
  function award(id) {
    if (account.achievements.includes(id)) return;
    account.achievements.push(id); saveAccount();
    const a = C.achievements.find(x => x.id === id);
    if (a) flash("Achievement: " + a.name);
  }

  // ---------------------------------------------------------------- stops
  function fuelAt(n) {
    // whether this place has fuel today, and what it costs, decided once per visit
    if (!S.fuelInfo) S.fuelInfo = {};
    if (!S.fuelInfo[n.id]) {
      const available = Math.random() < Math.min(1, (n.fuelChance != null ? n.fuelChance : 0.6) + 0.2);
      const base = 3.1 + (n.kind === "settlement" ? 0.5 : 1.1) * Math.random() + S.mile / 3400;
      S.fuelInfo[n.id] = { available, price: Math.round(base * 100) / 100 };
    }
    return S.fuelInfo[n.id];
  }

  function openStop(n) {
    stopTravel();
    show("stop");
    syncMood();
    if (n.kind === "settlement") {
      MUS.setMood("settlement");
      saveCheckpoint(n);
      pushProgress(true);
      if (n.mile > 1500) award("halfway");
      if (S.fuelGal < 1) award("thrifty");
    }
    $("stopName").textContent = n.name;
    $("stopMeta").textContent = `Mile ${n.mile} of ${destMile()} · ${C.regions[n.region].name} · Day ${dayNum()}, ${clockText()}`
      + (n.blurb ? ` — ${n.blurb}` : "");
    $("stopCheckpoint").hidden = n.kind !== "settlement";

    const acts = [];
    if (!S.onFoot && n.services.includes("fuel")) {
      const info = fuelAt(n);
      if (!info.available) {
        acts.push(action("No fuel here today", "The pumps are dry and the owner has stopped apologizing about it.", false, () => {}));
      } else {
        const need = veh().tankGal - S.fuelGal;
        const full = Math.round(need * info.price);
        acts.push(action(`Fill the tank — $${full}`, `$${info.price.toFixed(2)}/gal · tank at ${fuelPct()}%`,
          S.cash >= full && need > 0.3, () => {
            S.cash -= full; S.spent += full; S.fuelGal = veh().tankGal; S.minutes += 20;
            logLine(`Fuel at ${n.name}: $${full}.`); refreshStop(n);
          }));
        const some = Math.min(Math.round(S.cash), 40);
        if (some > 4) acts.push(action(`Put in $${some}`, "Enough to keep moving east.", true, () => {
          S.cash -= some; S.spent += some;
          S.fuelGal = clamp(S.fuelGal + some / info.price, 0, veh().tankGal);
          S.minutes += 12; refreshStop(n);
        }));
        if (has("jerry")) acts.push(action("Fill the jerry cans too", "Fuel you carry is fuel nobody can refuse you.", S.cash >= 25, () => {
          const cans = S.inventory.jerry, cost = Math.round(cans * 5 * info.price);
          if (S.cash < cost) return flash("Not enough for that.");
          S.cash -= cost; S.spent += cost; S.jerryFuel = (S.jerryFuel || 0) + cans * 5;
          S.minutes += 15; flash(`${cans * 5} gallons in cans.`); refreshStop(n);
        }));
      }
    }
    if ((S.jerryFuel || 0) > 0 && !S.onFoot) {
      acts.push(action(`Pour in the cans (${Math.round(S.jerryFuel)} gal)`, "Funnel, patience, no spilling.", true, () => {
        const room = veh().tankGal - S.fuelGal, pour = Math.min(room, S.jerryFuel);
        S.fuelGal += pour; S.jerryFuel -= pour; S.minutes += 10; refreshStop(n);
      }));
    }
    if (n.services.includes("food")) {
      acts.push(action("Eat, and buy what travels — $18", "Hot food, and a box of something for later.", S.cash >= 18, () => {
        S.cash -= 18; S.spent += 18; addItem("food");
        S.health = clamp(S.health + 6, 0, 100); S.stress = clamp(S.stress - 8, 0, 100);
        S.minutes += 45; refreshStop(n);
      }));
    }
    if (has("food")) {
      acts.push(action("Eat from your own supplies", "Cheaper. Duller.", true, () => {
        dropItem("food"); S.health = clamp(S.health + 5, 0, 100); S.minutes += 25;
        S.skills.cooking += 1; refreshStop(n);
      }));
    }
    if (!S.onFoot && n.services.includes("repair")) {
      const cost = Math.round((100 - S.vehicle) * 5.4 * (S.career === "mechanic" ? 0.7 : 1));
      acts.push(action(`Repair shop — $${cost}`, `Vehicle at ${Math.round(S.vehicle)}%.`, S.cash >= cost && S.vehicle < 96, () => {
        S.cash -= cost; S.spent += cost; S.vehicle = 96; S.minutes += 180;
        S.skills.mechanical += 1; logLine(`Repairs at ${n.name}: $${cost}.`); refreshStop(n);
      }));
    }
    if (!S.onFoot && has("tools") && S.vehicle < 85) {
      acts.push(action("Work on it yourself", `Mechanical ${S.skills.mechanical}. Free, but it costs daylight.`, true, () => {
        const gain = 5 + S.skills.mechanical * 3;
        S.vehicle = clamp(S.vehicle + gain, 0, 100); S.minutes += 120; S.energy -= 10;
        S.skills.mechanical += 1; flash(`Vehicle +${gain}%`); refreshStop(n);
      }));
    }
    if (n.services.includes("rest")) {
      acts.push(action("Sleep here — $45", "A bed, a door that locks.", S.cash >= 45, () => {
        S.cash -= 45; S.spent += 45; S.energy = 100; S.health = clamp(S.health + 12, 0, 100);
        S.stress = clamp(S.stress - 25, 0, 100); S.minutes += 8 * 60; refreshStop(n);
      }));
    }
    if (!S.onFoot && (S.grime || 0) > 0.25) {
      acts.push(action("Clean the windshield", "Bugs, dust and three states of road film.", true, () => {
        S.grime = 0; S.minutes += 10; flash("You can see again."); refreshStop(n);
      }));
    }
    acts.push(action("Sleep in the vehicle — free", S.onFoot ? "Sleep rough, off the road." : "Seat back, doors locked.", true, () => {
      S.energy = clamp(S.energy + 55, 0, 100); S.stress = clamp(S.stress - 12, 0, 100);
      S.health = clamp(S.health + (has("blanket") ? 4 : 0), 0, 100);
      S.minutes += 6 * 60; award("luxury"); refreshStop(n);
    }));
    if (n.kind === "settlement") {
      const pay = 55 + (S.skills.mechanical + S.skills.social + S.skills.firstAid + S.skills.outdoors) * 9 + Math.floor(Math.random() * 40);
      acts.push(action(`Work a day here — about $${pay}`, "Hands are needed everywhere. It costs a day and most of your energy.", S.energy > 25, () => {
        S.cash += pay; S.minutes += 11 * 60; S.energy = clamp(S.energy - 35, 0, 100);
        S.stress = clamp(S.stress + 6, 0, 100);
        const which = ["mechanical", "social", "outdoors", "firstAid"][Math.floor(Math.random() * 4)];
        S.skills[which] += 1;
        logLine(`Worked a day in ${n.name} for $${pay}.`);
        refreshStop(n);
      }));
    }
    if (n.services.includes("shop")) {
      acts.push(action("Trade at the market", "Buy supplies, sell what you don't need.", true, () => {
        show("outfit"); renderShop(true);
        $("btnLaunch").textContent = "Back to " + n.name;
        $("btnLaunch").onclick = () => { $("btnLaunch").onclick = null; $("btnLaunch").textContent = "Hit the road"; openStop(n); };
      }));
    }
    if (n.services.includes("lot")) {
      acts.push(action("Visit the vehicle lot", S.onFoot ? "You need wheels." : "Trade up, trade down, or just look.", true, () => openLot(n)));
    }
    if (!S.onFoot) {
      acts.push(action("Leave the vehicle and continue on foot", "Three miles an hour. Six cubic feet. A last resort.", true, () => {
        if (!confirmish("Abandon the vehicle here?")) return;
        goOnFoot(); refreshStop(n);
      }));
    }
    $("stopActions").replaceChildren(...acts);

    const c = ctxNow({ stopped: true, services: n.services });
    const pool = C.events.filter(e => eligible(e, c) && ((e.requires || {}).stopped || (e.requires || {}).service));
    const townGap = S.mile - (S.lastTownEventMile || -200);
    if (pool.length && townGap > 120 && Math.random() < 0.45) {
      S.lastTownEventMile = S.mile;
      setTimeout(() => { if ($("eventCard").hidden) fireEvent(pickWeighted(pool), c); }, 500);
    }
    save(); hud();
  }
  const refreshStop = n => openStop(n);
  function confirmish(q) { return window.confirm ? window.confirm(q) : true; }
  function action(label, sub, enabled, fn) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "action"; b.disabled = !enabled;
    const l = document.createElement("span"); l.className = "action-label"; l.textContent = label;
    const s = document.createElement("span"); s.className = "action-sub"; s.textContent = sub;
    b.append(l, s);
    b.addEventListener("click", fn);
    return b;
  }
  function leaveStop() {
    show("travel");
    S.mile += 0.7;
    syncMood();
    setTravel(true);
    save();
  }

  // ---------------------------------------------------------------- the lot
  function openLot(n) {
    show("lot");
    $("lotName").textContent = n.name + " — vehicle lot";
    const mine = veh();
    const myValue = S.onFoot ? 0 : Math.round(mine.value * (S.vehicle / 100));
    $("lotMine").textContent = S.onFoot
      ? "You arrive on foot with nothing to trade but money."
      : `Yours: ${mine.name} · ${Math.round(S.vehicle)}% · trade-in value about $${myValue}`;
    if (!S.lotStock || S.lotStock.node !== n.id) {
      const pool = C.vehicles.filter(v => v.id !== S.vehicleId);
      const offers = [];
      while (offers.length < 3 && pool.length) {
        const v = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        const cond = 35 + Math.floor(Math.random() * 55);
        offers.push({ id: v.id, cond, price: Math.max(40, Math.round(v.value * (cond / 100) * 1.15)) });
      }
      S.lotStock = { node: n.id, offers };
    }
    $("lotList").replaceChildren(...S.lotStock.offers.map(o => {
      const v = C.vehicles.find(x => x.id === o.id);
      const diff = o.price - myValue;
      const b = action(
        `${v.name} — ${diff > 0 ? "$" + diff + " to trade" : "they pay you $" + Math.abs(diff)}`,
        `${v.mpg} mpg · ${v.tankGal} gal tank · ${v.cargo} cu ft · ${o.cond}% condition — ${v.blurb}`,
        diff <= S.cash,
        () => {
          if (diff > S.cash) return flash("Not enough money.");
          S.cash -= diff; if (diff > 0) S.spent += diff;
          S.vehicleId = v.id; S.vehicleName = v.name; S.vehicle = o.cond;
          S.onFoot = false; S.footMiles = 0;
          S.fuelGal = clamp(S.fuelGal, 0, v.tankGal);
          while (bulkUsed() > v.cargo) {                    // cargo has to fit the new vehicle
            const biggest = Object.keys(S.inventory).sort((a, b2) =>
              (C.items.find(i => i.id === b2).bulk) - (C.items.find(i => i.id === a).bulk))[0];
            dropItem(biggest);
            flash("Left some gear behind — it didn't fit.");
          }
          S.lotStock = null;
          award("trader");
          logLine(`Traded into a ${v.name} at ${n.name}.`);
          openStop(n);
        });
      return b;
    }));
    save();
  }

  function goOnFoot() {
    S.onFoot = true;
    S.footMiles = 0;
    S.vehicleName = "on foot";
    while (bulkUsed() > 6) {
      const biggest = Object.keys(S.inventory).sort((a, b) =>
        (C.items.find(i => i.id === b).bulk) - (C.items.find(i => i.id === a).bulk))[0];
      dropItem(biggest);
    }
    logLine("Left the vehicle behind and started walking.");
    flash("On foot. Three miles an hour.");
    syncMood();
  }
  function stranded(why) {
    stopTravel();
    logLine(why + " at mile " + Math.round(S.mile) + ".");
    MUS.setMood("danger");
    $("eventTitle").textContent = why.toUpperCase();
    $("eventText").textContent = "You are standing on the shoulder in the quiet, looking at a vehicle that is not going to help you anymore. The next town is " +
      Math.max(1, Math.round(nextNode().mile - S.mile)) + " miles east.";
    $("eventOutcome").textContent = "";
    $("eventChoices").replaceChildren(
      (() => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "choice"; b.textContent = "Take what you can carry and walk";
        b.addEventListener("click", () => {
          goOnFoot();
          $("eventCard").hidden = true;
          show("travel"); setTravel(true);
        });
        return b;
      })(),
      (() => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "choice"; b.textContent = "Give up here";
        b.addEventListener("click", () => { $("eventCard").hidden = true; over(why, "The road east stayed east."); });
        return b;
      })()
    );
    $("eventClose").hidden = true;
    $("eventCard").hidden = false;
  }

  // ---------------------------------------------------------------- checkpoints
  function saveCheckpoint(n) {
    const snap = JSON.parse(JSON.stringify(S));
    snap.checkpointName = n.name;
    snap.checkpointAt = new Date().toLocaleDateString();
    account.checkpoints = account.checkpoints.filter(c => c.node !== n.id);
    account.checkpoints.push({ node: n.id, name: n.name, mile: n.mile, day: dayNum(), snap });
    account.checkpoints.sort((a, b) => a.mile - b.mile);
    if (account.checkpoints.length > 12) account.checkpoints.shift();
    account.bestMile = Math.max(account.bestMile, Math.round(n.mile));
    saveAccount();
    flash(`Checkpoint reached: ${n.name}`);
  }
  function renderCheckpoints() {
    const list = account.checkpoints.slice().reverse();
    $("cpList").replaceChildren(...(list.length ? list.map(c =>
      action(`${c.name} — mile ${c.mile}`, `Day ${c.day} of that run. Start again from here.`, true, () => {
        S = JSON.parse(JSON.stringify(c.snap));
        S.done = false;
        show("travel");
        MUS.start(); syncMood();
        hud(); setTravel(false);
        flash(`Restarted from ${c.name}.`);
        save();
      })) : [action("No checkpoints yet", "Reach a settlement and it becomes a place you can come back to.", false, () => {})]));
  }

  // ---------------------------------------------------------------- end
  function score() {
    return Math.round(S.mile * 2 + S.cash * 0.5 + S.vehicle * 3 + S.health * 3 +
      (100 - S.stress) * 2 + S.souvenirs.length * 60 + S.events * 20);
  }
  function arrive() {
    S.done = true; stopTravel(); MUS.setMood("settlement");
    account.runs++; account.arrivals++;
    account.milesLifetime += Math.round(S.mile);
    account.bestMile = destMile();
    account.xp += 900;
    account.travelerLevel = 1 + Math.floor(account.xp / 800);
    award("arrived");
    saveAccount();
    pushProgress(true);
    summary(true, "BOSTON",
      "You come around the last bend and the harbor is there, and the lights are on, all of them, all at once, for no reason other than that they can be.");
  }
  function over(title, text) {
    S.done = true; stopTravel(); MUS.setMood("danger");
    account.runs++;
    account.milesLifetime += Math.round(S.mile);
    account.bestMile = Math.max(account.bestMile, Math.round(S.mile));
    account.xp += 100 + Math.round(S.mile * 0.2);
    account.memorials.push({ name: S.name, miles: Math.round(S.mile), cause: title,
      spent: Math.round(S.spent), when: new Date().toLocaleDateString() });
    saveAccount();
    pushProgress(true);
    summary(false, title, text);
  }
  function summary(ok, title, text) {
    show("summary");
    $("sumTitle").textContent = ok ? "YOU MADE IT" : title.toUpperCase();
    $("sumTitle").className = ok ? "sum-title good" : "sum-title bad";
    $("sumText").textContent = text;
    const rows = [
      ["Miles traveled", `${Math.round(S.mile)} of ${destMile()}`],
      ["Days on the road", dayNum()],
      ["Money spent", "$" + Math.round(S.spent)],
      ["Cash left", "$" + Math.round(S.cash)],
      ["Fuel burned", S.fuelUsed.toFixed(1) + " gal"],
      ["Miles on foot", Math.round(S.footMiles)],
      ["Encounters", S.events],
      ["Vehicle", S.onFoot ? "none — on foot" : `${S.vehicleName} at ${Math.round(S.vehicle)}%`],
      ["Souvenirs", S.souvenirs.length ? S.souvenirs.join(" · ") : "none"],
      ["Score", score()]
    ];
    $("sumRows").replaceChildren(...rows.map(([k, v]) => {
      const d = document.createElement("div"); d.className = "sum-row";
      const a = document.createElement("span"); a.textContent = k;
      const b = document.createElement("b"); b.textContent = v;
      d.append(a, b); return d;
    }));
    if (!ok) {
      const m = document.createElement("p");
      m.className = "memorial";
      m.textContent = `HERE LIES THE DREAM OF REACHING BOSTON — ${S.name} made it ${Math.round(S.mile)} miles in ${dayNum()} days, spent $${Math.round(S.spent)}, and was ultimately defeated by: ${title.toLowerCase()}.`;
      $("sumRows").append(m);
    }
    store.clear(SAVE_KEY);
    renderAccount();
  }

  // ---------------------------------------------------------------- HUD + art
  function hud() {
    if (!S) return;
    $("hudMiles").textContent = Math.max(0, Math.round(destMile() - S.mile)).toLocaleString();
    $("hudFuel").textContent = S.onFoot ? "—" : fuelPct() + "%";
    $("hudFuelBar").style.width = (S.onFoot ? 0 : fuelPct()) + "%";
    $("hudFuelBar").className = "bar-fill" + (fuelPct() < 20 ? " warn" : "");
    $("hudCash").textContent = "$" + Math.round(S.cash);
    $("hudHealth").textContent = Math.round(S.health);
    $("hudEnergy").textContent = Math.round(S.energy);
    $("hudVehicle").textContent = S.onFoot ? "FOOT" : Math.round(S.vehicle) + "%";
    $("hudStress").textContent = Math.round(S.stress);
    $("hudClock").textContent = `D${dayNum()} ${clockText()}`;
    $("hudRegion").textContent = regionInfo().name;
    const nn = nextNode();
    $("hudNext").textContent = nn ? `${nn.name} in ${Math.max(0, Math.round(nn.mile - S.mile))} mi` : "";
  }

  let scroll = 0, weather = { kind: "clear", until: 0 }, glint = null;

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

  const speedNow = () => !S ? 55 : !travelling ? 0 : S.onFoot ? 3
    : 58 * (grade() === "climb" ? 0.9 : 1) * (S.vehicle < 40 ? 0.72 : 1) * (isNight() ? 0.85 : 1);

  // The drive is seen through the windshield: the world, then the cab you're in.
  function draw(dt) {
    const c = $("road"), ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const hour = S ? (S.minutes % (24 * 60)) / 60 : 18.4;
    const wx = S ? weatherNow() : "clear";
    const mph = speedNow();
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
      tempPct: S ? clamp(0.35 + (grade() === "climb" ? 0.28 : 0) + (100 - S.vehicle) / 240, 0, 1) : 0.4,
      odo: S ? S.odo : 0,
      wipers: wx === "rain",
      grime: S ? Math.min(1, S.grime || 0) : 0
    };
    ROAD.draw(ctx, w, h, st);

    if (wx === "rain" || wx === "snow") {
      const n = wx === "rain" ? 70 : 45;
      ctx.strokeStyle = wx === "rain" ? "rgba(200,215,235,0.4)" : "rgba(255,255,255,0.7)";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < n; i++) {
        const sx = (i * 137 + scroll * (wx === "rain" ? 22 : 5)) % (w + 60) - 30;
        const sy = (i * 71 + scroll * (wx === "rain" ? 42 : 9)) % (h * 0.7);
        if (wx === "rain") { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 4, sy + 13); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, Math.PI * 2); ctx.fill(); }
      }
    }

    if (S && S.onFoot) {
      ctx.fillStyle = "rgba(10,12,18,0.5)";
      ctx.fillRect(0, h * 0.93, w, h * 0.07);
      ctx.fillStyle = "#c9cfd6";
      ctx.font = "700 12px Overpass, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ON FOOT", w / 2, h * 0.975);
    } else {
      ROAD.drawCab(ctx, w, h, st);
    }

    if (S && !S.onFoot && travelling && !glint && Math.random() < 0.0012) {
      glint = { x: w * (0.6 + Math.random() * 0.3), y: h * (0.52 + Math.random() * 0.09), life: 3 };
    }
    if (glint) {
      glint.life -= dt;
      glint.x += dt * 80; glint.y += dt * 26;
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
      { item: null, text: "Broken glass, a shoe, and a receipt from a station in a town you haven't reached yet." }
    ];
    const find = finds[Math.floor(Math.random() * finds.length)];
    S.minutes += 12;
    if (find.item && bulkUsed() + 1 <= cargoCap()) addItem(find.item);
    else if (find.item) flash("No room to carry it.");
    if (!find.item) { account.anomaly += 1; saveAccount(); }
    $("eventTitle").textContent = "ON THE SHOULDER";
    $("eventText").textContent = "You brake for something bright in the weeds.";
    $("eventOutcome").textContent = find.text;
    $("eventChoices").replaceChildren();
    $("eventClose").hidden = false;
    $("eventCard").hidden = false;
    save();
  });

  function plantColor(kind) {
    return kind === "saguaro" ? "#4d7a43" : kind === "scrub" ? "#6b7a4a"
         : kind === "corn" ? "#9aa24e" : kind === "pole" ? "#4a4f47"
         : kind === "stack" ? "#4e5257" : "#3d5c3a";
  }
  function drawPlant(ctx, kind, x, y) {
    if (kind === "saguaro") {
      ctx.fillRect(x, y - 34, 7, 34);
      ctx.fillRect(x - 10, y - 26, 10, 5); ctx.fillRect(x - 10, y - 26, 5, 14);
      ctx.fillRect(x + 7, y - 30, 10, 5); ctx.fillRect(x + 12, y - 30, 5, 18);
    } else if (kind === "scrub") {
      ctx.beginPath(); ctx.arc(x, y - 8, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 11, y - 5, 6, 0, Math.PI * 2); ctx.fill();
    } else if (kind === "pole") {
      ctx.beginPath(); ctx.arc(x, y - 6, 7, 0, Math.PI * 2); ctx.fill();
    } else if (kind === "corn") {
      for (let i = 0; i < 6; i++) ctx.fillRect(x + i * 5, y - 17 - (i % 2) * 3, 3, 17);
    } else if (kind === "stack") {
      ctx.fillRect(x, y - 20, 8, 20);
      ctx.fillRect(x + 14, y - 13, 6, 13);
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y - 46); ctx.lineTo(x + 15, y); ctx.lineTo(x - 15, y);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(x - 2, y, 4, 6);
    }
  }

  function drawVehicle(ctx, x, y, night) {
    const v = S ? veh() : C.vehicles[0];
    const s = 1.5, moto = v.id === "moto";
    const roll = scroll / 9;                       // wheels actually turn
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath(); ctx.ellipse(0, 26 * s, (moto ? 22 : 42) * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    const paint = { ranger: "#c8442f", civic: "#c8cdd2", voyager: "#7a8fa6", suburban: "#2f4a3a",
                    diesel: "#d9cba7", wagon: "#3f5d86", bronco: "#d8892f", moto: "#2b2f36" }[v.id] || "#b5563c";
    const wheel = (wx, r) => {
      ctx.fillStyle = "#15161c";
      ctx.beginPath(); ctx.arc(wx * s, 20 * s, r * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#666b77";
      ctx.beginPath(); ctx.arc(wx * s, 20 * s, r * 0.42 * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#2b2f3a"; ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const a = roll + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(wx * s, 20 * s);
        ctx.lineTo(wx * s + Math.cos(a) * r * 0.9 * s, 20 * s + Math.sin(a) * r * 0.9 * s);
        ctx.stroke();
      }
    };
    if (moto) {
      ctx.fillStyle = paint;
      ctx.fillRect(-14 * s, 6 * s, 30 * s, 6 * s);
      ctx.fillRect(-4 * s, -4 * s, 12 * s, 10 * s);
      wheel(-14, 8); wheel(16, 8);
    } else {
      const cabW = v.cargo > 20 ? 46 : 34;
      ctx.fillStyle = paint;
      ctx.fillRect(-40 * s, 2 * s, 78 * s, 16 * s);
      ctx.fillRect(-14 * s, -12 * s, cabW * s, 16 * s);
      ctx.fillStyle = shade(paint, -0.28);
      ctx.fillRect(-40 * s, 14 * s, 78 * s, 4 * s);
      ctx.fillStyle = shade(paint, 0.25);                 // a highlight along the body
      ctx.fillRect(-40 * s, 2 * s, 78 * s, 2 * s);
      ctx.fillStyle = night ? "#232b44" : "#a8d3e6";
      ctx.fillRect(-10 * s, -9 * s, 13 * s, 11 * s);
      ctx.fillRect(6 * s, -9 * s, (cabW - 20) * s, 11 * s);
      if (S && S.vehicle < 55) {                          // rough shape once it's beaten up
        ctx.fillStyle = "rgba(20,20,25,0.45)";
        ctx.fillRect(10 * s, 6 * s, 14 * s, 5 * s);
        ctx.fillRect(-30 * s, 8 * s, 10 * s, 4 * s);
      }
      wheel(-26, 7.5); wheel(24, 7.5);
    }
    // exhaust and dust while moving
    if (travelling) {
      ctx.fillStyle = night ? "rgba(160,170,190,0.18)" : "rgba(120,110,100,0.22)";
      for (let i = 0; i < 4; i++) {
        const px = -46 * s - i * 14, py = 16 * s - Math.sin(scroll / 12 + i) * 4;
        ctx.beginPath(); ctx.arc(px, py, 4 + i * 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (night) {
      const g = ctx.createLinearGradient(40 * s, 6 * s, 170 * s, 6 * s);
      g.addColorStop(0, "rgba(255,240,190,0.5)"); g.addColorStop(1, "rgba(255,240,190,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(38 * s, 2 * s); ctx.lineTo(170 * s, -16 * s); ctx.lineTo(170 * s, 30 * s); ctx.lineTo(38 * s, 12 * s);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffe9b0";
      ctx.fillRect(36 * s, 4 * s, 4 * s, 5 * s);
      ctx.fillStyle = "#c8442f";
      ctx.fillRect(-42 * s, 6 * s, 3 * s, 5 * s);
    }
    ctx.restore();
  }

  function drawWalker(ctx, x, y, night) {
    const t = scroll / 8;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, 22, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = night ? "#2a3040" : "#3c4657";
    ctx.beginPath(); ctx.arc(0, -22, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-5, -16, 10, 20);
    ctx.fillStyle = night ? "#20263a" : "#57503f";
    ctx.fillRect(4, -14, 9, 15);                          // the pack
    ctx.fillStyle = night ? "#2a3040" : "#3c4657";
    ctx.fillRect(-5, 4, 4, 16 + Math.sin(t) * 3);
    ctx.fillRect(1, 4, 4, 16 - Math.sin(t) * 3);
    ctx.restore();
  }

  function shade(hex, amt) {
    if (!/^#/.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt > 0 ? 255 : 0, a = Math.abs(amt);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return `rgb(${r},${g},${b})`;
  }

  // ---------------------------------------------------------------- log, account, save
  function logLine(text) {
    S.log.push(`Day ${dayNum()} ${clockText()} · mile ${Math.round(S.mile)} — ${text}`);
    if (S.log.length > 300) S.log.shift();
  }
  function renderLog() {
    show("log");
    $("logList").replaceChildren(...S.log.slice().reverse().map(l => {
      const d = document.createElement("div"); d.className = "log-line"; d.textContent = l; return d;
    }));
  }
  function renderAccount() {
    $("accLevel").textContent = account.travelerLevel;
    $("accRuns").textContent = `${account.arrivals} / ${account.runs}`;
    $("accMiles").textContent = account.milesLifetime.toLocaleString();
    $("accBest").textContent = account.bestMile.toLocaleString();
    const earned = C.achievements.filter(a => account.achievements.includes(a.id));
    $("accAchCount").textContent = `${earned.length} / ${C.achievements.length}`;
    $("accAch").replaceChildren(...C.achievements.map(a => {
      const got = account.achievements.includes(a.id);
      const d = document.createElement("div"); d.className = "ach" + (got ? " got" : "");
      const b = document.createElement("b"); b.textContent = got ? a.name : "· · ·";
      const s = document.createElement("span"); s.textContent = got ? a.desc : "Not yet";
      d.append(b, s); return d;
    }));
    $("accMemorials").replaceChildren(...account.memorials.slice(-6).reverse().map(m => {
      const d = document.createElement("div"); d.className = "log-line";
      d.textContent = `${m.name} — ${m.miles} miles, $${m.spent} spent, ${m.cause.toLowerCase()} (${m.when})`;
      return d;
    }));
    $("accSouvenirs").replaceChildren(...account.souvenirs.slice(-8).reverse().map(s => {
      const d = document.createElement("div"); d.className = "log-line"; d.textContent = s; return d;
    }));
    renderCheckpoints();
  }
  const save = () => { if (S && !S.done) store.set(SAVE_KEY, S); };

  // ---------------------------------------------------------------- radio
  const RADIO = window.OME_RADIO || { stations: [], reports: {} };
  function stationsHere() {
    return RADIO.stations.filter(st =>
      st.kind !== "voice" || (S.mile >= (st.from || 0) - 250 && S.mile <= (st.to || 99999)));
  }
  const currentStation = () => {
    const list = stationsHere();
    return list[Math.min(S.radio || 0, list.length - 1)] || list[0];
  };
  function tune(dir) {
    const list = stationsHere();
    if (!list.length) return;
    S.radio = (((S.radio || 0) + dir) % list.length + list.length) % list.length;
    const st = currentStation();
    if (st.kind === "music") MUS.start(); else MUS.stop();
    AMB.blinker();
    renderRadio();
    save();
  }
  function renderRadio() {
    if (!S || !$("radioName")) return;
    const st = currentStation();
    if (!st) return;
    $("radioName").textContent = `${st.freq}  ${st.name}`;
    $("radioNote").textContent = st.kind === "voice"
      ? `Coming in from ahead of you — ${st.host}.`
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
    const lines = RADIO.reports[kind] || [];
    if (!lines.length) return;
    const line = lines[Math.floor(Math.random() * lines.length)];
    S.radioLog = (S.radioLog || []).concat(`${st.freq} — ${line}`).slice(-12);
    if (kind === "strange") { account.anomaly += 1; saveAccount(); }
    if ($("radioTicker")) {
      $("radioTicker").textContent = line;
      clearTimeout(radioTick.t);
      radioTick.t = setTimeout(() => { if ($("radioTicker")) $("radioTicker").textContent = ""; }, 14000);
    }
    renderRadio();
  }

  // ---------------------------------------------------------------- travelers
  const travelerName = () => (store.get("ome-name") || "").trim();
  let pushTimer = null, lastPush = 0;
  function pushProgress(force) {
    if (!SYNC.enabled || !travelerName()) return;
    const now = Date.now();
    if (!force && now - lastPush < 60000) return;      // at most once a minute while driving
    lastPush = now;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      SYNC.push(travelerName(), {
        mile: S ? S.mile : 0,
        day: S ? dayNum() : 1,
        bestMile: account.bestMile,
        arrivals: account.arrivals,
        status: !S ? "resting" : S.done ? "finished" : S.onFoot ? "on foot" : "driving",
        vehicle: S ? (S.onFoot ? "on foot" : S.vehicleName) : "",
        save: S && !S.done ? S : null,
        account
      }).catch(() => {});
    }, 50);
  }

  async function adoptTraveler(name) {
    store.set("ome-name", name);
    if (!SYNC.enabled) return null;
    try {
      const row = await SYNC.load(name);
      if (!row) return null;
      if (row.account) {
        account = Object.assign(account, row.account);
        saveAccount();
      }
      if (row.save) store.set(SAVE_KEY, row.save);
      return row;
    } catch (e) { return null; }
  }

  async function renderBoard() {
    const list = $("boardList");
    list.replaceChildren();
    $("boardNote").textContent = SYNC.enabled ? "Loading…" : "The board needs the hosted version of the game.";
    if (!SYNC.enabled) return;
    try {
      const rows = await SYNC.board();
      if (!rows.length) { $("boardNote").textContent = "Nobody has set out yet."; return; }
      $("boardNote").textContent = `${SYNC.group === "family" ? "Family" : SYNC.group} · furthest east`;
      list.replaceChildren(...rows.map(r => {
        const d = document.createElement("div");
        d.className = "sum-row";
        const who = document.createElement("span");
        who.textContent = `${r.name}${r.arrivals ? " ★" : ""}`;
        const what = document.createElement("b");
        const far = (r.best_mile || 0).toLocaleString();
        what.textContent = r.arrivals
          ? `reached Boston · best ${far} mi`
          : `${(r.mile || 0).toLocaleString()} mi in · day ${r.day || 1} · ${r.status || "on the road"}`;
        d.append(who, what);
        return d;
      }));
    } catch (e) {
      $("boardNote").textContent = "Couldn't reach the board.";
    }
  }
  function resume() {
    const s = store.get(SAVE_KEY);
    if (!s) return false;
    S = s; show("travel"); MUS.start(); syncMood(); hud(); setTravel(false);
    flash("Trip resumed.");
    return true;
  }

  // ---------------------------------------------------------------- wiring
  $("btnNew").addEventListener("click", () => { store.clear(SAVE_KEY); startCreate(); $("travelerName").value = travelerName(); });
  $("btnBoard").addEventListener("click", () => {
    const panel = $("boardPanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderBoard();
  });
  $("btnWhoami").addEventListener("click", async () => {
    const name = ($("whoName").value || "").trim().slice(0, 24);
    if (!name) return flash("Type a name first.");
    $("whoNote").textContent = "Looking for " + name + "…";
    const row = await adoptTraveler(name);
    if (row && row.save) {
      $("whoNote").textContent = `Found ${row.name}: ${Math.round(row.save.mile)} miles in, day ${row.day}. Tap Resume.`;
      $("btnResume").hidden = false;
    } else if (row) {
      $("whoNote").textContent = `Welcome back, ${row.name}. No run in progress — start a new one.`;
    } else {
      $("whoNote").textContent = SYNC.enabled ? `Travelling as ${name}. Your progress will follow this name.` : `Playing as ${name} on this device.`;
    }
    renderBoard();
  });
  $("btnResume").addEventListener("click", resume);
  $("btnAccount").addEventListener("click", () => { renderAccount(); $("accountPanel").hidden = !$("accountPanel").hidden; });
  $("btnBegin").addEventListener("click", beginRun);
  $("btnBackTitle").addEventListener("click", () => show("title"));
  $("shopFuel").addEventListener("click", () => {
    const cost = Math.round((veh().tankGal - S.fuelGal) * 3.1);
    if (S.cash < cost) return;
    S.cash -= cost; S.spent += cost; S.fuelGal = veh().tankGal;
    renderShop();
  });
  $("btnLaunch").addEventListener("click", () => launch());
  $("btnGo").addEventListener("click", () => setTravel(!travelling));
  $("btnSpeed").addEventListener("click", () => {
    speed = speed === 1 ? 2 : speed === 2 ? 4 : speed === 4 ? 8 : 1;
    $("btnSpeed").textContent = speed + "×";
  });
  $("btnLog").addEventListener("click", renderLog);
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
  });
  $("btnLogBack").addEventListener("click", () => { show("travel"); hud(); });
  $("eventClose").addEventListener("click", closeEvent);
  $("btnLeaveStop").addEventListener("click", leaveStop);
  $("btnLotBack").addEventListener("click", () => openStop(prevNode()));
  $("btnSumHome").addEventListener("click", () => { S = null; MUS.stop(); show("title"); refreshTitle(); });
  $("btnMusic").addEventListener("click", () => {
    const on = MUS.toggle();
    $("btnMusic").textContent = on ? "Music on" : "Music off";
    $("btnMusic").setAttribute("aria-pressed", String(on));
  });

  function refreshTitle() {
    $("btnResume").hidden = !store.get(SAVE_KEY);
    renderAccount();
  }
  $("whoName").value = travelerName();
  refreshTitle();
  show("title");
  draw(0);
  window.addEventListener("resize", () => draw(0));
  window.OME = { get state() { return S; }, get account() { return account; }, C };
})();
