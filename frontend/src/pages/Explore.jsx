
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import places from "../data/places.json";
import PlaceCard from "../components/cards/PlaceCard.jsx";
import TripBar from "../components/trip/TripBar.jsx";

const ZONES = [...new Set(places.map((p) => p.Zone))].sort();
const STATES = [...new Set(places.map((p) => p.State))].sort();
const INTERESTS = [
  ...new Set(
    places.flatMap((p) => p.Interest_Tags?.split(",") || [])
  ),
]
  .map((s) => s.trim())
  .filter(Boolean)
  .sort();

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [zone, setZone] = useState("");
  const [state, setState] = useState("");
  const [interest, setInterest] = useState("");
  const [hiddenGemsOnly, setHiddenGemsOnly] = useState(false);

  useEffect(() => {
    if (search) setSearchParams({ q: search });
    else setSearchParams({});
  }, [search]);

  const filtered = useMemo(() => {
    let results = places;

    if (search) {
      const q = search.toLowerCase();

      results = results.filter(
        (p) =>
          p.Place_Name.toLowerCase().includes(q) ||
          p.City.toLowerCase().includes(q) ||
          p.State.toLowerCase().includes(q)
      );
    }

    if (zone) results = results.filter((p) => p.Zone === zone);

    if (state) results = results.filter((p) => p.State === state);

    if (interest) {
      results = results.filter((p) =>
        p.Interest_Tags?.includes(interest)
      );
    }

    if (hiddenGemsOnly) {
      results = results.filter((p) => p.Is_Hidden_Gem);
    }

    return results;
  }, [search, zone, state, interest, hiddenGemsOnly]);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: "url('/images/site/explorebg.png')",
      }}
    >
      {/* Soft overlay to keep the background subtle */}
      <div className="pointer-events-none absolute inset-0 bg-[#f7f2e8]/75" />

      {/* Explore content */}
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-display text-3xl text-text">
            Explore places
          </h1>

          <p className="text-sm text-muted">
            {filtered.length} of {places.length} places match
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 space-y-6 lg:w-64">
            <div>
              <label className="mb-2 block text-xs font-medium text-muted">
                Search
              </label>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Place, city, or state"
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-mutedDim focus:border-marigold"
              />
            </div>

            <FilterSelect
              label="Zone"
              value={zone}
              onChange={setZone}
              options={ZONES}
            />

            <FilterSelect
              label="State"
              value={state}
              onChange={setState}
              options={STATES}
            />

            <FilterSelect
              label="Interest"
              value={interest}
              onChange={setInterest}
              options={INTERESTS}
            />

            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={hiddenGemsOnly}
                onChange={(e) => setHiddenGemsOnly(e.target.checked)}
                className="h-4 w-4 rounded border-line bg-surface accent-teal"
              />

              Hidden gems only
            </label>

            {(zone ||
              state ||
              interest ||
              hiddenGemsOnly ||
              search) && (
              <button
                onClick={() => {
                  setZone("");
                  setState("");
                  setInterest("");
                  setHiddenGemsOnly(false);
                  setSearch("");
                }}
                className="text-xs text-marigold hover:underline"
              >
                Clear all filters
              </button>
            )}
          </aside>

          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="rounded-md border border-line bg-surface p-10 text-center">
                <p className="font-display text-lg text-text">
                  No places match those filters
                </p>

                <p className="mt-2 text-sm text-muted">
                  Try clearing a filter — the catalog covers 36 states,
                  so something usually fits.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.slice(0, 60).map((place) => (
                  <PlaceCard
                    key={place.place_id}
                    place={place}
                  />
                ))}
              </div>
            )}

            <TripBar />
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-muted">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-text focus:border-marigold"
      >
        <option value="">All</option>

        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

