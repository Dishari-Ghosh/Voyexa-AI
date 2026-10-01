// Real, per-user wishlist backed by MongoDB via /me/wishlist, replacing
// the old localStorage-only version. Same useSyncExternalStore shape as
// before so every component that calls useWishlist() keeps working
// unchanged - toggle/remove still update instantly (optimistic), they
// just also sync to the backend now instead of only writing to
// localStorage.
import { useSyncExternalStore } from "react";
import { apiFetch, getToken } from "./client.js";

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

// Called by AuthContext right after login/signup/session-restore.
export async function refreshWishlist() {
  if (!getToken()) return;
  try {
    const ids = await apiFetch("/me/wishlist");
    write(Array.isArray(ids) ? ids : []);
  } catch {
    // not logged in yet, or backend unreachable - leave cache as-is
  }
}

// Called by AuthContext on logout.
export function clearWishlistCache() {
  write([]);
}

export function getWishlist() {
  return cache;
}

export function isWishlisted(placeId) {
  return cache.includes(placeId);
}

// Optimistic: flips the local cache immediately for instant UI feedback,
// then syncs with the backend. Reverts if the request fails.
// Returns the NEW wishlisted state (true = now in wishlist).
export function toggleWishlist(placeId) {
  const wasIn = cache.includes(placeId);
  write(wasIn ? cache.filter((id) => id !== placeId) : [...cache, placeId]);

  apiFetch(`/me/wishlist/${placeId}`, { method: "POST" }).catch(() => {
    // request failed - roll back to the pre-toggle state
    write(wasIn ? [...cache, placeId] : cache.filter((id) => id !== placeId));
  });

  return !wasIn;
}

export function removeFromWishlist(placeId) {
  if (!cache.includes(placeId)) return;
  write(cache.filter((id) => id !== placeId));
  apiFetch(`/me/wishlist/${placeId}`, { method: "POST" }).catch(() => {
    // failed - it's still wishlisted server-side, so put it back
    write([...cache, placeId]);
  });
}

export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, () => cache);
  return {
    ids,
    has: (placeId) => ids.includes(placeId),
    toggle: toggleWishlist,
    remove: removeFromWishlist,
  };
}
