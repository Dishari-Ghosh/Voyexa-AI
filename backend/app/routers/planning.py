"""
/planning routes: the real POST /planning/recommend and
POST /planning/itinerary, replacing the frontend's mock recommendTrip()
and the JS kmeansCluster() in src/utils/kmeans.js.
"""
from fastapi import APIRouter, Depends

from app.models.trip import RecommendRequest, ItineraryRequest, SaveTripRequest
from app.services.data_store import get_places_df, place_to_dict
from app.services.rule_engine import filter_candidates, classify_by_budget
from app.services.recommender import rank
from app.services.itinerary import cluster_into_days
from app.services.distance import max_spread_km, recommended_days_for_spread
from app.auth.dependencies import get_current_user
from app.db.mongo import trips_collection
from app.services import place_overlay as po

router = APIRouter(prefix="/planning", tags=["planning"])


@router.post("/recommend")
async def recommend(req: RecommendRequest):
    df = get_places_df()
    candidates = filter_candidates(df, req)
    within, near = classify_by_budget(candidates, req.budgetPerDay)

    suitable_for = [req.suitableFor] if req.suitableFor else []

    within_ranked = rank(within["place_id"].tolist(), req.interests, suitable_for, top_n=100)
    within_results = [place_to_dict(row) for _, row in within_ranked.iterrows()]

    near_results = []
    for _, row in near.iterrows():
        d = place_to_dict(row)
        d["_extra_needed"] = int(row["_extra_needed"])
        near_results.append(d)
    near_results.sort(key=lambda p: -p["Popularity_Rating"])

    # admin edits / removals apply to recommendations straight away
    ov = await po.load_overlay()
    within_results = po.apply_overlay(within_results, ov)
    near_results = po.apply_overlay(near_results, ov)

    by_state: dict[str, list] = {}
    for p in within_results:
        by_state.setdefault(p["State"], []).append(p)

    state_summaries = sorted(
        (
            {
                "state": state,
                "count": len(places),
                "avg_popularity": round(sum(p["Popularity_Rating"] for p in places) / len(places), 2),
            }
            for state, places in by_state.items()
        ),
        key=lambda s: (-s["avg_popularity"], -s["count"]),
    )

    return {
        "within_budget": within_results,
        "near_budget": near_results[:20],
        "state_summaries": state_summaries,
    }


@router.post("/itinerary")
async def build_itinerary(req: ItineraryRequest):
    ov = await po.load_overlay()
    df = po.effective_df(ov)  # originals + admin edits - removed + admin-added
    day_groups = cluster_into_days(req.place_ids, req.num_days, df=df)

    selected = df[df["place_id"].isin(req.place_ids)]
    places_list = [place_to_dict(row) for _, row in selected.iterrows()]
    spread_km = max_spread_km(places_list)
    recommended_days = recommended_days_for_spread(spread_km)

    warning = None
    if recommended_days > req.num_days:
        warning = (
            f"Your selected places span roughly {round(spread_km)} km — that's a lot of ground "
            f"for {req.num_days} day(s). Consider {recommended_days}+ days, or choosing places "
            f"closer together."
        )

    return {
        "day_groups": day_groups,
        "spread_km": round(spread_km),
        "recommended_days": recommended_days,
        "warning": warning,
    }


@router.post("/trips")
async def save_trip(req: SaveTripRequest, user: dict = Depends(get_current_user)):
    from datetime import datetime, timezone
    doc = {
        "user_id": user["_id"],
        "form": req.form,
        "place_ids": req.place_ids,
        "day_groups": req.day_groups,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await trips_collection().insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.get("/trips")
async def list_trips(user: dict = Depends(get_current_user)):
    docs = trips_collection().find({"user_id": user["_id"]}).sort("saved_at", -1)
    return [
        {
            "id": str(doc["_id"]),
            "form": doc["form"],
            "place_ids": doc["place_ids"],
            "day_groups": doc.get("day_groups"),
            "saved_at": doc["saved_at"],
        }
        async for doc in docs
    ]


@router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, user: dict = Depends(get_current_user)):
    from bson import ObjectId
    await trips_collection().delete_one({"_id": ObjectId(trip_id), "user_id": user["_id"]})
    return {"deleted": True}
