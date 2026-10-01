import { useEffect, useState } from "react";
import { addPlace, getPlaceOptions, getPlaces, removePlace, restorePlace, updatePlace } from "../adminApi.js";
import { placeMapEmbedUrl } from "../../utils/mapUrl.js";
import { Badge, ErrorNote, PageHeader, Pagination, btnGhost, btnPrimary, inputCls, useDebounced } from "../ui.jsx";

const PAGE_SIZE = 20;
const FALLBACK_ZONES = ["North", "South", "East", "West", "Central", "Northeast"];
const SUITABLE = ["Solo", "Couples", "Family", "Friends"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const INT_KEYS = [
  "Entry_Fee_INR", "Activity_Cost_Min", "Activity_Cost_Max", "HotelcostpernightINR_Min",
  "HotelcostpernightINR_Max", "FoodcostperdayINR_Min", "FoodcostperdayINR_Max", "Best_Month_Start", "Best_Month_End",
];
const FLOAT_KEYS = ["Latitude", "Longitude", "Popularity_Rating", "Hidden_Gem_Score"];
const TEXT_KEYS = ["Place_Name", "City", "State", "Zone", "Place_Type", "Interest_Tags", "Suitable_For", "Terrain_Type", "Difficulty_Level", "Typical_Duration"];

const EMPTY = {
  Place_Name: "", City: "", State: "", Zone: "", Place_Type: "", Interest_Tags: "",
  Suitable_For: "Solo,Couples,Family,Friends",
  Entry_Fee_INR: "0", Activity_Cost_Min: "0", Activity_Cost_Max: "0",
  HotelcostpernightINR_Min: "1000", HotelcostpernightINR_Max: "4000",
  FoodcostperdayINR_Min: "300", FoodcostperdayINR_Max: "800",
  Latitude: "", Longitude: "", Popularity_Rating: "4",
  Best_Month_Start: "1", Best_Month_End: "12",
  Terrain_Type: "", Difficulty_Level: "Easy", Typical_Duration: "",
  Is_Hidden_Gem: false, Hidden_Gem_Score: "0",
};

function toForm(place) {
  const f = { ...EMPTY };
  [...TEXT_KEYS, ...INT_KEYS, ...FLOAT_KEYS].forEach((k) => {
    if (place[k] !== null && place[k] !== undefined) f[k] = String(place[k]);
  });
  f.Is_Hidden_Gem = !!place.Is_Hidden_Gem;
  return f;
}

function toPayload(form) {
  const out = {};
  TEXT_KEYS.forEach((k) => {
    const v = String(form[k] ?? "").trim();
    if (v !== "") out[k] = v;
  });
  INT_KEYS.forEach((k) => {
    if (String(form[k]).trim() !== "" && !Number.isNaN(Number(form[k]))) out[k] = Math.round(Number(form[k]));
  });
  FLOAT_KEYS.forEach((k) => {
    if (String(form[k]).trim() !== "" && !Number.isNaN(Number(form[k]))) out[k] = Number(form[k]);
  });
  out.Is_Hidden_Gem = !!form.Is_Hidden_Gem;
  return out;
}

export default function Places() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [view, setView] = useState("live");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ places: [], total: 0, removed_count: 0 });
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | place object
  const q = useDebounced(search);

  useEffect(() => {
    getPlaceOptions().then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, state, view]);

  async function load() {
    setLoading(true);
    try {
      setData(await getPlaces({ search: q, state, view, page, page_size: PAGE_SIZE }));
      setError("");
    } catch (e) {
      setError(e.message || "Couldn't load places.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [q, state, view, page]);

  function showFlash(msg) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 4000);
  }

  async function handleRemove(p) {
    const msg = p._custom
      ? `Permanently delete "${p.Place_Name}"? It was added by an admin, so this can't be undone.`
      : `Remove "${p.Place_Name}"? Visitors will stop seeing it. You can restore it later from the "Removed" tab.`;
    if (!confirm(msg)) return;
    try {
      await removePlace(p.place_id);
      showFlash(`"${p.Place_Name}" removed.`);
      load();
    } catch (e) {
      setError(e.message || "Couldn't remove that place.");
    }
  }

  async function handleRestore(p) {
    try {
      await restorePlace(p.place_id);
      showFlash(`"${p.Place_Name}" restored.`);
      load();
    } catch (e) {
      setError(e.message || "Couldn't restore that place.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Place management"
        subtitle="Add, search, edit and remove destinations. Changes reach the website the next time a visitor loads it."
        actions={<button onClick={() => setEditing("new")} className={btnPrimary}>+ Add place</button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, state or id" className={`${inputCls} max-w-sm`} />
        <select value={state} onChange={(e) => setState(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All states</option>
          {(options.states || []).map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex overflow-hidden rounded-full border border-line text-sm">
          <button onClick={() => setView("live")} className={`px-4 py-1.5 ${view === "live" ? "bg-marigold text-ink" : "text-muted hover:text-text"}`}>Live</button>
          <button onClick={() => setView("removed")} className={`px-4 py-1.5 ${view === "removed" ? "bg-marigold text-ink" : "text-muted hover:text-text"}`}>
            Removed ({data.removed_count})
          </button>
        </div>
      </div>

      {flash && <p className="mb-3 rounded-md bg-teal/15 px-3 py-2 text-xs text-teal">{flash}</p>}
      <ErrorNote>{error}</ErrorNote>

      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Place</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.places.map((p) => (
              <tr key={p.place_id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-xs text-muted">{p.place_id}</td>
                <td className="px-4 py-3">
                  <p className="text-text">{p.Place_Name}</p>
                  <div className="mt-1 flex gap-1.5">
                    {p._custom && <Badge tone="teal">Added by admin</Badge>}
                    {p._edited && <Badge tone="gold">Edited</Badge>}
                    {p.Is_Hidden_Gem && <Badge>Hidden gem</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.City}, {p.State}</td>
                <td className="px-4 py-3 text-muted">{p.Zone}</td>
                <td className="px-4 py-3 text-muted">{p.Place_Type}</td>
                <td className="px-4 py-3 text-muted">★ {p.Popularity_Rating}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {view === "removed" ? (
                    <button onClick={() => handleRestore(p)} className="text-xs text-marigold hover:underline">Restore</button>
                  ) : (
                    <>
                      <button onClick={() => setEditing(p)} className="mr-4 text-xs text-marigold hover:underline">Edit</button>
                      <button onClick={() => handleRemove(p)} className="text-xs text-muted hover:text-red-500">Remove</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!loading && data.places.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-mutedDim">{view === "removed" ? "No removed places." : "No places match."}</td></tr>
            )}
            {loading && data.places.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-mutedDim">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />

      {editing && (
        <PlaceForm
          place={editing === "new" ? null : editing}
          options={options}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            showFlash(msg);
            load();
            getPlaceOptions().then(setOptions).catch(() => {});
          }}
        />
      )}
    </div>
  );
}

function PlaceForm({ place, options, onClose, onSaved }) {
  const isNew = !place;
  const [form, setForm] = useState(isNew ? EMPTY : toForm(place));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const suitable = form.Suitable_For.split(",").map((s) => s.trim()).filter(Boolean);
  function toggleSuitable(name) {
    const next = suitable.includes(name) ? suitable.filter((s) => s !== name) : [...suitable, name];
    setForm((f) => ({ ...f, Suitable_For: SUITABLE.filter((s) => next.includes(s)).join(",") }));
  }

  const lat = Number(form.Latitude);
  const lng = Number(form.Longitude);
  const coordsValid = form.Latitude !== "" && form.Longitude !== "" && Number.isFinite(lat) && Number.isFinite(lng);
  const outsideIndia = coordsValid && (lat < 6 || lat > 38 || lng < 67 || lng > 98);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const missing = ["Place_Name", "City", "State", "Zone"].filter((k) => !String(form[k]).trim());
    if (missing.length) return setError(`Please fill in: ${missing.join(", ").replaceAll("_", " ")}.`);
    if (!coordsValid) return setError("Please enter a valid latitude and longitude - they place the pin on the map.");

    const payload = toPayload(form);
    setSaving(true);
    try {
      if (isNew) {
        await addPlace(payload);
        onSaved(`"${payload.Place_Name}" added.`);
      } else {
        // send only what actually changed
        const changes = {};
        Object.entries(payload).forEach(([k, v]) => {
          const before = place[k];
          const same = typeof v === "boolean" ? !!before === v : String(before ?? "") === String(v);
          if (!same) changes[k] = v;
        });
        if (Object.keys(changes).length === 0) return onClose();
        await updatePlace(place.place_id, changes);
        onSaved(`"${payload.Place_Name}" updated.`);
      }
    } catch (err) {
      setError(err.message || "Couldn't save this place.");
    } finally {
      setSaving(false);
    }
  }

  const zones = options.zones?.length ? options.zones : FALLBACK_ZONES;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg/80 p-4 sm:items-center" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="my-4 w-full max-w-3xl rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl text-text">{isNew ? "Add a place" : `Edit: ${place.Place_Name}`}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-surfaceRaised hover:text-text">✕</button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <Section title="Basics">
            <Field label="Place name *" wide><input value={form.Place_Name} onChange={set("Place_Name")} className={inputCls} /></Field>
            <Field label="City *"><input value={form.City} onChange={set("City")} className={inputCls} /></Field>
            <Field label="State *">
              <input value={form.State} onChange={set("State")} list="dl-states" className={inputCls} />
              <datalist id="dl-states">{(options.states || []).map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Zone *">
              <select value={form.Zone} onChange={set("Zone")} className={inputCls}>
                <option value="">Select…</option>
                {zones.map((z) => <option key={z}>{z}</option>)}
              </select>
            </Field>
            <Field label="Place type">
              <input value={form.Place_Type} onChange={set("Place_Type")} list="dl-types" className={inputCls} placeholder="e.g. Lake, Temple, Fort" />
              <datalist id="dl-types">{(options.place_types || []).map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
          </Section>

          <Section title="Map location">
            <Field label="Latitude *"><input value={form.Latitude} onChange={set("Latitude")} inputMode="decimal" className={inputCls} placeholder="e.g. 22.5726" /></Field>
            <Field label="Longitude *"><input value={form.Longitude} onChange={set("Longitude")} inputMode="decimal" className={inputCls} placeholder="e.g. 88.3639" /></Field>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted">
                Tip: in Google Maps, right-click the spot and click the numbers at the top of the menu to copy the
                latitude and longitude.
              </p>
              {outsideIndia && <p className="mt-1 text-xs text-marigold">These coordinates look like they're outside India - please double-check.</p>}
              {coordsValid && (
                <div className="mt-3 h-48 overflow-hidden rounded-md border border-line">
                  <iframe title="Map preview" src={placeMapEmbedUrl({ Latitude: lat, Longitude: lng }, 11)} className="h-full w-full" loading="lazy" />
                </div>
              )}
            </div>
          </Section>

          <Section title="About the place">
            <Field label="Popularity rating (0–5)"><input value={form.Popularity_Rating} onChange={set("Popularity_Rating")} inputMode="decimal" className={inputCls} /></Field>
            <Field label="Difficulty">
              <input value={form.Difficulty_Level} onChange={set("Difficulty_Level")} list="dl-diff" className={inputCls} />
              <datalist id="dl-diff">{(options.difficulties || []).map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Terrain">
              <input value={form.Terrain_Type} onChange={set("Terrain_Type")} list="dl-terrain" className={inputCls} />
              <datalist id="dl-terrain">{(options.terrains || []).map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Typical duration">
              <input value={form.Typical_Duration} onChange={set("Typical_Duration")} list="dl-dur" className={inputCls} />
              <datalist id="dl-dur">{(options.durations || []).map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Best months from">
              <select value={form.Best_Month_Start} onChange={set("Best_Month_Start")} className={inputCls}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </Field>
            <Field label="…to">
              <select value={form.Best_Month_End} onChange={set("Best_Month_End")} className={inputCls}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </Field>
            <Field label="Interests (comma separated)" wide>
              <input value={form.Interest_Tags} onChange={set("Interest_Tags")} className={inputCls} placeholder="Nature, Scenic, Relaxation" />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-text">Good for</p>
              <div className="flex flex-wrap gap-4">
                {SUITABLE.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-text">
                    <input type="checkbox" checked={suitable.includes(s)} onChange={() => toggleSuitable(s)} className="accent-[#F2A93C]" />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" checked={form.Is_Hidden_Gem} onChange={(e) => setForm((f) => ({ ...f, Is_Hidden_Gem: e.target.checked }))} className="accent-[#F2A93C]" />
                This is a hidden gem
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                Hidden-gem score (0–100)
                <input value={form.Hidden_Gem_Score} onChange={set("Hidden_Gem_Score")} inputMode="decimal" className={`${inputCls} w-24`} />
              </label>
            </div>
          </Section>

          <Section title="Costs (₹)">
            <Field label="Entry fee"><input value={form.Entry_Fee_INR} onChange={set("Entry_Fee_INR")} inputMode="numeric" className={inputCls} /></Field>
            <span />
            <Field label="Activity – min"><input value={form.Activity_Cost_Min} onChange={set("Activity_Cost_Min")} inputMode="numeric" className={inputCls} /></Field>
            <Field label="Activity – max"><input value={form.Activity_Cost_Max} onChange={set("Activity_Cost_Max")} inputMode="numeric" className={inputCls} /></Field>
            <Field label="Hotel per night – min"><input value={form.HotelcostpernightINR_Min} onChange={set("HotelcostpernightINR_Min")} inputMode="numeric" className={inputCls} /></Field>
            <Field label="Hotel per night – max"><input value={form.HotelcostpernightINR_Max} onChange={set("HotelcostpernightINR_Max")} inputMode="numeric" className={inputCls} /></Field>
            <Field label="Food per day – min"><input value={form.FoodcostperdayINR_Min} onChange={set("FoodcostperdayINR_Min")} inputMode="numeric" className={inputCls} /></Field>
            <Field label="Food per day – max"><input value={form.FoodcostperdayINR_Max} onChange={set("FoodcostperdayINR_Max")} inputMode="numeric" className={inputCls} /></Field>
          </Section>

          <ErrorNote>{error}</ErrorNote>
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : isNew ? "Add place" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-text">{label}</label>
      {children}
    </div>
  );
}
