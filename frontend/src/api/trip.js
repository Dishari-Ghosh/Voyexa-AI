// The "current trip" — the places the user has chosen to actually visit on
// THIS journey, plus the planning-form answers (days, budget, group...).
//
// Think of it like a shopping cart, while the wishlist (wishlist.js) is the
// "saved for later" list: people wishlist lots of places but only put a few
// into the trip, and they can take places out of the trip again.
//
// Reactive + localStorage-backed, same swap-for-an-API-later idea as
// wishlist.js. Every component that calls useTrip() updates together, which
// is what keeps the "N places in your trip" bar in sync with the cards.
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "voyexa_current_trip";
const listeners = new Set();

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && Array.isArray(parsed.placeIds)) {
      return { placeIds: parsed.placeIds, form: parsed.form || null };
    }
  } catch {
    /* fall through */
  }
  return { placeIds: [], form: null };
}

let cache = read();

function write(next) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* keep the in-memory copy */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cache = read();
      listeners.forEach((l) => l());
    }
  });
}

export function getTrip() {
  return cache;
}

export function isInTrip(placeId) {
  return cache.placeIds.includes(placeId);
}

export function addToTrip(placeId) {
  if (cache.placeIds.includes(placeId)) return;
  write({ ...cache, placeIds: [...cache.placeIds, placeId] });
}

export function removeFromTrip(placeId) {
  write({ ...cache, placeIds: cache.placeIds.filter((id) => id !== placeId) });
}

// returns the NEW in-trip state (true = now in the trip)
export function toggleTrip(placeId) {
  if (cache.placeIds.includes(placeId)) {
    removeFromTrip(placeId);
    return false;
  }
  addToTrip(placeId);
  return true;
}

// Stores the planning-form answers (numDays, budget, ...) without touching
// the chosen places.
export function setTripForm(form) {
  write({ ...cache, form });
}

export function clearTrip() {
  write({ placeIds: [], form: cache.form });
}

export function useTrip() {
  const trip = useSyncExternalStore(subscribe, () => cache);
  return {
    placeIds: trip.placeIds,
    form: trip.form,
    count: trip.placeIds.length,
    has: (placeId) => trip.placeIds.includes(placeId),
    add: addToTrip,
    remove: removeFromTrip,
    toggle: toggleTrip,
    clear: clearTrip,
    setForm: setTripForm,
  };
}
