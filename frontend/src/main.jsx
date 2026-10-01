import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { applyPlaceOverlay } from "./data/placeOverlay.js";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Show a tiny loading note straight away, fetch the admin's latest place
// changes, THEN load the app (so pages that read the places list when they
// first load already see the up-to-date list).
root.render(
  <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
    Loading…
  </div>
);

applyPlaceOverlay().finally(async () => {
  const { default: App } = await import("./App.jsx");
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
});
