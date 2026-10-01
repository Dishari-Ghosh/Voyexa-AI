// The whole admin website. Mounted by App.jsx at /admin/*, so with your
// deployed link https://voyexa.ai the admin site is https://voyexa.ai/admin.
//
//   /admin/login      admin sign in
//   /admin/signup     create an admin account (needs the private admin key)
//   /admin            dashboard   (all of these need an ADMIN account)
//   /admin/users      user management
//   /admin/feedback   feedback management
//   /admin/places     place management
//   /admin/analytics  charts + Excel + Power BI
//
// Someone who isn't an admin is always sent to /admin/login - and even if
// they could get past that, the backend refuses every /admin/* call
// unless the login token belongs to an admin.
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";
import AdminLogin from "./AdminLogin.jsx";
import AdminSignup from "./AdminSignup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Feedback from "./pages/Feedback.jsx";
import Places from "./pages/Places.jsx";
import Analytics from "./pages/Analytics.jsx";

export default function AdminApp() {
  const { isAuthenticated, authLoading, user } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
        Loading…
      </div>
    );
  }

  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <Routes>
      <Route path="login" element={isAdmin ? <Navigate to="/admin-he25130929" replace /> : <AdminLogin />} />
      <Route path="signup" element={isAdmin ? <Navigate to="/admin-he25130929" replace /> : <AdminSignup />} />

      <Route element={isAdmin ? <AdminLayout /> : <Navigate to="/admin-he25130929/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="places" element={<Places />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/admin-he25130929" replace />} />
      </Route>
    </Routes>
  );
}
