from bson import ObjectId
from fastapi import APIRouter, Cookie, HTTPException, Response, status

from lib.auth import (
    SESSION_COOKIE,
    create_session,
    get_user_id_from_session,
    hash_password,
    verify_password,
)
from lib.db import users_collection
from models.user import UserCreate, UserLogin, UserPublic


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic)
async def register(data: UserCreate):
    username = data.username.strip()

    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required",
        )

    existing = await users_collection.find_one(
        {"username": username}
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    user_id = ObjectId()

    user = {
        "_id": user_id,
        "username": username,
        "password_hash": hash_password(data.password),
    }

    await users_collection.insert_one(user)

    return UserPublic(
        id=str(user_id),
        username=username,
    )


@router.post("/login", response_model=UserPublic)
async def login(
    data: UserLogin,
    response: Response,
):
    username = data.username.strip()

    user = await users_collection.find_one(
        {"username": username}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not verify_password(
        data.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    user_id = str(user["_id"])

    token = create_session(user_id)

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        max_age=14 * 60 * 60,
        samesite="lax",
        secure=False,
    )

    return UserPublic(
        id=user_id,
        username=user["username"],
    )


@router.get("/me", response_model=UserPublic)
async def me(
    ops_session: str | None = Cookie(default=None),
):
    user_id = get_user_id_from_session(
        ops_session
    )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in",
        )

    try:
        user = await users_collection.find_one(
            {"_id": ObjectId(user_id)}
        )
    except Exception:
        user = None

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserPublic(
        id=str(user["_id"]),
        username=user["username"],
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE
    )

    return {"ok": True}
