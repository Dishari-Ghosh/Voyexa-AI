import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return initials.join("") || "?";
}

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-marigold text-sm font-medium text-ink"
      >
        {initialsOf(user?.name)}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-md border border-line bg-surface shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-text">{user?.name || "Traveller"}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-text hover:bg-surfaceRaised"
          >
            My profile
          </Link>

          {/* Only admin accounts ever see this link. */}
          {user?.role === "admin" && (
            <Link
              to="/admin-he25130929"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-marigold hover:bg-surfaceRaised"
            >
              Admin panel
            </Link>
          )}

          <div className="flex items-center justify-between px-4 py-2.5 text-sm text-text">
            <span>Appearance</span>
            <button
              onClick={toggleTheme}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:bg-surfaceRaised hover:text-text"
            >
              {theme === "dark" ? "Dark ☾" : "Light ☀"}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="block w-full border-t border-line px-4 py-2.5 text-left text-sm text-text hover:bg-surfaceRaised"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
