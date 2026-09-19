/* One More Exit — game CONTENT.
   Everything here is data, not logic: routes, vehicles, careers, items and events.
   It is shaped like the Supabase tables it will eventually live in, so moving it
   into the database later means changing where it loads from, not how it works. */
window.OME_CONTENT = (() => {
  // ---------------------------------------------------------------- route
  // Phoenix -> Flagstaff on I-17. Nodes are stops; the gaps between them are segments.
  const route = {
    id: "i17-phx-flg",
    name: "Phoenix → Flagstaff",
    region: "southwest",
    nodes: [
      { id: "phoenix", name: "Phoenix", mile: 0, elevation: 1086, kind: "city",
        services: ["fuel", "food", "shop", "repair", "rest"] },
      { id: "anthem", name: "Anthem", mile: 30, elevation: 1900, kind: "exit",
        services: ["fuel", "food"] },
      { id: "blackcanyon", name: "Black Canyon City", mile: 45, elevation: 2050, kind: "exit",
        services: ["fuel", "food", "repair"], blurb: "Last cheap gas before the climb." },
      { id: "sunsetpoint", name: "Sunset Point Rest Area", mile: 64, elevation: 3200, kind: "rest",
        services: ["rest", "view"], blurb: "Free bathrooms and an enormous view." },
      { id: "cordes", name: "Cordes Junction", mile: 78, elevation: 3800, kind: "exit",
        services: ["fuel", "food"], blurb: "Truckers, a diner, and a lot of wind." },
      { id: "campverde", name: "Camp Verde", mile: 94, elevation: 3150, kind: "town",
        services: ["fuel", "food", "shop", "repair", "rest"] },
      { id: "stoneman", name: "Stoneman Lake Road", mile: 116, elevation: 6200, kind: "exit",
        services: [], blurb: "A road sign, a cattle guard, and nothing else." },
      { id: "munds", name: "Munds Park", mile: 131, elevation: 6900, kind: "exit",
        services: ["fuel", "food", "rest"] },
      { id: "flagstaff", name: "Flagstaff", mile: 146, elevation: 6910, kind: "city",
        services: ["fuel", "food", "shop", "repair", "rest"], destination: true }
    ]
  };

  // ---------------------------------------------------------------- vehicles
  const vehicles = [
    {
      id: "ranger", name: "2004 Ford Ranger", tag: "Pickup",
      tankGal: 16.5, mpg: 21, reliability: 0.82, cargo: 14, seats: 3, comfort: 0.5, offroad: 0.7,
      blurb: "Hand-me-down. Smells faintly of hay. Starts every time so far."
    },
    {
      id: "civic", name: "2009 Honda Civic", tag: "Compact",
      tankGal: 13.2, mpg: 32, reliability: 0.9, cargo: 8, seats: 4, comfort: 0.55, offroad: 0.2,
      blurb: "Cheap on gas. One hubcap has been missing since 2016."
    },
    {
      id: "voyager", name: "1998 Plymouth Voyager", tag: "Minivan",
      tankGal: 20, mpg: 19, reliability: 0.68, cargo: 20, seats: 7, comfort: 0.7, offroad: 0.25,
      blurb: "Enormous inside. The check-engine light is a permanent resident."
    }
  ];

  // ---------------------------------------------------------------- careers
  const careers = [
    { id: "mechanic", name: "Mechanic", cash: 320, skills: { mechanical: 3 },
      perk: "Repairs cost 25% less and roadside fixes are possible." },
    { id: "nurse", name: "Nurse", cash: 420, skills: { firstAid: 3 },
      perk: "Health problems hurt less and heal faster." },
    { id: "teacher", name: "Teacher", cash: 300, skills: { social: 2, cooking: 1 },
      perk: "Stress resistance, but only because it is summer." },
    { id: "trucker", name: "Truck Driver", cash: 380, skills: { navigation: 3 },
      perk: "You know which exits are lying to you." },
    { id: "it", name: "IT Worker", cash: 500, skills: { social: 1, navigation: 1 },
      perk: "Better starting cash. Worse posture." },
    { id: "retired", name: "Retired", cash: 640, skills: { outdoors: 2, cooking: 2 },
      perk: "Money and patience. Energy runs out sooner." }
  ];

  // ---------------------------------------------------------------- items
  const items = [
    { id: "spare", name: "Spare tire", price: 95, bulk: 3, use: "Turns a flat into an inconvenience." },
    { id: "jack", name: "Jack & lug wrench", price: 40, bulk: 2, use: "Required to actually use that spare." },
    { id: "tools", name: "Tool kit", price: 60, bulk: 2, use: "Roadside repairs, with enough skill." },
    { id: "jumper", name: "Jumper cables", price: 25, bulk: 1, use: "For you, or for a stranger." },
    { id: "oil", name: "Quart of motor oil", price: 9, bulk: 1, use: "Engines appreciate it." },
    { id: "coolant", name: "Jug of coolant", price: 14, bulk: 1, use: "Mandatory on a long climb in July." },
    { id: "firstaid", name: "First-aid kit", price: 30, bulk: 1, use: "Bandages, aspirin, optimism." },
    { id: "water", name: "Case of water", price: 7, bulk: 2, use: "Arizona is not a suggestion." },
    { id: "snacks", name: "Box of snacks", price: 12, bulk: 1, use: "Food that will not betray you." },
    { id: "jerky", name: "Questionable beef jerky", price: 4, bulk: 1, use: "The date is smudged." },
    { id: "charger", name: "Phone charger", price: 15, bulk: 1, use: "Keeps the map alive." },
    { id: "blanket", name: "Blanket", price: 18, bulk: 1, use: "Sleeping in the car is a lifestyle." },
    { id: "flashlight", name: "Flashlight", price: 12, bulk: 1, use: "For looking at the engine uselessly at night." },
    { id: "tape", name: "Duct tape", price: 6, bulk: 1, use: "Holds a bumper, a hose, or a plan together." },
    { id: "mug", name: "Giant souvenir mug", price: 11, bulk: 2, use: "64 ounces. No practical purpose." }
  ];

  /* ---------------------------------------------------------------- events
     Each event mirrors the planned events table:
       id, title, text, weight, rarity, cooldown, requires, choices[]
     A choice has: label, requires, outcomes[] (weighted), each with text + effects.
     Effects are plain numbers applied to the trip; items add/remove; flags stick to
     the account; anomaly nudges the hidden story variable. */
  const events = [
    {
      id: "check_engine", title: "CHECK ENGINE", weight: 10, cooldown: 999,
      requires: { minMile: 12 },
      text: "The check-engine light comes on with the quiet confidence of something that has been thinking about it for a while.",
      choices: [
        { label: "Pull over and look at the engine", outcomes: [
          { w: 2, text: "You open the hood and stare. The engine stares back. Nothing is visibly on fire, which you decide counts as good news.", effects: { time: 12, stress: -2 } },
          { w: 1, text: "A vacuum hose has popped off. You push it back on with your thumb and feel like a genius.", effects: { time: 15, vehicle: 6, stress: -4, skill: { mechanical: 1 } } }
        ] },
        { label: "Find a repair shop", requires: { service: "repair" }, outcomes: [
          { w: 1, text: "They read the code, clear it, and charge you for the privilege.", effects: { cash: -45, time: 50, vehicle: 4, stress: -6 } }
        ] },
        { label: "Keep driving and monitor it", outcomes: [
          { w: 3, text: "Nothing changes. The light stays on. You get used to it faster than you expected.", effects: { stress: 3, flag: "ignored_light" } },
          { w: 1, text: "Twenty miles later the engine develops a stumble you can feel through the seat.", effects: { vehicle: -8, stress: 8, flag: "ignored_light" } }
        ] },
        { label: "Turn the radio up", outcomes: [
          { w: 1, text: "The check-engine light remains illuminated, but you feel considerably less responsible for it.", effects: { stress: -2, flag: "ignored_light", achievement: "probably_fine" } }
        ] }
      ]
    },
    {
      id: "construction", title: "CONSTRUCTION AHEAD", weight: 9,
      text: "Orange barrels, a pilot car, and a sign promising delays. There is no visible construction happening anywhere.",
      choices: [
        { label: "Wait it out", outcomes: [
          { w: 1, text: "Twenty-five minutes. A worker waves. You wave back. Neither of you means it unkindly.", effects: { time: 25, stress: 4, fuelGal: -0.2 } }
        ] },
        { label: "Take the frontage road", requires: { skillMin: { navigation: 1 } }, outcomes: [
          { w: 2, text: "You skirt the whole mess and rejoin the highway feeling smug.", effects: { time: 6, miles: 3, skill: { navigation: 1 } } },
          { w: 1, text: "The frontage road ends in gravel and a locked gate. You backtrack.", effects: { time: 22, miles: 5, vehicle: -3, stress: 6 } }
        ] }
      ]
    },
    {
      id: "gas_gouge", title: "$5.19 A GALLON", weight: 8,
      requires: { service: "fuel" },
      text: "The only gas for thirty miles, and they know it. A hand-lettered sign says NO PUBLIC RESTROOM.",
      choices: [
        { label: "Fill up anyway", outcomes: [
          { w: 1, text: "You pay it. The pump is slow, as though savoring this.", effects: { fillRate: 5.19, time: 12, stress: 5 } }
        ] },
        { label: "Put in just enough to reach the next town", outcomes: [
          { w: 1, text: "Ten dollars of dignity.", effects: { cash: -10, fuelGal: 1.9, time: 8 } }
        ] },
        { label: "Drive on and hope", outcomes: [
          { w: 1, text: "You leave. The needle continues its slow migration toward E.", effects: { stress: 6, flag: "gambled_fuel" } }
        ] }
      ]
    },
    {
      id: "dust_storm", title: "DUST STORM AHEAD", weight: 6,
      requires: { maxMile: 80, daytime: true },
      text: "A brown wall is crossing the interstate about a mile ahead. The sign on the shoulder says PULL ASIDE — STAY ALIVE.",
      choices: [
        { label: "Pull completely off, lights off, foot off the brake", outcomes: [
          { w: 1, text: "You do it exactly the way the sign says. Twelve minutes of sandpaper on the windshield, then daylight.", effects: { time: 14, stress: 6, skill: { navigation: 1 } } }
        ] },
        { label: "Slow down and keep going", outcomes: [
          { w: 2, text: "Visibility drops to a hood length. You come out the far side with your hands aching from the wheel.", effects: { time: 8, stress: 16, vehicle: -4, health: -2 } },
          { w: 1, text: "You emerge fine, but the paint has been very lightly sandblasted.", effects: { time: 6, stress: 10, vehicle: -7 } }
        ] }
      ]
    },
    {
      id: "overheat", title: "TEMPERATURE CLIMBING", weight: 7,
      requires: { minMile: 60, grade: "climb" },
      text: "The temperature needle is drifting past the middle for the first time all day. The grade ahead is six miles of uphill.",
      choices: [
        { label: "Turn the heater on full blast", outcomes: [
          { w: 1, text: "The oldest trick there is. It pulls heat off the engine and into your face. You crest the hill sweating and victorious.", effects: { time: 6, health: -2, stress: 4, skill: { mechanical: 1 } } }
        ] },
        { label: "Pull over and let it cool", outcomes: [
          { w: 1, text: "Twenty minutes in the shade of a rock. You add coolant if you have it.", effects: { time: 22, vehicle: 4, useItem: "coolant" } }
        ] },
        { label: "Push through", outcomes: [
          { w: 2, text: "You make it. Barely. Something under the hood ticks for a while after you shut it off.", effects: { vehicle: -12, stress: 10 } },
          { w: 1, text: "Steam. Actual steam. You coast onto the shoulder and wait a long time.", effects: { vehicle: -18, time: 45, stress: 18, health: -3 } }
        ] }
      ]
    },
    {
      id: "flat_tire", title: "THAT'S NOT A GOOD SOUND", weight: 6,
      requires: { minMile: 25 },
      text: "A rhythmic thumping starts, then gets faster, then gets embarrassing. Right rear is flat.",
      choices: [
        { label: "Change it yourself", requires: { items: ["spare", "jack"] }, outcomes: [
          { w: 1, text: "Twenty-five minutes and one skinned knuckle later, you are rolling on the little spare.", effects: { time: 28, health: -2, vehicle: -5, removeItem: "spare", skill: { mechanical: 2 }, achievement: "tire_hero" } }
        ] },
        { label: "Call for roadside assistance", outcomes: [
          { w: 1, text: "Ninety minutes of waiting, then a very cheerful man fixes it in nine.", effects: { time: 95, cash: -120, stress: 12 } }
        ] },
        { label: "Limp to the next exit on the flat", outcomes: [
          { w: 1, text: "You make it. The tire does not. The rim is now a topic of conversation.", effects: { time: 18, vehicle: -14, cash: -180, stress: 15 } }
        ] }
      ]
    },
    {
      id: "gas_station_sushi", title: "GAS STATION SUSHI", weight: 5,
      requires: { service: "food" },
      text: "Beside the roller hot dogs, under a light that has been humming since 2009, is a plastic tray of sushi.",
      choices: [
        { label: "Obviously not", outcomes: [
          { w: 1, text: "You buy a banana instead and feel like an adult.", effects: { cash: -2, food: 1, stress: -2 } }
        ] },
        { label: "Obviously yes", outcomes: [
          { w: 2, text: "It is fine. It is honestly fine. You are almost disappointed.", effects: { cash: -8, food: 2, achievement: "never_again" } },
          { w: 3, text: "It is not fine. The next forty miles are a negotiation between you and your own body.", effects: { cash: -8, health: -12, stress: 14, achievement: "never_again" } }
        ] }
      ]
    },
    {
      id: "speed_trap", title: "A CAR IN THE MEDIAN", weight: 6,
      requires: { minMile: 20 },
      text: "White SUV, nose out, tucked behind a stand of brush at the bottom of a long downhill.",
      choices: [
        { label: "Brake hard", outcomes: [
          { w: 2, text: "He doesn't move. The truck behind you is now extremely close and extremely annoyed.", effects: { stress: 8, time: 2 } }
        ] },
        { label: "Coast down naturally", outcomes: [
          { w: 3, text: "Nothing happens. You spend the next four miles checking your mirror anyway.", effects: { stress: 3 } },
          { w: 1, text: "Lights. A very polite conversation and a very impolite number.", effects: { cash: -186, time: 22, stress: 20, flag: "ticketed" } }
        ] },
        { label: "Flash your lights at oncoming traffic afterward", outcomes: [
          { w: 1, text: "A trucker flashes back. Somewhere, a small act of solidarity is recorded.", effects: { stress: -4, skill: { social: 1 } } }
        ] }
      ]
    },
    {
      id: "hitchhiker", title: "SOMEONE ON THE SHOULDER", weight: 5,
      requires: { minMile: 40, daytime: true },
      text: "A man with a gas can and a sunburn raises one hand, not quite a wave.",
      choices: [
        { label: "Give him a ride to the next exit", outcomes: [
          { w: 3, text: "His name is Dale. He talks about his brother the entire time and gives you eleven dollars for fuel.", effects: { cash: 11, time: 14, stress: -3, flag: "met_dale", skill: { social: 1 } } },
          { w: 1, text: "He is quiet the whole way. When he gets out he says, \"Careful up past Stoneman.\" You didn't mention where you were headed.", effects: { time: 14, stress: 6, anomaly: 1, flag: "met_dale" } }
        ] },
        { label: "Give him water and keep going", requires: { items: ["water"] }, outcomes: [
          { w: 1, text: "He takes two bottles, nods, and is already walking before you pull away.", effects: { time: 5, stress: -2, skill: { social: 1 } } }
        ] },
        { label: "Keep driving", outcomes: [
          { w: 1, text: "You watch him get smaller in the mirror and think about it for the next twenty miles.", effects: { stress: 7 } }
        ] }
      ]
    },
    {
      id: "elk", title: "ELK", weight: 6,
      requires: { minMile: 105, night: true },
      text: "Two eyes at the edge of the headlights, then a shape the size of a refrigerator stepping onto the asphalt.",
      choices: [
        { label: "Brake in a straight line", outcomes: [
          { w: 3, text: "You stop in time. It looks at you with total indifference and walks off into the pines.", effects: { time: 4, stress: 18, vehicle: -2 } },
          { w: 1, text: "You stop. The elk does not. A hoof puts a dent in your fender on the way past.", effects: { vehicle: -12, stress: 25, time: 10 } }
        ] },
        { label: "Swerve", outcomes: [
          { w: 2, text: "You miss the elk and catch the rumble strip. Your heart takes four miles to come down.", effects: { stress: 26, vehicle: -4, time: 3 } },
          { w: 2, text: "You miss the elk and clip a sign. The sign loses.", effects: { vehicle: -16, stress: 24, cash: -60, time: 20 } }
        ] }
      ]
    },
    {
      id: "free_coffee", title: "FREE REFILL", weight: 5,
      requires: { service: "food" },
      text: "The sign says FREE REFILL ON ANY SIZE. The largest size is the dimensions of a paint can.",
      choices: [
        { label: "Fill the paint can", outcomes: [
          { w: 1, text: "You will be awake for six hours and regret two of them.", effects: { cash: -3, energy: 22, stress: 5, health: -1 } }
        ] },
        { label: "Normal-sized human coffee", outcomes: [
          { w: 1, text: "Warm, bitter, adequate.", effects: { cash: -2, energy: 10 } }
        ] }
      ]
    },
    {
      id: "rock_chip", title: "GRAVEL TRUCK", weight: 6,
      text: "A dump truck ahead has a tarp that is more of a gesture than a cover.",
      choices: [
        { label: "Back way off", outcomes: [
          { w: 2, text: "You lose four minutes and keep your windshield.", effects: { time: 5 } }
        ] },
        { label: "Pass it", outcomes: [
          { w: 2, text: "Clean pass, no damage, small thrill.", effects: { stress: 2 } },
          { w: 2, text: "A rock cracks off the windshield like a gunshot. A star-shaped chip, right at eye level, forever.", effects: { vehicle: -5, stress: 12, flag: "windshield_chip" } }
        ] }
      ]
    },
    {
      id: "lost", title: "THIS DOESN'T LOOK RIGHT", weight: 4,
      requires: { minMile: 30 },
      text: "You took an exit for fuel and now you are on a road with no stripe, going a direction you did not choose.",
      choices: [
        { label: "Double back", outcomes: [
          { w: 1, text: "Eight miles of embarrassment, then the interstate again.", effects: { miles: 8, time: 18, fuelGal: -0.4, stress: 8, achievement: "shortcut" } }
        ] },
        { label: "Keep going, it probably loops around", outcomes: [
          { w: 2, text: "It does loop around, eventually, past a house with eleven mailboxes.", effects: { miles: 12, time: 26, fuelGal: -0.6, stress: 5, skill: { navigation: 1 }, achievement: "shortcut" } },
          { w: 1, text: "It does not loop around. It ends at a cattle gate. A cow watches you turn around.", effects: { miles: 16, time: 34, vehicle: -4, stress: 14, achievement: "shortcut" } }
        ] }
      ]
    },
    {
      id: "attraction_fork", title: "WORLD'S LARGEST FORK", weight: 5,
      requires: { daytime: true, minMile: 35 },
      text: "A billboard advertises it for eleven miles. The exit is right here. It is, allegedly, thirty-one feet tall.",
      choices: [
        { label: "Stop and look at the fork", outcomes: [
          { w: 1, text: "It is nineteen feet tall at most. You take a photo anyway. It is, undeniably, a very large fork.", effects: { time: 22, stress: -10, souvenir: "Photo of a medium-large fork", achievement: "tourist" } }
        ] },
        { label: "Buy the gift shop mug", outcomes: [
          { w: 1, text: "Sixty-four ounces of commemorative ceramic. It will live in a cupboard for a decade.", effects: { time: 26, cash: -11, stress: -12, addItem: "mug", souvenir: "Giant fork mug", achievement: "tourist" } }
        ] },
        { label: "Drive past", outcomes: [
          { w: 1, text: "You drive past. You will think about the fork again in four years.", effects: { stress: 2 } }
        ] }
      ]
    },
    {
      id: "vending", title: "ROW E", weight: 4,
      requires: { service: "food" },
      text: "The chips are stuck. They are clearly stuck. They have committed to being stuck.",
      choices: [
        { label: "Buy a second bag to knock the first one down", outcomes: [
          { w: 2, text: "Both bags fall. You have doubled your investment and your sodium.", effects: { cash: -3, food: 2, stress: -4 } },
          { w: 1, text: "The second bag also hangs there. You now own two bags of chips located inside a machine.", effects: { cash: -3, stress: 10 } }
        ] },
        { label: "The shake", outcomes: [
          { w: 1, text: "A stranger watches you shake a vending machine. The chips fall. Eye contact is not made.", effects: { food: 1, stress: -2, energy: -2 } }
        ] },
        { label: "Walk away", outcomes: [
          { w: 1, text: "You walk away. This is the mature option and it tastes like nothing.", effects: { stress: 3 } }
        ] }
      ]
    },
    {
      id: "battery", title: "CLICK. CLICK. CLICK.", weight: 5,
      requires: { stopped: true, minMile: 40 },
      text: "You turn the key and the truck makes the specific sound of a battery that has decided this is where it lives now.",
      choices: [
        { label: "Ask someone for a jump", requires: { items: ["jumper"] }, outcomes: [
          { w: 1, text: "A woman in a Tacoma has you running in four minutes and refuses money.", effects: { time: 14, vehicle: 2, stress: -4, skill: { social: 1 } } }
        ] },
        { label: "Ask around without cables", outcomes: [
          { w: 2, text: "A trucker has cables and a lecture about terminal corrosion. Both help.", effects: { time: 26, stress: 6, skill: { mechanical: 1 } } },
          { w: 1, text: "Nobody has cables. You buy a set at an alarming markup.", effects: { time: 35, cash: -48, addItem: "jumper", stress: 12 } }
        ] },
        { label: "Push start it", requires: { skillMin: { mechanical: 2 } }, outcomes: [
          { w: 1, text: "You and two strangers push. It catches on the second try. Everyone cheers.", effects: { time: 12, energy: -8, stress: -6, skill: { mechanical: 1 } } }
        ] }
      ]
    },
    {
      id: "phone_dying", title: "10% BATTERY", weight: 5,
      requires: { minMile: 30 },
      text: "Your phone is at ten percent and your map is the only thing on it that matters.",
      choices: [
        { label: "Plug it in", requires: { items: ["charger"] }, outcomes: [
          { w: 1, text: "Crisis resolved by forethought. Rare and satisfying.", effects: { stress: -4 } }
        ] },
        { label: "Turn everything off and ration it", outcomes: [
          { w: 1, text: "Airplane mode, screen dim, map memorized at every exit. It works, mostly.", effects: { stress: 8, skill: { navigation: 1 } } }
        ] },
        { label: "Use it normally and accept fate", outcomes: [
          { w: 1, text: "It dies outside Cordes Junction. You drive by signs, like an ancient person.", effects: { stress: 14, flag: "phone_dead" } }
        ] }
      ]
    },
    {
      id: "ten_mil", title: "THE 10MM", weight: 4,
      requires: { items: ["tools"] },
      text: "You open the tool kit for something unrelated and notice the 10mm socket is missing. You have never lost one before. You have lost eleven before.",
      choices: [
        { label: "Search the truck", outcomes: [
          { w: 2, text: "It is not in the truck. It has left this plane of existence.", effects: { time: 8, stress: 6, achievement: "ten_mil" } },
          { w: 1, text: "It is under the seat, with a french fry from a previous administration.", effects: { time: 10, stress: -4, achievement: "found_it" } }
        ] },
        { label: "Accept it", outcomes: [
          { w: 1, text: "You accept it. Somewhere, a 10mm socket is having a wonderful time without you.", effects: { stress: 2, achievement: "ten_mil" } }
        ] }
      ]
    },
    {
      id: "scenic", title: "SCENIC VIEWPOINT", weight: 5,
      requires: { minMile: 55, daytime: true },
      text: "The pullout looks over about ninety miles of country you just drove through.",
      choices: [
        { label: "Stop for ten minutes", outcomes: [
          { w: 1, text: "You stand at the rail and do not check your phone once.", effects: { time: 12, stress: -14, energy: 5, souvenir: "Sunset Point, 3,200 ft" } }
        ] },
        { label: "Keep the momentum", outcomes: [
          { w: 1, text: "Miles are miles.", effects: { stress: 2 } }
        ] }
      ]
    },
    {
      id: "semi_merge", title: "MERGING SEMI", weight: 6,
      text: "A loaded semi is coming up the on-ramp at a speed that suggests optimism.",
      choices: [
        { label: "Move over", outcomes: [
          { w: 1, text: "You move left. He flashes his trailer lights in thanks. Small good moment.", effects: { stress: -3, skill: { social: 1 } } }
        ] },
        { label: "Hold your lane", outcomes: [
          { w: 2, text: "He backs off. Nobody dies. Everyone is a little tense.", effects: { stress: 7 } }
        ] }
      ]
    },
    {
      id: "nap", title: "YOUR EYES ARE DOING THAT THING", weight: 7,
      requires: { maxEnergy: 35 },
      text: "You have read the same mile marker twice and you are not sure you read it either time.",
      choices: [
        { label: "Twenty-minute rest-area nap", outcomes: [
          { w: 1, text: "You sleep hard for nineteen minutes and wake up like a new model of yourself.", effects: { time: 26, energy: 34, stress: -8, achievement: "luxury" } }
        ] },
        { label: "Caffeine and sheer will", outcomes: [
          { w: 1, text: "It works for about forty minutes.", effects: { cash: -4, energy: 14, health: -2, stress: 5 } }
        ] },
        { label: "Keep driving", outcomes: [
          { w: 2, text: "You keep driving. The lane lines start suggesting things.", effects: { energy: -8, health: -4, stress: 12, vehicle: -2 } }
        ] }
      ]
    },
    {
      id: "jerky_time", title: "THE JERKY", weight: 4,
      requires: { items: ["jerky"] },
      text: "You are hungry, and the questionable beef jerky is right there, being questionable.",
      choices: [
        { label: "Eat the jerky", outcomes: [
          { w: 2, text: "Salty, chewy, deeply satisfying. No consequences whatsoever.", effects: { food: 2, removeItem: "jerky", stress: -5 } },
          { w: 1, text: "Consequences. Immediate and thorough consequences.", effects: { health: -10, stress: 12, removeItem: "jerky" } }
        ] },
        { label: "Not yet", outcomes: [
          { w: 1, text: "You put it back in the bag. It waits.", effects: {} }
        ] }
      ]
    },
    {
      id: "hot_shoes", title: "BRAKE SMELL", weight: 5,
      requires: { minMile: 100, grade: "descend" },
      text: "Coming down out of the curves there is a hot metallic smell and the pedal feels softer than it did this morning.",
      choices: [
        { label: "Downshift and let them cool", outcomes: [
          { w: 1, text: "Engine braking, slower speed, and the smell fades. Your father would be proud.", effects: { time: 10, skill: { mechanical: 1 }, stress: -2 } }
        ] },
        { label: "Ride them the rest of the way down", outcomes: [
          { w: 2, text: "You get to the bottom. The brakes are now a maintenance item rather than a feature.", effects: { vehicle: -12, stress: 12 } }
        ] }
      ]
    },
    {
      id: "snow_flurry", title: "FLURRIES AT 6,000 FEET", weight: 5,
      requires: { minMile: 110, season: "winter" },
      text: "It was 74 degrees in Phoenix. Here, small determined snowflakes are crossing your headlights sideways.",
      choices: [
        { label: "Slow way down", outcomes: [
          { w: 1, text: "Forty miles an hour, hazards on, both hands. It takes longer and you arrive alive.", effects: { time: 22, stress: 10, energy: -6 } }
        ] },
        { label: "Normal speed, it's barely sticking", outcomes: [
          { w: 2, text: "It is barely sticking. You are fine.", effects: { stress: 6 } },
          { w: 1, text: "It is sticking more than advertised. A slow, sideways moment near the guardrail rearranges your priorities.", effects: { vehicle: -10, stress: 30, health: -3, time: 15 } }
        ] }
      ]
    },

    /* ------- quiet groundwork: these only become eligible as anomaly rises ------- */
    {
      id: "radio_static", title: "THE RADIO", weight: 3, rarity: "uncommon",
      requires: { minAnomaly: 0, minMile: 70 },
      text: "The station you have been listening to drops into static, and under the static there is a man calmly reading exit numbers. Yours is one of them. He reads it twice.",
      choices: [
        { label: "Change the station", outcomes: [
          { w: 1, text: "Country music. Normal. Loud. Fine.", effects: { stress: 6, anomaly: 1 } }
        ] },
        { label: "Listen", outcomes: [
          { w: 1, text: "He reaches 414 and stops. There is no Exit 414 on this highway. The station comes back mid-song.", effects: { stress: 12, anomaly: 2, flag: "heard_414" } }
        ] }
      ]
    },
    {
      id: "billboard_twice", title: "HAVEN'T YOU SEEN THAT?", weight: 3, rarity: "uncommon",
      requires: { minAnomaly: 2, minMile: 50 },
      text: "A billboard for a steakhouse with a cartoon cow. You are fairly sure you passed this exact billboard eleven miles ago, including the bird sitting on it.",
      choices: [
        { label: "Check the mile markers", outcomes: [
          { w: 1, text: "The markers are climbing normally. Everything is in order except that you know what you saw.", effects: { stress: 8, anomaly: 1 } }
        ] },
        { label: "Take a photo of it", outcomes: [
          { w: 1, text: "You take a photo. Later, the photo shows the billboard, the sky, and no bird.", effects: { stress: 10, anomaly: 2, souvenir: "Photo of a billboard" } }
        ] }
      ]
    },
    {
      id: "back_again", title: "BACK AGAIN?", weight: 2, rarity: "rare",
      requires: { minAnomaly: 4, service: "fuel" },
      text: "The attendant rings up your gas, looks at you for slightly too long, and says, \"Back again? You made better time last go-round.\"\n\nYou have never been here before.",
      choices: [
        { label: "\"You must be thinking of someone else.\"", outcomes: [
          { w: 1, text: "He agrees pleasantly and goes back to his crossword. As you leave he says, without looking up, \"Drive safe, now. Watch for 414.\"", effects: { stress: 14, anomaly: 3, flag: "heard_414" } }
        ] },
        { label: "\"How much better?\"", outcomes: [
          { w: 1, text: "He checks a notebook under the counter, runs a finger down a column, and reads your name.", effects: { stress: 20, anomaly: 4, flag: "the_notebook" } }
        ] }
      ]
    }
  ];

  // ---------------------------------------------------------------- achievements
  const achievements = [
    { id: "arrived", name: "Are We There Yet?", desc: "Complete your first trip." },
    { id: "probably_fine", name: "Probably Fine", desc: "Turn the radio up instead of dealing with the check-engine light." },
    { id: "shortcut", name: "I Know A Shortcut", desc: "Become lost." },
    { id: "luxury", name: "Luxury Accommodations", desc: "Sleep in your vehicle." },
    { id: "never_again", name: "Never Again", desc: "Eat gas-station sushi." },
    { id: "ten_mil", name: "Ten Millimeter", desc: "Lose a 10mm socket." },
    { id: "found_it", name: "Found It", desc: "Recover one." },
    { id: "tourist", name: "Roadside Americana", desc: "Stop at an attraction." },
    { id: "tire_hero", name: "Jack Of One Trade", desc: "Change your own tire on the shoulder." },
    { id: "thrifty", name: "Ran On Fumes", desc: "Arrive with less than a gallon in the tank." },
    { id: "loaded", name: "Overpacked", desc: "Leave town with a full cargo area." }
  ];

  return { route, vehicles, careers, items, events, achievements };
})();
