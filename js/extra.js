/* More road, so no two trips are the same.
   Twenty more encounters, a kind on every event so the engine can keep the
   same sort of thing from happening twice in a row, and a long list of small
   moments that go by without stopping the car. */
(() => {
  const C = window.OME_CONTENT;

  // what sort of thing each of the original encounters is
  const KINDS = {
    check_engine: "mech", flat_tire: "mech", overheat: "mech", low_fuel_gamble: "supply",
    pumps_dry: "supply", siphon_chance: "supply", jerky_time: "supply",
    roadblock: "people", convoy: "people", hitchhiker: "people", checkpoint_ne: "people",
    market_rumor: "people", mechanic_offer: "people", kid_with_map: "people",
    motel_running: "rest", nap: "rest", vehicle_lot: "people",
    dust_storm: "weather", hail: "weather", storm_farm: "weather",
    elk: "road", bridge_out: "road", toll_appalachia: "road", mill_town: "road",
    night_lights: "strange", billboard_twice: "strange", back_again: "strange",
    exit_414: "strange", radio_news: "strange",
    foot_walk: "foot", foot_find: "foot"
  };
  C.events.forEach(e => { if (!e.kind) e.kind = KINDS[e.id] || "road"; });

  // ------------------------------------------------------------ new encounters
  const more = [
    { id: "dog_shoulder", title: "A DOG ON THE SHOULDER", kind: "people", weight: 7, requires: { minMile: 10, daytime: true },
      text: "It is trotting east with real purpose, like it has an appointment. No collar. It looks at the car without slowing down.",
      choices: [
        { label: "Stop and share some food", requires: { items: ["food"] }, outcomes: [
          { w: 2, text: "It eats fast, leans its whole weight against your leg for about four seconds, and then goes back to trotting east.", effects: { time: 10, stress: -12 } },
          { w: 1, text: "It takes the food, carries it into the brush, and does not come back out. Fair enough.", effects: { time: 8, stress: -5 } }
        ] },
        { label: "Slow down and let it pass", outcomes: [
          { w: 1, text: "You roll alongside for a quarter mile. It glances over once, decides you are not interesting, and turns off at a fence line.", effects: { time: 4, stress: -4 } }
        ] },
        { label: "Keep your speed", outcomes: [
          { w: 1, text: "You watch it in the mirror until the road bends. You think about it again around dinner.", effects: { stress: 4 } }
        ] } ] },

    { id: "water_sellers", title: "FIVE DOLLARS A JUG", kind: "people", weight: 6, requires: { minMile: 40, daytime: true, region: "desert" },
      text: "A card table under a beach umbrella at the bottom of an off-ramp. Two kids, a cooler, and a hand-painted sign. Their mother is asleep in the truck behind them with the door open for the air.",
      choices: [
        { label: "Buy four jugs", outcomes: [
          { w: 1, text: "Twenty dollars. The older one counts your change twice and gets it right both times. The water is cold and tastes like the cooler.", effects: { cash: -20, health: 6, stress: -10, time: 12 } }
        ] },
        { label: "Buy one and overpay", outcomes: [
          { w: 1, text: "You hand over a twenty for a five-dollar jug and drive off before the argument can start. In the mirror they are still looking at the bill.", effects: { cash: -20, health: 2, stress: -14, time: 10, flag: "kind_once" } }
        ] },
        { label: "Wave and keep going", outcomes: [
          { w: 1, text: "They wave back. The umbrella is the only shade for nine miles in either direction.", effects: { stress: 3 } }
        ] } ] },

    { id: "freight_train", title: "THE TRAIN", kind: "road", weight: 6, requires: { minMile: 60, daytime: true },
      text: "A freight comes up on your left and matches your speed for a while, close enough to read the graffiti. Somebody is sitting in an open boxcar door with their boots hanging out.",
      choices: [
        { label: "Wave", outcomes: [
          { w: 3, text: "They wave back with their whole arm, like it matters. The train pulls ahead at the grade and that is the end of it.", effects: { stress: -10 } },
          { w: 1, text: "They don't move at all. You are most of a mile down the road before you understand why.", effects: { stress: 12, anomaly: 1 } }
        ] },
        { label: "Race it to the crossing", outcomes: [
          { w: 2, text: "You win by a length and a half and feel about nine years old.", effects: { fuelBurn: 1.2, stress: -14, vehicle: -1 } },
          { w: 1, text: "You lose, and the arms come down, and you sit through a hundred and twelve cars. You count them.", effects: { time: 22, stress: 5 } }
        ] } ] },

    { id: "stalled_family", title: "HOOD UP, FOUR-WAYS ON", kind: "people", weight: 8, requires: { minMile: 70 },
      text: "A wagon on the shoulder with everything they own strapped to the roof. A man is standing in front of the engine with the posture of somebody who has run out of ideas.",
      choices: [
        { label: "Stop and take a look", requires: { skillMin: { mechanical: 1 } }, outcomes: [
          { w: 2, text: "Corroded battery terminal. Two minutes with a wire brush and it turns over. His wife hands you a jar of peaches through the window and will not take no.", effects: { time: 25, stress: -12, addItem: "food", skill: { mechanical: 1 }, flag: "helped_family" } },
          { w: 1, text: "It is the fuel pump, and there is nothing you can do about a fuel pump on a shoulder. You give them water and the name of the next town.", effects: { time: 30, stress: 6, flag: "helped_family" } }
        ] },
        { label: "Give them some fuel", outcomes: [
          { w: 1, text: "Two gallons out of your tank into theirs. They offer money and you say no, and everyone gets to feel good about it for a while.", effects: { fuelBurn: 2, time: 20, stress: -14, flag: "helped_family" } }
        ] },
        { label: "Carry a message to the next town", outcomes: [
          { w: 1, text: "You take down a name and an address and promise to pass it on. You do, too, eventually.", effects: { time: 10, stress: -4 } }
        ] },
        { label: "Keep driving", outcomes: [
          { w: 1, text: "There were kids in the back window. You saw them. You drive for an hour without the radio on.", effects: { stress: 14 } }
        ] } ] },

    { id: "rock_chip", title: "A SOUND LIKE A GUNSHOT", kind: "mech", weight: 7, requires: { minMile: 120 },
      text: "A gravel truck goes by the other direction and something off its load hits the windshield square in front of your face. A star, right there, with a crack already deciding which way to go.",
      choices: [
        { label: "Tape it from the inside", requires: { items: ["tape"] }, outcomes: [
          { w: 1, text: "It holds. It looks terrible and it holds, and you stop noticing it within fifty miles.", effects: { time: 12, removeItem: "tape", stress: -4 } }
        ] },
        { label: "Ignore it and drive", outcomes: [
          { w: 2, text: "The crack walks about four inches over the next hour and then stops, as cracks do.", effects: { stress: 6 } },
          { w: 1, text: "By nightfall it runs the whole width of the glass and catches every headlight in the oncoming lane.", effects: { stress: 12, vehicle: -4 } }
        ] } ] },

    { id: "brake_smell", title: "SOMETHING IS BURNING", kind: "mech", weight: 7, requires: { grade: "descend", minMile: 200 },
      text: "Six miles of downgrade and a smell coming up through the vents like a hot iron left on a shirt. The pedal is going soft under your foot.",
      choices: [
        { label: "Pull off and let them cool", outcomes: [
          { w: 1, text: "Twenty minutes on a runaway-truck ramp with the hood up and your hands on your knees. When you go again the pedal is back where it belongs.", effects: { time: 25, stress: 8, vehicle: -2 } }
        ] },
        { label: "Downshift and ride it out", requires: { skillMin: { mechanical: 1 } }, outcomes: [
          { w: 2, text: "You let the engine do the work the rest of the way down, the way you were taught. At the bottom everything is fine and you are a little proud.", effects: { time: 8, stress: 4, skill: { mechanical: 1 } } },
          { w: 1, text: "It mostly works. Mostly is doing a lot of carrying in that sentence, and the brakes are never quite the same after.", effects: { vehicle: -12, stress: 16 } }
        ] } ] },

    { id: "overpass_kids", title: "KIDS ON THE OVERPASS", kind: "people", weight: 6, requires: { minMile: 150, daytime: true },
      text: "Four of them leaning over the rail, watching the road the way people used to watch airports. One has a cardboard sign but you are past before you can read it.",
      choices: [
        { label: "Honk", outcomes: [
          { w: 1, text: "All four go up like a flock. In the mirror they are jumping. You can hear them through the glass.", effects: { stress: -12 } }
        ] },
        { label: "Read the sign in the mirror", outcomes: [
          { w: 2, text: "It says HI. That's the whole sign.", effects: { stress: -10 } },
          { w: 1, text: "It says GO BACK. They are not laughing, and neither are you, for a while.", effects: { stress: 14, anomaly: 1 } }
        ] } ] },

    { id: "state_line", title: "WELCOME TO", kind: "road", weight: 6, requires: { minMile: 90, daytime: true },
      text: "The state line sign, repainted by hand. Somebody has added a line under the old slogan in a different color: STILL HERE.",
      choices: [
        { label: "Stop and take a picture", outcomes: [
          { w: 1, text: "You stand in the weeds and line it up properly, like a person on a vacation, because that is what you have decided this is.", effects: { time: 12, stress: -12, souvenir: "A photo of a hand-painted state line sign" } }
        ] },
        { label: "Drive under it", outcomes: [
          { w: 1, text: "The odometer rolls over something round about a mile later, which feels arranged.", effects: { stress: -5 } }
        ] } ] },

    { id: "wrong_way", title: "HEADLIGHTS IN YOUR LANE", kind: "road", weight: 6, requires: { night: true, minMile: 250 },
      text: "They are a long way off and they are on your side of the median and they are not correcting.",
      choices: [
        { label: "Shoulder, hard", outcomes: [
          { w: 3, text: "Gravel, dust, your heart somewhere around your teeth. They go by doing seventy without ever slowing down.", effects: { time: 10, stress: 26, vehicle: -3 } },
          { w: 1, text: "You catch a ditch edge coming back up and something under the car complains about it for the next hundred miles.", effects: { time: 14, stress: 28, vehicle: -11 } }
        ] },
        { label: "Flash your lights and hold the lane", outcomes: [
          { w: 2, text: "At the last possible second they swerve back where they belong. Neither of you stops.", effects: { stress: 30 } },
          { w: 1, text: "They flash back, three times, and turn off onto a frontage road that wasn't on your map.", effects: { stress: 20, anomaly: 2 } }
        ] } ] },

    { id: "glovebox_wreck", title: "A CAR NOBODY CAME BACK FOR", kind: "supply", weight: 6, requires: { minMile: 100, daytime: true },
      text: "Nose-down in the ditch, doors open, weeds through the wheels. It has been picked over, but people mostly pick over the obvious parts.",
      choices: [
        { label: "Check the glovebox and the trunk", outcomes: [
          { w: 2, text: "Registration, a tire iron, and a folded road atlas from before, with somebody's route drawn in pen. The route is useful.", effects: { time: 18, skill: { navigation: 1 }, stress: -4 } },
          { w: 2, text: "Half a case of bottled water under a blanket, still sealed. Today is a good day.", effects: { time: 16, addItem: "food", health: 4 } },
          { w: 1, text: "A child's car seat, still buckled in, and nothing else. You close the door carefully and stand there a minute.", effects: { time: 12, stress: 16 } }
        ] },
        { label: "Siphon the tank", requires: { items: ["siphon"] }, outcomes: [
          { w: 1, text: "Two and a half gallons of old gas. It will run rough for a few miles and then it will be fine.", effects: { fuelGal: 2.5, time: 22, vehicle: -2 } }
        ] },
        { label: "Leave it", outcomes: [
          { w: 1, text: "Somebody else's whole life, off the side of the road. You keep your eyes forward.", effects: { stress: 2 } }
        ] } ] },

    { id: "washout", title: "THE ROAD IS UNDER WATER", kind: "weather", weight: 6, requires: { minMile: 180 },
      text: "A culvert let go upstream and there is brown water moving across both lanes, maybe a foot of it, maybe more. You cannot tell and that is the problem.",
      choices: [
        { label: "Walk it first", outcomes: [
          { w: 2, text: "Ten inches at the deepest and a solid bottom. You drive it in low and slow and come out the other side with wet boots and a dry engine.", effects: { time: 35, health: -2, skill: { navigation: 1 } } },
          { w: 1, text: "Halfway across you find where the pavement isn't any more. You go back for the long way around.", effects: { time: 70, fuelBurn: 2, stress: 12 } }
        ] },
        { label: "Just drive it", outcomes: [
          { w: 2, text: "A wave over the hood, a cough from the engine, and you're through, swearing.", effects: { time: 8, vehicle: -7, stress: 14 } },
          { w: 1, text: "The water takes the front end sideways and sets you down on the shoulder facing the wrong way. It takes an hour to be ready to drive again.", effects: { time: 60, vehicle: -16, stress: 30, health: -4 } }
        ] },
        { label: "Wait for it to drop", outcomes: [
          { w: 1, text: "Three hours with the engine off, watching a stick you put at the edge. It goes down. Everything does, eventually.", effects: { time: 180, energy: -6, stress: -4 } }
        ] } ] },

    { id: "night_diner", title: "A LIT SIGN AT TWO IN THE MORNING", kind: "rest", weight: 7, requires: { night: true, minMile: 120 },
      text: "Somebody is running a kitchen out of a gas station bay. Four stools, a griddle, a hand-lettered menu with two things on it.",
      choices: [
        { label: "Eggs and coffee", outcomes: [
          { w: 1, text: "Eight dollars. The cook talks the whole time about the road east and half of it is even true. You leave awake in a way you were not before.", effects: { cash: -8, time: 40, energy: 22, health: 4, stress: -16 } }
        ] },
        { label: "Coffee to go", outcomes: [
          { w: 1, text: "Three dollars in a styrofoam cup that has been reused enough times to have a personality.", effects: { cash: -3, time: 12, energy: 12, stress: -6 } }
        ] },
        { label: "Sit in the lot and listen", outcomes: [
          { w: 1, text: "Two truckers at the counter arguing about a bridge. You write down what they say about it.", effects: { time: 20, skill: { navigation: 1 }, stress: -8 } }
        ] } ] },

    { id: "funeral", title: "A LINE OF CARS WITH THEIR LIGHTS ON", kind: "people", weight: 5, requires: { minMile: 300, daytime: true },
      text: "Eleven vehicles, headlights on in daylight, moving slow in the right lane. The lead car has a spray of flowers wired to the grille.",
      choices: [
        { label: "Pull over and let them pass", outcomes: [
          { w: 1, text: "You put it in park on the shoulder and wait, which is what your grandfather would have done. The last car flashes its lights at you.", effects: { time: 14, stress: -10, flag: "paid_respects" } }
        ] },
        { label: "Pass on the left, quietly", outcomes: [
          { w: 1, text: "You go by at forty with your hand raised off the wheel. Nobody looks over.", effects: { time: 4, stress: 4 } }
        ] } ] },

    { id: "water_tower", title: "NAMES ON THE WATER TOWER", kind: "road", weight: 5, requires: { minMile: 80, daytime: true },
      text: "A tower over a town of maybe six hundred, painted with a school mascot and then, more recently, with names. A lot of names, in a lot of different hands.",
      choices: [
        { label: "Read them", outcomes: [
          { w: 1, text: "You idle at the base and read until it gets uncomfortable. Somebody has been adding the dates.", effects: { time: 16, stress: 10, anomaly: 1 } }
        ] },
        { label: "Add yours", outcomes: [
          { w: 1, text: "There is a coffee can of paint pens chained to the ladder, which tells you this is expected. You put your name low, where there's room.", effects: { time: 22, stress: -14, souvenir: "Your name on a water tower in the middle of nowhere", flag: "left_name" } }
        ] },
        { label: "Keep moving", outcomes: [
          { w: 1, text: "You look at it in the mirror for longer than is safe.", effects: { stress: 4 } }
        ] } ] },

    { id: "fence_watchers", title: "THE FENCE LINE", kind: "strange", weight: 4, requires: { minMile: 400, minAnomaly: 3 },
      text: "People standing along a barbed-wire fence at regular intervals, facing the road. Not waving. Spaced too evenly to be an accident. It goes on for most of a mile.",
      choices: [
        { label: "Speed up", outcomes: [
          { w: 1, text: "The last one at the end of the line turns their head to follow you and none of the others do.", effects: { stress: 24, anomaly: 2, fuelBurn: 0.8 } }
        ] },
        { label: "Slow down and count them", outcomes: [
          { w: 2, text: "Forty-one. On the way back through this stretch, if you ever come back through this stretch, you will count again.", effects: { time: 10, stress: 18, anomaly: 3 } },
          { w: 1, text: "You get to nineteen and the nineteenth one is holding a mailbox flag, and you decide that counting was a mistake.", effects: { time: 8, stress: 26, anomaly: 3 } }
        ] },
        { label: "Wave", outcomes: [
          { w: 1, text: "Every single one of them waves back, at the same time, with the same hand.", effects: { stress: 30, anomaly: 4, flag: "waved_back" } }
        ] } ] },

    { id: "school_bus_camp", title: "THE BUS PEOPLE", kind: "people", weight: 6, requires: { minMile: 350 },
      text: "Three school buses parked in a horseshoe off an exit, windows curtained, laundry between them, a generator going. Somebody stands up when you slow down, and then somebody else does.",
      choices: [
        { label: "Trade at the fire", requires: { skillMin: { social: 1 } }, outcomes: [
          { w: 2, text: "They want batteries and news, in that order. You come away with a hot meal, a full jug, and directions around a stretch they say to avoid.", effects: { time: 55, health: 8, energy: 12, stress: -18, skill: { social: 1 }, fuelGal: 1 } },
          { w: 1, text: "It's a quiet, careful conversation at the edge of the camp and nobody invites you in, but they sell you fuel at a fair price.", effects: { time: 35, cash: -30, fuelGal: 5 } }
        ] },
        { label: "Ask to sleep near the fire", outcomes: [
          { w: 1, text: "An old woman points at a patch of ground and says you can have it until first light. It is the best you have slept in a week.", effects: { time: 380, energy: 45, health: 6, stress: -24 } }
        ] },
        { label: "Keep going", outcomes: [
          { w: 1, text: "A kid runs alongside the fence for a second, waving, and then gives up.", effects: { stress: 5 } }
        ] } ] },

    { id: "solar_field", title: "THE PANELS", kind: "road", weight: 5, requires: { minMile: 200, daytime: true },
      text: "A solar field a half mile on a side, and every panel is turned to face the road instead of the sun.",
      choices: [
        { label: "Look it up as you pass", outcomes: [
          { w: 2, text: "Trackers failed, probably. Something in the controller. That is almost certainly all it is.", effects: { stress: 8, anomaly: 1 } },
          { w: 1, text: "As you pass the far end, in the mirror, the near end has begun to turn.", effects: { stress: 22, anomaly: 3 } }
        ] },
        { label: "Don't look", outcomes: [
          { w: 1, text: "You watch the centerline for two solid minutes and feel the glare move across the side of your face.", effects: { stress: 12, anomaly: 1 } }
        ] } ] },

    { id: "radio_preacher", title: "THE ONLY THING ON THE DIAL", kind: "strange", weight: 5, requires: { night: true, minMile: 200 },
      text: "A voice that has been talking for hours, calm and unhurried, reading what sounds like a list of towns. Your town is on it. He reads it and keeps going.",
      choices: [
        { label: "Keep listening", outcomes: [
          { w: 2, text: "It's a road closure list. Of course it's a road closure list. He reads it twice more before dawn and your town is on it both times.", effects: { stress: 12, anomaly: 2, skill: { navigation: 1 } } },
          { w: 1, text: "Somewhere past the state line he stops mid-word. Then, after a minute, he starts the list again from the beginning.", effects: { stress: 24, anomaly: 3 } }
        ] },
        { label: "Turn it off", outcomes: [
          { w: 1, text: "The quiet is worse, so you put the window down instead and drive on the sound of the tires.", effects: { stress: 8 } }
        ] } ] },

    { id: "gate_toll_kid", title: "A KID WITH A ROPE", kind: "people", weight: 5, requires: { minMile: 500, daytime: true },
      text: "A rope across the on-ramp, tied to a fence post at one end and held by a boy of about twelve at the other. He says it's a dollar. He says it like he expects to be laughed at.",
      choices: [
        { label: "Pay the dollar", outcomes: [
          { w: 1, text: "He drops the rope and salutes, which you suspect he practiced. Worth considerably more than a dollar.", effects: { cash: -1, time: 6, stress: -14 } }
        ] },
        { label: "Pay ten and ask about the road", outcomes: [
          { w: 1, text: "For ten dollars you get everything he knows, which is a surprising amount, because a kid with a rope watches the road all day.", effects: { cash: -10, time: 16, skill: { navigation: 1 }, stress: -10 } }
        ] },
        { label: "Drive around the rope", outcomes: [
          { w: 1, text: "It's a rope. You go around it through the weeds. He doesn't even turn to watch you go, which somehow stings.", effects: { time: 3, stress: 8 } }
        ] } ] },

    { id: "sunset_stop", title: "THE LIGHT GOES ORANGE", kind: "rest", weight: 6, requires: { minMile: 60, daytime: true },
      text: "The sun gets down to where it comes in flat through the windshield and turns the whole road the color of a struck match. There is a pull-off ahead with nothing at it.",
      choices: [
        { label: "Stop and watch it", outcomes: [
          { w: 1, text: "You sit on the hood with the engine ticking and watch the whole thing go down behind the road you have not driven yet. Nobody comes by.", effects: { time: 30, stress: -22, energy: 4 } }
        ] },
        { label: "Drive into it", outcomes: [
          { w: 1, text: "You put the visor down and squint east out of habit, even though it's behind you, and laugh at yourself about it.", effects: { stress: -6 } }
        ] } ] }
  ];
  more.forEach(e => C.events.push(e));

  // ------------------------------------------------------------ small moments
  // These never stop the car. They just go by.
  window.OME_VIGNETTES = {
    any: [
      "A hawk lifts off a fence post and keeps pace with you for a hundred yards.",
      "Mile marker, bent flat, with a bicycle chained to it.",
      "Somebody has planted flowers in the median. Actual flowers, in rows.",
      "A hand-painted sign: FOOD 14 MI. Under it, in newer paint: PROBABLY.",
      "Three crosses on the shoulder, freshly whitewashed.",
      "The road crew's paint truck, parked and rusted, one perfect stripe behind it.",
      "A shoe on the centerline. You spend a mile wondering about the other one.",
      "Tumbleweed the size of a chair goes across both lanes ahead of you.",
      "A pickup passes the other way and the driver lifts two fingers off the wheel.",
      "The radio finds a station for four seconds and loses it again.",
      "A billboard for a lawyer, faded to a pair of eyes and a phone number.",
      "Somebody's laundry line strung between two highway signs.",
      "A line of ants across the pavement at a rest stop, working away like nothing happened.",
      "The wind shoves the car half a lane and lets go.",
      "A dog on a porch a quarter mile off lifts its head and puts it back down."
    ],
    desert: [
      "Heat lifts off the asphalt ahead and makes a lake that stays exactly as far away as it was.",
      "A saguaro with a hole in it, and a bird going in and out of the hole.",
      "Bones on the shoulder, picked white and tidy.",
      "A dust devil walks across the flats on the right, taking its time."
    ],
    mesa: [
      "The rock goes red where the light hits it and stays purple where it doesn't.",
      "A water tank on a hill, painted with a school year from before.",
      "Rusted rail cars on a siding, doors open, nothing inside."
    ],
    plains: [
      "You can see the weather coming from forty miles away out here.",
      "Grain elevators stand up out of nothing like a skyline, then sink back down.",
      "A windmill turning at a speed that suggests nobody has oiled it in years.",
      "The road runs dead straight to the horizon and stays there for an hour."
    ],
    farm: [
      "Corn on both sides, taller than the car, moving all at once.",
      "A tractor working a field at dusk with its lights on.",
      "A barn quilt on a hay loft, colors still good.",
      "The smell of cut hay comes in the vents and stays for a mile."
    ],
    rust: [
      "A mill with three smokestacks, and one of them is smoking.",
      "Row houses backed up to the highway, satellite dishes, one flag.",
      "A river the color of weak coffee, going the other way.",
      "Somebody's high school football field, mowed, lines painted, empty."
    ],
    hills: [
      "The road goes into the trees and the temperature drops four degrees.",
      "Fog sits in the valley below you like something poured in.",
      "A tunnel, tiled, lit every third light, and the sound changes.",
      "A creek runs alongside the road for a while and then goes under it."
    ],
    northeast: [
      "Stone walls in the woods, running straight through where the trees are now.",
      "A white church steeple over the hill, then the hill, then the steeple again.",
      "Leaves come off in a sheet when a truck goes by the other way.",
      "A sign for a town founded in 1641, and somebody has kept the paint up."
    ],
    night: [
      "A radio tower blinks red, far out, and then another one behind it, out of step.",
      "Your headlights find eyes in the ditch and lose them.",
      "The only other light for ten miles is a porch bulb a long way off the road.",
      "Something crosses the road far ahead, too big for a dog, and is gone before it registers."
    ]
  };
})();
