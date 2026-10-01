"""
Pydantic schemas for the planning flow: the recommend request, the
itinerary request, and a saved trip record.
"""
from typing import Optional
from pydantic import BaseModel


class RecommendRequest(BaseModel):
    tripFor: str = "myself"          # "myself" | "someone_else"
    selfAge: Optional[int] = None
    someoneElseAge: Optional[int] = None
    suitableFor: Optional[str] = None  # Solo | Couples | Family | Friends
    partnerAge: Optional[int] = None
    numChildren: int = 0
    childAges: list[int] = []
    numElderly: int = 0
    friendsHasElderly: bool = False
    budgetPerDay: int = 3000
    month: int = 1
    numDays: int = 3
    interests: list[str] = []
    hasElderly: bool = False


class ItineraryRequest(BaseModel):
    place_ids: list[int]
    num_days: int = 3


class SaveTripRequest(BaseModel):
    form: dict
    place_ids: list[int]
    day_groups: Optional[list[dict]] = None


class TripOut(BaseModel):
    id: str
    form: dict
    place_ids: list[int]
    day_groups: Optional[list[dict]] = None
    saved_at: str
