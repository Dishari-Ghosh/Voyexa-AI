import { useEffect, useState } from "react";
import { deleteFeedback, getFeedback, setFeedbackReviewed } from "../adminApi.js";
import { Badge, ErrorNote, PageHeader, Stars, btnGhost, formatDateTime } from "../ui.jsx";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
];

export default function Feedback() {
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState({ feedback: [], total: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(f = filter) {
    try {
      setData(await getFeedback(f));
      setError("");
    } catch (e) {
      setError(e.message || "Couldn't load feedback.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load(filter);
  }, [filter]);

  async function toggleReviewed(item) {
    try {
      await setFeedbackReviewed(item.id, !item.reviewed);
      await load();
    } catch (e) {
      setError(e.message || "Couldn't update that feedback.");
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete this feedback from ${item.name}? This can't be undone.`)) return;
    try {
      await deleteFeedback(item.id);
      await load();
    } catch (e) {
      setError(e.message || "Couldn't delete that feedback.");
    }
  }

  const counts = { all: data.total, new: data.new, reviewed: data.total - data.new };

  return (
    <div>
      <PageHeader title="Feedback management" subtitle="What users have told you from the feedback form on the home page." />

      <div className="mb-5 flex gap-2 border-b border-line">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${filter === f.key ? "border-marigold text-text" : "border-transparent text-muted hover:text-text"}`}
          >
            {f.label} <span className="text-xs text-mutedDim">({counts[f.key]})</span>
          </button>
        ))}
      </div>
      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <p className="mt-6 text-sm text-mutedDim">Loading…</p>
      ) : data.feedback.length === 0 ? (
        <p className="mt-6 text-sm text-mutedDim">Nothing here.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {data.feedback.map((f) => (
            <div key={f.id} className="rounded-lg border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg text-text">{f.name}</p>
                    {f.reviewed ? <Badge tone="teal">Reviewed</Badge> : <Badge tone="gold">New</Badge>}
                  </div>
                  <Stars rating={f.rating} />
                </div>
                <div className="text-right text-xs text-muted">
                  <p>Given on</p>
                  <p className="text-text">{formatDateTime(f.created_at)}</p>
                  {f.reviewed && f.reviewed_at && <p className="mt-1 text-mutedDim">Reviewed {formatDateTime(f.reviewed_at)}</p>}
                </div>
              </div>

              {f.message ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-text">{f.message}</p>
              ) : (
                <p className="mt-3 text-sm text-mutedDim">(Rating only, no message)</p>
              )}

              <div className="mt-4 flex gap-2">
                <button onClick={() => toggleReviewed(f)} className={btnGhost}>
                  {f.reviewed ? "Mark as not reviewed" : "✓ Mark as reviewed"}
                </button>
                <button onClick={() => handleDelete(f)} className="rounded-full px-4 py-2 text-sm text-muted hover:text-red-500">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
