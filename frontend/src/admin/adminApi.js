// Every call the admin website makes to the backend. All of these go to
// /admin/... routes that only accept an admin's login token.
import { apiFetch, getToken, BASE_URL } from "../api/client.js";

const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const getStats = () => apiFetch("/admin/stats");

export const getUsers = (params) => apiFetch(`/admin/users${qs(params)}`);

export const getFeedback = (status = "all") => apiFetch(`/admin/feedback${qs({ status })}`);
export const setFeedbackReviewed = (id, reviewed) =>
  apiFetch(`/admin/feedback/${id}`, { method: "PATCH", body: { reviewed } });
export const deleteFeedback = (id) => apiFetch(`/admin/feedback/${id}`, { method: "DELETE" });

export const getPlaces = (params) => apiFetch(`/admin/places${qs(params)}`);
export const getPlaceOptions = () => apiFetch("/admin/places/options");
export const addPlace = (body) => apiFetch("/admin/places", { method: "POST", body });
export const updatePlace = (id, body) => apiFetch(`/admin/places/${id}`, { method: "PUT", body });
export const removePlace = (id) => apiFetch(`/admin/places/${id}`, { method: "DELETE" });
export const restorePlace = (id) => apiFetch(`/admin/places/${id}/restore`, { method: "POST" });

export const getAnalytics = () => apiFetch("/admin/analytics");
export const getSettings = () => apiFetch("/admin/settings");
export const savePowerBiUrl = (powerbi_url) =>
  apiFetch("/admin/settings", { method: "PUT", body: { powerbi_url } });

// Excel download: a normal <a href> can't send the login token, so we fetch
// the file ourselves and hand it to the browser as a download.
export async function downloadExcel(dataset) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/admin/export/${dataset}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  } catch {
    throw new Error("Couldn't reach the server to download the file.");
  }
  if (!res.ok) throw new Error(`Download failed (${res.status}).`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voyexa-${dataset}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
