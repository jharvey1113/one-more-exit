# Artwork

Every image here is optional. The game paints a stand-in for anything that is
missing, so you can drop in one file at a time and see it appear on the next
reload. **No code changes are needed to add art** — the file name *is* the
wiring.

- Preferred format **`.webp`** (quality ~82). `.png` also works; the loader
  tries `.webp` first, then `.png`.
- Transparency is required wherever it says *transparent* below.
- Add `?assets=debug` to the URL to log which files loaded and which are missing.

## Naming

```
assets/<area>/<set>/<slot>.webp
```
`<slot>` names are fixed — those are what the code asks for. `<set>` is the
theme id or vehicle id. Anything else in a folder is ignored.

---

## 1. Environment layers — `assets/environments/<theme>/`

Six themes ship today. The theme ids are the folder names:

`az_desert` · `az_pines` · `nm_high` · `tx_plains` · `prairie` · `farm` ·
`rust` · `appalachia` · `northeast` · `urban`

| Slot | Size | Transparency | What it is |
|---|---|---|---|
| `far.webp` | 2048 × 640 | opaque or transparent | Furthest ridgeline / skyline. Painted flat, low contrast — the game hazes it. |
| `mid.webp` | 2048 × 420 | **transparent** | Middle distance: hills, treeline, town edge. Bottom edge should end cleanly. |
| `near.webp` | 2048 × 260 | **transparent** | The band right behind the shoulder: brush, fences, close trees. |
| `foreground.webp` | 2048 × 200 | **transparent** | Grass and posts that whip past the bottom corners. Leave the middle 40% empty — the road goes there. |

All four must **tile horizontally** (left edge matches right edge). They are
drawn at the horizon and scaled to height, so width is free — 2048 is a good
balance for phones. Viewpoint: eye level of a driver, roughly 4 ft off the
ground, camera looking straight down the road. Keep them low-contrast and
slightly desaturated; lighting and colour grading are applied at runtime.

Example: `assets/environments/az_desert/far.webp`

## 2. Roadside objects — `assets/props/<theme>/` (or `assets/props/common/`)

Drawn standing on the ground, anchored **bottom-centre**, scaled by distance.
Transparent PNG/WebP, 512 px tall is plenty; keep the object filling the frame.

Slots used by the current themes:
`saguaro` `ocotillo` `scrub` `juniper` `pine` `hardwood` `treeline` `stump`
`pole` `pylon` `windmill` `tank` `grain` `silo` `barn` `corn` `warehouse`
`motel` `stack` `rockcut` `stonewall` `steeple` `billboard` `sign` `wreck`
`marker`

A file in `props/common/` is used by every theme that doesn't have its own.

## 3. Vehicles — `assets/vehicles/<id>/`

Vehicle ids: `ranger` `civic` `voyager` `suburban` `diesel` `wagon` `bronco` `moto`

| Slot | Size | Transparency | Viewpoint |
|---|---|---|---|
| `rear.webp` | 1024 × 768 | **transparent** | Directly behind, camera slightly high, vehicle centred, wheels touching the bottom. Used by the Chase view. |
| `cockpit.webp` | 2048 × 1152 | **transparent** | From the driver's seat: pillars, roof edge, mirror, dash. **Cut the windshield out** — the road shows through the hole. Used by the Cockpit view. |

Leave the gauge cluster area (centre-bottom, roughly 40% of the width) clear or
dark; the game draws live gauges over it.

## 4. Weather — `assets/weather/`

| Slot | Size | Transparency | Notes |
|---|---|---|---|
| `clouds_high.webp` | 2048 × 512 | **transparent** | Tiles horizontally. Thin cirrus. |
| `clouds_low.webp` | 2048 × 512 | **transparent** | Tiles horizontally. Heavier cumulus. |

## 5. Effects — `assets/effects/`

| Slot | Size | Notes |
|---|---|---|
| `grain.webp` | 128 × 128 | Seamless neutral-grey noise. Overlaid at 15%. |

---

## Priority order

If you are commissioning or generating art, this is the order that buys the
most visible improvement per file:

1. `environments/az_desert/{far,mid,near}` — the first hour of every run.
2. `vehicles/ranger/cockpit` and `vehicles/ranger/rear`.
3. `environments/nm_high/*`, then `tx_plains`, then `farm`, `appalachia`, `northeast`.
4. `props/az_desert/{saguaro,pole,sign,billboard}`.
5. `weather/clouds_low`, `weather/clouds_high`.

## Style notes for whoever paints these

Atmospheric American road-trip graphic novel. Painterly, realistic proportion
and perspective, strong aerial perspective, muted palette with one warm accent
(late sun, a lit sign). Not cartoon, not neon, not pixel art. Everything should
look like a real place that people used to maintain and mostly still do.
