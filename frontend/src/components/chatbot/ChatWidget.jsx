import { useEffect, useRef, useState } from "react";
import { askChatbot } from "../../api/chatbot.js";
import { useAuth } from "../../context/AuthContext.jsx";

const GREETING = {
  role: "bot",
  text: "Hi! Ask me about a place, a state, how the recommendations work, or how to use Voyexa.",
};

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      // Real backend call now: FastAPI checks the curated Excel FAQ, then
      // falls back to live dataset lookups, and logs the question if
      // neither answers it - see backend/app/services/chatbot.py.
      const result = await askChatbot(text, user?.id);
      setMessages((prev) => [...prev, { role: "bot", text: result.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            err.status === 0
              ? "I can't reach the Voyexa server right now — make sure the backend is running and try again."
              : "Something went wrong answering that — please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {open && (
        <div className="mb-3 flex w-80 flex-col rounded-lg border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-text">Ask Voyexa</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted hover:text-text"
            >
              ✕
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex h-72 flex-col gap-2 overflow-y-auto px-4 py-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "self-end bg-marigold text-ink"
                    : "self-start bg-bg text-text"
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="self-start rounded-2xl bg-bg px-3 py-2 text-sm text-muted">
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a destination..."
              className="w-full rounded-full border border-line bg-bg px-4 py-2 text-sm text-text placeholder:text-mutedDim focus:border-marigold"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send"
              className="shrink-0 rounded-full bg-marigold px-3 py-2 text-sm font-medium text-ink hover:bg-marigold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              ➤
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-marigold text-ink shadow-lg transition-transform hover:scale-105"
        aria-label="Open chat"
      >
        💬
      </button>
    </div>
  );
}
