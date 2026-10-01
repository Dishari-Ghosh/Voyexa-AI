"""
MongoDB connection, via motor (the async driver FastAPI apps use).

You connect this to your own database by setting MONGODB_URI in
backend/.env (copy .env.example -> .env and fill it in) - nothing else
in the app needs to change. Works with a local mongod just as well as
MongoDB Atlas.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
    return _client


def get_db():
    return get_client()[settings.MONGODB_DB_NAME]


# Collections, accessed as properties so callers don't repeat the string names
def users_collection():
    return get_db()["users"]


def trips_collection():
    return get_db()["trips"]


def wishlist_collection():
    return get_db()["wishlist"]


def admin_images_collection():
    return get_db()["admin_images"]


def chatbot_logs_collection():
    return get_db()["chatbot_logs"]


def feedback_collection():
    return get_db()["feedback"]


def place_overrides_collection():
    """Admin edits to the place catalogue: edited fields, removed places, and
    brand-new places. The original CSV is never modified - see
    app/services/place_overlay.py."""
    return get_db()["place_overrides"]


def settings_collection():
    """Small key/value settings the admin can change from the panel
    (e.g. the Power BI embed link)."""
    return get_db()["settings"]


async def ping():
    """Used at startup to confirm the DB is actually reachable."""
    await get_db().command("ping")


async def ensure_indexes():
    """Called once at startup - safe to call every time the app boots."""
    await users_collection().create_index("email", unique=True)
    await trips_collection().create_index("user_id")
    await wishlist_collection().create_index([("user_id", 1), ("place_id", 1)], unique=True)
    await admin_images_collection().create_index("place_id", unique=True)
    await place_overrides_collection().create_index("place_id", unique=True)
    await settings_collection().create_index("key", unique=True)
    # Feedback and chatbot logs are always read newest-first, so index the date.
    await feedback_collection().create_index([("created_at", -1)])
    await chatbot_logs_collection().create_index([("created_at", -1)])
