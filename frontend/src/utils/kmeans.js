// Minimal k-means for grouping places into day-wise clusters by lat/long.
// Mirrors the logic in ml/models/geo_clustering_itinerary.py, just in JS
// so the frontend can build itineraries without waiting on the backend.
export function kmeansCluster(points, k, iterations = 20) {
  if (points.length === 0) return [];
  k = Math.min(k, points.length);
  if (k <= 1) return points.map(() => 0);

  // seed centroids by picking k evenly spaced points (deterministic, no
  // randomness needed for a dataset this small)
  const step = Math.floor(points.length / k);
  let centroids = Array.from({ length: k }, (_, i) => points[i * step]);

  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    let changed = false;
    // assign each point to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dLat = points[i].lat - centroids[c].lat;
        const dLng = points[i].lng - centroids[c].lng;
        const dist = dLat * dLat + dLng * dLng;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      if (assignments[i] !== best) changed = true;
      assignments[i] = best;
    }

    // recompute centroids
    const sums = Array.from({ length: k }, () => ({ lat: 0, lng: 0, count: 0 }));
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      sums[c].lat += points[i].lat;
      sums[c].lng += points[i].lng;
      sums[c].count += 1;
    }
    centroids = sums.map((s, idx) =>
      s.count > 0 ? { lat: s.lat / s.count, lng: s.lng / s.count } : centroids[idx]
    );

    if (!changed) break;
  }

  return assignments;
}

// Groups places into `numDays` day-clusters, ordered north-to-south by
// centroid latitude (rough travel-logic ordering), and returns
// { day, places }[] ready for an itinerary view.
export function clusterIntoDays(placesList, numDays) {
  if (placesList.length === 0) return [];
  const points = placesList.map((p) => ({ lat: p.Latitude, lng: p.Longitude }));
  const assignments = kmeansCluster(points, numDays);

  const groups = {};
  placesList.forEach((place, i) => {
    const cluster = assignments[i];
    (groups[cluster] ||= []).push(place);
  });

  const dayGroups = Object.values(groups).map((groupPlaces) => {
    const avgLat = groupPlaces.reduce((s, p) => s + p.Latitude, 0) / groupPlaces.length;
    return { avgLat, places: groupPlaces };
  });

  dayGroups.sort((a, b) => b.avgLat - a.avgLat);

  return dayGroups.map((g, i) => ({ day: i + 1, places: g.places }));
}
