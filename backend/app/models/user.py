"""
Pydantic schemas for users. Note what's NOT here: there is no "password"
field on anything that ever gets returned to the client - UserOut never
includes it, by design (matches the frontend's Profile page, which never
shows a password either).
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    phone: Optional[str] = None
    dob: Optional[date] = None
    # Only present when someone is deliberately signing up as an admin.
    # Must match settings.ADMIN_SIGNUP_KEY or the account is created as a
    # normal user regardless of what's sent here.
    admin_key: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    dob: Optional[date] = None
    role: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
