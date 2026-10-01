// Real, MongoDB-backed admin place images (GET/POST/DELETE /admin/images),
// replacing the old localStorage-only version. These routes require an
// admin-role JWT (see backend/app/auth/dependencies.py::require_admin) -
// sign up with the correct admin_key (backend/.env ADMIN_SIGNUP_KEY) to
// get an admin account.
import { apiFetch } from "./client.js";

let cache = {};

export async function refreshImages() {
  cache = await apiFetch("/admin/images");
  return cache;
}

export function getAllImages() {
  return cache;
}

export function getImage(placeId) {
  return cache[placeId] || null;
}

export async function setImage(placeId, driveLink) {
  const res = await apiFetch("/admin/images", {
    method: "POST",
    body: { place_id: Number(placeId), drive_link: driveLink },
  });
  cache = { ...cache, [placeId]: res.image_url };
  return res.image_url;
}

export async function removeImage(placeId) {
  await apiFetch(`/admin/images/${placeId}`, { method: "DELETE" });
  const next = { ...cache };
  delete next[placeId];
  cache = next;
}
