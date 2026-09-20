/* One More Exit — the art layer.

   Every drawn thing asks for an image by name. If the file exists it is used;
   if it doesn't, the renderer paints that layer itself and the game looks the
   same as it always did. That means finished artwork can be dropped into
   /assets later, one file at a time, without touching a line of game code.

   Add ?assets=debug to the URL to see what is loaded and what is missing. */
window.OME_ASSETS = (() => {
  const BASE = "assets/";
  const EXT = ["webp", "png"];          // .webp preferred, .png accepted
  const cache = new Map();              // key -> {img, state}
  const missing = new Set();
  const loaded = new Set();
  const debug = /[?&]assets=debug/.test(location.search);

  // A key is a path without its extension: "environments/az_desert/far".
  function get(key) {
    if (!key) return null;
    let slot = cache.get(key);
    if (!slot) {
      slot = { img: null, state: "pending", tried: 0 };
      cache.set(key, slot);
      attempt(key, slot);
    }
    return slot.state === "ready" ? slot.img : null;
  }

  function attempt(key, slot) {
    if (slot.tried >= EXT.length) {
      slot.state = "missing";
      missing.add(key);
      if (debug) console.info("[assets] missing:", key);
      return;
    }
    const img = new Image();
    const ext = EXT[slot.tried++];
    img.decoding = "async";
    img.onload = () => {
      slot.img = img; slot.state = "ready";
      loaded.add(key + "." + ext);
      if (debug) console.info("[assets] loaded:", key + "." + ext, img.width + "x" + img.height);
    };
    img.onerror = () => attempt(key, slot);
    img.src = BASE + key + "." + ext;
  }

  // True once we know for certain there is no artwork — lets a painter decide
  // whether to draw its own version or wait a frame for the image.
  const absent = key => { get(key); const s = cache.get(key); return !s || s.state === "missing"; };
  const ready = key => !!get(key);

  // Draw an image scaled to a box, keeping it crisp and never stretching oddly.
  function drawFit(ctx, img, x, y, w, h) {
    if (!img) return false;
    ctx.drawImage(img, x, y, w, h);
    return true;
  }

  // Draw a horizontally repeating strip — the shape every parallax band wants.
  // offset is in pixels and wraps, so a layer can scroll forever.
  function drawStrip(ctx, img, offset, y, w, h, alpha) {
    if (!img) return false;
    const scale = h / img.height;
    const tile = Math.max(1, img.width * scale);
    let x = -(((offset % tile) + tile) % tile);
    if (alpha != null) { ctx.save(); ctx.globalAlpha = alpha; }
    while (x < w) { ctx.drawImage(img, x, y, tile, h); x += tile - 0.5; }
    if (alpha != null) ctx.restore();
    return true;
  }

  /* How much detail this device can afford. The renderer measures its own
     frame time and moves this between 1 (everything) and 0.5 (fewer particles,
     fewer clouds, thinner grain). Phones settle here on their own. */
  const quality = { v: 1, ema: 16 };
  quality.note = ms => {
    quality.ema = quality.ema * 0.88 + ms * 0.12;
    quality.v = quality.ema > 30 ? 0.5 : quality.ema > 22 ? 0.72 : 1;
  };
  const count = n => Math.max(3, Math.round(n * quality.v));

  function report() {
    return { loaded: [...loaded].sort(), missing: [...missing].sort(), debug };
  }
  if (debug) window.addEventListener("load", () => setTimeout(() => console.table(report().missing), 1500));

  return { get, absent, ready, drawFit, drawStrip, report, quality, count, BASE };
})();
