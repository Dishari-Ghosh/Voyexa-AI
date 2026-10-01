import { useParams, Link, useNavigate } from "react-router-dom";
import places from "../data/places.json";
import PlaceDetailModal from "../components/modal/PlaceDetailModal.jsx";

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const place = places.find((p) => p.place_id === Number(id));

  if (!place) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="font-display text-xl text-text">Place not found</p>
        <Link to="/explore" className="mt-4 inline-block text-sm text-marigold hover:underline">
          Back to explore
        </Link>
      </div>
    );
  }

  // Reuses the modal component as a full page overlay so the card-click
  // interaction (Explore -> modal) and the direct-link case (this route)
  // share one implementation.
  return <PlaceDetailModal place={place} onClose={() => navigate(-1)} />;
}
