# One More Exit

A road-trip survival game that runs in the browser.

**Play:** https://jharvey1113.github.io/one-more-exit/

Phoenix to Boston: 2,762 miles across a country that mostly still works. Power comes on for a few hours a day. Some gas stations have fuel and some have a sign about it. Manage fuel, cash, health, energy, stress and a vehicle that is older than it looks. Decide what to do when the check-engine light comes on, when a dust storm crosses the interstate, and when the only gas for thirty miles costs $5.19 a gallon.

## This build

- Character creation: name, a former career (starting cash and skills) and a vehicle
- Supplies limited by cargo space; fuel you carry in cans is fuel nobody can refuse to sell you
- A side-scrolling drive east through seven regions, from Sonoran desert to the Rust Belt to New England, day and night
- Twenty-six stops: fuel that may or may not exist, food, repairs, beds, markets, paid work and vehicle lots
- Vehicles can be traded, lost or abandoned — you can continue on foot at three miles an hour
- Settlements are checkpoints: reach one and you can always start again from there
- A data-driven event engine: encounters respond to region, mileage, time of day, fuel, vehicle condition, skills, inventory and things you've done before
- An adaptive score that follows the road, turning ominous on its own
- Autosave, arrival summary, memorials, achievements, and an account that persists across runs

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
