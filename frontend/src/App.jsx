import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import ChatWidget from "./components/chatbot/ChatWidget.jsx";

import PublicLanding from "./pages/PublicLanding.jsx";
import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import PlaceDetail from "./pages/PlaceDetail.jsx";
import PlanningForm from "./pages/PlanningForm.jsx";
import Results from "./pages/Results.jsx";
import Itinerary from "./pages/Itinerary.jsx";
import Confirmation from "./pages/Confirmation.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";

// The admin website is a separate section of the same app: same URL, path
// starts with /admin. It is loaded only when someone opens /admin, so normal
// visitors never even download its code.
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin-he25130929/*"
        element={
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
                Loading…
              </div>
            }
          >
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="/*" element={<UserSite />} />
    </Routes>
  );
}

// Everything visitors and logged-in users see (unchanged from before,
// minus the old /admin route which now lives in src/admin/).
function UserSite() {
  const { isAuthenticated, authLoading } = useAuth();

  // While we're confirming a stored token against the backend, avoid
  // flashing the public landing page for an authenticated user.
  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <Header />
      <main className="flex-1">
        <Routes>
          {/* Same "/" URL for both: anonymous visitors see the teaser,
              logged-in visitors see the real app home. */}
          <Route path="/" element={isAuthenticated ? <Home /> : <PublicLanding />} />

          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id"
            element={
              <ProtectedRoute>
                <PlaceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <PlanningForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan/itinerary"
            element={
              <ProtectedRoute>
                <Itinerary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan/confirmation"
            element={
              <ProtectedRoute>
                <Confirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {isAuthenticated && <ChatWidget />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="font-display text-3xl text-text">Page not found</p>
      <p className="mt-2 text-sm text-muted">That route doesn't exist yet.</p>
    </div>
  );
}
