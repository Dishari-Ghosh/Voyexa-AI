"""
FastAPI entry point. Run with:  uvicorn app.main:app --reload
(from inside backend/, with your venv activated).
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import mongo
from app.services import data_store, recommender, chatbot as chatbot_service

from app.routers import auth, explore, planning, chatbot, admin, wishlist, feedback, admin_panel, catalog


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    print("Loading dataset into memory...")
    data_store.load()

    print("Loading ML model artifacts...")
    recommender.load()

    print("Loading chatbot FAQ sheet...")
    chatbot_service.load()

    if settings.JWT_SECRET == "change-this-before-deploying":
        print("WARNING: JWT_SECRET is still the default. Set your own in backend/.env before going live.")
    if settings.ADMIN_SIGNUP_KEY in ("", "change-this-too"):
        print("WARNING: ADMIN_SIGNUP_KEY is not set, so creating admin accounts is switched off.")
        print("         Set ADMIN_SIGNUP_KEY in backend/.env to a private value to enable it.")

    print("Connecting to MongoDB...")
    try:
        await mongo.ping()
        await mongo.ensure_indexes()
        print(f"MongoDB connected (database: {settings.MONGODB_DB_NAME})")
    except Exception as e:
        print(f"WARNING: could not reach MongoDB at startup ({e}).")
        print("The app will still start, but any route touching the DB will fail")
        print("until MongoDB is reachable. Check MONGODB_URI in backend/.env.")

    yield
    # --- shutdown ---
    mongo.get_client().close()


app = FastAPI(title="Voyexa AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(explore.router)
app.include_router(planning.router)
app.include_router(chatbot.router)
app.include_router(admin.router)
app.include_router(wishlist.router)
app.include_router(feedback.router)
app.include_router(admin_panel.public_router)
app.include_router(admin_panel.router)
app.include_router(catalog.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Voyexa AI API"}


@app.get("/health")
async def health():
    try:
        await mongo.ping()
        db_ok = True
    except Exception:
        db_ok = False
    return {"status": "ok", "mongodb_connected": db_ok}
