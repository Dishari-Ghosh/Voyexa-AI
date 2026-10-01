import { useEffect } from "react";
import { zoneColor, terrainGlyph } from "../cards/zoneColors";
import PlaceImage from "../cards/PlaceImage.jsx";
import { useWishlist } from "../../api/wishlist.js";
import { useTrip } from "../../api/trip.js";
import { placeMapEmbedUrl, placeMapLinkUrl } from "../../utils/mapUrl.js";

export default function PlaceDetailModal({ place, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const wishlist = useWishlist();
  const trip = useTrip();

  if (!place) return null;
  const accent = zoneColor(place.Zone);
  const wishlisted = wishlist.has(place.place_id);
  const inTrip = trip.has(place.place_id);

  const monthName = (n) =>
    ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][n];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface scrollbar-thin"
        style={{ borderTop: `3px solid ${accent}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <PlaceImage place={place} className="h-56 w-full" />

        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-muted">
              <span style={{ color: accent }}>{terrainGlyph(place.Terrain_Type)}</span>
              <span>{place.Terrain_Type}</span>
              <span className="text-line">/</span>
              <span>{place.Zone} zone</span>
            </div>
            <h2 className="font-display text-2xl text-text">{place.Place_Name}</h2>
            <p className="text-sm text-muted">
              {place.City}, {place.State}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => wishlist.toggle(place.place_id)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              className={`rounded-full p-2 text-lg hover:bg-surfaceRaised ${
                wishlisted ? "text-marigold" : "text-muted hover:text-text"
              }`}
            >
              {wishlisted ? "♥" : "♡"}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-2 text-muted hover:bg-surfaceRaised hover:text-text"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 pb-4 sm:grid-cols-4">
          <Stat label="Popularity" value={`★ ${place.Popularity_Rating}`} />
          <Stat label="Difficulty" value={place.Difficulty_Level} />
          <Stat label="Duration" value={place.Typical_Duration} />
          <Stat
            label="Best months"
            value={`${monthName(place.Best_Month_Start)}–${monthName(place.Best_Month_End)}`}
          />
        </div>

        <div className="border-t border-line px-6 py-4">
          <p className="mb-2 text-xs font-medium text-muted">Good for</p>
          <p className="text-sm text-text">{place.Suitable_For}</p>
        </div>

        <div className="border-t border-line px-6 py-4">
          <p className="mb-2 text-xs font-medium text-muted">Interests</p>
          <div className="flex flex-wrap gap-2">
            {place.Interest_Tags?.split(",").map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-line px-6 py-4">
          <p className="mb-3 text-xs font-medium text-muted">Estimated daily cost</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CostLine label="Entry" value={place.Entry_Fee_INR} />
            <CostLine
              label="Activity"
              value={`${place.Activity_Cost_Min}–${place.Activity_Cost_Max}`}
            />
            <CostLine
              label="Hotel"
              value={`${place.HotelcostpernightINR_Min}–${place.HotelcostpernightINR_Max}`}
            />
            <CostLine
              label="Food"
              value={`${place.FoodcostperdayINR_Min}–${place.FoodcostperdayINR_Max}`}
            />
          </div>
        </div>

        <div className="border-t border-line px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Location</p>
            <a
              href={placeMapLinkUrl(place)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-marigold hover:underline"
            >
              Open in Google Maps ↗
            </a>
          </div>
          <div className="h-56 w-full overflow-hidden rounded-md border border-line">
            <iframe
              title={`Map of ${place.Place_Name}`}
              src={placeMapEmbedUrl(place, 13)}
              loading="lazy"
              className="h-full w-full"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-full border border-line px-5 py-2 text-sm text-text hover:bg-surfaceRaised"
          >
            Close
          </button>
          {/* Wishlist and trip are two separate lists: the wishlist is
              "saved for later", the trip is what goes into the itinerary. */}
          <button
            onClick={() => wishlist.toggle(place.place_id)}
            aria-pressed={wishlisted}
            className={`rounded-full border px-5 py-2 text-sm hover:bg-surfaceRaised ${
              wishlisted ? "border-marigold text-marigold" : "border-line text-text"
            }`}
          >
            {wishlisted ? "♥ In wishlist" : "♡ Save to wishlist"}
          </button>
          <button
            onClick={() => trip.toggle(place.place_id)}
            aria-pressed={inTrip}
            className={`rounded-full px-5 py-2 text-sm font-medium ${
              inTrip
                ? "bg-teal text-ink hover:bg-teal-soft"
                : "bg-marigold text-ink hover:bg-marigold-soft"
            }`}
          >
            {inTrip ? "✓ Added to trip · Remove" : "Add to trip"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  );
}

function CostLine({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-sm text-text">₹{value}</p>
    </div>
  );
}