"""
Loads places_processed.csv into memory once, at startup. The dataset is
small (1,163 rows) and static, so there's no need to query it from Mongo
on every request - Mongo is reserved for things that actually change
(users, trips, wishlist, admin images, chat logs).
"""
import pandas as pd
import numpy as np
from app.config import settings

_df: pd.DataFrame | None = None
_raw_df: pd.DataFrame | None = None


def load():
    global _df, _raw_df
    _df = pd.read_csv(settings.PLACES_CSV_PATH)
    _raw_df = pd.read_csv(settings.RAW_CSV_PATH)


def get_places_df() -> pd.DataFrame:
    if _df is None:
        load()
    return _df


def get_raw_df() -> pd.DataFrame:
    if _raw_df is None:
        load()
    return _raw_df


def _to_native(value):
    """Pandas/numpy scalars (numpy.int64, numpy.bool_, numpy.float64...)
    don't always survive FastAPI's JSON encoding cleanly. Converting them
    to plain Python types here (once, at the boundary) avoids intermittent
    500s on /explore and /planning/recommend without touching every
    caller."""
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, float) and pd.isna(value):
        return None
    return value


def place_to_dict(row: pd.Series) -> dict:
    """Only the columns the frontend actually uses - mirrors
    frontend_mock_places.json's column selection so responses match what
    the UI already expects."""
    cols = [
        "place_id", "Place_Name", "City", "State", "Zone", "Place_Type",
        "Interest_Tags", "Suitable_For", "Entry_Fee_INR", "Activity_Cost_Min",
        "Activity_Cost_Max", "HotelcostpernightINR_Min", "HotelcostpernightINR_Max",
        "FoodcostperdayINR_Min", "FoodcostperdayINR_Max", "Latitude", "Longitude",
        "Popularity_Rating", "Number_Of_Reviewpoints", "Best_Month_Start",
        "Best_Month_End", "Terrain_Type", "Hidden_Gem_Score", "Is_Hidden_Gem",
        "Difficulty_Level", "Typical_Duration",
    ]
    return {c: _to_native(row[c]) for c in cols if c in row}
