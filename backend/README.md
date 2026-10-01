# Voyexa AI — Backend

FastAPI + JWT auth + MongoDB (via `motor`), wired to the 5 trained ML models
in `ml/artifacts/` and the chatbot QnA sheet in `data/raw/chatbot_qna.xlsx`.

## Setup

```bash
cd backend
python -m venv venv          # or: bash setup_venv.sh / setup_venv.bat
venv\Scripts\activate         # Windows — or source venv/bin/activate on Mac/Linux
pip install -r requirements.txt
copy .env.example .env        # or: cp .env.example .env
```

Open `.env` and set:
- `MONGODB_URI` — your own MongoDB connection string (local `mongodb://localhost:27017`
  or an Atlas `mongodb+srv://...` URI). **This is the only thing you need to connect
  your own database** — nothing else in the code needs to change.
- `JWT_SECRET` — generate one with `python -c "import secrets; print(secrets.token_hex(32))"`
- `ADMIN_SIGNUP_KEY` — a secret only you know; see "Admin accounts" below.

Then run it:

```bash
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive Swagger docs of every route below.
Visit `http://localhost:8000/health` to confirm MongoDB is actually reachable.

## Admin accounts

There's no separate admin website — same `/auth/signup` endpoint, but include
`"admin_key": "<your ADMIN_SIGNUP_KEY>"` in the request body and that account gets
`role: "admin"` instead of `role: "user"`. Regular users signing up through the
site's normal Sign Up form never send this field, so they always get `role: "user"`.
Admin-only routes (image management) check this role via `require_admin`.

## Routes

**Auth** (`/auth`)
- `POST /auth/signup` — `{name, email, password, phone?, dob?, admin_key?}` → token + user
- `POST /auth/login` — `{email, password}` → token + user
- `GET /auth/me` — current user (needs `Authorization: Bearer <token>`)
- `PATCH /auth/me` — update name/phone/dob

**Explore** (`/explore`) — all public, no auth needed
- `GET /explore?state=&zone=&interest=&suitable_for=&search=&hidden_gems_only=&limit=`
- `GET /explore/states`, `GET /explore/zones`
- `GET /explore/{place_id}`

**Planning** (`/planning`)
- `POST /planning/recommend` — the real version of the frontend's mock `recommendTrip()`.
  Body matches the planning form's fields (`tripFor`, `suitableFor`, `budgetPerDay`,
  `month`, `interests`, `hasElderly`, etc.) → `{within_budget, near_budget, state_summaries}`
- `POST /planning/itinerary` — `{place_ids, num_days}` → day-wise clusters + a
  `warning` string if the selected places are too spread out for the day count
- `POST /planning/trips` (auth) — save a built trip
- `GET /planning/trips` (auth) — trip history
- `DELETE /planning/trips/{trip_id}` (auth)

**Wishlist** (`/me/wishlist`, auth required)
- `GET /me/wishlist` → list of place_ids
- `POST /me/wishlist/{place_id}` → toggles, returns new state

**Chatbot** (`/chatbot`)
- `POST /chatbot` — `{message, user_id?}` → `{answer, category, match, answered}`.
  Checks the Excel FAQ first, then looks up place-specific answers directly from
  the dataset, and only falls back (logging the question) if neither hits.
- `GET /chatbot/unanswered` — the logged questions nobody could answer, for you
  to review and turn into new rows in `chatbot_qna.xlsx`

**Admin** (`/admin`, admin role required)
- `GET /admin/images` — place_id → image_url map
- `POST /admin/images` — `{place_id, drive_link}` → sets one image
- `POST /admin/images/bulk` — `{lines: "place_id_or_name,drive_link\n..."}` for
  importing many at once instead of one-by-one
- `DELETE /admin/images/{place_id}`

## How it's wired to the ML models

`app/services/recommender.py` loads the 3 trained artifacts
(`hidden_gem_classifier.pkl`, `popularity_regressor.pkl`,
`similarity_feature_matrix.pkl`) once at startup and runs the same blended-score
logic built in `ml/notebooks/07_ranking_blend.ipynb`. `app/services/itinerary.py`
runs the same KMeans day-clustering as `06_geo_clustering_itinerary.ipynb`.
`app/services/rule_engine.py` mirrors the frontend's mock filtering logic
(budget tiers, season, age-safety) so behavior stays consistent now that it's
backed by the real dataset instead of the browser-side mock.

## Known gaps / next steps

- Frontend's `src/api/*.js` files still call the mock/localStorage versions —
  swapping each one to a real `fetch()` against these routes is the next step.
- Chatbot fallback matching is keyword/substring-based, not a full NLP model —
  good enough for a curated FAQ + dataset lookup, but exact spelling of place
  names in a question still matters (e.g. "Sonmarg" won't match "Sonamarg").
- No file upload for admin images yet — still Drive-link based, same as the
  frontend's current localStorage version.
