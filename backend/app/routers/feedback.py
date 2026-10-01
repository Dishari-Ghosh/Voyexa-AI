"""
/feedback routes: the real, MongoDB-backed version of the frontend's old
localStorage-only feedback.js. Public to submit (so anonymous-feeling
feedback still works even though the page is behind login), and now
admin-only to read or clear - regular users can no longer list everyone's
feedback. (The admin website uses the richer /admin/feedback routes in
admin_panel.py.)
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from bson import ObjectId

from app.models.feedback import FeedbackIn
from app.db.mongo import feedback_collection
from app.auth.dependencies import require_admin

router = APIRouter(prefix="/feedback", tags=["feedback"])


def _to_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name") or "Anonymous",
        "rating": doc.get("rating", 0),
        "message": doc.get("message", ""),
        "created_at": doc["created_at"],
    }


@router.post("")
async def submit_feedback(payload: FeedbackIn):
    doc = {
        "name": (payload.name or "").strip() or "Anonymous",
        "rating": payload.rating,
        "message": (payload.message or "").strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await feedback_collection().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_out(doc)


@router.get("")
async def list_feedback(user: dict = Depends(require_admin)):
    docs = feedback_collection().find({}).sort("created_at", -1)
    return [_to_out(doc) async for doc in docs]


@router.delete("")
async def clear_feedback(user: dict = Depends(require_admin)):
    await feedback_collection().delete_many({})
    return {"cleared": True}
