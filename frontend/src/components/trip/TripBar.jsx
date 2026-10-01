import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import places from "../../data/places.json";
import { useTrip } from "../../api/trip.js";
import { checkTripFeasibility } from "../../utils/tripFeasibility.js";

const placeById = new Map(places.map((p) => [p.place_id, p]));

// Sticky "your trip" bar: how many places are in the trip, which states
// they're in, a warning when they're too far apart for the chosen number
// of days, and the button that builds the itinerary.
//
// The trip is separate from the wishlist — only places added via
// "Add to trip" appear here, and each one can be removed again.
export default function TripBar({ showWhenEmpty = false }) {
  const trip = useTrip();
  const [open, setOpen] = useState(false);

  const tripPlaces = useMemo(
    () => trip.placeIds.map((id) => placeById.get(id)).filter(Boolean),
    [trip.placeIds]
  );

  const feasibility = useMemo(
    () => checkTripFeasibility(tripPlaces, trip.form?.numDays),
    [tripPlaces, trip.form?.numDays]
  );

  if (tripPlaces.length === 0 && !showWhenEmpty) return null;

  const count = tripPlaces.length;
  const states = feasibility.states;
  const stateText =
    states.length === 0
      ? "Use “Add to trip” on any place to start"
      : states.length <= 3
      ? states.join(", ")
      : `${states.slice(0, 3).join(", ")} +${states.length - 3} more`;
  const warn = feasibility.level === "warn";

  function applySuggestedDays() {
    trip.setForm({ ...trip.form, numDays: feasibility.daysNeeded });
  }

  return (
    <div className="sticky bottom-6 z-30 mt-8 overflow-hidden rounded-md border border-line bg-surface shadow-xl">
      {open && count > 0 && (
        <div className="max-h-60 space-y-2 overflow-y-auto border-b border-line p-3">
          {tripPlaces.map((p) => (
            <div
              key={p.place_id}
              className="flex items-center justify-between rounded-md border border-line bg-bg px-3 py-2"
            >
              <Link to={`/places/${p.place_id}`} className="min-w-0 text-sm text-text hover:text-marigold">
                <span className="truncate">{p.Place_Name}</span>{" "}
                <span className="text-xs text-muted">— {p.City}, {p.State}</span>
              </Link>
              <button
                onClick={() => trip.remove(p.place_id)}
                aria-label={`Remove ${p.Place_Name} from trip`}
                className="ml-3 shrink-0 text-xs text-muted hover:text-text"
              >
                Remove ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {warn && (
        <div className="border-b border-marigold/40 bg-marigold/10 px-4 py-3">
          <p className="text-sm font-medium text-marigold">Heads up — this trip may be too packed</p>
          <p className="mt-1 text-xs text-text">{feasibility.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-xs text-muted">{feasibility.suggestion}</p>
            {trip.form && (
              <button
                onClick={applySuggestedDays}
                className="rounded-full border border-marigold px-3 py-1 text-xs text-marigold hover:bg-marigold hover:text-ink"
              >
                Set trip to {feasibility.daysNeeded} days
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm text-text">
            {count} place{count === 1 ? "" : "s"} in your trip
            {trip.form?.numDays ? (
              <span className="text-muted"> · {trip.form.numDays} day{trip.form.numDays === 1 ? "" : "s"}</span>
            ) : null}
          </p>
          <p className="truncate text-xs text-muted">{stateText}</p>
        </div>

        <div className="flex items-center gap-4">
          {count > 0 && (
            <>
              <button onClick={() => setOpen((v) => !v)} className="text-xs text-muted hover:text-text">
                {open ? "Hide list" : "View list"}
              </button>
              <button onClick={trip.clear} className="text-xs text-muted hover:text-text">
                Clear
              </button>
            </>
          )}

          {count === 0 ? (
            <span className="rounded-full bg-line px-6 py-2 text-sm font-medium text-mutedDim">
              Build day-wise itinerary
            </span>
          ) : trip.form ? (
            <Link
              to="/plan/itinerary"
              className="rounded-full bg-marigold px-6 py-2 text-sm font-medium text-ink hover:bg-marigold-soft"
            >
              {warn ? "Build itinerary anyway" : "Build day-wise itinerary"}
            </Link>
          ) : (
            <Link
              to="/plan"
              className="rounded-full bg-marigold px-6 py-2 text-sm font-medium text-ink hover:bg-marigold-soft"
            >
              Add trip details to continue
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
