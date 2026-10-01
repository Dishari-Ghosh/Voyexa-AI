import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const NAV = [
  { to: "/admin-he25130929", label: "Dashboard", end: true },
  { to: "/admin-he25130929/users", label: "Users" },
  { to: "/admin-he25130929/feedback", label: "Feedback" },
  { to: "/admin-he25130929/places", label: "Places" },
  { to: "/admin-he25130929/analytics", label: "Analytics" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin-he25130929/login");
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
          <Link to="/admin-he25130929" className="flex items-center gap-2.5 font-display text-xl tracking-tight text-text">
            <img src="/images/site/voyexa-logo.png" alt="Voyexa AI" className="h-7 w-7 object-contain" />
            <span>
              Voyexa <span className="text-marigold">AI</span>
            </span>
            <span className="rounded-full border border-marigold/60 px-2 py-0.5 font-sans text-[11px] text-marigold">
              Admin
            </span>
          </Link>

          <nav className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto px-2 sm:order-none sm:mx-0 sm:w-auto sm:px-0">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    isActive ? "bg-marigold text-ink" : "text-muted hover:bg-surfaceRaised hover:text-text"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={toggleTheme}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:bg-surfaceRaised hover:text-text"
            >
              {theme === "dark" ? "Dark ☾" : "Light ☀"}
            </button>
            {/* Admins are also normal accounts, so they can open the user site too. */}
            <Link to="/" className="hidden text-xs text-muted hover:text-text sm:inline">
              User site ↗
            </Link>
            <span className="hidden max-w-[10rem] truncate text-xs text-muted md:inline">{user?.name}</span>
            <button onClick={handleLogout} className="text-xs text-muted hover:text-text">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
