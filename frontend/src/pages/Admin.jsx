import { useEffect, useMemo, useState } from "react";
import places from "../data/places.json";
import { getAllImages, setImage, refreshImages } from "../api/adminImages.js";
import PlaceImage from "../components/cards/PlaceImage.jsx";
import { getPlaceImageSources } from "../utils/placeImage.js";
import { useFeedback } from "../api/feedback.js";
import { useUnansweredQuestions } from "../api/unanswered.js";

const PAGE_SIZE = 20;
const TABS = [
  { key: "images", label: "Place images" },
  { key: "feedback", label: "Feedback" },
  { key: "chatbot", label: "Chatbot gaps" },
];

export default function Admin() {
  const [tab, setTab] = useState("images");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl text-text">Admin</h1>

      <div className="mt-6 flex gap-2 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === t.key
                ? "border-marigold text-text"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "images" && <PlaceImagesTab />}
        {tab === "feedback" && <FeedbackTab />}
        {tab === "chatbot" && <ChatbotGapsTab />}
      </div>
    </div>
  );
}

function PlaceImagesTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [images, setImages] = useState(getAllImages());
  const [drafts, setDrafts] = useState({});
  const [savedFlash, setSavedFlash] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    refreshImages()
      .then(setImages)
      .catch((err) =>
        setLoadError(
          err.status === 403
            ? "Your account isn't an admin account, so image management is read-only for you."
            : err.message || "Couldn't load images from the server."
        )
      );
  }, []);

  const filtered = useMemo(() => {
    if (!search) return places;
    const q = search.toLowerCase();
    return places.filter(
      (p) =>
        p.Place_Name.toLowerCase().includes(q) ||
        p.City.toLowerCase().includes(q) ||
        p.State.toLowerCase().includes(q)
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSave(placeId) {
    const link = drafts[placeId];
    if (link === undefined) return;
    try {
      await setImage(placeId, link);
      setImages(getAllImages());
      setSavedFlash(placeId);
      setTimeout(() => setSavedFlash(null), 1500);
    } catch (err) {
      setLoadError(err.message || "Couldn't save that image.");
    }
  }

  // counts every image source: Drive overrides, files in src/assets/places, placeImages.json
  const imageCount = places.filter((p) => getPlaceImageSources(p).length > 0).length;

  return (
    <div>
      <p className="text-sm text-muted">
        Quick per-place override: paste a Google Drive share link. Saved to MongoDB via
        the backend (admin-only). For the whole dataset, drop image files into{" "}
        <code>src/assets/places/</code> named by place id (e.g. <code>635_pangong-lake.jpg</code>)
        — see frontend/README.md.
      </p>
      {loadError && <p className="mt-3 text-xs text-scarlet">{loadError}</p>}

      <div className="mt-6 flex items-center justify-between gap-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by place, city, or state"
          className="w-full max-w-sm rounded-md border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-mutedDim focus:border-marigold"
        />
        <p className="shrink-0 text-xs text-muted">
          {imageCount} of {places.length} places have an image set
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {pageItems.map((place) => {
          const draftValue = drafts[place.place_id] ?? "";
          return (
            <div
              key={place.place_id}
              className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 sm:flex-row sm:items-center"
            >
              <PlaceImage place={place} className="h-16 w-24 shrink-0 rounded" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-text">{place.Place_Name}</p>
                <p className="text-xs text-muted">
                  {place.City}, {place.State} · id {place.place_id}
                </p>
              </div>

              <div className="flex flex-1 gap-2">
                <input
                  value={draftValue}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [place.place_id]: e.target.value }))
                  }
                  placeholder="Paste Google Drive link"
                  className="w-full rounded-md border border-line bg-bg px-3 py-2 text-xs text-text placeholder:text-mutedDim focus:border-marigold"
                />
                <button
                  onClick={() => handleSave(place.place_id)}
                  className="shrink-0 rounded-md bg-marigold px-4 py-2 text-xs font-medium text-ink hover:bg-marigold-soft"
                >
                  {savedFlash === place.place_id ? "Saved ✓" : "Save"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="text-sm text-muted hover:text-text disabled:opacity-30"
        >
          Previous
        </button>
        <p className="text-xs text-muted">
          Page {page} of {totalPages}
        </p>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="text-sm text-muted hover:text-text disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function FeedbackTab() {
  const { feedback, clear, refresh } = useFeedback();
  const [error, setError] = useState("");

  useEffect(() => {
    refresh().catch((err) => setError(err.message || "Couldn't load feedback."));
  }, []);

  async function handleClear() {
    if (!confirm("Clear all feedback?")) return;
    try {
      await clear();
    } catch (err) {
      setError(err.message || "Couldn't clear feedback.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {feedback.length} submission{feedback.length === 1 ? "" : "s"} from the home
          page feedback form, stored in MongoDB.
        </p>
        {feedback.length > 0 && (
          <button onClick={handleClear} className="shrink-0 text-xs text-muted hover:text-text">
            Clear all
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-scarlet">{error}</p>}

      {feedback.length === 0 ? (
        <p className="mt-6 text-sm text-mutedDim">No feedback submitted yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {feedback.map((f) => (
            <div key={f.id} className="rounded-md border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-text">{f.name}</p>
                <p className="text-xs text-muted">
                  {new Date(f.createdAt).toLocaleString()}
                </p>
              </div>
              {f.rating > 0 && (
                <p className="mt-1 text-marigold">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</p>
              )}
              {f.message && <p className="mt-2 text-sm text-text">{f.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatbotGapsTab() {
  const { questions, clear, refresh } = useUnansweredQuestions();
  const [error, setError] = useState("");

  useEffect(() => {
    refresh().catch((err) => setError(err.message || "Couldn't load unanswered questions."));
  }, []);

  async function handleClear() {
    if (!confirm("Clear the unanswered-question log?")) return;
    try {
      await clear();
    } catch (err) {
      setError(err.message || "Couldn't clear the log.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Questions the chatbot's backend couldn't confidently answer (logged in MongoDB
          automatically). Add strong ones to <code>data/raw/chatbot_qna.xlsx</code> and
          re-run <code>build_chatbot_data.py</code> — the backend reads the .xlsx directly,
          so it picks up the new rows on its next restart.
        </p>
        {questions.length > 0 && (
          <button onClick={handleClear} className="shrink-0 text-xs text-muted hover:text-text">
            Clear all
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-scarlet">{error}</p>}

      {questions.length === 0 ? (
        <p className="mt-6 text-sm text-mutedDim">
          No gaps logged yet — every chatbot question so far has been confidently
          answered.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface px-4 py-3"
            >
              <p className="text-sm text-text">{q.question}</p>
              <p className="shrink-0 text-xs text-muted">
                {new Date(q.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
