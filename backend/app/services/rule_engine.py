"""
Hard filters applied BEFORE the ML ranking model runs: season, difficulty/
age-safety, and budget classification (within-budget vs near-budget).
Mirrors the logic in frontend/src/api/places.js's recommendTrip so the
real backend and the earlier frontend mock agree on behavior.
"""
import pandas as pd

DIFFICULTY_LEVEL = {"Easy": 1, "Moderate": 2, "Strenuous": 3}


def is_in_season(row: pd.Series, month: int) -> bool:
    s, e = int(row["Best_Month_Start"]), int(row["Best_Month_End"])
    if s <= e:
        return s <= month <= e
    return month >= s or month <= e  # wraps across year-end


def daily_cost(row: pd.Series) -> float:
    return (
        row["Entry_Fee_INR"] + row["Activity_Cost_Min"]
        + row["HotelcostpernightINR_Min"] + row["FoodcostperdayINR_Min"]
    )


def filter_candidates(df: pd.DataFrame, req) -> pd.DataFrame:
    max_level = 2 if req.hasElderly else 3  # cap at Moderate if anyone is 60+
    candidates = df[df["Difficulty_Level"].map(DIFFICULTY_LEVEL).fillna(3) <= max_level]

    if req.month:
        candidates = candidates[candidates.apply(lambda r: is_in_season(r, req.month), axis=1)]

    if req.interests:
        pattern = "|".join(req.interests)
        candidates = candidates[candidates["Interest_Tags"].str.contains(pattern, case=False, na=False)]

    return candidates


def classify_by_budget(df: pd.DataFrame, budget_per_day: int):
    """Returns (within_budget_df, near_budget_df) - near_budget is up to
    20% over, so the frontend can offer 'raise your budget by ₹X'."""
    costs = df.apply(daily_cost, axis=1)
    within = df[costs <= budget_per_day * 0.9].copy()
    within["_cost"] = costs[costs <= budget_per_day * 0.9]

    near_mask = (costs > budget_per_day * 0.9) & (costs <= budget_per_day * 1.2)
    near = df[near_mask].copy()
    near["_cost"] = costs[near_mask]
    near["_extra_needed"] = (near["_cost"] - budget_per_day).apply(lambda x: max(0, round(x)))

    return within, near
