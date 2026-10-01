
import { Link } from "react-router-dom";

// Adjust this value to control how visible the landing-page image is.
// 0.40 = faint
// 0.50 = subtle
// 0.55 = recommended
// 0.65 = clearly visible
// 0.75 = strong
const LANDING_IMAGE_OPACITY = 0.55;

export default function PublicLanding() {
  return (
    <section className="relative min-h-[80vh] overflow-hidden border-b border-line">

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/site/public-landing-background.png')",
          opacity: LANDING_IMAGE_OPACITY,
        }}
      />

      {/* Soft warm overlay
          Keeps the image visible while improving text readability */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(247, 241, 230, 0.35)",
        }}
      />

      {/* Landing-page content */}
      <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center px-6 py-24 text-center sm:text-left">

        {/* Eyebrow */}
        <p className="mb-4 text-sm font-medium text-text">
          A trip planner grounded in real terrain
        </p>

        {/* Main heading */}
        <h1 className="font-display text-5xl font-medium leading-[1.1] text-text sm:text-6xl">
          Plan India, one honest recommendation at a time.
        </h1>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-md text-text sm:mx-0">
          Tell us your budget, who's travelling, and what you're chasing —
          we rank real places by fit, not by who paid for placement.
          Sign up to start exploring.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 sm:justify-start">

          {/* Primary button */}
          <Link
            to="/signup"
            className="rounded-full bg-marigold px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-marigold-soft"
          >
            Sign up free
          </Link>

          {/* Secondary button */}
          <Link
            to="/login"
            className="rounded-full border border-text/40 bg-bg/30 px-6 py-3 text-sm font-medium text-text backdrop-blur-sm transition-colors hover:bg-bg/50"
          >
            Log in
          </Link>

        </div>
      </div>
    </section>
  );
}
