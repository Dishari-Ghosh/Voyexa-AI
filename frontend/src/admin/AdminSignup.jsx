import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorNote, btnPrimary, inputCls } from "./ui.jsx";

// Creating an admin needs the private admin key that only you know (it's
// ADMIN_SIGNUP_KEY in the backend settings). Without it the server refuses,
// so nobody can make themselves an admin by finding this page.
export default function AdminSignup() {
  const { adminSignup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", dob: "", password: "", admin_key: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await adminSignup(form);
      navigate("/admin-he25130929");
    } catch (err) {
      setError(err.message || "Couldn't create the admin account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg bg-contour bg-cover px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-xl sm:p-10">
        <h1 className="font-display text-3xl font-medium text-text">Create admin account</h1>
        <p className="mt-1 text-sm text-muted">
          You'll need the private admin key. Already have a normal Voyexa account? Use the same email and
          password here to upgrade it.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Field label="Name"><input required value={form.name} onChange={set("name")} className={inputCls} /></Field>
          <Field label="Email"><input type="email" required value={form.email} onChange={set("email")} className={inputCls} /></Field>
          <Field label="Phone number"><input type="tel" value={form.phone} onChange={set("phone")} className={inputCls} /></Field>
          <Field label="Date of birth"><input type="date" value={form.dob} onChange={set("dob")} max={new Date().toISOString().split("T")[0]} className={inputCls} /></Field>
          <Field label="Password (at least 8 characters)"><input type="password" required minLength={8} value={form.password} onChange={set("password")} className={inputCls} /></Field>
          <Field label="Admin key"><input type="password" required value={form.admin_key} onChange={set("admin_key")} className={inputCls} autoComplete="off" /></Field>
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
            {submitting ? "Creating…" : "Create admin account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already an admin?{" "}
          <Link to="/admin-he25130929/login" className="font-medium text-marigold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-text">{label}</label>
      {children}
    </div>
  );
}
