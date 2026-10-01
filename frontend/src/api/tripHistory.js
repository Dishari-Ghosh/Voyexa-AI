// Real, per-user trip history backed by MongoDB via /planning/trips,
// replacing the old localStorage-only version. Kept as a small reactive
// store (like wishlist.js) so Profile.jsx can just call getTripHistory()
// after fetchTripHistory() has populated the cache once.
import { useSyncExternalStore } from "react";
import { apiFetch } from "./client.js";
import placesData from "../data/places.json";

const placeStateById = new Map(placesData.map((p) => [p.place_id, p.State]));

let cache = [];
const listeners = new Set();

function write(next) {
  cache = next;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toEntry(doc) {
  const placeIds = doc.place_ids || [];
  const states = [...new Set(placeIds.map((id) => placeStateById.get(id)).filter(Boolean))];
  return {
    id: doc.id,
    form: doc.form,
    places: placeIds,
    dayGroups: doc.day_groups,
    states,
    savedAt: doc.saved_at,
  };
}

// Call this once (e.g. in a useEffect) before reading getTripHistory().
export async function fetchTripHistory() {
  const docs = await apiFetch("/planning/trips");
  write((docs || []).map(toEntry));
  return cache;
}

export function getTripHistory() {
  return cache;
}

export async function saveTrip(trip) {
  const doc = await apiFetch("/planning/trips", {
    method: "POST",
    body: {
      form: trip.form,
      place_ids: trip.places || [],
      day_groups: trip.dayGroups || null,
    },
  });
  // the backend only returns {id}; build the display entry from what we
  // already have instead of doing a second round trip
  const entry = toEntry({
    id: doc.id,
    form: trip.form,
    place_ids: trip.places || [],
    day_groups: trip.dayGroups || null,
    saved_at: new Date().toISOString(),
  });
  write([entry, ...cache]);
  return entry;
}

export async function deleteTrip(id) {
  write(cache.filter((t) => t.id !== id));
  await apiFetch(`/planning/trips/${id}`, { method: "DELETE" });
}

export function useTripHistory() {
  const history = useSyncExternalStore(subscribe, () => cache);
  return { history, refresh: fetchTripHistory, save: saveTrip, remove: deleteTrip };
}
