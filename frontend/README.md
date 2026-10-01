# Voyexa AI — Frontend

React + Vite + Tailwind CSS. Currently runs on **mock data** (`src/data/places.json`,
exported from the real dataset) since the FastAPI backend isn't built yet.

## Setup (run locally — this was built without network access, so untested by npm)

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Swapping mock data for the real backend later

All data access goes through `src/api/places.js`. Each function there
(`fetchPlaces`, `fetchPlaceById`, `recommendTrip`, etc.) currently reads
from the local JSON file — replace the body with a `fetch("/api/...")`
call to the FastAPI backend and no page component needs to change.

## Auth + theming (mock, frontend-only for now)

- `src/context/AuthContext.jsx` — mock login/signup/logout, stored in
  localStorage. Swap the function bodies for real calls to `/auth/*`
  once the backend exists; the shape (`login({email})`, `signup({name,email})`)
  is designed to match.
- `src/context/ThemeContext.jsx` — light/dark mode. Defaults to the
  visitor's OS setting on first visit, then remembers a manual toggle.
- `src/components/ProtectedRoute.jsx` — gates `/explore`, `/places/:id`,
  `/plan`, `/plan/results`, `/plan/confirmation`, `/admin` behind login.
  Logged-out visitors hitting any of those are bounced to `/`.
- `/` renders `PublicLanding.jsx` (minimal teaser, no Explore/Plan links)
  when logged out, or `Home.jsx` (the real app entry point) when logged in
  — same URL, different component, based on auth state.

## Maps

Every place card and the detail modal embed a Google Maps iframe via the
no-API-key embed URL format (`google.com/maps?q=lat,lng&output=embed`).
Card previews use `loading="lazy"` so off-screen maps don't all load at once.

## Design tokens

Defined in `tailwind.config.js` via CSS variables (`src/index.css`) so the
same class names (`bg-ink`, `text-marigold`, etc.) work in both themes —
`:root` holds the light (warm beige paper) values, `.dark` overrides them
(deep indigo-night). Marigold and teal accents are shared across both
modes for a consistent identity. Fonts: `Fraunces` (display/headlines),
`Plus Jakarta Sans` (UI/body) — loaded via Google Fonts in `index.html`.

## Pages built (shells, using mock data)

- `/` — PublicLanding (logged out) or Home (logged in)
- `/explore` — filterable place grid with map previews *(protected)*
- `/places/:id` — place detail with map *(protected)*
- `/plan` — 4-step planning wizard *(protected)*
- `/plan/results` — ranked recommendations *(protected)*
- `/plan/confirmation` — selected places + estimated cost *(protected)*
- `/login`, `/signup` — mock auth, redirects to `/` on submit
- `/admin` — stats shell *(protected)*

## Verified without a dev server

Node wasn't network-connected in the build environment, so `npm install`
couldn't run there. Every `.jsx`/`.js` file was syntax-checked and the
full app was bundle-resolved with esbuild (all imports, including the
JSON data import, resolve correctly) — but the actual browser rendering
hasn't been visually confirmed. Flag anything that looks off once you
run it locally.

## Wishlist vs. trip (two separate lists)

- **Wishlist** (`src/api/wishlist.js`) — the heart button. Saved-for-later, any number of places. Viewable and editable on the Profile page.
- **Trip** (`src/api/trip.js`) — the "Add to trip" button. Only these places go into the day-wise itinerary, and each can be removed again (like a shopping cart). The sticky **trip bar** (`src/components/trip/TripBar.jsx`) shows the count, states covered and a list you can remove from.
- A trip may mix places from several states. `src/utils/tripFeasibility.js` estimates whether the places fit in the chosen number of days and shows a warning (with a one-click "Set trip to N days") when they are too far apart. The distance/day numbers are constants at the top of that file — tune them if the warnings feel too strict or lenient.
- Saving a trip on the itinerary page adds it to trip history and empties the current trip.

## Place images

Every card and the detail view show a place image, falling back to a coloured placeholder. Sources, in priority order:

1. **Admin override** — paste a Google Drive link on `/admin` (this browser only).
2. **Local files** — put images in `src/assets/places/`, named with the place id: `635_pangong-lake.jpg`.
3. **URLs** — entries in `src/data/placeImages.json` (`{ "635": "https://..." }`).

Helpers (run from the project root):

```bash
python scripts/make_image_checklist.py        # data/place_image_checklist.csv: every place, its filename, and what's missing
python scripts/fetch_wikipedia_images.py --limit 25   # optional: auto-fill URLs from Wikimedia Commons (verifies by coordinates)
```

Commons images usually need attribution — add a "Photos: Wikimedia Commons" credit if you use them.

## Itinerary PDF (template-based)

"Download PDF" on the itinerary page builds a real A4 PDF (`src/pdf/itineraryPdf.js`) on top of a template image:

| What | Where |
| --- | --- |
| Template background (A4 portrait PNG, ideally 1240 x 1754 px or 2480 x 3508 px) | `src/assets/pdf/template.png` |
| Logo (square PNG, 512 x 512, transparent) | `src/assets/brand/logo.png` |
| Where the logo / name / text / footer sit (in mm) and the text colours | `src/pdf/pdfTemplate.config.js` |
| Fonts embedded in the PDF (Plus Jakarta Sans, Fraunces, both OFL-licensed) | `src/assets/fonts/` |

`src/assets/pdf/template-guide.png` shows the text zones on the default template — use it as a reference layer when you design your own template in Canva. The PDF shows the website name + logo, who the trip is prepared for, the trip facts, the day-wise places, and "Downloaded on <date, time>" in the footer. Text shrinks (down to 75%) to fit one page; longer trips continue on extra pages, each with the same template.

To use your own template: export an A4 portrait PNG, overwrite `src/assets/pdf/template.png`, then move the zone numbers / colours in `pdfTemplate.config.js` to match. `python scripts/make_default_pdf_template.py` regenerates the default template.

## Planning form: who the trip is for

- "Just for myself": name and age come from the profile (if the profile has no date of birth, the form asks for the age).
- "Planning for someone else": their name and age are required. Age 60+ automatically leaves out strenuous places.
- The "Comfort level" question was removed.
