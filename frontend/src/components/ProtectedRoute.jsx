import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Wraps any route that should only be reachable once logged in
// (Explore, Plan a trip, Admin). Not logged in -> bounced to "/",
// which renders the public teaser for anonymous visitors.
//
// While authLoading is true we're still confirming a stored token
// against the backend (see AuthContext) - render nothing rather than
// bounce, so a valid session isn't kicked out for a split second on
// every page refresh.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
