"""
/auth routes: signup, login, and reading your own profile.

Admin accounts: signup only creates role="admin" if the request's
admin_key matches settings.ADMIN_SIGNUP_KEY (see app/config.py) - keep
that key secret. Every other signup is role="user", same as clicking
"Sign up" on the public site.
"""
import secrets
from datetime import date
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.config import settings
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.db.mongo import users_collection
from app.models.user import UserSignup, UserLogin, UserOut, UserUpdate, Token

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_user_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        phone=doc.get("phone"),
        dob=doc.get("dob"),
        role=doc.get("role", "user"),
    )


@router.post("/signup", response_model=Token)
async def signup(payload: UserSignup):
    existing = await users_collection().find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Admin accounts can only be created when ADMIN_SIGNUP_KEY has been set to
    # a private value. The placeholder defaults never count, so nobody can
    # become an admin by guessing them.
    configured_key = settings.ADMIN_SIGNUP_KEY
    key_is_usable = configured_key not in ("", "change-this-too")
    is_admin = (
        key_is_usable
        and bool(payload.admin_key)
        and secrets.compare_digest(payload.admin_key.encode(), configured_key.encode())
    )
    role = "admin" if is_admin else "user"

    doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "phone": payload.phone,
        "dob": payload.dob.isoformat() if payload.dob else None,
        "role": role,
    }
    result = await users_collection().insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(doc["_id"])})
    return Token(access_token=token, user=_to_user_out(doc))


@router.post("/login", response_model=Token)
async def login(payload: UserLogin):
    doc = await users_collection().find_one({"email": payload.email})
    if not doc or not verify_password(payload.password, doc["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token({"sub": str(doc["_id"])})
    return Token(access_token=token, user=_to_user_out(doc))

@router.post("/token")
async def token(form_data: OAuth2PasswordRequestForm = Depends()):
    doc = await users_collection().find_one({"email": form_data.username})

    if not doc or not verify_password(form_data.password, doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token({"sub": str(doc["_id"])})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return _to_user_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(payload: UserUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if "dob" in updates and isinstance(updates["dob"], date):
        updates["dob"] = updates["dob"].isoformat()
    if updates:
        await users_collection().update_one({"_id": user["_id"]}, {"$set": updates})
    doc = await users_collection().find_one({"_id": user["_id"]})
    return _to_user_out(doc)
