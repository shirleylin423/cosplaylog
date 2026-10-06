
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Cookie, HTTPException, status


SESSION_COOKIE = "ops_session"
SESSION_HOURS = 14


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8")
        )
    except Exception:
        return False


def create_session(user_id: str) -> str:
    secret = os.environ["JWT_SECRET"]

    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(hours=SESSION_HOURS),
    }

    return jwt.encode(payload, secret, algorithm="HS256")


def get_user_id_from_session(
    ops_session: str | None = Cookie(default=None),
) -> str:
    if not ops_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="請先登入",
        )

    try:
        secret = os.environ["JWT_SECRET"]

        payload = jwt.decode(
            ops_session,
            secret,
            algorithms=["HS256"],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise ValueError("Missing user id")

        return user_id

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登入已失效，請重新登入",
        )
