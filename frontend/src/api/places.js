// Real backend data layer, replacing the old client-side mock. Every
// function keeps its original name/signature so pages don't need to
// change - fetchPlaces/fetchPlaceById/fetchStates/fetchZones now hit
// GET /explore, and recommendTrip now hits POST /planning/recommend,
// which runs the actual trained ML models (popularity regressor,
// hidden-gem classifier, similarity recommender - see
// backend/app/services/recommender.py) instead of a JS budget filter.
import { apiFetch } from "./client.js";

export async function fetchPlaces({ state, zone, interest, suitableFor, search, hiddenGemsOnly } = {}) {
  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (zone) params.set("zone", zone);
  if (interest) params.set("interest", interest);
  if (suitableFor) params.set("suitable_for", suitableFor);
  if (search) params.set("search", search);
  if (hiddenGemsOnly) params.set("hidden_gems_only", "true");

  const query = params.toString();
  const data = await apiFetch(`/explore${query ? `?${query}` : ""}`, { auth: false });
  return data.places;
}

export async function fetchPlaceById(placeId) {
  try {
    return await apiFetch(`/explore/${placeId}`, { auth: false });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function fetchStates() {
  return apiFetch("/explore/states", { auth: false });
}

export async function fetchZones() {
  return apiFetch("/explore/zones", { auth: false });
}

// The real POST /planning/recommend - runs season/age-safety/budget rule
// filtering, THEN ranks what's left with the trained ML blend (interest
// match + popularity model + hidden-gem model). Response fields are
// mapped from the backend's snake_case shape to the camelCase shape
// Results.jsx already expects, so that page needed no changes.
export async function recommendTrip(formData) {
  const res = await apiFetch("/planning/recommend", {
    method: "POST",
    body: formData,
    auth: false,
  });

  const withinBudget = res.within_budget || [];
  const nearBudget = (res.near_budget || []).map((p) => ({
    ...p,
    _extraNeeded: p._extra_needed,
  }));
  const stateSummaries = (res.state_summaries || []).map((s) => ({
    state: s.state,
    count: s.count,
    avgPopularity: s.avg_popularity,
  }));

  return { withinBudget, nearBudget, stateSummaries };
}

// The real POST /planning/itinerary - same KMeans geo-clustering as
// ml/notebooks/06_geo_clustering_itinerary.ipynb, run server-side.
// Returns { dayGroups, spreadKm, recommendedDays, warning }.
export async function buildItinerary(placeIds, numDays) {
  const res = await apiFetch("/planning/itinerary", {
    method: "POST",
    body: { place_ids: placeIds, num_days: numDays },
    auth: false,
  });
  return {
    dayGroups: (res.day_groups || []).map((g) => ({ day: g.day, places: g.places })),
    spreadKm: res.spread_km,
    recommendedDays: res.recommended_days,
    warning: res.warning,
  };
}
