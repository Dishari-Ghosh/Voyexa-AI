import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorNote, btnPrimary, inputCls } from "./ui.jsx";

export default function AdminLogin() {
  const { adminLogin } = useAuth();
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
      await adminLogin({ email, password });
      navigate("/admin-he25130929");
    } catch (err) {
      setError(err.message || "Couldn't log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg bg-contour bg-cover px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-xl sm:p-10">
        <div className="mb-6 flex items-center gap-2.5 font-display text-xl text-text">
          <img src="/images/site/voyexa-logo.png" alt="" className="h-8 w-8 object-contain" />
          <span>
            Voyexa <span className="text-marigold">AI</span>
          </span>
        </div>
        <h1 className="font-display text-3xl font-medium text-text">Admin log in</h1>
        <p className="mt-1 text-sm text-muted">For Voyexa administrators only.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-xs font-medium text-text">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="admin@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-text">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-muted">
          Need an admin account?{" "}
          <Link to="/admin-he25130929/signup" className="font-medium text-marigold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
