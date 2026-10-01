import { useEffect, useState } from "react";
import { getUsers } from "../adminApi.js";
import { Badge, ErrorNote, PageHeader, Pagination, formatDate, inputCls, useDebounced } from "../ui.jsx";

const PAGE_SIZE = 25;

export default function Users() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = useDebounced(search);

  useEffect(() => {
    setPage(1);
  }, [q, role]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUsers({ search: q, role, page, page_size: PAGE_SIZE })
      .then((d) => !cancelled && (setData(d), setError("")))
      .catch((e) => !cancelled && setError(e.message || "Couldn't load users."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, role, page]);

  return (
    <div>
      <PageHeader title="User management" subtitle="Everyone who has signed up. This list is read-only." />

      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone" className={`${inputCls} max-w-sm`} />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <ErrorNote>{error}</ErrorNote>

      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Date of birth</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-text">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 text-muted">{u.phone || "–"}</td>
                <td className="px-4 py-3 text-muted">{formatDate(u.dob)}</td>
                <td className="px-4 py-3"><Badge tone={u.role === "admin" ? "gold" : "muted"}>{u.role}</Badge></td>
                <td className="px-4 py-3 text-muted">{formatDate(u.joined)}</td>
              </tr>
            ))}
            {!loading && data.users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mutedDim">No users found.</td></tr>
            )}
            {loading && data.users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mutedDim">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
    </div>
  );
}
