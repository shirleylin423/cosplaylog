from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Cookie, HTTPException, status

from lib.auth import get_user_id_from_session
from lib.db import records_collection
from models.record import RecordCreate, RecordPublic, RecordUpdate


router = APIRouter(prefix="/api/records", tags=["records"])


def get_current_user_id(ops_session: str | None) -> str:
    user_id = get_user_id_from_session(ops_session)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in",
        )

    try:
        ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session",
        )

    return user_id


def record_to_public(record: dict) -> RecordPublic:
    return RecordPublic(
        id=str(record["_id"]),
        date=record["date"],
        character=record["character"],
        photographer=record.get("photographer", ""),
        type=record["type"],
        note=record.get("note", ""),
        photo=record.get("photo"),
        tags=record.get("tags", []),
    )


@router.get("", response_model=list[RecordPublic])
async def get_records(
    ops_session: str | None = Cookie(default=None),
):
    user_id = get_current_user_id(ops_session)

    records = await records_collection.find(
        {"user_id": user_id}
    ).sort("date", -1).to_list(1000)

    return [
        record_to_public(record)
        for record in records
    ]


@router.post("", response_model=RecordPublic)
async def create_record(
    data: RecordCreate,
    ops_session: str | None = Cookie(default=None),
):
    user_id = get_current_user_id(ops_session)

    record = {
        "_id": ObjectId(),
        "user_id": user_id,
        "date": datetime.combine(data.date, datetime.min.time()),
        "character": data.character,
        "photographer": data.photographer,
        "type": data.type,
        "note": data.note,
        "photo": data.photo,
        "tags": data.tags,
    }

    await records_collection.insert_one(record)

    return record_to_public(record)


@router.patch("/{record_id}", response_model=RecordPublic)
async def update_record(
    record_id: str,
    data: RecordUpdate,
    ops_session: str | None = Cookie(default=None),
):
    user_id = get_current_user_id(ops_session)

    try:
        object_id = ObjectId(record_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record ID",
        )

    patch = data.model_dump(exclude_unset=True)

    if not patch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided",
        )

    result = await records_collection.update_one(
        {
            "_id": object_id,
            "user_id": user_id,
        },
        {
            "$set": patch,
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )

    record = await records_collection.find_one(
        {
            "_id": object_id,
            "user_id": user_id,
        }
    )

    return record_to_public(record)


@router.delete("/{record_id}")
async def delete_record(
    record_id: str,
    ops_session: str | None = Cookie(default=None),
):
    user_id = get_current_user_id(ops_session)

    try:
        object_id = ObjectId(record_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid record ID",
        )

    result = await records_collection.delete_one(
        {
            "_id": object_id,
            "user_id": user_id,
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )

    return {"ok": True}
