// Real, MongoDB-backed log of chatbot questions the backend couldn't
// confidently answer (GET/DELETE /chatbot/unanswered), replacing the old
// localStorage-only version. Logging now happens server-side, inside
// POST /chatbot (see backend/app/routers/chatbot.py) every time the
// chatbot service can't find a FAQ or dataset match - there's nothing
// left for the frontend to log itself.
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

function toEntry(doc, i) {
  return {
    id: `${doc.created_at}-${i}`,
    question: doc.message,
    createdAt: doc.created_at,
  };
}

export async function refreshUnansweredQuestions() {
  const docs = await apiFetch("/chatbot/unanswered");
  write((docs || []).map(toEntry));
  return cache;
}

export function getUnansweredQuestions() {
  return cache;
}

export async function clearUnansweredQuestions() {
  write([]);
  await apiFetch("/chatbot/unanswered", { method: "DELETE" });
}

export function useUnansweredQuestions() {
  const questions = useSyncExternalStore(subscribe, () => cache);
  return { questions, clear: clearUnansweredQuestions, refresh: refreshUnansweredQuestions };
}
