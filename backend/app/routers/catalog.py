"""
GET /catalog/overlay - public. Tells the website which places the admin has
edited, removed or added, so visitors always see the current catalogue.
The frontend fetches this once when the site loads (see
frontend/src/data/placeOverlay.js).
"""
from fastapi import APIRouter

from app.services.place_overlay import load_overlay

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/overlay")
async def overlay():
    ov = await load_overlay()
    return {
        "deleted": sorted(ov.deleted),
        "edits": {str(pid): fields for pid, fields in ov.edits.items()},
        "custom": ov.custom,
    }
