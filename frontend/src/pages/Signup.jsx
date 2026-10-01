
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LOGIN_BACKGROUND = "/images/site/login-background.png";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup({ name, email, phone, dob, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${LOGIN_BACKGROUND}')`,
      }}
    >
      {/* Same subtle overlay as the Login page */}
      <div className="absolute inset-0 bg-black/5" />

      {/* Signup content */}
      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-md flex-col justify-center px-6 py-12">

        {/* Glass card — same styling as Login, but naturally taller */}
        <div className="rounded-2xl border border-white/40 bg-white/20 p-8 shadow-xl backdrop-blur-md sm:p-10">

          <h1 className="font-display text-3xl font-medium text-ink">
            Create an account
          </h1>

          

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>

            {/* Name */}
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">
                Name
              </label>

              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-white/60 bg-white/35 px-3 py-2 text-sm text-ink placeholder:text-ink/50 outline-none backdrop-blur-sm transition focus:border-white focus:bg-white/45"
                placeholder="Your name"
              />
            </div>

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
                className="w-full rounded-md border border-white/60 bg-white/35 px-3 py-2 text-sm text-ink placeholder:text-ink/50 outline-none backdrop-blur-sm transition focus:border-white focus:bg-white/45"
                placeholder="you@example.com"
              />
            </div>

            {/* Phone number */}
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">
                Phone number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-white/60 bg-white/35 px-3 py-2 text-sm text-ink placeholder:text-ink/50 outline-none backdrop-blur-sm transition focus:border-white focus:bg-white/45"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Date of birth */}
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">
                Date of birth
              </label>

              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-white/60 bg-white/35 px-3 py-2 text-sm text-ink outline-none backdrop-blur-sm transition focus:border-white focus:bg-white/45"
              />

              <p className="mt-1 text-xs text-ink/65">
                Used to pre-fill your age when planning a trip for yourself.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-xs font-medium text-ink">
                Password
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/60 bg-white/35 px-3 py-2 text-sm text-ink placeholder:text-ink/50 outline-none backdrop-blur-sm transition focus:border-white focus:bg-white/45"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-ink/65">At least 8 characters.</p>
            </div>

            {error && (
              <p className="rounded-md bg-scarlet/10 px-3 py-2 text-xs text-scarlet">{error}</p>
            )}

            {/* Create account */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-marigold px-6 py-3 text-sm font-medium text-ink shadow-sm transition hover:bg-marigold-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-ink/80">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-white underline decoration-white/60 underline-offset-4 drop-shadow-sm hover:decoration-white"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

