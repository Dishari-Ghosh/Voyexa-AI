import { createContext, useContext, useEffect, useState } from "react";
import { calculateAge } from "../utils/age.js";
import { apiFetch, getToken, setToken } from "../api/client.js";
import { refreshWishlist, clearWishlistCache } from "../api/wishlist.js";

// Real auth now: every function here calls the FastAPI /auth routes and
// stores a JWT (see api/client.js), instead of writing a fake user
// straight to localStorage. This is the fix for "users aren't showing up
// in MongoDB" - previously nothing in this file ever left the browser.
const AuthContext = createContext(null);

function toFormDob(dob) {
  // Backend sends dob as "YYYY-MM-DD" or null; inputs want "" not null.
  return dob || "";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we're checking a stored token against the backend on first
  // load - ProtectedRoute waits for this so a valid session isn't bounced
  // to "/" for a split second on every page refresh.
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const token = getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const me = await apiFetch("/auth/me");
        if (cancelled) return;
        setUser({ ...me, dob: toFormDob(me.dob) });
        refreshWishlist();
      } catch {
        // token expired / invalid / backend unreachable - fall back to
        // logged-out rather than get stuck
        setToken(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login({ email, password }) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(data.access_token);
    setUser({ ...data.user, dob: toFormDob(data.user.dob) });
    refreshWishlist();
    return data.user;
  }

  async function signup({ name, email, phone, dob, password, admin_key }) {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: {
        name,
        email,
        password,
        phone: phone || null,
        dob: dob || null,
        admin_key: admin_key || null,
      },
      auth: false,
    });
    setToken(data.access_token);
    setUser({ ...data.user, dob: toFormDob(data.user.dob) });
    refreshWishlist();
    return data.user;
  }

  // --- Admin website only (/admin). These call the admin-only backend
  // routes, which refuse anyone who isn't an admin, so a normal user
  // never ends up with a session from here. ---
  async function adminLogin({ email, password }) {
    const data = await apiFetch("/admin/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(data.access_token);
    setUser({ ...data.user, dob: toFormDob(data.user.dob) });
    return data.user;
  }

  async function adminSignup({ name, email, phone, dob, password, admin_key }) {
    const data = await apiFetch("/admin/signup", {
      method: "POST",
      body: { name, email, password, phone: phone || null, dob: dob || null, admin_key },
      auth: false,
    });
    setToken(data.access_token);
    setUser({ ...data.user, dob: toFormDob(data.user.dob) });
    return data.user;
  }

  async function updateProfile(updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.dob !== undefined) payload.dob = updates.dob || null;

    const me = await apiFetch("/auth/me", { method: "PATCH", body: payload });
    setUser({ ...me, dob: toFormDob(me.dob) });
    return me;
  }

  function logout() {
    setUser(null);
    setToken(null);
    clearWishlistCache();
  }

  const age = user ? calculateAge(user.dob) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        age,
        isAuthenticated: !!user,
        authLoading,
        login,
        signup,
        adminLogin,
        adminSignup,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
