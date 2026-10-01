"""
/me/wishlist routes - the real, per-user version of the frontend's
localStorage-based wishlist.js. Swap point: once wired up, the frontend's
getWishlist/toggleWishlist bodies become fetch() calls to these routes.
"""
from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.db.mongo import wishlist_collection

router = APIRouter(prefix="/me/wishlist", tags=["wishlist"])


@router.get("")
async def get_wishlist(user: dict = Depends(get_current_user)):
    docs = wishlist_collection().find({"user_id": user["_id"]})
    return [doc["place_id"] async for doc in docs]


@router.post("/{place_id}")
async def toggle_wishlist(place_id: int, user: dict = Depends(get_current_user)):
    existing = await wishlist_collection().find_one({"user_id": user["_id"], "place_id": place_id})
    if existing:
        await wishlist_collection().delete_one({"_id": existing["_id"]})
        return {"place_id": place_id, "wishlisted": False}
    else:
        await wishlist_collection().insert_one({"user_id": user["_id"], "place_id": place_id})
        return {"place_id": place_id, "wishlisted": True}
