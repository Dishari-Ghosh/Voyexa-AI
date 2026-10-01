"""
/chatbot route. Logs every unanswered question to Mongo so you can review
them later and turn the good ones into new rows in chatbot_qna.xlsx.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services import chatbot as chatbot_service
from app.db.mongo import chatbot_logs_collection
from app.auth.dependencies import require_admin

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None


@router.post("")
async def chat(req: ChatRequest):
    result = chatbot_service.answer(req.message)

    if not result["answered"]:
        await chatbot_logs_collection().insert_one({
            "message": req.message,
            "user_id": req.user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return result


@router.get("/unanswered")
async def list_unanswered(_: dict = Depends(require_admin)):
    """For your admin review - the raw questions nobody could be answered,
    newest first. Was unauthenticated before (anyone could read every
    logged question, which may contain user PII) - now requires an admin
    token, same as the rest of the admin panel."""
    docs = chatbot_logs_collection().find({}).sort("created_at", -1).limit(200)
    return [
        {"message": doc["message"], "user_id": doc.get("user_id"), "created_at": doc["created_at"]}
        async for doc in docs
    ]


@router.delete("/unanswered")
async def clear_unanswered(_: dict = Depends(require_admin)):
    """Admin > Chatbot gaps > Clear all, from the frontend. Was only
    `get_current_user` before, so any logged-in visitor (not just admins)
    could wipe the whole log."""
    await chatbot_logs_collection().delete_many({})
    return {"cleared": True}
