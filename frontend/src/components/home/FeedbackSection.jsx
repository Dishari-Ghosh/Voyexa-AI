import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { addFeedback } from "../../api/feedback.js";

const RATING_LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"];

export default function FeedbackSection() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating && !message.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      await addFeedback({ name: user?.name, rating, message });
      setSubmitted(true);
      setRating(0);
      setMessage("");
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message || "Couldn't send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const shownRating = hoverRating || rating;

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-display text-2xl text-text">Tell us what you think</h2>
        <p className="mt-2 text-sm text-muted">
          Rate your experience and let us know what's missing — a place you couldn't
          find, a question the chatbot couldn't answer, or anything else.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  aria-label={`Rate ${n} out of 5`}
                  className={`text-2xl leading-none transition-colors ${
                    n <= shownRating ? "text-marigold" : "text-line"
                  }`}
                >
                  ★
                </button>
              ))}
              {shownRating > 0 && (
                <span className="ml-2 text-sm text-muted">
                  {RATING_LABELS[shownRating - 1]}
                </span>
              )}
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What worked well? What should we add or fix?"
            rows={4}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-mutedDim focus:border-marigold"
          />

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || (!rating && !message.trim())}
              className="rounded-full bg-marigold px-6 py-2.5 text-sm font-medium text-ink hover:bg-marigold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Sending…" : "Send feedback"}
            </button>
            {submitted && (
              <p className="text-sm text-teal">Thanks — feedback received!</p>
            )}
            {error && <p className="text-sm text-scarlet">{error}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
