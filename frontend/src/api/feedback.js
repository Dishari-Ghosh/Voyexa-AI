// Real, MongoDB-backed feedback (POST/GET/DELETE /feedback), replacing
// the old localStorage-only version. Same useSyncExternalStore shape as
// before, plus a refresh() you call once (e.g. in Admin.jsx) to populate
// the cache from the backend.
import { useSyncExternalStore } from "react";
import { apiFetch } from "./client.js";

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
  return {
    id: doc.id,
    name: doc.name || "Anonymous",
    rating: doc.rating || 0,
    message: doc.message || "",
    createdAt: doc.created_at,
  };
}

export async function refreshFeedback() {
  const docs = await apiFetch("/feedback");
  write((docs || []).map(toEntry));
  return cache;
}

export function getAllFeedback() {
  return cache;
}

export async function addFeedback({ name, rating, message }) {
  const doc = await apiFetch("/feedback", {
    method: "POST",
    body: { name: name || null, rating: Number(rating) || 0, message: (message || "").trim() },
    auth: false,
  });
  const entry = toEntry(doc);
  write([entry, ...cache]);
  return entry;
}

export async function clearFeedback() {
  write([]);
  await apiFetch("/feedback", { method: "DELETE" });
}

export function useFeedback() {
  const feedback = useSyncExternalStore(subscribe, () => cache);
  return { feedback, add: addFeedback, clear: clearFeedback, refresh: refreshFeedback };
}
