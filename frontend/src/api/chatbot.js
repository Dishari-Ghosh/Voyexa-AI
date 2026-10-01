// Calls the real backend chatbot (POST /chatbot), which answers from the
// curated Excel FAQ first, then falls back to live dataset lookups
// (cost/season/difficulty/duration for a named place), and only then
// logs the question as unanswered - see backend/app/services/chatbot.py.
// This replaces the old fully-client-side chatbotEngine.js, which never
// touched the backend at all.
import { apiFetch } from "./client.js";

export async function askChatbot(message, userId) {
  return apiFetch("/chatbot", {
    method: "POST",
    body: { message, user_id: userId || null },
    auth: false,
  });
}
