// Checks whether the places in a trip can realistically be covered in the
// number of days the user picked. A trip is allowed to mix places from many
// states — this only decides whether to show a warning.
//
// It is a deliberately simple, explainable estimate (not a routing engine):
//   days needed = sightseeing days + travel days
//   * sightseeing days: sum of each place's Typical_Duration, at 8 usable
//     hours per day
//   * travel days: the shortest tour through the places (nearest-neighbour),
//     and every leg costs some travel time depending on how far it is
// Tune the numbers below if the warnings feel too strict or too lenient.

const ROAD_FACTOR = 1.35; // straight-line km -> realistic road km
const SIGHTSEEING_HOURS_PER_DAY = 8;

// Cost, in days, of moving between two consecutive places.
// Each row: [max road-km for this tier, days lost travelling]
const TRAVEL_TIERS = [
  [60, 0], //   same area — done within the day's sightseeing
  [200, 0.5], // half a day on the road
  [450, 1], //  a full travel day
  [900, 1.5], // long drive / short flight with transfers
  [1800, 2.5], // flight + connections + recovery
  [Infinity, 4], // opposite ends of the country (e.g. Manipur <-> Goa)
];

// A day that is only slightly over-full still counts as fine.
const SLACK_DAYS = 0.3;

// Hours spent at a place, from the Typical_Duration label in the dataset
// ("Short (1-2 hrs)", "Half-day (2-4 hrs)", "Full-day (4-8 hrs)",
// "Multi-day (1-3 days)").
function hoursAtPlace(place) {
  const label = (place.Typical_Duration || "").toLowerCase();
  if (label.startsWith("short")) return 1.5;
  if (label.startsWith("half")) return 3;
  if (label.startsWith("full")) return 6;
  if (label.startsWith("multi")) return 16;
  return 3;
}

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.Latitude - a.Latitude);
  const dLng = toRad(b.Longitude - a.Longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.Latitude)) * Math.cos(toRad(b.Latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function travelDaysForLeg(straightKm) {
  const roadKm = straightKm * ROAD_FACTOR;
  for (const [maxKm, days] of TRAVEL_TIERS) {
    if (roadKm <= maxKm) return days;
  }
  return 0;
}

// Shortest tour found by trying a nearest-neighbour walk from every start.
function bestTour(places) {
  if (places.length <= 1) return { order: places, legs: [] };
  let best = null;
  for (let s = 0; s < places.length; s++) {
    const remaining = places.map((_, i) => i).filter((i) => i !== s);
    const order = [s];
    const legs = [];
    let total = 0;
    while (remaining.length) {
      const last = places[order[order.length - 1]];
      let bi = 0;
      let bd = Infinity;
      remaining.forEach((idx, ri) => {
        const d = haversineKm(last, places[idx]);
        if (d < bd) {
          bd = d;
          bi = ri;
        }
      });
      order.push(remaining[bi]);
      legs.push(bd);
      total += bd;
      remaining.splice(bi, 1);
    }
    if (!best || total < best.total) best = { order, legs, total };
  }
  return { order: best.order.map((i) => places[i]), legs: best.legs };
}

const round10 = (n) => Math.round(n / 10) * 10;

export function checkTripFeasibility(places, numDays) {
  const days = Math.max(1, Number(numDays) || 1);
  const states = [...new Set(places.map((p) => p.State))];

  if (places.length === 0) {
    return { level: "ok", states, daysNeeded: 0, numDays: days, message: null, suggestion: null };
  }

  const sightDays =
    places.reduce((sum, p) => sum + hoursAtPlace(p), 0) / SIGHTSEEING_HOURS_PER_DAY;
  const { legs } = bestTour(places);
  const travelDays = legs.reduce((sum, km) => sum + travelDaysForLeg(km), 0);
  const daysNeeded = Math.max(1, Math.ceil(sightDays + travelDays - SLACK_DAYS));

  // the two places furthest apart, used to make the message concrete
  let farthest = null;
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const km = haversineKm(places[i], places[j]);
      if (!farthest || km > farthest.km) farthest = { a: places[i], b: places[j], km };
    }
  }

  const base = { states, daysNeeded, numDays: days, sightDays, travelDays, farthest };

  if (daysNeeded <= days) {
    return { ...base, level: "ok", message: null, suggestion: null };
  }

  let message;
  if (travelDays >= 1 && farthest && farthest.a.State !== farthest.b.State) {
    message =
      `${farthest.a.Place_Name} (${farthest.a.State}) and ${farthest.b.Place_Name} ` +
      `(${farthest.b.State}) are about ${round10(farthest.km).toLocaleString("en-IN")} km apart. ` +
      `With travel time, these places need roughly ${daysNeeded} days — you've planned ${days}.`;
  } else if (travelDays >= 1) {
    message =
      `These places are spread far apart, so with travel time they need roughly ` +
      `${daysNeeded} days — you've planned ${days}.`;
  } else {
    message = `That's a lot to see in ${days} day${days === 1 ? "" : "s"} — these places need roughly ${daysNeeded} days.`;
  }

  const suggestion =
    states.length > 1
      ? `Increase your trip to ${daysNeeded} days, or choose places from closer states.`
      : `Increase your trip to ${daysNeeded} days, or remove a few places.`;

  return { ...base, level: "warn", message, suggestion };
}
