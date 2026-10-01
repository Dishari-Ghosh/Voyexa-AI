import { useLocation, useNavigate, Link } from "react-router-dom";

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    navigate("/plan");
    return null;
  }

  const { form, places: selectedPlaces } = data;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-2xl text-teal">
        ✓
      </div>
      <h1 className="font-display text-3xl text-text">Trip saved</h1>
      <p className="mt-2 text-sm text-muted">
        {selectedPlaces?.length || 0} places across {form?.numDays || "several"} day
        {form?.numDays === 1 ? "" : "s"}. Find it anytime under your profile's trip history.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          to="/profile"
          className="rounded-full border border-line px-6 py-3 text-sm text-text hover:bg-surface"
        >
          View in profile
        </Link>
        <Link
          to="/plan"
          className="rounded-full bg-marigold px-6 py-3 text-sm font-medium text-ink hover:bg-marigold-soft"
        >
          Plan another trip
        </Link>
      </div>
    </div>
  );
}
