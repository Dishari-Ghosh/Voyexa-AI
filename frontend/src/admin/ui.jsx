// Small building blocks shared by the admin pages, styled with the same
// colour tokens as the rest of the site.
import { useEffect, useState } from "react";

export const inputCls =
  "w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-mutedDim outline-none focus:border-marigold";
export const btnPrimary =
  "rounded-full bg-marigold px-5 py-2 text-sm font-medium text-ink hover:bg-marigold-soft disabled:cursor-not-allowed disabled:opacity-60";
export const btnGhost =
  "rounded-full border border-line px-4 py-2 text-sm text-text hover:bg-surfaceRaised disabled:opacity-50";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">{children}</p>
  );
}

export function StatCard({ label, value, hint, accent }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5" style={{ borderTop: `3px solid ${accent || "#F2A93C"}` }}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl text-text">
        {value === null || value === undefined ? "–" : Number(value).toLocaleString("en-IN")}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = "muted" }) {
  const tones = {
    muted: "border-line text-muted",
    gold: "border-marigold/60 text-marigold",
    teal: "border-teal/60 text-teal",
    red: "border-red-500/50 text-red-500",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-5 flex items-center justify-between">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="text-sm text-muted hover:text-text disabled:opacity-30"
      >
        Previous
      </button>
      <p className="text-xs text-muted">
        Page {page} of {pages} · {total.toLocaleString("en-IN")} total
      </p>
      <button
        onClick={() => onPage(Math.min(pages, page + 1))}
        disabled={page >= pages}
        className="text-sm text-muted hover:text-text disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}

/** Waits until the person stops typing before returning the value. */
export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function formatDateTime(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function Stars({ rating }) {
  if (!rating) return <span className="text-xs text-mutedDim">No rating</span>;
  return (
    <span className="text-marigold" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/** Horizontal bars, e.g. "places per zone". */
export function BarList({ rows, color = "#F2A93C", empty = "No data yet." }) {
  if (!rows || rows.length === 0 || rows.every((r) => !r.value)) {
    return <p className="text-sm text-mutedDim">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-xs">
          <span className="w-32 shrink-0 truncate text-muted" title={r.label}>
            {r.label}
          </span>
          <div className="h-3 flex-1 rounded bg-bg">
            <div
              className="h-3 rounded"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: color }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-text">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Vertical columns for a 12-month series ("2026-09" labels). */
export function MonthColumns({ rows, color = "#2FA98C", empty = "No data yet." }) {
  if (!rows || rows.every((r) => !r.value)) return <p className="text-sm text-mutedDim">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex h-40 items-end gap-1.5">
      {rows.map((r) => {
        const [, m] = r.label.split("-");
        return (
          <div key={r.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${r.label}: ${r.value}`}>
            <span className="text-[10px] text-muted">{r.value || ""}</span>
            <div className="w-full rounded-t" style={{ height: `${(r.value / max) * 100}%`, minHeight: r.value ? 4 : 1, background: r.value ? color : "rgb(var(--color-line))" }} />
            <span className="text-[10px] text-muted">{MONTHS[Number(m) - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Card({ title, children, className = "" }) {
  return (
    <div className={`rounded-lg border border-line bg-surface p-5 ${className}`}>
      {title && <h2 className="mb-4 font-display text-lg text-text">{title}</h2>}
      {children}
    </div>
  );
}
