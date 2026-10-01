import { useEffect, useState } from "react";
import { getPlaceImageSources } from "../../utils/placeImage.js";
import { zoneColor, terrainGlyph } from "./zoneColors";

// Shows a place's photo. Tries each available source in turn; if all of
// them are missing or fail to load, shows a zone-coloured placeholder so
// every card keeps the same shape.
//   className — sizing, e.g. "h-36 w-full"
export default function PlaceImage({ place, className = "h-36 w-full" }) {
  const sources = getPlaceImageSources(place);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [place.place_id]);

  const src = sources[attempt];

  if (!src) {
    const accent = zoneColor(place.Zone);
    return (
      <div
        className={`flex items-center justify-center overflow-hidden ${className}`}
        style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}12)` }}
        aria-hidden="true"
      >
        <span className="text-3xl opacity-60" style={{ color: accent }}>
          {terrainGlyph(place.Terrain_Type)}
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-surfaceRaised ${className}`}>
      <img
        src={src}
        alt={place.Place_Name}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={() => setAttempt((a) => a + 1)}
      />
    </div>
  );
}
