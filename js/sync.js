/* One More Exit — travelers.
   Your progress follows your name, not your phone. Type the same name on any
   device and the road picks up where you left it. Also powers the family board.
   Falls back to local-only play if the database isn't reachable. */
window.OME_SYNC = (() => {
  const URL = "https://csnrueehdjxqfkbxqcxe.supabase.co";
  const KEY = "sb_publishable__Gjp9HLDRtXeJQ5XTuC_XA_Y8dF9UOY";
  const TABLE = "ome_travelers";
  const base = `${URL}/rest/v1/${TABLE}`;
  const headers = { apikey: KEY, "Content-Type": "application/json" };

  const params = new URLSearchParams(location.search);
  let group = (params.get("group") || localStorage.getItem("ome-group") || "family").trim().toLowerCase().slice(0, 32) || "family";
  try { localStorage.setItem("ome-group", group); } catch (e) {}

  const enabled = !/claude|anthropic/i.test(location.hostname) && !params.has("solo");
  const key = name => `${group}|${String(name).trim().toLowerCase().slice(0, 24)}`;

  async function req(url, opts) {
    const r = await fetch(url, Object.assign({ headers }, opts));
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }

  return {
    enabled, group,

    // everything we know about one traveler
    async load(name) {
      if (!enabled) return null;
      const rows = await req(`${base}?select=*&traveler=eq.${encodeURIComponent(key(name))}`);
      return rows && rows[0] ? rows[0] : null;
    },

    // upsert this traveler's run and account, so any device can continue it
    async push(name, payload) {
      if (!enabled) return;
      const row = {
        traveler: key(name),
        grp: group,
        name: String(name).trim().slice(0, 24),
        mile: Math.round(payload.mile || 0),
        day: payload.day || 1,
        best_mile: Math.round(payload.bestMile || 0),
        arrivals: payload.arrivals || 0,
        status: payload.status || "on the road",
        vehicle: payload.vehicle || "",
        save: payload.save || null,
        account: payload.account || null,
        updated_at: new Date().toISOString()
      };
      await req(base + "?on_conflict=traveler", {
        method: "POST",
        headers: Object.assign({}, headers, { Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(row)
      });
    },

    // who else is out there, and how far they've got
    async board() {
      if (!enabled) return [];
      return (await req(`${base}?select=name,mile,day,best_mile,arrivals,status,vehicle,updated_at&grp=eq.${encodeURIComponent(group)}&order=best_mile.desc&limit=25`)) || [];
    }
  };
})();
