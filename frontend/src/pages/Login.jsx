
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Couldn't log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="relative min-h-[calc(100vh-73px)] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/site/login-background.png')",
      }}
    >
      {/* Very subtle overlay */}
      <div className="absolute inset-0 bg-[#F7F1E6]/5" />

      {/* Login content */}
      <div className="relative mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-6 py-12">

        {/* Transparent login card */}
        <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/20 p-8 shadow-xl backdrop-blur-md sm:p-10">

          <h1 className="font-display text-3xl font-medium text-ink">
            Log in
          </h1>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>

            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/50 bg-white/25 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/50 transition focus:border-marigold focus:bg-white/35 focus:ring-2 focus:ring-marigold/20"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/50 bg-white/25 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/50 transition focus:border-marigold focus:bg-white/35 focus:ring-2 focus:ring-marigold/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-md bg-scarlet/10 px-3 py-2 text-xs text-scarlet">{error}</p>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-marigold px-6 py-3 text-sm font-medium text-ink shadow-sm transition hover:bg-marigold-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          {/* Signup link */}
          <p className="mt-7 text-center text-sm text-ink/75">
            New here?{" "}
            <Link
              to="/signup"
              className="font-semibold text-white underline decoration-white/60 underline-offset-4 drop-shadow-sm hover:decoration-white"
            >
              Create an account
            </Link>
          </p>

        </div>
      </div>
    </section>
  );
}

