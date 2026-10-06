import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt


SESSION_COOKIE = "ops_session"
SESSION_HOURS = 14


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except Exception:
        return False


def create_session(user_id: str) -> str:
    secret = os.environ.get("JWT_SECRET")

    if not secret:
        raise RuntimeError("JWT_SECRET environment variable is not set")

    now = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(hours=SESSION_HOURS),
    }

    return jwt.encode(payload, secret, algorithm="HS256")


def get_user_id_from_session(token: str | None) -> str | None:
    if not token:
        return None

    secret = os.environ.get("JWT_SECRET")

    if not secret:
        return None

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
        )

        user_id = payload.get("sub")

        if not user_id:
            return None

        return str(user_id)

    except jwt.PyJWTError:
        return None
