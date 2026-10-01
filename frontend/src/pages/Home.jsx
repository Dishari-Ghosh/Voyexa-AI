import { Link } from "react-router-dom";
import places from "../data/places.json";
import { useAuth } from "../context/AuthContext.jsx";
import FeedbackSection from "../components/home/FeedbackSection.jsx";

// Adjust only this value to control how visible the background image is.
// 0.05 = extremely faint
// 0.08 = very subtle
// 0.10 = recommended starting point
// 0.12 = slightly more visible
// 0.15 = clearly visible
const HOME_IMAGE_OPACITY = 0.50;

export default function Home() {
  const { user } = useAuth();
  const stateCount = new Set(places.map((p) => p.State)).size;
  const hiddenGemCount = places.filter((p) => p.Is_Hidden_Gem).length;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-contour bg-cover bg-center">

        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/site/home-background.png')",
            opacity: HOME_IMAGE_OPACITY,
          }}
        />

        {/* Readability layer: strongest on the left where the text sits,
            fading out to the right so the image stays visible */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f7f2e8]/85 via-[#f7f2e8]/60 to-transparent dark:from-[#0b1220]/85 dark:via-[#0b1220]/60" />

        {/* Existing Home content */}
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-4 text-sm font-semibold text-[#A8650A] dark:text-marigold">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </p>

          <h1 className="max-w-xl font-display text-5xl font-medium leading-[1.1] text-text sm:text-6xl">
            Where to next?
          </h1>

          <p className="mt-6 max-w-md font-medium text-text/80">
            Browse {places.length.toLocaleString("en-IN")} real places by fit, or let the
            planner rank them for you based on budget and interests.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/plan"
              className="rounded-full bg-marigold px-6 py-3 text-sm font-medium text-ink hover:bg-marigold-soft"
            >
              Plan my trip
            </Link>

            <Link
              to="/explore"
              className="rounded-full border border-gray-300 bg-gray-100/90 px-6 py-3 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:border-gray-500 dark:bg-gray-700/60 dark:text-gray-100 dark:hover:bg-gray-600/70"
            >
              Browse places
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <StatBlock
            value={places.length.toLocaleString("en-IN")}
            label="Places catalogued"
          />

          <StatBlock
            value={stateCount}
            label="States and union territories"
          />

          <StatBlock
            value={hiddenGemCount}
            label="Hidden gems surfaced"
          />

          <StatBlock
            value="6"
            label="Zones covered"
          />
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl text-text">
            How it works
          </h2>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <HowStep
              n="1"
              title="Tell us the constraints"
              body="Budget, group type, age and health, travel dates — the things that actually rule places in or out."
            />

            <HowStep
              n="2"
              title="We rank what's left"
              body="A model matches your interests to each place's tags, weighing popularity and hidden-gem discovery."
            />

            <HowStep
              n="3"
              title="Get a day-by-day plan"
              body="Selected places are grouped geographically into a real itinerary, not a random list."
            />
          </div>
        </div>
      </section>

      <FeedbackSection />
    </div>
  );
}

function StatBlock({ value, label }) {
  return (
    <div>
      <p className="font-display text-3xl text-text">
        {value}
      </p>

      <p className="mt-1 text-sm text-muted">
        {label}
      </p>
    </div>
  );
}

function HowStep({ n, title, body }) {
  return (
    <div className="border-l border-line pl-5">
      <p className="text-xs text-marigold">
        Step {n}
      </p>

      <h3 className="mt-2 font-display text-lg text-text">
        {title}
      </h3>

      <p className="mt-2 text-sm text-muted">
        {body}
      </p>
    </div>
  );
}

