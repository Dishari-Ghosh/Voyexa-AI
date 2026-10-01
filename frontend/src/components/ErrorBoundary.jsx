import { Component } from "react";

// Catches any crash inside the app and shows a friendly page instead of a
// blank white screen.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Voyexa crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted">
          Sorry, this page ran into a problem. Reloading usually fixes it.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Reload page
          </button>
          <a href="/" className="rounded-lg border px-4 py-2 text-sm">
            Go to home
          </a>
        </div>
      </div>
    );
  }
}
