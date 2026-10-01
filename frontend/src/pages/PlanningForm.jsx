import { useState } from "react";
import { useNavigate } from "react-router-dom";
import places from "../data/places.json";
import { useAuth } from "../context/AuthContext.jsx";
import { setTripForm } from "../api/trip.js";

const INTERESTS = [...new Set(places.flatMap((p) => p.Interest_Tags?.split(",") || []))]
  .map((s) => s.trim())
  .filter(Boolean)
  .sort();

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STEPS = [
  { key: "tripFor", title: "Who's this for" },
  { key: "group", title: "Who's travelling" },
  { key: "budget", title: "Budget, month and days" },
  { key: "interests", title: "What you're chasing" },
];

export default function PlanningForm() {
  const navigate = useNavigate();
  const { user, age: profileAge } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  const [form, setForm] = useState({
    tripFor: "myself", // "myself" | "someone_else"
    selfAge: "", // only typed in if the profile has no date of birth
    someoneElseName: "",
    someoneElseAge: "",
    suitableFor: "", // Solo | Couples | Family | Friends
    partnerAge: "",
    numChildren: 0,
    childAges: [],
    numElderly: 0,
    friendsHasElderly: false,
    budgetPerDay: 3000,
    month: new Date().getMonth() + 1,
    numDays: 3,
    interests: [],
  });

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  // Who the trip is for. "myself" -> name and age come from the profile
  // (age can be typed in here if the profile has no date of birth yet).
  // "someone else" -> their name and age are entered below and are required.
  const isSelf = form.tripFor === "myself";
  const travellerName = isSelf ? user?.name || "" : form.someoneElseName.trim();
  const travellerAge = isSelf
    ? profileAge ?? (form.selfAge === "" ? null : Number(form.selfAge))
    : form.someoneElseAge === ""
    ? null
    : Number(form.someoneElseAge);
  const needsAgeInput = !isSelf || profileAge === null;
  const ageValid = travellerAge !== null && !Number.isNaN(travellerAge) && travellerAge >= 0 && travellerAge <= 120;
  const nameValid = isSelf || form.someoneElseName.trim().length > 0;
  const [attempted, setAttempted] = useState(false);

  // Any signal that someone 60+ is in the group -> excludes Strenuous places
  // (steep treks, high altitude). The traveller's own age is the main
  // reference; there's no separate "comfort level" question any more.
  const hasElderly =
    (ageValid && travellerAge >= 60) ||
    (form.suitableFor === "Couples" && Number(form.partnerAge) >= 60) ||
    (form.suitableFor === "Family" && form.numElderly > 0) ||
    (form.suitableFor === "Friends" && form.friendsHasElderly);

  function toggleInterest(tag) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(tag)
        ? f.interests.filter((t) => t !== tag)
        : [...f.interests, tag],
    }));
  }

  function updateChildCount(count) {
    const n = Math.max(0, Number(count) || 0);
    setForm((f) => {
      const ages = [...f.childAges];
      while (ages.length < n) ages.push("");
      ages.length = n;
      return { ...f, numChildren: n, childAges: ages };
    });
  }

  function next() {
    // step 1 must be complete: name + age of whoever the trip is for
    if (step.key === "tripFor" && (!nameValid || (needsAgeInput && !ageValid))) {
      setAttempted(true);
      return;
    }
    if (isLast) {
      // selfAge/someoneElseAge/partnerAge/childAges are typed as plain text
      // and stay as strings in form state - "" when left blank. The backend
      // expects real integers or null, and rejects "" with "unable to parse
      // string as an integer", so convert them here before sending.
      const toIntOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
      const payload = {
        ...form,
        selfAge: toIntOrNull(form.selfAge),
        someoneElseAge: toIntOrNull(form.someoneElseAge),
        partnerAge: toIntOrNull(form.partnerAge),
        childAges: form.childAges.map((a) => toIntOrNull(a) ?? 0),
        travellerName,
        travellerAge,
        hasElderly,
      };
      // remember the trip details (days, budget...) so the trip bar and the
      // itinerary page can use them; chosen places are left untouched
      setTripForm(payload);
      navigate("/plan/results", { state: payload });
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/images/site/planatripbg.png')" }}
    >
      {/* Soft overlay: light in light mode, dark in dark mode */}
      <div className="pointer-events-none absolute inset-0 bg-[#f7f2e8]/70 dark:bg-[#0b1220]/75" />

    <div className="relative mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-text">Plan your trip</h1>
      <p className="mt-2 text-sm text-muted">Four short steps.</p>

      <div className="mt-10 flex flex-col gap-10 sm:flex-row">
        <ol className="flex shrink-0 flex-row gap-4 sm:w-48 sm:flex-col sm:gap-0">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex items-start gap-3 sm:pb-8">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    i <= stepIndex ? "bg-marigold text-ink" : "border border-line text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && <span className="mt-1 hidden h-full w-px bg-line sm:block" />}
              </div>
              <span className={`hidden text-sm sm:block ${i === stepIndex ? "text-text" : "text-muted"}`}>
                {s.title}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex-1 rounded-md border border-line bg-surface p-6">
          <h2 className="font-display text-xl text-text">{step.title}</h2>

          {step.key === "tripFor" && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setForm((f) => ({ ...f, tripFor: "myself" }))}
                className={`block w-full rounded-md border px-4 py-3 text-left text-sm ${
                  isSelf
                    ? "border-marigold bg-marigold/10 text-marigold"
                    : "border-line text-text hover:bg-surfaceRaised"
                }`}
              >
                Just for myself
                <span className="block text-xs text-mutedDim">
                  {profileAge !== null
                    ? `We'll use your profile name${user?.name ? ` (${user.name})` : ""} and age (${profileAge}) automatically.`
                    : "We'll use your profile name. Add your date of birth in your profile to skip typing your age."}
                </span>
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, tripFor: "someone_else" }))}
                className={`block w-full rounded-md border px-4 py-3 text-left text-sm ${
                  !isSelf
                    ? "border-marigold bg-marigold/10 text-marigold"
                    : "border-line text-text hover:bg-surfaceRaised"
                }`}
              >
                Planning for someone else
              </button>

              {(!isSelf || needsAgeInput) && (
                <div className="flex flex-wrap gap-4 pt-2">
                  {!isSelf && (
                    <div>
                      <label className="mb-2 block text-xs font-medium text-muted">Their name</label>
                      <input
                        value={form.someoneElseName}
                        onChange={(e) => setForm((f) => ({ ...f, someoneElseName: e.target.value }))}
                        placeholder="Full name"
                        className="w-56 rounded-md border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-mutedDim focus:border-marigold"
                      />
                      {attempted && !nameValid && (
                        <p className="mt-1 text-xs text-marigold">Please enter their name.</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted">
                      {isSelf ? "Your age" : "Their age"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={isSelf ? form.selfAge ?? "" : form.someoneElseAge}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [isSelf ? "selfAge" : "someoneElseAge"]: e.target.value,
                        }))
                      }
                      className="w-32 rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
                    />
                    {attempted && !ageValid && (
                      <p className="mt-1 text-xs text-marigold">Please enter an age between 0 and 120.</p>
                    )}
                    <p className="mt-1 text-xs text-mutedDim">
                      Age is used to leave out strenuous places for anyone 60 or older.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step.key === "group" && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted">Who's travelling?</label>
                <div className="flex flex-wrap gap-2">
                  {["Solo", "Couples", "Family", "Friends"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setForm((f) => ({ ...f, suitableFor: opt }))}
                      className={`rounded-full border px-4 py-2 text-sm ${
                        form.suitableFor === opt
                          ? "border-marigold bg-marigold/10 text-marigold"
                          : "border-line text-text hover:bg-surfaceRaised"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {form.suitableFor === "Couples" && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">Partner's age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={form.partnerAge}
                    onChange={(e) => setForm((f) => ({ ...f, partnerAge: e.target.value }))}
                    className="w-32 rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
                  />
                </div>
              )}

              {form.suitableFor === "Family" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted">
                      Number of children (0–18)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={form.numChildren}
                      onChange={(e) => updateChildCount(e.target.value)}
                      className="w-32 rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
                    />
                  </div>
                  {form.childAges.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {form.childAges.map((age, i) => (
                        <div key={i}>
                          <label className="mb-1 block text-[11px] text-mutedDim">Child {i + 1} age</label>
                          <input
                            type="number"
                            min="0"
                            max="18"
                            value={age}
                            onChange={(e) => {
                              const ages = [...form.childAges];
                              ages[i] = e.target.value;
                              setForm((f) => ({ ...f, childAges: ages }));
                            }}
                            className="w-20 rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-text focus:border-marigold"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted">
                      How many in the group are 60 or older?
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={form.numElderly}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, numElderly: Math.max(0, Number(e.target.value) || 0) }))
                      }
                      className="w-32 rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
                    />
                    <p className="mt-1 text-xs text-mutedDim">
                      We'll exclude strenuous/mountainous places if anyone is 60+.
                    </p>
                  </div>
                </div>
              )}

              {form.suitableFor === "Friends" && (
                <label className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={form.friendsHasElderly}
                    onChange={(e) => setForm((f) => ({ ...f, friendsHasElderly: e.target.checked }))}
                    className="h-4 w-4 rounded border-line bg-surface accent-teal"
                  />
                  Anyone in the group 60 or older?
                </label>
              )}

              {hasElderly && (
                <p className="rounded-md bg-marigold/10 px-3 py-2 text-xs text-marigold">
                  Strenuous places (steep treks, high altitude) will be left out since your group
                  includes someone 60 or older.
                </p>
              )}
            </div>
          )}

          {step.key === "budget" && (
            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  Daily budget per person: ₹{form.budgetPerDay.toLocaleString("en-IN")}
                </label>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="500"
                  value={form.budgetPerDay}
                  onChange={(e) => setForm((f) => ({ ...f, budgetPerDay: Number(e.target.value) }))}
                  className="w-full accent-marigold"
                />
                <div className="flex justify-between text-xs text-muted">
                  <span>₹500</span>
                  <span>₹15,000+</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">Which month?</label>
                <select
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                  className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-mutedDim">Used to only show places in season.</p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  How many days?
                </label>
                <input
                  type="number"
                  min="1"
                  max="21"
                  value={form.numDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, numDays: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="w-32 rounded-md border border-line bg-bg px-3 py-2 text-sm text-text focus:border-marigold"
                />
              </div>
            </div>
          )}

          {step.key === "interests" && (
            <div className="mt-6">
              <label className="mb-2 block text-xs font-medium text-muted">
                Pick as many as fit
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      form.interests.includes(tag)
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-line text-text hover:bg-surfaceRaised"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-line pt-6">
            <button
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="text-sm text-muted hover:text-text disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={next}
              className="rounded-full bg-marigold px-6 py-2 text-sm font-medium text-ink hover:bg-marigold-soft"
            >
              {isLast ? "See recommendations" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
