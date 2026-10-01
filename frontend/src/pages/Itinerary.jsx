import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import places from "../data/places.json";
import { clusterIntoDays } from "../utils/kmeans.js";
import { checkTripFeasibility } from "../utils/tripFeasibility.js";
import { saveTrip } from "../api/tripHistory.js";
import { useTrip } from "../api/trip.js";
import { downloadItineraryPdf } from "../pdf/itineraryPdf.js";

export default function Itinerary() {
  const navigate = useNavigate();
  const trip = useTrip();
  const { form } = trip;
  const justSaved = useRef(false);
  const [pdfState, setPdfState] = useState("idle"); // idle | working | error
  // These two must be declared before any early return below - Hooks can't
  // be called conditionally, and this file used to call them after the
  // `if (!form) return ...` / `if (selectedPlaces.length === 0) return ...`
  // guards, which crashes in development (Rules of Hooks violation).
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  // Only the places added via "Add to trip" go into the itinerary —
  // wishlisted places are not included unless they're also in the trip.
  const selectedPlaces = useMemo(
    () => places.filter((p) => trip.placeIds.includes(p.place_id)),
    [trip.placeIds]
  );

  const dayGroups = useMemo(
    () => (form ? clusterIntoDays(selectedPlaces, form.numDays || 1) : []),
    [selectedPlaces, form]
  );

  const feasibility = useMemo(
    () => checkTripFeasibility(selectedPlaces, form?.numDays),
    [selectedPlaces, form?.numDays]
  );

  if (justSaved.current) return null; // trip was just saved + cleared; we're leaving this page
  if (!form) return <Navigate to="/plan" replace />;
  if (selectedPlaces.length === 0) return <Navigate to="/plan/results" state={form} replace />;

  const totalCost = selectedPlaces.reduce((sum, p) => {
    return sum + p.Entry_Fee_INR + p.Activity_Cost_Min + p.HotelcostpernightINR_Min + p.FoodcostperdayINR_Min;
  }, 0);

  async function handleSaveTrip() {
    setSaveError("");
    setSaving(true);
    try {
      await saveTrip({
        form,
        places: selectedPlaces.map((p) => p.place_id),
        states: feasibility.states,
        dayGroups,
      });
      // the trip is "checked out" — start the next one from an empty list
      justSaved.current = true;
      trip.clear();
      navigate("/plan/confirmation", { state: { form, places: selectedPlaces } });
    } catch (err) {
      setSaveError(err.message || "Couldn't save this trip. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Builds the PDF from the template (src/assets/pdf/template.png) + logo +
  // this trip's text. See src/pdf/pdfTemplate.config.js for the layout.
  async function handleDownloadPdf() {
    setPdfState("working");
    try {
      await downloadItineraryPdf({ form, dayGroups, totalCost });
      setPdfState("idle");
    } catch (err) {
      console.error(err);
      setPdfState("error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Screen-only header — hidden when printing, since the printable
          layout below has its own header */}
      <div className="print:hidden">
        <p className="text-xs text-marigold">
          {form.suitableFor || "Trip"} · {form.numDays} day{form.numDays === 1 ? "" : "s"}
        </p>
        <h1 className="mt-2 font-display text-3xl text-text">Your day-wise itinerary</h1>
        <p className="mt-2 text-sm text-muted">
          Grouped by proximity so each day stays geographically sensible.
        </p>
        {form.travellerName && (
          <p className="mt-1 text-sm text-text">
            Prepared for <span className="font-medium">{form.travellerName}</span>
          </p>
        )}
        {pdfState === "error" && (
          <p className="mt-3 text-xs text-marigold">
            Couldn't create the PDF. Check the browser console for details and try again.
          </p>
        )}

        {feasibility.level === "warn" && (
          <div className="mt-5 rounded-md border border-marigold/40 bg-marigold/10 px-4 py-3">
            <p className="text-sm font-medium text-marigold">This itinerary may be too packed</p>
            <p className="mt-1 text-xs text-text">{feasibility.message}</p>
            <p className="mt-1 text-xs text-muted">{feasibility.suggestion}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/plan/results"
            state={form}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-text hover:bg-surface"
          >
            ← Edit trip
          </Link>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfState === "working"}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-text hover:bg-surface disabled:opacity-60"
          >
            {pdfState === "working" ? "Preparing PDF…" : "Download PDF"}
          </button>
          <button
            onClick={handleSaveTrip}
            disabled={saving}
            className="rounded-full bg-marigold px-5 py-2.5 text-sm font-medium text-ink hover:bg-marigold-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save this trip"}
          </button>
        </div>
      </div>
      {saveError && <p className="mt-2 text-right text-xs text-scarlet">{saveError}</p>}

      {/*
        SWAP POINT: this is the printable itinerary layout. It's a plain,
        generic design for now — replace this block with your Canva-designed
        template's markup/CSS whenever it's ready. Everything it needs
        (dayGroups, form, totalCost) is already computed above.
      */}
      <ItineraryPrintLayout form={form} dayGroups={dayGroups} totalCost={totalCost} />
    </div>
  );
}

function ItineraryPrintLayout({ form, dayGroups, totalCost }) {
  return (
    <div className="mt-10 rounded-md border border-line bg-surface p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black">
      <div className="mb-8 flex items-center justify-between border-b border-line pb-4 print:border-black">
        <div>
          <p className="font-display text-2xl text-text print:text-black">
            Voyexa <span className="text-marigold print:text-black">AI</span>
          </p>
          <p className="text-xs text-muted print:text-black">
            {form.numDays}-day itinerary · {form.suitableFor || "Custom trip"}
            {form.travellerName ? ` · ${form.travellerName}` : ""}
          </p>
        </div>
        <p className="text-xs text-muted print:text-black">
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {dayGroups.map((group) => (
        <div key={group.day} className="mb-8">
          <h3 className="mb-3 font-display text-lg text-text print:text-black">Day {group.day}</h3>
          <div className="space-y-2">
            {group.places.map((place) => (
              <div
                key={place.place_id}
                className="flex items-center justify-between rounded-md border border-line px-4 py-3 print:rounded-none print:border-black"
              >
                <div>
                  <p className="text-sm font-medium text-text print:text-black">{place.Place_Name}</p>
                  <p className="text-xs text-muted print:text-black">
                    {place.City}, {place.State} · {place.Typical_Duration}
                  </p>
                </div>
                <p className="text-xs text-muted print:text-black">★ {place.Popularity_Rating}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 flex items-center justify-between border-t border-line pt-4 print:border-black">
        <p className="text-sm text-text print:text-black">Estimated total daily cost</p>
        <p className="font-display text-lg text-marigold print:text-black">
          ₹{totalCost.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}
