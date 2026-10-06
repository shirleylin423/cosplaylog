from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class RecordCreate(BaseModel):
    date: date
    character: str = Field(min_length=1, max_length=200)
    photographer: str = Field(default="", max_length=200)
    type: str = Field(min_length=1, max_length=100)
    note: str = Field(default="", max_length=5000)
    photo: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class RecordUpdate(BaseModel):
    date: Optional[date] = None
    character: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    photographer: Optional[str] = Field(
        default=None,
        max_length=200,
    )
    type: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    note: Optional[str] = Field(
        default=None,
        max_length=5000,
    )
    photo: Optional[str] = None
    tags: Optional[List[str]] = None


class RecordPublic(BaseModel):
    id: str
    date: date
    character: str
    photographer: str
    type: str
    note: str
    photo: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
