// Central place every api/*.js file talks to the real FastAPI backend
// through. This is the file that used to be "the swap point" mentioned
// in all the mock comments across this codebase - it's now a real fetch
// wrapper instead of localStorage.
//
// Set VITE_API_URL in frontend/.env if your backend isn't on the default
// http://localhost:8000 (see .env.example).

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const TOKEN_KEY = "voyexa_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// Turns FastAPI's error shapes (a plain string, or a Pydantic
// [{loc, msg, type}, ...] validation array) into one readable line.
function extractMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
  }
  return fallback;
}

/**
 * Calls `${VITE_API_URL}${path}`. Attaches the stored JWT as a Bearer
 * token unless `auth: false` is passed. Throws ApiError on any non-2xx
 * response or network failure, with a message safe to show the user.
 */
export async function apiFetch(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Couldn't reach the Voyexa server. Make sure the backend is running (uvicorn app.main:app --reload) and VITE_API_URL is correct.",
      0,
      err
    );
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(data, `Request failed (${res.status})`), res.status, data);
  }

  return data;
}

export { BASE_URL };
