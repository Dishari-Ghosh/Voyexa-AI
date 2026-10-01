// Builds the Google Maps URLs for a place.
//
// The place's own Latitude/Longitude (from the dataset) are used, so every
// card and popup points at ITS place. If a place ever has no valid
// coordinates, we fall back to searching by "name, city, state" - which is
// still that place, never a shared default location.

function hasCoords(place) {
  const lat = Number(place?.Latitude);
  const lng = Number(place?.Longitude);
  return (
    place?.Latitude !== null &&
    place?.Latitude !== undefined &&
    place?.Longitude !== null &&
    place?.Longitude !== undefined &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function queryFor(place) {
  if (hasCoords(place)) return `${Number(place.Latitude)},${Number(place.Longitude)}`;
  return encodeURIComponent(
    [place?.Place_Name, place?.City, place?.State].filter(Boolean).join(", ")
  );
}

/** URL for the small embedded map (iframe src). */
export function placeMapEmbedUrl(place, zoom = 12) {
  return `https://www.google.com/maps?q=${queryFor(place)}&z=${zoom}&output=embed`;
}

/** URL that opens the place in the full Google Maps site/app. */
export function placeMapLinkUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${queryFor(place)}`;
}
