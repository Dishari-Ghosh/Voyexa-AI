import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "../adminApi.js";
import { Badge, Card, ErrorNote, PageHeader, StatCard, Stars, formatDate, formatDateTime } from "../ui.jsx";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats().then(setStats).catch((e) => setError(e.message || "Couldn't load the dashboard."));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A quick look at how Voyexa AI is doing." />
      <ErrorNote>{error}</ErrorNote>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total users" value={stats?.total_users} hint={stats ? `+ ${stats.total_admins} admin${stats.total_admins === 1 ? "" : "s"}` : ""} />
        <StatCard label="Total places" value={stats?.total_places} accent="#2FA98C" />
        <StatCard label="Trips planned" value={stats?.total_trips} accent="#6FC9B3" />
        <StatCard label="Feedback received" value={stats?.total_feedback} hint={stats ? `${stats.new_feedback} not yet reviewed` : ""} accent="#D98E22" />
        <StatCard label="Hidden gems" value={stats?.hidden_gems} accent="#F7C378" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Latest feedback">
          {!stats ? (
            <p className="text-sm text-mutedDim">Loading…</p>
          ) : stats.recent_feedback.length === 0 ? (
            <p className="text-sm text-mutedDim">No feedback yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.recent_feedback.map((f) => (
                <div key={f.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-text">{f.name}</p>
                    {f.reviewed ? <Badge tone="teal">Reviewed</Badge> : <Badge tone="gold">New</Badge>}
                  </div>
                  <Stars rating={f.rating} />
                  {f.message && <p className="mt-1 line-clamp-2 text-sm text-muted">{f.message}</p>}
                  <p className="mt-1 text-[11px] text-mutedDim">{formatDateTime(f.created_at)}</p>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin-he25130929/feedback" className="mt-4 inline-block text-xs text-marigold hover:underline">
            Open feedback →
          </Link>
        </Card>

        <Card title="Newest users">
          {!stats ? (
            <p className="text-sm text-mutedDim">Loading…</p>
          ) : stats.recent_users.length === 0 ? (
            <p className="text-sm text-mutedDim">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">{u.name}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={u.role === "admin" ? "gold" : "muted"}>{u.role}</Badge>
                    <p className="mt-1 text-[11px] text-mutedDim">{formatDate(u.joined)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin-he25130929/users" className="mt-4 inline-block text-xs text-marigold hover:underline">
            Open user management →
          </Link>
        </Card>
      </div>
    </div>
  );
}
