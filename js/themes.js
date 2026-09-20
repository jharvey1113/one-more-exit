/* One More Exit — environment themes.

   The country changes as you cross it. Each theme describes what the land
   looks like at a stretch of road: the shape of the terrain, the colours the
   light lands on, what grows by the shoulder, and which artwork to use when
   artwork exists. Themes overlap at their edges and cross-fade, so New Mexico
   becomes Texas over twenty miles instead of between two frames.

   Adding a theme is adding an entry here. Nothing else needs to know. */
window.OME_THEMES = (() => {

  // terrain: the archetype the procedural painter uses until art is dropped in
  //   mountains | mesas | plains | forest | farm | hills | city | coast
  // dir: the folder under assets/environments/ that finished art goes in
  const list = [
    { id: "az_desert", name: "Sonoran Desert", from: -40, to: 150, terrain: "mountains", dir: "az_desert",
      far: "#6d5a72", mid: "#9a6f52", near: "#b98a55", ground: "#c08a56", dust: "#d8a86d",
      haze: "#e6bd92", veg: ["saguaro", "scrub", "ocotillo"], density: 0.5, humid: 0.1 },

    { id: "az_pines", name: "Mogollon Rim", from: 120, to: 300, terrain: "forest", dir: "az_pines",
      far: "#4c5f6b", mid: "#3f5a4c", near: "#33503d", ground: "#6b6b4a", dust: "#8d8a63",
      haze: "#b9c6bd", veg: ["pine", "pine", "stump", "scrub"], density: 0.95, humid: 0.4 },

    { id: "nm_high", name: "High Desert", from: 275, to: 640, terrain: "mesas", dir: "nm_high",
      far: "#7b5f63", mid: "#a2694c", near: "#b07a4e", ground: "#a8764f", dust: "#caa070",
      haze: "#dcb894", veg: ["scrub", "juniper", "saguaro"], density: 0.4, humid: 0.12 },

    { id: "tx_plains", name: "Llano Estacado", from: 610, to: 1080, terrain: "plains", dir: "tx_plains",
      far: "#8a8c86", mid: "#a89a67", near: "#b9a45f", ground: "#bfa960", dust: "#d6c284",
      haze: "#dfd6ac", veg: ["pole", "windmill", "scrub", "tank"], density: 0.35, humid: 0.25 },

    { id: "prairie", name: "The Prairie", from: 1050, to: 1420, terrain: "plains", dir: "prairie",
      far: "#7e8a83", mid: "#8f9a62", near: "#93a05c", ground: "#9aa35d", dust: "#c3c48a",
      haze: "#cdd6b4", veg: ["pole", "grain", "barn", "scrub"], density: 0.45, humid: 0.4 },

    { id: "farm", name: "Farm Country", from: 1390, to: 1820, terrain: "farm", dir: "farm",
      far: "#6f8390", mid: "#6d8455", near: "#6b8c46", ground: "#7f8c4e", dust: "#a7a869",
      haze: "#c6d2bc", veg: ["corn", "barn", "silo", "pole", "treeline"], density: 0.75, humid: 0.55 },

    { id: "rust", name: "The Rust Belt", from: 1790, to: 2120, terrain: "city", dir: "rust",
      far: "#5e6a75", mid: "#5a6159", near: "#525a4c", ground: "#5c6152", dust: "#7c7f74",
      haze: "#aab2ae", veg: ["stack", "pylon", "warehouse", "pole", "treeline"], density: 0.6, humid: 0.6 },

    { id: "appalachia", name: "The Alleghenies", from: 2090, to: 2430, terrain: "hills", dir: "appalachia",
      far: "#5a6a76", mid: "#44584b", near: "#39503c", ground: "#4c5b46", dust: "#6f7a5f",
      haze: "#b6c4c2", veg: ["pine", "hardwood", "rockcut", "guard"], density: 1, humid: 0.75 },

    { id: "northeast", name: "New England", from: 2400, to: 2820, terrain: "forest", dir: "northeast",
      far: "#54687e", mid: "#3f5548", near: "#39533f", ground: "#41543f", dust: "#6d7560",
      haze: "#bcc9cd", veg: ["hardwood", "pine", "stonewall", "steeple"], density: 0.95, humid: 0.7 }
  ];

  // Towns and cities sit on top of whatever theme the road is in.
  const urban = { id: "urban", name: "Outskirts", terrain: "city", dir: "urban",
    far: "#5f6b78", mid: "#5b6068", near: "#4f5550", ground: "#6a6a60", dust: "#8a8d88",
    haze: "#b6bec4", veg: ["billboard", "warehouse", "pole", "motel"], density: 0.8, humid: 0.5 };

  const byId = Object.fromEntries(list.concat([urban]).map(t => [t.id, t]));

  // The theme at a mile, plus the next one and how far the blend has gone.
  // Two themes overlap for the width of their shared window, so the land
  // changes the way it does out a window: gradually, and before you notice.
  function at(mile) {
    let a = list[0], b = null, t = 0;
    for (let i = 0; i < list.length; i++) {
      const th = list[i];
      if (mile >= th.from && mile <= th.to) {
        a = th;
        const next = list[i + 1];
        if (next && mile >= next.from) {
          b = next;
          t = (mile - next.from) / Math.max(1, th.to - next.from);
        }
        break;
      }
      if (mile > th.to) a = th;
    }
    return { a, b, t: Math.max(0, Math.min(1, t)) };
  }

  // Region ids from the game map onto themes, so anything that only knows the
  // region (a stop screen, an event) still gets the right look.
  const forRegion = {
    desert: "az_desert", mesa: "nm_high", plains: "tx_plains",
    farm: "farm", rust: "rust", hills: "appalachia", northeast: "northeast"
  };

  return { list, urban, byId, at, forRegion };
})();
