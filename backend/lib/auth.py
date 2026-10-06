from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field

from lib.auth import (
    SESSION_COOKIE,
    create_session,
    get_user_id_from_session,
    hash_password,
    verify_password,
)

from lib.db import db


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


@router.post("/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower().strip()

    existing = await db.users.find_one({"email": email})

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="這個 Email 已經註冊",
        )

    user = {
        "email": email,
        "password_hash": hash_password(data.password),
    }

    result = await db.users.insert_one(user)
    user_id = str(result.inserted_id)

    token = create_session(user_id)

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=os.environ.get("COOKIE_SECURE", "true").lower() == "true",
        samesite="lax",
        max_age=14 * 60 * 60,
    )

    return {
        "id": user_id,
        "email": email,
    }


@router.post("/login")
async def login(data: LoginInput, response: Response):
    email = data.email.lower().strip()

    user = await db.users.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email 或密碼錯誤",
        )

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email 或密碼錯誤",
        )

    user_id = str(user["_id"])
    token = create_session(user_id)

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=os.environ.get("COOKIE_SECURE", "true").lower() == "true",
        samesite="lax",
        max_age=14 * 60 * 60,
    )

    return {
        "id": user_id,
        "email": user["email"],
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE,
        httponly=True,
        samesite="lax",
    )

    return {"message": "已登出"}


@router.get("/me")
async def me(user_id: str = Depends(get_user_id_from_session)):
    user = await db.users.find_one(
        {"_id": ObjectId(user_id)},
        {"password_hash": 0},
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="使用者不存在",
        )

    return {
        "id": str(user["_id"]),
        "email": user["email"],
    }
