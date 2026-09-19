# One More Exit

A road-trip survival game that runs in the browser.

**Play:** https://jharvey1113.github.io/one-more-exit/

You start in Phoenix with a used vehicle, a little money, and 146 miles of desert that climbs four thousand feet into the pines at Flagstaff. Manage fuel, cash, health, energy, stress and a vehicle that is older than it looks. Decide what to do when the check-engine light comes on, when a dust storm crosses the interstate, and when the only gas for thirty miles costs $5.19 a gallon.

## This build (vertical slice)

- Character creation: name, career (which sets starting cash and skills) and one of three vehicles
- Supply shopping in Phoenix, limited by cargo space
- A side-scrolling drive north: the scenery shifts from saguaro desert to juniper to pine, and from day to night
- Stops at eight real I-17 exits for fuel, food, repairs, naps and motels
- An event engine with roughly thirty written encounters that respond to mileage, elevation, time of day, season, vehicle condition, skills and inventory
- Autosave: close the tab mid-trip and resume later
- Arrival summary, a memorial when a trip ends badly, achievements, and an account that persists across trips

## Structure

| File | What it is |
|---|---|
| `index.html` | Screens and styling (highway-sign look) |
| `js/content.js` | All content: route, vehicles, careers, items, events, achievements |
| `js/game.js` | Engine: travel, event selection, stops, saving, drawing |

Content is deliberately separate from logic. Events are data records with requirements, weights, choices and outcomes, shaped like the Supabase tables they are meant to live in, so new encounters can be written without touching the engine.

## Roadmap

1. **Now:** local save, one route, ~30 events
2. **Next:** Supabase accounts, saved trips and remote content so events can be added without redeploying
3. **Then:** inventory depth, vehicle components, weather, more routes, skills, 100+ events
4. **Later:** passengers, garages, mini-games, long-term progression
5. **Eventually:** the parts of the road that don't add up

There is a hidden variable. It starts at zero.
