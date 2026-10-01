// Maps each Zone to an accent color + each Terrain_Type to a small glyph.
// Used to make cards carry real information (zone, terrain) rather than
// decorate them uniformly.

export const ZONE_COLORS = {
  North: "#F2A93C",
  South: "#35C9B0",
  East: "#E8846B",
  West: "#7EA6F2",
  Central: "#C792EA",
  Northeast: "#6FD98C",
};

export function zoneColor(zone) {
  return ZONE_COLORS[zone] || "#8B93A7";
}

export const TERRAIN_GLYPH = {
  Mountain: "▲",
  Valley: "◡",
  Coastal: "≈",
  Desert: "◢",
  Forest: "♣",
  Urban: "▦",
  Island: "○",
};

export function terrainGlyph(terrain) {
  return TERRAIN_GLYPH[terrain] || "•";
}
