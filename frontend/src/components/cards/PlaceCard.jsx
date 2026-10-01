import { Link } from "react-router-dom";
import { zoneColor, terrainGlyph } from "./zoneColors";
import PlaceImage from "./PlaceImage.jsx";
import { useWishlist } from "../../api/wishlist.js";
import { useTrip } from "../../api/trip.js";
import { placeMapEmbedUrl } from "../../utils/mapUrl.js";

// One card, two independent actions:
//   ♡  heart        -> wishlist (saved for later, any number of places)
//   +  Add to trip  -> the places going into THIS itinerary
export default function PlaceCard({ place }) {
  const accent = zoneColor(place.Zone);
  const dailyMin =
    place.Entry_Fee_INR + place.Activity_Cost_Min + place.HotelcostpernightINR_Min + place.FoodcostperdayINR_Min;
  const mapSrc = placeMapEmbedUrl(place, 11);

  const wishlist = useWishlist();
  const trip = useTrip();
  const wishlisted = wishlist.has(place.place_id);
  const inTrip = trip.has(place.place_id);

  // The whole card is a link to the detail view, so the buttons must stop
  // the click from bubbling up and triggering navigation.
  function handleWishlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggle(place.place_id);
  }

  function handleTripClick(e) {
    e.preventDefault();
    e.stopPropagation();
    trip.toggle(place.place_id);
  }

  return (
    <Link
      to={`/places/${place.place_id}`}
      className="group relative block overflow-hidden rounded-md bg-surface transition-colors hover:bg-surfaceRaised"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <button
        onClick={handleWishlistClick}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
        title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
        className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-bg/70 text-sm backdrop-blur transition-colors hover:bg-bg ${
          wishlisted ? "text-marigold" : "text-text"
        }`}
      >
        {wishlisted ? "♥" : "♡"}
      </button>

      <PlaceImage place={place} className="h-36 w-full" />

      <div className="flex items-start justify-between p-5 pb-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted">
            <span style={{ color: accent }}>{terrainGlyph(place.Terrain_Type)}</span>
            <span>{place.Terrain_Type}</span>
            <span className="text-line">/</span>
            <span>{place.Zone} zone</span>
          </div>

          <h3 className="truncate font-display text-lg text-text group-hover:text-marigold">
            {place.Place_Name}
          </h3>
          <p className="text-sm text-muted">
            {place.City}, {place.State}
          </p>

          <p className="mt-3 line-clamp-1 text-xs text-mutedDim">{place.Interest_Tags}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 pl-3 text-right">
          {place.Is_Hidden_Gem && (
            <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-medium text-teal">
              Hidden gem
            </span>
          )}
          <span className="text-sm font-medium text-text">★ {place.Popularity_Rating}</span>
          <span className="text-xs text-muted">from ₹{dailyMin.toLocaleString("en-IN")}/day</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-4">
        <span className="text-xs text-mutedDim">{place.Typical_Duration}</span>
        <button
          onClick={handleTripClick}
          aria-pressed={inTrip}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            inTrip
              ? "bg-teal text-ink hover:bg-teal-soft"
              : "border border-marigold text-marigold hover:bg-marigold hover:text-ink"
          }`}
        >
          {inTrip ? "✓ In your trip" : "+ Add to trip"}
        </button>
      </div>

      <div className="h-28 w-full border-t border-line">
        <iframe
          title={`Map of ${place.Place_Name}`}
          src={mapSrc}
          loading="lazy"
          className="pointer-events-none h-full w-full grayscale-[30%] contrast-125"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </Link>
  );
}
