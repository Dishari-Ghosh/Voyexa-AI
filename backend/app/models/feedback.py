"""
Pydantic schemas for the home-page feedback form. Public endpoint - no
login required to leave feedback, but if the person is logged in the
frontend sends their name automatically.
"""
from typing import Optional
from pydantic import BaseModel, Field


class FeedbackIn(BaseModel):
    name: Optional[str] = None
    rating: int = Field(0, ge=0, le=5)
    message: str = ""


class FeedbackOut(BaseModel):
    id: str
    name: str
    rating: int
    message: str
    created_at: str
