"""
/admin routes - everything here requires an admin-role account
(see app/auth/dependencies.py::require_admin and the admin_key gate on
signup in app/routers/auth.py).
"""
import re
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.dependencies import require_admin
from app.db.mongo import admin_images_collection
from app.services.data_store import get_places_df

router = APIRouter(prefix="/admin", tags=["admin"])


def to_drive_image_url(link: str) -> str:
    """Same conversion as frontend/src/utils/driveImage.js - a Drive share
    link doesn't work directly in <img src>, this rewrites it to the form
    that does."""
    if "drive.google.com" not in link:
        return link
    match = re.search(r"/file/d/([a-zA-Z0-9_-]+)", link) or re.search(r"[?&]id=([a-zA-Z0-9_-]+)", link)
    if not match:
        return link
    return f"https://drive.google.com/uc?export=view&id={match.group(1)}"


class SetImageRequest(BaseModel):
    place_id: int
    drive_link: str


class BulkImportRequest(BaseModel):
    # Each line: "place_id,drive_link" or "place_name,drive_link"
    lines: str


@router.get("/images")
async def list_images(_: dict = Depends(require_admin)):
    docs = admin_images_collection().find({})
    return {doc["place_id"]: doc["image_url"] async for doc in docs}


@router.post("/images")
async def set_image(req: SetImageRequest, _: dict = Depends(require_admin)):
    url = to_drive_image_url(req.drive_link)
    await admin_images_collection().update_one(
        {"place_id": req.place_id},
        {"$set": {"place_id": req.place_id, "image_url": url}},
        upsert=True,
    )
    return {"place_id": req.place_id, "image_url": url}


@router.delete("/images/{place_id}")
async def delete_image(place_id: int, _: dict = Depends(require_admin)):
    await admin_images_collection().delete_one({"place_id": place_id})
    return {"deleted": True}


@router.post("/images/bulk")
async def bulk_import(req: BulkImportRequest, _: dict = Depends(require_admin)):
    df = get_places_df()
    name_to_id = {str(name).strip().lower(): pid for name, pid in zip(df["Place_Name"], df["place_id"])}
    valid_ids = set(df["place_id"].tolist())

    imported, errors = [], []
    for line_num, line in enumerate(req.lines.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        parts = line.split(",", 1)
        if len(parts) != 2:
            errors.append(f"Line {line_num}: expected 'place_id_or_name,drive_link'")
            continue

        key, link = parts[0].strip(), parts[1].strip()
        place_id = None
        if key.isdigit() and int(key) in valid_ids:
            place_id = int(key)
        elif key.lower() in name_to_id:
            place_id = int(name_to_id[key.lower()])

        if place_id is None:
            errors.append(f"Line {line_num}: could not match '{key}' to a place")
            continue

        url = to_drive_image_url(link)
        await admin_images_collection().update_one(
            {"place_id": place_id},
            {"$set": {"place_id": place_id, "image_url": url}},
            upsert=True,
        )
        imported.append(place_id)

    return {"imported_count": len(imported), "imported_ids": imported, "errors": errors}
