import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { recommendTrip } from "../api/places.js";
import PlaceCard from "../components/cards/PlaceCard.jsx";
import TripBar from "../components/trip/TripBar.jsx";
import { getTrip, setTripForm, useTrip } from "../api/trip.js";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const form = location.state;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeState, setActiveState] = useState(null);
  const trip = useTrip();

  useEffect(() => {
    if (!form) {
      navigate("/plan");
      return;
    }
    // Keep the trip's stored form (days, budget...) if it already exists —
    // it may have been edited since (e.g. "Set trip to 6 days").
    if (!getTrip().form) setTripForm(form);
    recommendTrip(form)
      .then((res) => {
        setData(res);
        setActiveState(res.stateSummaries[0]?.state || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Couldn't get recommendations from the server.");
        setLoading(false);
      });
  }, [form]);

  if (!form) return null;

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted">Ranking places…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="rounded-md border border-line bg-surface p-10">
          <p className="font-display text-lg text-text">Couldn't load recommendations</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link to="/plan" className="mt-4 inline-block text-sm text-marigold hover:underline">
            Back to planning
          </Link>
        </div>
      </div>
    );
  }

  const { withinBudget, nearBudget, stateSummaries } = data;

  if (stateSummaries.length === 0 && nearBudget.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="rounded-md border border-line bg-surface p-10">
          <p className="font-display text-lg text-text">Nothing fits every constraint</p>
          <p className="mt-2 text-sm text-muted">
            Try raising your budget, choosing a different month, or picking fewer interests.
          </p>
          <Link to="/plan" className="mt-4 inline-block text-sm text-marigold hover:underline">
            Adjust preferences
          </Link>
        </div>
      </div>
    );
  }

  const activeStatePlaces = withinBudget.filter((p) => p.State === activeState);
  const activeNearBudget = nearBudget.filter((p) => p.State === activeState);
  const tripForm = trip.form || form;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs text-marigold">
          {form.suitableFor || "Any group"} · ₹{form.budgetPerDay?.toLocaleString("en-IN")}/day ·{" "}
          {tripForm.numDays} day{tripForm.numDays === 1 ? "" : "s"}
        </p>
        <h1 className="mt-2 font-display text-3xl text-text">Recommended states</h1>
        <p className="mt-2 text-sm text-muted">
          Ranked by how well each state fits your budget and interests. Pick a state to see its
          places — use the heart to save a place for later, or “Add to trip” to put it in this
          itinerary. You can mix places from different states; we'll warn you if they're too far
          apart for your number of days.
        </p>
      </div>

      {stateSummaries.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {stateSummaries.map((s) => (
            <button
              key={s.state}
              onClick={() => setActiveState(s.state)}
              className={`rounded-full border px-4 py-2 text-sm ${
                activeState === s.state
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-line text-text hover:bg-surfaceRaised"
              }`}
            >
              {s.state} <span className="text-mutedDim">· {s.count} places</span>
            </button>
          ))}
        </div>
      )}

      {activeStatePlaces.length > 0 && (
        <>
          <h2 className="mb-3 font-display text-lg text-text">Within your budget</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeStatePlaces.map((place) => (
              <PlaceCard key={place.place_id} place={place} />
            ))}
          </div>
        </>
      )}

      {activeNearBudget.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 font-display text-lg text-text">
            Just outside your budget
          </h2>
          <p className="mb-3 text-sm text-muted">
            These didn't quite fit — raise your budget slightly to include them.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeNearBudget.map((place) => (
              <div key={place.place_id} className="relative opacity-90">
                <div className="absolute left-3 top-3 z-10 rounded-full bg-marigold px-3 py-1 text-[11px] font-medium text-ink">
                  +₹{place._extraNeeded.toLocaleString("en-IN")}/day needed
                </div>
                <PlaceCard place={place} />
              </div>
            ))}
          </div>
        </>
      )}

      <TripBar showWhenEmpty />
    </div>
  );
}
