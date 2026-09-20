# One More Exit

A road-trip survival game that runs in the browser.

**Play:** https://jharvey1113.github.io/one-more-exit/

Phoenix to Boston: 2,762 miles across a country that mostly still works. Power comes on for a few hours a day. Some gas stations have fuel and some have a sign about it. Manage fuel, cash, health, energy, stress and a vehicle that is older than it looks. Decide what to do when the check-engine light comes on, when a dust storm crosses the interstate, and when the only gas for thirty miles costs $5.19 a gallon.

## This build

- Character creation: name, a former career (starting cash and skills) and a vehicle
- Supplies limited by cargo space; fuel you carry in cans is fuel nobody can refuse to sell you
- The drive is seen through the windshield: a road with curves and crests running to the horizon, sun and moon on a real daily arc, long sunsets, rain, snow, dust and fog, and a dashboard whose gauges actually read
- Engine, tyres and wind respond to speed and to how rough the vehicle has become
- A radio you can tune: stations broadcast from ahead of you with fuel, weather and road reports, and you pick up more of them the further east you get
- Twenty-six stops: fuel that may or may not exist, food, repairs, beds, markets, paid work and vehicle lots
- Vehicles can be traded, lost or abandoned — you can continue on foot at three miles an hour
- Settlements are checkpoints: reach one and you can always start again from there
- A data-driven event engine: encounters respond to region, mileage, time of day, fuel, vehicle condition, skills, inventory and things you've done before
- An adaptive score that follows the road, turning ominous on its own
- Autosave, arrival summary, memorials, achievements, and an account that persists across runs

## Travelers and the family board

Type your name on the title screen and your progress follows the name rather than the device: the same name on a phone and a laptop continues the same road. A shared family board shows how far everyone has got. This needs one Supabase table (`ome_travelers`); without it the game still plays, saving locally.

Other groups get their own board with `?group=name`, and `?solo` turns sharing off.

## Structure

| File | What it is |
|---|---|
| `index.html` | Screens and styling (highway-sign look) |
| `js/content.js` | All content: route, vehicles, careers, items, events, achievements |
| `js/game.js` | Engine: travel, event selection, stops, saving, drawing |
| `js/music.js` | Adaptive score that follows region, night and trouble |
| `js/sync.js` | Name-based progress sync and the family board |

Content is deliberately separate from logic. Events are data records with requirements, weights, choices and outcomes, shaped like the Supabase tables they are meant to live in, so new encounters can be written without touching the engine.

## Roadmap

1. **Now:** local save, one route, ~30 events
2. **Next:** Supabase accounts, saved trips and remote content so events can be added without redeploying
3. **Then:** inventory depth, vehicle components, weather, more routes, skills, 100+ events
4. **Later:** passengers, garages, mini-games, long-term progression
5. **Eventually:** the parts of the road that don't add up

There is a hidden variable. It starts at zero.
