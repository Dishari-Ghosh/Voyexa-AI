import { useEffect, useState } from "react";
import { downloadExcel, getAnalytics, getSettings, savePowerBiUrl } from "../adminApi.js";
import { BarList, Card, ErrorNote, MonthColumns, PageHeader, btnGhost, btnPrimary, inputCls } from "../ui.jsx";

const EXPORTS = [
  { key: "users", label: "Users", note: "Names, emails, phones (personal data)" },
  { key: "places", label: "Places", note: "All destinations and costs" },
  { key: "feedback", label: "Feedback", note: "Ratings, messages, dates" },
  { key: "trips", label: "Trips", note: "Planned trips, no personal details" },
  { key: "all", label: "Everything", note: "One workbook, four sheets" },
];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics().then(setData).catch((e) => setError(e.message || "Couldn't load analytics."));
  }, []);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Charts from your live data, Excel downloads, and your Power BI report." />
      <ErrorNote>{error}</ErrorNote>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <Card title="New sign-ups (last 12 months)"><MonthColumns rows={data?.signups_by_month} /></Card>
        <Card title="Trips planned (last 12 months)"><MonthColumns rows={data?.trips_by_month} color="#F2A93C" /></Card>
        <Card title="Feedback ratings"><BarList rows={data?.feedback_ratings} color="#D98E22" /></Card>
        <Card title="Places by zone"><BarList rows={data?.places_by_zone} color="#2FA98C" /></Card>
        <Card title="Hidden gems by zone"><BarList rows={data?.hidden_gems_by_zone} color="#6FC9B3" /></Card>
        <Card title="Top 10 states by number of places"><BarList rows={data?.places_by_state} /></Card>
        <Card title="Most planned places" ><BarList rows={data?.most_planned_places} color="#2FA98C" empty="No trips saved yet." /></Card>
        <Card title="Most saved to wishlists"><BarList rows={data?.most_saved_places} color="#F2A93C" empty="No wishlist activity yet." /></Card>
      </div>

      <ExcelSection />
      <PowerBiSection />
    </div>
  );
}

function ExcelSection() {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function go(key) {
    setBusy(key);
    setError("");
    try {
      await downloadExcel(key);
    } catch (e) {
      setError(e.message || "Download failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card title="Excel downloads" className="mt-6">
      <p className="mb-4 text-sm text-muted">
        Download your data as an Excel file (.xlsx) - always up to date at the moment you click. You can open it in
        Excel, or load it into Power BI.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {EXPORTS.map((e) => (
          <button
            key={e.key}
            onClick={() => go(e.key)}
            disabled={!!busy}
            className="rounded-md border border-line bg-bg p-4 text-left hover:border-marigold disabled:opacity-60"
          >
            <p className="text-sm font-medium text-text">{busy === e.key ? "Preparing…" : `⬇ ${e.label}`}</p>
            <p className="mt-1 text-xs text-muted">{e.note}</p>
          </button>
        ))}
      </div>
      <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>
    </Card>
  );
}

function PowerBiSection() {
  const [saved, setSaved] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSaved(s.powerbi_url || "");
        setDraft(s.powerbi_url || "");
      })
      .catch(() => {});
  }, []);

  async function save(url) {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await savePowerBiUrl(url);
      setSaved(res.powerbi_url);
      setDraft(res.powerbi_url);
      setMsg(res.powerbi_url ? "Saved. Your report is shown below." : "Report removed.");
    } catch (e) {
      setError(e.message || "Couldn't save the link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Power BI report" className="mt-6">
      <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Download the Excel file(s) above.</li>
        <li>In Power BI, choose <b className="text-text">Get data → Excel workbook</b> and build your report.</li>
        <li>Publish it, then choose <b className="text-text">File → Embed report → Publish to web (public)</b> and copy the link.</li>
        <li>Paste that link below and it will appear on this page for every admin.</li>
      </ol>
      <p className="mb-4 rounded-md bg-marigold/10 px-3 py-2 text-xs text-marigold">
        "Publish to web" makes a report public to anyone who has the link. Only use the Places, Feedback and Trips
        data for a public report - never the Users sheet, which contains names, emails and phone numbers.
      </p>

      <div className="flex flex-wrap gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://app.powerbi.com/view?r=…" className={`${inputCls} flex-1 min-w-[16rem]`} />
        <button onClick={() => save(draft.trim())} disabled={busy || draft.trim() === saved} className={btnPrimary}>Save link</button>
        {saved && <button onClick={() => save("")} disabled={busy} className={btnGhost}>Remove</button>}
      </div>
      <div className="mt-3 space-y-2">
        <ErrorNote>{error}</ErrorNote>
        {msg && <p className="text-xs text-teal">{msg}</p>}
      </div>

      {saved ? (
        <div className="mt-5 overflow-hidden rounded-md border border-line bg-bg">
          <iframe title="Power BI report" src={saved} className="h-[560px] w-full" allowFullScreen />
        </div>
      ) : (
        <div className="mt-5 flex h-40 items-center justify-center rounded-md border border-dashed border-line text-sm text-mutedDim">
          No Power BI report linked yet.
        </div>
      )}
    </Card>
  );
}
