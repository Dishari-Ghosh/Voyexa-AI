// Applies the admin's place changes (edits / removals / new places) to the
// bundled places.json BEFORE the site renders, so every page - Explore,
// Home, Planning, place details - shows the current catalogue without any
// of those pages needing to change.
//
// It changes the same array that `import places from "./places.json"`
// gives every page, in place. If the backend is slow or unreachable we wait
// only a few seconds, then carry on with the bundled data (the site never
// gets stuck on this).
import places from "./places.json";
import { BASE_URL } from "../api/client.js";

const TIMEOUT_MS = 3500;

export async function applyPlaceOverlay() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/catalog/overlay`, { signal: controller.signal });
    if (!res.ok) return;
    const { deleted = [], edits = {}, custom = [] } = await res.json();
    if (!deleted.length && !Object.keys(edits).length && !custom.length) return;

    const removed = new Set(deleted);
    const merged = places
      .filter((p) => !removed.has(p.place_id))
      .map((p) => (edits[p.place_id] ? { ...p, ...edits[p.place_id] } : p));
    merged.push(...custom);

    places.splice(0, places.length, ...merged);
  } catch {
    // offline / backend asleep / older backend without this route: use bundled data
  } finally {
    clearTimeout(timer);
  }
}
