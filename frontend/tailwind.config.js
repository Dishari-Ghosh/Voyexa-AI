/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        surfaceRaised: "rgb(var(--color-surface-raised) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        mutedDim: "rgb(var(--color-muted-dim) / <alpha-value>)",
        // Static (non-theme-aware) dark navy, used only as text color ON
        // TOP of the marigold/teal accent colors, which need dark text
        // for contrast in both light and dark mode.
        ink: "#141A2B",
        marigold: {
          DEFAULT: "#F2A93C",
          soft: "#F7C378",
          deep: "#D98E22",
        },
        teal: {
          DEFAULT: "#2FA98C",
          soft: "#6FC9B3",
        },
        // Error/danger accent (e.g. Login/Signup form errors). Was used in
        // pages/Login.jsx and pages/Signup.jsx (bg-scarlet, text-scarlet)
        // without ever being defined here - Tailwind silently drops classes
        // for colors it doesn't know, so those error banners rendered with
        // no color at all, and Login's submit button (which reused
        // bg-scarlet by mistake) rendered with a transparent background,
        // showing dark-on-dark or light-on-light text depending on theme.
        scarlet: {
          DEFAULT: "#D6484B",
          soft: "#E67D80",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      backgroundImage: {
        contour: "url('/contour.svg')",
      },
    },
  },
  plugins: [],
};
