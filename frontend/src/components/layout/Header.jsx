
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ProfileMenu from "./ProfileMenu.jsx";

const navItems = [
  { to: "/explore", label: "Explore" },
  { to: "/plan", label: "Plan a trip" },
];

export default function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Logo + Voyexa AI */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-xl tracking-tight text-text"
        >
          <img
            src="/images/site/voyexa-logo.png"
            alt="Voyexa AI logo"
            className="h-8 w-8 object-contain"
          />

          <span>
            Voyexa <span className="text-marigold">AI</span>
          </span>
        </Link>

        {/* Navigation */}
        {isAuthenticated && (
          <nav className="hidden items-center gap-8 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm transition-colors ${
                    isActive
                      ? "text-marigold"
                      : "text-muted hover:text-text"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <ProfileMenu />
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-muted transition-colors hover:text-text"
              >
                Log in
              </Link>

              <Link
                to="/signup"
                className="rounded-full bg-marigold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-marigold-soft"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

