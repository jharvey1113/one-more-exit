/* One More Exit — game CONTENT.
   Data only: the road, the people on it, what you can carry, and what happens.
   Shaped like the Supabase tables this will eventually live in. */
window.OME_CONTENT = (() => {
  /* ---------------------------------------------------------------- the road
     Phoenix to Boston, about 2,750 miles. Settlements are checkpoints: reach one
     and you can always come back to it. Everything between them is road. */
  const route = {
    id: "phx-bos",
    name: "Phoenix → Boston",
    nodes: [
      // --- the Southwest: hot, empty, and surprisingly organized -------------
      { id: "phoenix", name: "Phoenix", mile: 0, region: "desert", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 1,
        blurb: "Water rationed, power on six hours a day, and a functioning market. It works. It just doesn't work well." },
      { id: "payson", name: "Payson Junction", mile: 94, region: "desert", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.75, blurb: "A pump, a generator, and a man who charges for both." },
      { id: "holbrook", name: "Holbrook", mile: 186, region: "desert", kind: "stop",
        services: ["fuel", "repair"], fuelChance: 0.6, blurb: "Concrete teepees, still standing, now occupied." },
      { id: "gallup", name: "Gallup", mile: 288, region: "desert", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.9,
        blurb: "Trading post. Genuinely a trading post now." },
      { id: "albuquerque", name: "Albuquerque", mile: 428, region: "mesa", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.9,
        blurb: "The biggest thing still lit up between here and the Mississippi." },
      { id: "santarosa", name: "Santa Rosa", mile: 546, region: "mesa", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.5, blurb: "A blue hole full of very cold water and nothing else." },
      // --- the plains: wind, distance, and people who watch the horizon ------
      { id: "tucumcari", name: "Tucumcari", mile: 620, region: "plains", kind: "stop",
        services: ["fuel", "rest"], fuelChance: 0.55, blurb: "Two hundred motel rooms. Eleven people." },
      { id: "amarillo", name: "Amarillo", mile: 734, region: "plains", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.85,
        blurb: "Cattle, wind turbines, and a militia that mostly directs traffic." },
      { id: "elk_city", name: "Elk City", mile: 880, region: "plains", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.5 },
      { id: "okc", name: "Oklahoma City", mile: 1002, region: "plains", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.85,
        blurb: "Runs on wind power and rules. Both are enforced." },
      { id: "tulsa", name: "Tulsa", mile: 1112, region: "plains", kind: "stop",
        services: ["fuel", "food", "repair"], fuelChance: 0.7 },
      { id: "joplin", name: "Joplin", mile: 1226, region: "farm", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.55, blurb: "Everything here has been rebuilt at least once." },
      { id: "springfield_mo", name: "Springfield", mile: 1300, region: "farm", kind: "stop",
        services: ["fuel", "rest"], fuelChance: 0.6 },
      { id: "stlouis", name: "St. Louis", mile: 1518, region: "farm", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.85,
        blurb: "The bridges are the whole story. Two work. One is guarded. One is a rumor." },
      { id: "effingham", name: "Effingham", mile: 1618, region: "farm", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.6 },
      { id: "indianapolis", name: "Indianapolis", mile: 1760, region: "rust", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.8,
        blurb: "They kept the speedway. Of course they kept the speedway." },
      { id: "dayton", name: "Dayton", mile: 1872, region: "rust", kind: "stop",
        services: ["fuel", "repair"], fuelChance: 0.6 },
      { id: "columbus", name: "Columbus", mile: 1944, region: "rust", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.8 },
      { id: "wheeling", name: "Wheeling", mile: 2072, region: "rust", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.55, blurb: "The river is clean now. Nobody is sure why." },
      { id: "pittsburgh", name: "Pittsburgh", mile: 2144, region: "hills", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.8,
        blurb: "Mills running again, at a fraction, by people who learned from their grandparents." },
      { id: "breezewood", name: "Breezewood", mile: 2262, region: "hills", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.65, blurb: "Still, somehow, entirely made of gas stations." },
      { id: "harrisburg", name: "Harrisburg", mile: 2370, region: "hills", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.8 },
      { id: "scranton", name: "Scranton", mile: 2470, region: "northeast", kind: "stop",
        services: ["fuel", "repair"], fuelChance: 0.6 },
      { id: "albany", name: "Albany", mile: 2604, region: "northeast", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest", "lot"], fuelChance: 0.75,
        blurb: "Checkpoint on the Hudson. They write your name in a book." },
      { id: "springfield_ma", name: "Springfield", mile: 2700, region: "northeast", kind: "stop",
        services: ["fuel", "food"], fuelChance: 0.6 },
      { id: "boston", name: "Boston", mile: 2762, region: "northeast", kind: "settlement",
        services: ["fuel", "food", "shop", "repair", "rest"], fuelChance: 1, destination: true,
        blurb: "Lights on the harbor. Actual, electric, unrationed lights." }
    ]
  };

  // Region look and feel, used by the art and the music
  const regions = {
    desert:    { name: "Sonoran Desert", sky: ["#6fb3d8", "#f0c891"], ground: "#c98f5c", plant: "saguaro", mood: "open" },
    mesa:      { name: "High Desert",    sky: ["#5a9ccd", "#e8bb92"], ground: "#a8764f", plant: "scrub",   mood: "open" },
    plains:    { name: "High Plains",    sky: ["#7fb2cc", "#d9d2a8"], ground: "#b9a45f", plant: "pole",    mood: "lonely" },
    farm:      { name: "Farm Country",   sky: ["#6f9dc0", "#cfd6b0"], ground: "#7f8c4e", plant: "corn",    mood: "lonely" },
    rust:      { name: "The Rust Belt",  sky: ["#6b7787", "#b9bcb5"], ground: "#5c6152", plant: "stack",   mood: "grim" },
    hills:     { name: "The Alleghenies",sky: ["#6c8494", "#aebba9"], ground: "#4c5b46", plant: "pine",    mood: "grim" },
    northeast: { name: "New England",    sky: ["#5d7e9b", "#b7c6c9"], ground: "#41543f", plant: "pine",    mood: "close" }
  };

  /* ---------------------------------------------------------------- vehicles
     Fuel is the whole game now, so economy matters more than comfort. */
  const vehicles = [
    { id: "ranger", name: "2004 Ford Ranger", tag: "Pickup", value: 900,
      tankGal: 16.5, mpg: 21, reliability: 0.82, cargo: 16, seats: 3, offroad: 0.7,
      blurb: "Yours. Smells of hay and old sun. Has never once failed to start." },
    { id: "civic", name: "2009 Honda Civic", tag: "Compact", value: 800,
      tankGal: 13.2, mpg: 34, reliability: 0.9, cargo: 8, seats: 4, offroad: 0.2,
      blurb: "Sips fuel. Will not go anywhere that isn't pavement." },
    { id: "voyager", name: "1998 Plymouth Voyager", tag: "Van", value: 650,
      tankGal: 20, mpg: 19, reliability: 0.66, cargo: 24, seats: 7, offroad: 0.25,
      blurb: "You can sleep in it. You will sleep in it." },
    { id: "suburban", name: "1996 Chevy Suburban", tag: "SUV", value: 1400,
      tankGal: 42, mpg: 13, reliability: 0.75, cargo: 28, seats: 8, offroad: 0.8,
      blurb: "Forty-two gallon tank. Thirteen miles per gallon. Both of those matter." },
    { id: "diesel", name: "1987 Mercedes 300D", tag: "Diesel", value: 1900,
      tankGal: 21, mpg: 30, reliability: 0.88, cargo: 12, seats: 5, offroad: 0.3,
      blurb: "Will run on cooking oil, bad diesel, and spite." },
    { id: "wagon", name: "1989 Volvo 240 Wagon", tag: "Wagon", value: 1100,
      tankGal: 15.8, mpg: 24, reliability: 0.86, cargo: 20, seats: 5, offroad: 0.35,
      blurb: "Square, slow, and functionally immortal." },
    { id: "bronco", name: "1978 Ford Bronco", tag: "Off-road", value: 1600,
      tankGal: 23, mpg: 12, reliability: 0.7, cargo: 14, seats: 4, offroad: 0.95,
      blurb: "Goes where the road stopped being a road." },
    { id: "moto", name: "Kawasaki KLR 650", tag: "Motorcycle", value: 700,
      tankGal: 6.1, mpg: 48, reliability: 0.8, cargo: 4, seats: 1, offroad: 0.85,
      blurb: "Cheap to feed, impossible to sleep in, no roof when it hails." }
  ];

  const careers = [
    { id: "mechanic", name: "Mechanic", cash: 320, skills: { mechanical: 3 },
      perk: "Repairs cost far less, and you can fix things on the shoulder." },
    { id: "nurse", name: "Nurse", cash: 420, skills: { firstAid: 3 },
      perk: "Injuries hurt less. People let you through checkpoints." },
    { id: "teacher", name: "Teacher", cash: 300, skills: { social: 2, cooking: 1 },
      perk: "Stress resistance. Unearned, but real." },
    { id: "trucker", name: "Long-haul driver", cash: 380, skills: { navigation: 3 },
      perk: "You know which roads lie and which ones are just quiet." },
    { id: "farmer", name: "Farmer", cash: 340, skills: { outdoors: 2, cooking: 2 },
      perk: "You can eat and sleep places other people can't." },
    { id: "scavenger", name: "Scavenger", cash: 500, skills: { mechanical: 1, outdoors: 1, social: 1 },
      perk: "You find things. Sometimes useful ones." }
  ];

  const items = [
    { id: "jerry", name: "Jerry can (5 gal)", price: 45, bulk: 3, use: "Fuel you carry is fuel nobody can refuse to sell you." },
    { id: "spare", name: "Spare tire", price: 95, bulk: 3, use: "Turns a disaster into an inconvenience." },
    { id: "jack", name: "Jack & lug wrench", price: 40, bulk: 2, use: "Required to actually use that spare." },
    { id: "tools", name: "Tool kit", price: 60, bulk: 2, use: "Roadside repairs, given skill and daylight." },
    { id: "jumper", name: "Jumper cables", price: 25, bulk: 1, use: "For you, or for whoever flags you down." },
    { id: "oil", name: "Case of motor oil", price: 22, bulk: 1, use: "Old engines drink it." },
    { id: "coolant", name: "Jug of coolant", price: 14, bulk: 1, use: "The desert does not negotiate." },
    { id: "firstaid", name: "First-aid kit", price: 30, bulk: 1, use: "Bandages, antibiotics, and luck." },
    { id: "water", name: "Water (5 gal)", price: 12, bulk: 2, use: "Drink it, or pour it into a radiator." },
    { id: "food", name: "Box of rations", price: 20, bulk: 2, use: "Three days of food that will not argue with you." },
    { id: "jerky", name: "Unlabeled jerky", price: 5, bulk: 1, use: "Someone made this. Probably recently." },
    { id: "radio", name: "Shortwave radio", price: 55, bulk: 1, use: "Hear about the road ahead. And other things." },
    { id: "battery", name: "Portable battery", price: 48, bulk: 1, use: "Keeps the lights and the radio alive." },
    { id: "blanket", name: "Wool blankets", price: 24, bulk: 2, use: "Sleeping in the vehicle is standard now." },
    { id: "tent", name: "Tent", price: 60, bulk: 3, use: "Camp away from the road, away from the road's people." },
    { id: "flashlight", name: "Flashlight", price: 12, bulk: 1, use: "Dark is darker than it used to be." },
    { id: "tape", name: "Duct tape", price: 8, bulk: 1, use: "Holds a hose, a bumper, or a plan together." },
    { id: "siphon", name: "Siphon hose", price: 18, bulk: 1, use: "Abandoned tanks are not always empty." },
    { id: "medkit2", name: "Antibiotics", price: 70, bulk: 1, use: "Worth more than fuel, by weight." },
    { id: "mug", name: "Giant souvenir mug", price: 6, bulk: 2, use: "64 ounces. No practical purpose. You want it." }
  ];

  /* ---------------------------------------------------------------- events
     requires: minMile/maxMile, region, night/daytime, grade, minAnomaly, maxEnergy,
     items, service, stopped, onFoot, maxFuelPct, maxVehicle, flag, notFlag.
     Each choice may require items/skills; outcomes are weighted. */
  const events = [
    // ---------------------------------------------------------------- road, general
    { id: "check_engine", title: "CHECK ENGINE", weight: 9, requires: { minMile: 20 },
      text: "The light comes on with the quiet confidence of something that has been thinking about it for a while.",
      choices: [
        { label: "Pull over and look", outcomes: [
          { w: 2, text: "You open the hood and stare. The engine stares back. Nothing is visibly on fire, which you decide counts as good news.", effects: { time: 12, stress: -2 } },
          { w: 1, text: "A vacuum line has popped off. You push it back on with your thumb and feel like a genius.", effects: { time: 15, vehicle: 6, stress: -4, skill: { mechanical: 1 } } }
        ] },
        { label: "Keep going and monitor it", outcomes: [
          { w: 3, text: "Nothing changes. You get used to the light faster than you expected.", effects: { stress: 3, flag: "ignored_light" } },
          { w: 1, text: "Twenty miles later there's a stumble you can feel through the seat.", effects: { vehicle: -8, stress: 8 } }
        ] },
        { label: "Turn the radio up", outcomes: [
          { w: 1, text: "The light remains illuminated, but you feel considerably less responsible for it.", effects: { stress: -3, achievement: "probably_fine", flag: "ignored_light" } }
        ] }
      ] },

    { id: "pumps_dry", title: "PUMPS DRY", weight: 8, requires: { service: "fuel", stopped: true },
      text: "Hand-lettered on cardboard, taped over the pump: NO FUEL. NOT TOMORROW EITHER.",
      choices: [
        { label: "Ask what it would take", requires: { skillMin: { social: 1 } }, outcomes: [
          { w: 2, text: "There is fuel. There is always fuel. It costs what he says it costs.", effects: { fuelPrice: 2.4, time: 20, skill: { social: 1 } } },
          { w: 1, text: "He looks at you for a while and then says no again, more slowly.", effects: { time: 15, stress: 8 } }
        ] },
        { label: "Trade something for it", requires: { items: ["jerky"] }, outcomes: [
          { w: 1, text: "Food moves faster than money out here. Two gallons for the jerky, and he throws in the news.", effects: { fuelGal: 2, removeItem: "jerky", time: 18, flag: "traded_food" } }
        ] },
        { label: "Move on", outcomes: [
          { w: 1, text: "You leave with what you came with, which is less than you wanted.", effects: { stress: 6 } }
        ] }
      ] },

    { id: "siphon_chance", title: "AN ABANDONED TANKER", weight: 6, requires: { items: ["siphon"], minMile: 120 },
      text: "It's been on its side in the median long enough for weeds to grow through the cab. The belly tank might still have something in it.",
      choices: [
        { label: "Siphon what you can", outcomes: [
          { w: 3, text: "Four gallons of something that smells close enough to diesel. Your arms will smell like it for two days.", effects: { fuelGal: 4, time: 40, health: -2, stress: -6 } },
          { w: 1, text: "Sludge. Whatever was in there separated years ago. You get nothing but a headache.", effects: { time: 35, health: -4, stress: 8 } }
        ] },
        { label: "Leave it alone", outcomes: [
          { w: 1, text: "Someone has been living in the trailer. You see the laundry line too late to pretend you didn't.", effects: { stress: 10, anomaly: 1 } }
        ] }
      ] },

    { id: "roadblock", title: "THE ROAD IS CLOSED", weight: 7, requires: { minMile: 200 },
      text: "Two cars nose to nose across both lanes, and three people who are being very polite about it. A toll, they explain. For maintenance.",
      choices: [
        { label: "Pay the toll", outcomes: [
          { w: 1, text: "Forty dollars, a wave, and the cars roll back exactly enough to let you through.", effects: { cash: -40, time: 15 } }
        ] },
        { label: "Talk your way through", requires: { skillMin: { social: 2 } }, outcomes: [
          { w: 2, text: "You mention the last checkpoint by name and the mood changes. Twenty dollars, friend rate.", effects: { cash: -20, time: 20, skill: { social: 1 } } },
          { w: 1, text: "They are not interested in conversation and the price goes up for wasting daylight.", effects: { cash: -70, time: 30, stress: 12 } }
        ] },
        { label: "Take the frontage road around", requires: { skillMin: { navigation: 1 } }, outcomes: [
          { w: 2, text: "Dirt, a cattle gate, and back on the interstate a mile past them.", effects: { time: 35, fuelBurn: 1.5, vehicle: -3, skill: { navigation: 1 } } },
          { w: 1, text: "The detour is longer than it looked and the ruts are deeper.", effects: { time: 55, fuelBurn: 2.5, vehicle: -9, stress: 10 } }
        ] },
        { label: "Drive at them", outcomes: [
          { w: 1, text: "They move. Of course they move. You spend the next hour watching the mirror and feeling worse about it than you expected.", effects: { time: 2, stress: 22, vehicle: -4, flag: "ran_blockade" } }
        ] }
      ] },

    { id: "convoy", title: "A CONVOY", weight: 6, requires: { minMile: 150 },
      text: "Six vehicles running close, lights on in daylight. The last one slows and the driver waves you into the line.",
      choices: [
        { label: "Join the convoy for a while", outcomes: [
          { w: 3, text: "Ninety miles of somebody else watching the mirrors. You'd forgotten what that felt like.", effects: { time: -10, stress: -16, flag: "rode_convoy", skill: { social: 1 } } },
          { w: 1, text: "They peel off at an exit that isn't on your map, all six, without signaling. You keep going alone.", effects: { stress: 6, anomaly: 1 } }
        ] },
        { label: "Hang back", outcomes: [
          { w: 1, text: "You let them get small in the distance. Safer, maybe. Quieter, definitely.", effects: { stress: 4 } }
        ] }
      ] },

    { id: "hitchhiker", title: "SOMEONE ON THE SHOULDER", weight: 7, requires: { minMile: 80, daytime: true },
      text: "A woman with a pack and a sunburn, one hand raised, not quite a wave.",
      choices: [
        { label: "Pick her up", outcomes: [
          { w: 3, text: "Her name is Mercy. She rides forty miles, fixes your idle by ear, and gets out at a road with no sign.", effects: { time: 20, vehicle: 6, stress: -8, flag: "met_mercy", skill: { mechanical: 1 } } },
          { w: 1, text: "She's quiet the whole way. Getting out she says, \"Careful east of the river.\" You never told her where you were going.", effects: { time: 20, stress: 8, anomaly: 1, flag: "met_mercy" } }
        ] },
        { label: "Give water and keep going", requires: { items: ["water"] }, outcomes: [
          { w: 1, text: "She takes it, nods, and is walking again before you've pulled away.", effects: { time: 6, stress: -3, skill: { social: 1 } } }
        ] },
        { label: "Drive past", outcomes: [
          { w: 1, text: "You watch her get smaller in the mirror and think about it for the next twenty miles.", effects: { stress: 9 } }
        ] }
      ] },

    { id: "dust_storm", title: "DUST STORM", weight: 6, requires: { region: "desert", daytime: true },
      text: "A brown wall is crossing the interstate a mile ahead. The old sign still says PULL ASIDE — STAY ALIVE, and somebody has kept it painted.",
      choices: [
        { label: "Pull off, lights off, foot off the brake", outcomes: [
          { w: 1, text: "Twelve minutes of sandpaper on glass, then daylight and a world the color of a paper bag.", effects: { time: 16, stress: 6, skill: { navigation: 1 } } }
        ] },
        { label: "Push through slowly", outcomes: [
          { w: 2, text: "Visibility drops to a hood length. You come out the far side with aching hands.", effects: { time: 9, stress: 16, vehicle: -5, health: -2 } },
          { w: 1, text: "Something big passes going the other way, close enough to rock you. Neither of you saw the other.", effects: { time: 8, stress: 26, vehicle: -8 } }
        ] }
      ] },

    { id: "overheat", title: "TEMPERATURE CLIMBING", weight: 7, requires: { grade: "climb", minMile: 60 },
      text: "The needle drifts past the middle for the first time today, and the grade ahead goes up for six miles.",
      choices: [
        { label: "Heater on full blast", outcomes: [
          { w: 1, text: "The oldest trick there is. You crest the hill sweating and victorious.", effects: { time: 8, health: -2, stress: 4, skill: { mechanical: 1 } } }
        ] },
        { label: "Pull over and let it cool", outcomes: [
          { w: 1, text: "Twenty minutes in what shade there is. You top off the coolant if you have it.", effects: { time: 24, vehicle: 4, useItem: "coolant" } }
        ] },
        { label: "Push on", outcomes: [
          { w: 2, text: "You make it. Something under the hood ticks for a long time after you shut it off.", effects: { vehicle: -12, stress: 10 } },
          { w: 1, text: "Steam, then the smell, then the shoulder. You wait a long time for it to be touchable.", effects: { vehicle: -20, time: 55, stress: 20, health: -3 } }
        ] }
      ] },

    { id: "flat_tire", title: "THAT'S NOT A GOOD SOUND", weight: 7, requires: { minMile: 40 },
      text: "A rhythmic thumping starts, gets faster, then gets embarrassing.",
      choices: [
        { label: "Change it yourself", requires: { items: ["spare", "jack"] }, outcomes: [
          { w: 1, text: "Twenty-five minutes and one skinned knuckle. You're rolling on the spare and watching for the next tire pile.", effects: { time: 30, health: -2, removeItem: "spare", skill: { mechanical: 2 }, achievement: "tire_hero" } }
        ] },
        { label: "Flag someone down", outcomes: [
          { w: 2, text: "A farm truck stops. He has a tire that nearly fits and won't take money, only the story of where you're going.", effects: { time: 70, vehicle: -4, stress: 8, skill: { social: 1 } } },
          { w: 1, text: "Nobody stops for two hours. Then somebody does, and charges you for it.", effects: { time: 150, cash: -120, stress: 20 } }
        ] },
        { label: "Limp to the next exit", outcomes: [
          { w: 1, text: "You make it. The tire does not. The rim is now a conversation topic.", effects: { time: 25, vehicle: -15, stress: 14 } }
        ] }
      ] },

    { id: "low_fuel_gamble", title: "THE NEEDLE", weight: 9, requires: { maxFuelPct: 18 },
      text: "Below the E mark now. The next place anyone mentioned is further than you'd like.",
      choices: [
        { label: "Pour in the jerry can", requires: { items: ["jerry"] }, outcomes: [
          { w: 1, text: "Five gallons, funneled carefully, not one drop wasted. The best money you ever spent.", effects: { fuelGal: 5, removeItem: "jerry", time: 12, stress: -14 } }
        ] },
        { label: "Coast the downhills, 45 the rest", outcomes: [
          { w: 2, text: "You drive like an old man and it works. Fumes and prayer get you there.", effects: { time: 40, fuelSave: 0.8, stress: 12, skill: { navigation: 1 } } },
          { w: 1, text: "It doesn't work. The engine surges, stumbles, and quits in the silence of a place with no lights.", effects: { fuelGal: -99, stress: 26 } }
        ] },
        { label: "Knock on a door", outcomes: [
          { w: 2, text: "A farmhouse with a tank on stilts out back. He sells you six gallons at a price that is not friendly, but is fair.", effects: { cash: -90, fuelGal: 6, time: 50 } },
          { w: 1, text: "Nobody answers. The dog at the fence is very clear about the situation.", effects: { time: 30, stress: 14 } }
        ] }
      ] },

    { id: "night_lights", title: "LIGHTS BEHIND YOU", weight: 6, requires: { night: true, minMile: 180 },
      text: "Headlights have been holding the same distance back for eleven miles. Not closing. Not falling away.",
      choices: [
        { label: "Slow down and let them pass", outcomes: [
          { w: 2, text: "They pass. A family, three kids asleep in back, hand out the window as they go by.", effects: { stress: -6, time: 4 } },
          { w: 1, text: "They slow down too. You drive that way for another twenty minutes before they take an exit.", effects: { stress: 20, time: 6, anomaly: 1 } }
        ] },
        { label: "Take the next exit and wait", outcomes: [
          { w: 1, text: "You sit behind a dead motel with your lights off. Nothing follows. You feel foolish, then relieved, then tired.", effects: { time: 35, energy: -6, stress: 6 } }
        ] },
        { label: "Speed up", outcomes: [
          { w: 1, text: "You open it up. They don't follow. The fuel gauge notices.", effects: { fuelBurn: 1.2, stress: 10, vehicle: -3 } }
        ] }
      ] },

    { id: "elk", title: "SOMETHING IN THE ROAD", weight: 6, requires: { night: true, minMile: 90 },
      text: "Eyes at the edge of the headlights, then a shape the size of a refrigerator stepping onto the asphalt.",
      choices: [
        { label: "Brake in a straight line", outcomes: [
          { w: 3, text: "You stop in time. It looks at you with total indifference and walks off.", effects: { time: 5, stress: 18 } },
          { w: 1, text: "You stop. It doesn't. A hoof dents the fender on the way past.", effects: { vehicle: -12, stress: 25, time: 12 } }
        ] },
        { label: "Swerve", outcomes: [
          { w: 2, text: "You miss it and catch the rumble strip. Your heart takes four miles to come down.", effects: { stress: 26, vehicle: -4 } },
          { w: 2, text: "You miss it and clip a sign. The sign loses. So does your headlight.", effects: { vehicle: -18, stress: 24, time: 25 } }
        ] }
      ] },

    { id: "hail", title: "HAIL", weight: 5, requires: { region: "plains" },
      text: "The sky turns the color of a bruise and the first stone hits the hood like a thrown rock.",
      choices: [
        { label: "Get under an overpass", outcomes: [
          { w: 2, text: "Four other vehicles have the same idea. Nobody talks. Everybody nods.", effects: { time: 35, stress: 8 } }
        ] },
        { label: "Drive out of it", outcomes: [
          { w: 2, text: "Eleven miles of noise, then sun. The hood looks like a golf ball.", effects: { vehicle: -10, stress: 18, time: 12 } }
        ] }
      ] },

    { id: "bridge_out", title: "THE BRIDGE", weight: 5, requires: { minMile: 1400, maxMile: 1700 },
      text: "The river is wide and brown and the bridge on your map has a barge tied across the gap in the middle of it.",
      choices: [
        { label: "Pay the barge", outcomes: [
          { w: 1, text: "Sixty dollars and an hour of standing on steel watching the water. Your vehicle looks small out there.", effects: { cash: -60, time: 70, stress: -4, flag: "crossed_barge" } }
        ] },
        { label: "Drive south to the working bridge", outcomes: [
          { w: 1, text: "Fifty extra miles and a checkpoint, but concrete the whole way across.", effects: { time: 70, fuelBurn: 2.2, cash: -10 } }
        ] },
        { label: "Ask about the other bridge", requires: { skillMin: { social: 2 } }, outcomes: [
          { w: 2, text: "There is a third bridge. It is not on any map and the people who use it would like it kept that way.", effects: { time: 45, flag: "third_bridge", anomaly: 1, skill: { social: 1 } } },
          { w: 1, text: "Nobody here will discuss a third bridge with you, and the way they don't discuss it is itself informative.", effects: { time: 20, stress: 10, anomaly: 1 } }
        ] }
      ] },

    { id: "radio_news", title: "THE SHORTWAVE", weight: 6, requires: { items: ["radio"], minMile: 100 },
      text: "You run the dial while you drive. Mostly static, then a woman reading fuel prices by city, slow and clear, the way you'd read to a child.",
      choices: [
        { label: "Write down the prices", outcomes: [
          { w: 1, text: "Three towns ahead are worth stopping in. Two aren't. That's real money.", effects: { flag: "fuel_intel", stress: -6, skill: { navigation: 1 } } }
        ] },
        { label: "Keep listening past the prices", outcomes: [
          { w: 2, text: "Weather, a missing persons list, a birthday. Ordinary and enormously comforting.", effects: { stress: -10 } },
          { w: 1, text: "After the list she reads exit numbers. Yours is one of them. She reads it twice.", effects: { stress: 12, anomaly: 2, flag: "heard_414" } }
        ] }
      ] },

    { id: "jerky_time", title: "THE JERKY", weight: 5, requires: { items: ["jerky"] },
      text: "You're hungry and the unlabeled jerky is right there, being unlabeled.",
      choices: [
        { label: "Eat it", outcomes: [
          { w: 2, text: "Salty, chewy, deeply satisfying, no consequences whatsoever.", effects: { food: 1, removeItem: "jerky", stress: -6 } },
          { w: 1, text: "Consequences. Immediate, thorough, and roadside.", effects: { health: -12, stress: 12, removeItem: "jerky", achievement: "never_again" } }
        ] },
        { label: "Save it for trading", outcomes: [
          { w: 1, text: "It goes back in the bag. Out here, food is currency that never inflates.", effects: {} }
        ] }
      ] },

    { id: "nap", title: "YOUR EYES ARE DOING THAT THING", weight: 8, requires: { maxEnergy: 30 },
      text: "You've read the same mile marker twice and you aren't sure you read it either time.",
      choices: [
        { label: "Sleep in the vehicle", outcomes: [
          { w: 1, text: "Four hours, doors locked, seat back, boots on. You wake up cold and much better.", effects: { time: 240, energy: 60, stress: -12, health: 2, achievement: "luxury" } }
        ] },
        { label: "Twenty minutes and coffee", outcomes: [
          { w: 1, text: "It works for about forty miles.", effects: { time: 30, energy: 22, health: -1 } }
        ] },
        { label: "Keep driving", outcomes: [
          { w: 2, text: "You keep driving. The lane lines start suggesting things.", effects: { energy: -10, health: -5, stress: 14, vehicle: -3 } }
        ] }
      ] },

    { id: "storm_farm", title: "STORM OVER THE FIELDS", weight: 5, requires: { region: "farm" },
      text: "You can see the whole weather system at once out here. It is beautiful and it is coming across the road.",
      choices: [
        { label: "Find a farm road and wait", outcomes: [
          { w: 1, text: "Rain so loud you can't hear the engine. Forty minutes later the light goes gold and everything smells like dirt.", effects: { time: 45, stress: -14, souvenir: "A sky the size of the world" } }
        ] },
        { label: "Drive through it", outcomes: [
          { w: 2, text: "White knuckles and hazard lights, and then it's behind you.", effects: { time: 20, stress: 14, vehicle: -3 } }
        ] }
      ] },

    { id: "mill_town", title: "THE MILL IS RUNNING", weight: 5, requires: { region: "rust" },
      text: "Smoke from a stack that hasn't smoked in thirty years, and a line of people walking in carrying lunch pails.",
      choices: [
        { label: "Stop and look", outcomes: [
          { w: 1, text: "They restarted one furnace. One. A man explains the whole thing to you with enormous pride and you buy a sandwich you don't need.", effects: { time: 35, cash: -6, stress: -14, souvenir: "Slag glass from a working mill", skill: { social: 1 } } }
        ] },
        { label: "Keep moving", outcomes: [
          { w: 1, text: "You watch it in the mirror for a long time.", effects: { stress: -4 } }
        ] }
      ] },

    { id: "toll_appalachia", title: "THE TUNNEL", weight: 5, requires: { region: "hills" },
      text: "The tunnel through the ridge is lit, staffed, and charging. The alternative is the old road over the top.",
      choices: [
        { label: "Pay and take the tunnel", outcomes: [
          { w: 1, text: "Thirty dollars for four minutes of orange light and the hum of your own tires.", effects: { cash: -30, time: 10 } }
        ] },
        { label: "Take the old road over the ridge", outcomes: [
          { w: 2, text: "Switchbacks, brakes smelling hot, and a view you'd have paid thirty dollars for.", effects: { time: 55, fuelBurn: 1.4, vehicle: -6, stress: -6, souvenir: "The whole valley from the top" } },
          { w: 1, text: "Halfway up you meet a truck coming down in the middle. The backing-up situation takes an hour.", effects: { time: 80, vehicle: -8, stress: 18 } }
        ] }
      ] },

    { id: "checkpoint_ne", title: "THEY WRITE YOUR NAME IN A BOOK", weight: 6, requires: { region: "northeast" },
      text: "A real checkpoint: a table, a ledger, two people with clipboards and one with a rifle who looks embarrassed about it.",
      choices: [
        { label: "Give your name and your business", outcomes: [
          { w: 3, text: "Fifteen minutes of paperwork and a stamped card you're told to keep.", effects: { time: 20, flag: "carded" } },
          { w: 1, text: "The clerk finds your name already in the ledger, from four months ago, in handwriting that is almost yours.", effects: { time: 25, stress: 18, anomaly: 3, flag: "the_ledger" } }
        ] },
        { label: "Offer to help instead", requires: { skillMin: { firstAid: 2 } }, outcomes: [
          { w: 1, text: "You look at a woman's infected hand for ten minutes. They wave you through and give you a bag of apples.", effects: { time: 40, addItem: "food", stress: -10, skill: { firstAid: 1 } } }
        ] }
      ] },

    // ---------------------------------------------------------------- on foot
    { id: "foot_walk", title: "WALKING", weight: 9, requires: { onFoot: true },
      text: "Three miles an hour. Everything you own is on your back and the horizon is not getting closer in any way you can measure.",
      choices: [
        { label: "Keep walking", outcomes: [
          { w: 2, text: "You walk. It is the oldest thing people do.", effects: { time: 30, energy: -8, health: -2 } },
          { w: 1, text: "A truck slows, looks at you, and keeps going. Then another one stops.", effects: { time: 20, stress: -10, flag: "got_lift", milesFree: 22 } }
        ] },
        { label: "Rest in the shade", outcomes: [
          { w: 1, text: "An hour under an overpass with your boots off. It helps more than it should.", effects: { time: 60, energy: 14, stress: -8 } }
        ] }
      ] },

    { id: "foot_find", title: "SOMETHING IN THE WEEDS", weight: 6, requires: { onFoot: true },
      text: "A sedan nose-down in the ditch, doors open, tires flat but the body straight.",
      choices: [
        { label: "Look it over", requires: { skillMin: { mechanical: 1 } }, outcomes: [
          { w: 2, text: "It turns over. It actually turns over. Half a tank, bald tires, and a smell you will get used to.", effects: { giveVehicle: "civic", vehicleCond: 42, fuelGal: 5, time: 90, stress: -25, achievement: "back_on_wheels" } },
          { w: 2, text: "Dead as a stone, but the trunk has a jack and a jug of coolant in it.", effects: { addItem: "jack", addItem2: "coolant", time: 45 } }
        ] },
        { label: "Take what you can carry", outcomes: [
          { w: 1, text: "A flashlight, half a roll of tape, and a photograph of people you will never meet.", effects: { addItem: "flashlight", addItem2: "tape", time: 25, souvenir: "A photograph of strangers" } }
        ] }
      ] },

    // ---------------------------------------------------------------- settlements
    { id: "market_rumor", title: "IN THE MARKET", weight: 7, requires: { stopped: true, service: "shop" },
      text: "Two women arguing about the road east, loudly enough that it's clearly meant to be overheard.",
      choices: [
        { label: "Listen", outcomes: [
          { w: 2, text: "Fuel is short three towns ahead and there's a family selling eggs at the old weigh station. Both facts are useful.", effects: { flag: "fuel_intel", stress: -4 } },
          { w: 1, text: "They stop when they notice you and start again when you move away.", effects: { stress: 5, anomaly: 1 } }
        ] },
        { label: "Join in", requires: { skillMin: { social: 1 } }, outcomes: [
          { w: 1, text: "You mention where you're headed. One of them says \"Boston\" like it's a rumor she's heard and doesn't believe.", effects: { time: 25, stress: -8, skill: { social: 1 } } }
        ] }
      ] },

    { id: "mechanic_offer", title: "THE MECHANIC", weight: 6, requires: { stopped: true, service: "repair", maxVehicle: 65 },
      text: "She walks around your vehicle once, crouches at the rear wheel, and stands up with a verdict.",
      choices: [
        { label: "Have her do the work", outcomes: [
          { w: 1, text: "Four hours and most of your cash. It runs like a different vehicle.", effects: { repairFull: true, time: 240 } }
        ] },
        { label: "Have her teach you instead", requires: { items: ["tools"] }, outcomes: [
          { w: 1, text: "Half the price, twice the time, and you'll know how to do it next time. That's the real trade.", effects: { repairHalf: true, time: 300, cash: -40, skill: { mechanical: 3 } } }
        ] },
        { label: "Not today", outcomes: [{ w: 1, text: "She shrugs. \"It'll tell you when it's serious.\"", effects: {} } ] }
      ] },

    { id: "kid_with_map", title: "A KID WITH A MAP", weight: 5, requires: { stopped: true },
      text: "Maybe twelve, selling hand-drawn maps of the next two hundred miles for five dollars. The lettering is careful.",
      choices: [
        { label: "Buy a map", outcomes: [
          { w: 2, text: "It's good. Genuinely good. Water sources, two blocked exits, a note that says DOGS at mile 40.", effects: { cash: -5, flag: "kid_map", skill: { navigation: 2 }, stress: -6 } },
          { w: 1, text: "It's beautiful and completely wrong, and you won't find that out for a hundred miles.", effects: { cash: -5, flag: "bad_map" } }
        ] },
        { label: "Buy two", outcomes: [
          { w: 1, text: "She looks at you like you've made a mistake, then decides not to mention it. The second map shows a road the first one doesn't.", effects: { cash: -10, skill: { navigation: 1 }, anomaly: 1, souvenir: "A hand-drawn map with an extra road" } }
        ] }
      ] },

    { id: "motel_running", title: "A MOTEL WITH THE SIGN LIT", weight: 6, requires: { stopped: true, service: "rest" },
      text: "Nine rooms, a working ice machine, and a man behind the desk who seems delighted that anyone came.",
      choices: [
        { label: "Take a room", outcomes: [
          { w: 1, text: "Hot water. Actual hot water. You stand in it until it runs cold and then you sleep for nine hours.", effects: { cash: -55, time: 540, energy: 100, health: 12, stress: -30 } }
        ] },
        { label: "Sleep in the lot instead", outcomes: [
          { w: 1, text: "He waves you to a spot under the light and brings you coffee in the morning without being asked.", effects: { time: 420, energy: 70, stress: -14, health: 2 } }
        ] }
      ] },

    { id: "vehicle_lot", title: "THE LOT", weight: 6, requires: { stopped: true, service: "lot" },
      text: "Fifteen vehicles behind a fence, a woman with a clipboard, and a sign: WE TRADE. WE DON'T HAGGLE. (She haggles.)",
      choices: [
        { label: "Look at what's there", outcomes: [
          { w: 1, text: "Open the gate and walk the rows.", effects: { openLot: true } }
        ] },
        { label: "Not today", outcomes: [{ w: 1, text: "You keep what you came with. It's gotten you this far.", effects: {} }] }
      ] },

    // ---------------------------------------------------------------- the quiet ones
    { id: "billboard_twice", title: "HAVEN'T YOU SEEN THAT?", weight: 3, rarity: "uncommon",
      requires: { minAnomaly: 2, minMile: 300 },
      text: "A billboard for a steakhouse with a cartoon cow. You passed this exact billboard eleven miles ago, including the bird sitting on it.",
      choices: [
        { label: "Check the mile markers", outcomes: [
          { w: 1, text: "The markers climb normally. Everything is in order except that you know what you saw.", effects: { stress: 8, anomaly: 1 } }
        ] },
        { label: "Photograph it", outcomes: [
          { w: 1, text: "Later, the photo shows the billboard, the sky, and no bird.", effects: { stress: 10, anomaly: 2, souvenir: "Photo of a billboard, no bird" } }
        ] }
      ] },

    { id: "back_again", title: "BACK AGAIN?", weight: 3, rarity: "rare",
      requires: { minAnomaly: 4, service: "fuel", stopped: true },
      text: "The attendant works the hand pump, looks at you a beat too long, and says: \"Back again? You made better time last go-round.\"\n\nYou have never been here before.",
      choices: [
        { label: "\"You've got me confused with someone.\"", outcomes: [
          { w: 1, text: "He agrees pleasantly. As you leave, without looking up: \"Drive safe. Watch for 414.\"", effects: { stress: 14, anomaly: 3, flag: "heard_414" } }
        ] },
        { label: "\"How much better?\"", outcomes: [
          { w: 1, text: "He checks a notebook under the counter, runs a finger down a column, and reads your name.", effects: { stress: 20, anomaly: 4, flag: "the_notebook" } }
        ] }
      ] },

    { id: "exit_414", title: "EXIT 414", weight: 2, rarity: "rare",
      requires: { minAnomaly: 7, minMile: 600 },
      text: "The sign is green and clean and correct in every way except that there is no town on it. No services. No distance.\n\nJust: EXIT 414 — NEXT EXIT.\n\nYour map has nothing here. The odometer says you are eleven miles from where the map says you are.",
      choices: [
        { label: "Take the exit", outcomes: [
          { w: 1, text: "The ramp curves down and east, which is the wrong direction for a ramp on this side of the highway. At the bottom there is a stop sign, a crossroad, and no traffic in either direction.\n\nYou sit there a while. Then you get back on the interstate.\n\nThe next mile marker is the one you passed twenty minutes ago.", effects: { time: 40, stress: 30, anomaly: 5, flag: "took_414", achievement: "one_more_exit", souvenir: "A photograph of a sign for Exit 414" } }
        ] },
        { label: "Keep driving", outcomes: [
          { w: 1, text: "You pass it. In the mirror the sign is still there, getting smaller, and then it isn't there, and the gap in the guardrail where the ramp was is just guardrail.", effects: { stress: 22, anomaly: 3, flag: "saw_414" } }
        ] }
      ] }
  ];

  const achievements = [
    { id: "arrived", name: "One Piece", desc: "Reach Boston." },
    { id: "probably_fine", name: "Probably Fine", desc: "Turn the radio up instead of dealing with the check-engine light." },
    { id: "luxury", name: "Luxury Accommodations", desc: "Sleep in your vehicle." },
    { id: "never_again", name: "Never Again", desc: "Eat the unlabeled jerky and regret it." },
    { id: "tire_hero", name: "Jack Of One Trade", desc: "Change your own tire on the shoulder." },
    { id: "back_on_wheels", name: "Back On Wheels", desc: "Find a running vehicle while on foot." },
    { id: "long_walk", name: "The Long Walk", desc: "Cover twenty miles on foot." },
    { id: "trader", name: "Horse Trading", desc: "Swap vehicles at a lot." },
    { id: "halfway", name: "The Mississippi", desc: "Cross into the eastern half of the country." },
    { id: "thrifty", name: "Fumes", desc: "Reach a settlement with under a gallon left." },
    { id: "one_more_exit", name: "One More Exit", desc: "Take Exit 414." }
  ];

  return { route, regions, vehicles, careers, items, events, achievements };
})();

/* ---------------------------------------------------------------- radio
   Voices from down the road. The further east you get, the more you pick up,
   and what they say about the next few hundred miles is usually true. */
window.OME_RADIO = (() => {
  const stations = [
    { id: "music", freq: "88.1", name: "Unattended music", kind: "music",
      blurb: "Somebody left a tape running in an empty station. It has not stopped." },
    { id: "kphx", freq: "92.3", name: "Phoenix Relay", kind: "voice", from: 0, to: 700,
      host: "a tired man reading from index cards" },
    { id: "kabq", freq: "96.7", name: "Albuquerque Watch", kind: "voice", from: 250, to: 1100,
      host: "a woman who says everything twice" },
    { id: "kama", freq: "101.5", name: "Amarillo Roadhouse", kind: "voice", from: 600, to: 1500,
      host: "two men who clearly do not like each other" },
    { id: "kstl", freq: "104.9", name: "River Net", kind: "voice", from: 1150, to: 2000,
      host: "a dispatcher with a river accent" },
    { id: "kpit", freq: "107.1", name: "Three Rivers", kind: "voice", from: 1800, to: 2500,
      host: "a man who used to do traffic" },
    { id: "kbos", freq: "89.7", name: "Boston Harbor Signal", kind: "voice", from: 2200, to: 3000,
      host: "a voice that sounds genuinely pleased you're coming" },
    { id: "static", freq: "—", name: "Static", kind: "static",
      blurb: "Nothing. Sometimes that's the point." }
  ];

  // Reports are written to be useful: weather, fuel, roads, people.
  const reports = {
    weather: [
      "Wind advisory on the high stretch east of here. If you've got a high profile, keep both hands on it.",
      "Rain moving across the plains tonight. It won't stop you, it'll just make the dark darker.",
      "Dust is up west of the state line. Anyone out there, pull all the way off the pavement. All the way off.",
      "Snow above six thousand feet. It's early for it. Carry a blanket."
    ],
    fuel: [
      "Fuel report: pumps running at the junction, dry at the two exits after. Fill where you can.",
      "Prices are up east of here. Not gouging, just up. Top off before the county line.",
      "Somebody got a tanker through. There's diesel again at the big stop, first time in a month.",
      "If you're running low, the farm with the white tank will sell you six gallons and talk your ear off."
    ],
    road: [
      "Bridge is still one lane. Take turns. People have been taking turns.",
      "There's a crew working the center span. They're not charging. They're just working.",
      "Stay off the old highway north of the interchange. Washouts, and nobody's grading it.",
      "Tunnel's lit and staffed. Toll's what it was last week."
    ],
    people: [
      "Two cars nose to nose at the county line, charging for the privilege. They'll take twenty.",
      "Convoy went through this morning, six vehicles, friendly enough. If they wave you in, you can take it.",
      "If a woman named Mercy flags you down, she's worth the seat. She fixes what she rides in.",
      "Be careful past dark on the long empty stretch. Not saying anything more than that."
    ],
    ordinary: [
      "Birthday today for a girl in the east settlement. She is nine. Happy birthday.",
      "Lost dog, brown, answers to Rooster, last seen near the water tower.",
      "Market's Saturday. Bring what you don't need and take what you do.",
      "Power's on from six to midnight. Charge what you've got."
    ],
    // rare, and never explained
    strange: [
      "…and for anyone running east tonight, watch your mileage. Watch it closely. We've had reports.",
      "Repeating a message we were asked to read: the exit is not on the map and should not be taken.",
      "If you passed a green sign about eleven miles back, and it wasn't there on your way out, you are not the first to call it in.",
      "We've been asked to stop reading the numbers. So we'll stop reading the numbers."
    ]
  };

  return { stations, reports };
})();
