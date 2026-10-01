"""
/explore routes: list/filter places (public, no auth needed - browsing
doesn't require an account) and get a single place's detail.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.data_store import get_places_df, place_to_dict
from app.db.mongo import admin_images_collection

router = APIRouter(prefix="/explore", tags=["explore"])


@router.get("")
async def list_places(
    state: Optional[str] = None,
    zone: Optional[str] = None,
    interest: Optional[str] = None,
    suitable_for: Optional[str] = None,
    search: Optional[str] = None,
    hidden_gems_only: bool = False,
    limit: int = Query(60, le=200),
):
    df = get_places_df()

    if state:
        df = df[df["State"] == state]
    if zone:
        df = df[df["Zone"] == zone]
    if interest:
        df = df[df["Interest_Tags"].str.contains(interest, case=False, na=False)]
    if suitable_for:
        df = df[df["Suitable_For"].str.contains(suitable_for, case=False, na=False)]
    if search:
        q = search.lower()
        df = df[
            df["Place_Name"].str.lower().str.contains(q, na=False)
            | df["City"].str.lower().str.contains(q, na=False)
            | df["State"].str.lower().str.contains(q, na=False)
        ]
    if hidden_gems_only:
        df = df[df["Is_Hidden_Gem"] == True]  # noqa: E712

    results = [place_to_dict(row) for _, row in df.head(limit).iterrows()]

    # attach admin-set images, if any
    images = {doc["place_id"]: doc["image_url"] async for doc in admin_images_collection().find({})}
    for r in results:
        r["image_url"] = images.get(r["place_id"])

    return {"count": len(results), "places": results}


@router.get("/states")
async def list_states():
    df = get_places_df()
    return sorted(df["State"].unique().tolist())


@router.get("/zones")
async def list_zones():
    df = get_places_df()
    return sorted(df["Zone"].unique().tolist())


@router.get("/{place_id}")
async def get_place(place_id: int):
    df = get_places_df()
    match = df[df["place_id"] == place_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Place not found")

    result = place_to_dict(match.iloc[0])
    image_doc = await admin_images_collection().find_one({"place_id": place_id})
    result["image_url"] = image_doc["image_url"] if image_doc else None
    return result
