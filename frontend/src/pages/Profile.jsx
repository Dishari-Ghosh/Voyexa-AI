import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useWishlist } from "../api/wishlist.js";
import { useTrip } from "../api/trip.js";
import { useTripHistory } from "../api/tripHistory.js";
import places from "../data/places.json";

export default function Profile() {
  const { user, age, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
  });
  const wishlist = useWishlist();
  const trip = useTrip();
  const { history, refresh: refreshHistory, remove: removeTripRemote } = useTripHistory();
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    refreshHistory().catch((err) => setHistoryError(err.message || "Couldn't load trip history."));
  }, []);

  const wishlistedPlaces = places.filter((p) => wishlist.ids.includes(p.place_id));

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    try {
      await updateProfile(form);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || "Couldn't save your profile.");
    }
  }

  async function removeTrip(id) {
    try {
      await removeTripRemote(id);
    } catch (err) {
      setHistoryError(err.message || "Couldn't delete that trip.");
    }
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/images/site/profilebg.png')" }}
    >
      {/* Soft overlay: light in light mode, dark in dark mode */}
      <div className="pointer-events-none absolute inset-0 bg-[#f7f2e8]/55 dark:bg-[#0b1220]/65" />

      <div className="relative mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-text">My profile</h1>

      {/* Note: password is intentionally never shown or stored here. */}
      <section className="mt-8 rounded-md border border-line bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-text">Details</h2>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs text-marigold hover:underline"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
              />
            </Field>
            <Field label="Phone number">
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
              />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
              />
            </Field>
            <button
              type="submit"
              className="rounded-full bg-marigold px-5 py-2 text-sm font-medium text-ink hover:bg-marigold-soft"
            >
              Save changes
            </button>
            {saveError && <p className="text-xs text-scarlet">{saveError}</p>}
          </form>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Name" value={user?.name || "—"} />
            <Stat label="Email" value={user?.email || "—"} />
            <Stat label="Phone" value={user?.phone || "—"} />
            <Stat label="Age" value={age !== null ? `${age} years` : "—"} />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-md border border-line bg-surface p-6">
        <h2 className="font-display text-lg text-text">Appearance</h2>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted">Theme</p>
          <button
            onClick={toggleTheme}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-text hover:bg-surfaceRaised"
          >
            {theme === "dark" ? "Dark ☾ — switch to light" : "Light ☀ — switch to dark"}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-line bg-surface p-6">
        <h2 className="font-display text-lg text-text">Wishlist</h2>
        <p className="mt-1 text-xs text-muted">
          Places you've saved for later. Only the ones you add to your trip go into an itinerary.
        </p>
        {wishlistedPlaces.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nothing saved yet — tap the heart icon on any place to add it here.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {wishlistedPlaces.map((p) => (
              <div
                key={p.place_id}
                className="flex items-center justify-between rounded-md border border-line bg-bg px-4 py-2.5"
              >
                <Link to={`/places/${p.place_id}`} className="text-sm text-text hover:text-marigold">
                  {p.Place_Name} <span className="text-muted">— {p.City}</span>
                </Link>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => trip.toggle(p.place_id)}
                    className={`text-xs ${
                      trip.has(p.place_id) ? "text-teal hover:text-text" : "text-marigold hover:underline"
                    }`}
                  >
                    {trip.has(p.place_id) ? "✓ In trip · Remove" : "+ Add to trip"}
                  </button>
                  <button
                    onClick={() => wishlist.remove(p.place_id)}
                    className="text-xs text-muted hover:text-text"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-md border border-line bg-surface p-6">
        <h2 className="font-display text-lg text-text">Trip history</h2>
        {historyError && <p className="mt-1 text-xs text-scarlet">{historyError}</p>}
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No planned trips saved yet — trips you build in the planner will show up here.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {history.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between rounded-md border border-line bg-bg px-4 py-2.5"
              >
                <div>
                  <p className="text-sm text-text">
                    {saved.states?.join(", ") || "Multiple states"} · {saved.places?.length || 0} places
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(saved.savedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removeTrip(saved.id)}
                  className="text-xs text-muted hover:text-text"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  );
}
