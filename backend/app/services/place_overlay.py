"""
Admin place-catalogue overlay. The original data/processed/places_processed.csv
is never edited in place - instead the `place_overrides` Mongo collection
stores three kinds of documents, keyed by place_id:

  - an edit on a base place:  {place_id, fields: {...changed columns...}}
  - a removal of a base place: {place_id, deleted: True, fields?: {...}}
  - an admin-added place:      {place_id, custom: True, deleted: False, fields: {...all columns...}}

This module merges those overrides onto the base CSV-backed catalogue so
every route (planning/recommend, planning/itinerary, the admin panel, and the
public /catalog/overlay the frontend polls on load) sees one consistent,
current view of "what places exist right now" without ever touching the CSV.

NOTE: this file did not exist in the uploaded project (only a stale .pyc was
left behind) - every route that imports `place_overlay` would crash the
backend at startup. This is a reconstruction based on how admin_panel.py,
planning.py and catalog.py call it; the public function names, signatures
and return shapes below match every call site exactly, but the exact
original implementation is unknown, so double check add/edit/remove/restore
in the admin panel behave the way you expect once this is wired in.
"""
from dataclasses import dataclass

import pandas as pd

from app.db.mongo import place_overrides_collection
from app.services.data_store import get_places_df, place_to_dict

# Used to fill in any field the admin didn't type when adding a brand-new
# place (see routers/admin_panel.py::add_place).
CUSTOM_DEFAULTS = {
    "Place_Type": "",
    "Interest_Tags": "",
    "Suitable_For": "Solo,Couples,Family,Friends",
    "Entry_Fee_INR": 0,
    "Activity_Cost_Min": 0,
    "Activity_Cost_Max": 0,
    "HotelcostpernightINR_Min": 1000,
    "HotelcostpernightINR_Max": 4000,
    "FoodcostperdayINR_Min": 300,
    "FoodcostperdayINR_Max": 800,
    "Popularity_Rating": 4.0,
    "Number_Of_Reviewpoints": 0,
    "Best_Month_Start": 1,
    "Best_Month_End": 12,
    "Terrain_Type": "",
    "Hidden_Gem_Score": 0.0,
    "Is_Hidden_Gem": False,
    "Difficulty_Level": "Easy",
    "Typical_Duration": "",
}

INT_FIELDS = {
    "Entry_Fee_INR", "Activity_Cost_Min", "Activity_Cost_Max",
    "HotelcostpernightINR_Min", "HotelcostpernightINR_Max",
    "FoodcostperdayINR_Min", "FoodcostperdayINR_Max",
    "Best_Month_Start", "Best_Month_End", "Number_Of_Reviewpoints",
}
FLOAT_FIELDS = {"Latitude", "Longitude", "Popularity_Rating", "Hidden_Gem_Score"}
BOOL_FIELDS = {"Is_Hidden_Gem"}


def coerce_fields(data: dict) -> dict:
    """Normalizes place-field values coming from the admin panel's JSON
    body (Pydantic already types them, this just guards against strays and
    keeps ints as ints instead of e.g. 500.0)."""
    out = {}
    for k, v in data.items():
        if v is None:
            continue
        if k in INT_FIELDS:
            out[k] = int(round(float(v)))
        elif k in FLOAT_FIELDS:
            out[k] = float(v)
        elif k in BOOL_FIELDS:
            out[k] = bool(v)
        else:
            out[k] = v
    return out


@dataclass
class Overlay:
    edits: dict          # {place_id: {field: value, ...}}
    deleted: set          # {place_id, ...}
    custom: list          # [{place_id, ...all fields}, ...]


async def load_overlay() -> Overlay:
    """Reads every override document once per request. The collection is
    small (admin edits, not visitor traffic) so this is a cheap full scan -
    if it ever gets slow, cache this behind a short TTL."""
    edits: dict = {}
    deleted: set = set()
    custom: list = []

    async for doc in place_overrides_collection().find({}):
        pid = doc["place_id"]
        if doc.get("custom"):
            if not doc.get("deleted"):
                custom.append({"place_id": pid, **doc.get("fields", {})})
            continue
        if doc.get("deleted"):
            deleted.add(pid)
        if doc.get("fields"):
            edits[pid] = doc["fields"]

    return Overlay(edits=edits, deleted=deleted, custom=custom)


def base_places() -> list:
    """The untouched CSV catalogue, as plain dicts (same shape /explore
    returns)."""
    df = get_places_df()
    return [place_to_dict(row) for _, row in df.iterrows()]


def apply_overlay(places: list, ov: Overlay) -> list:
    """Applies edits and removals to an already-built list of place dicts
    (e.g. ranked recommendation results). Admin-added places are never
    injected here, since recommend/rank only ever rank the base dataset -
    they only appear via effective_places()/effective_df()."""
    out = []
    for p in places:
        pid = p.get("place_id")
        if pid in ov.deleted:
            continue
        if pid in ov.edits:
            p = {**p, **ov.edits[pid]}
        out.append(p)
    return out


def effective_places(ov: Overlay) -> list:
    """Base catalogue with edits applied, removals dropped, admin-added
    places appended - the full "current" catalogue."""
    merged = apply_overlay(base_places(), ov)
    merged.extend(ov.custom)
    return merged


def effective_df(ov: Overlay) -> pd.DataFrame:
    """Same merge as effective_places(), as a DataFrame - planning/itinerary
    needs Latitude/Longitude columns to cluster by."""
    return pd.DataFrame(effective_places(ov))


async def next_custom_id() -> int:
    """Admin-added places get an id starting one past the highest id
    already in use (base dataset or a previously admin-added place), so
    new places never collide with an existing place_id."""
    df = get_places_df()
    max_id = int(df["place_id"].max())
    async for doc in place_overrides_collection().find({"custom": True}).sort("place_id", -1).limit(1):
        max_id = max(max_id, doc["place_id"])
    return max_id + 1
