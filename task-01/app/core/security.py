import hashlib
import secrets
import time
from collections import defaultdict
from threading import Lock

import bcrypt
from fastapi import HTTPException, status

from app.core.config import settings

SESSION_COOKIE_NAME = "techloom_session"
MIN_PASSWORD_LENGTH = 12


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with salt factor 12."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def validate_password_strength(password: str) -> None:
    """Enforce minimum 12-character password policy."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters long.",
        )


def generate_session_token() -> str:
    """Generate a cryptographically random session token (256-bit entropy)."""
    return secrets.token_hex(32)


def hash_session_token(token: str) -> str:
    """Compute the SHA-256 hash of a session token for safe database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_cookie_security_options() -> dict:
    """Return environment-aware cookie configuration for session cookie."""
    is_production = settings.environment.lower() == "production"
    # For production Vercel -> Render cross-site communication over HTTPS,
    # SameSite must be 'none' and secure must be True.
    # For local development over HTTP, SameSite is 'lax' and secure is False.
    samesite = settings.cookie_samesite or ("none" if is_production else "lax")
    return {
        "httponly": True,
        "secure": is_production,
        "samesite": samesite,
        "path": "/",
    }


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter for login brute-force prevention."""

    def __init__(self, max_attempts: int = 5, window_seconds: int = 60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: dict[str, list[float]] = defaultdict(list)
        self.lock = Lock()

    def check(self, key: str) -> None:
        now = time.time()
        with self.lock:
            # Clean attempts older than window
            self.attempts[key] = [
                t for t in self.attempts[key] if now - t < self.window_seconds
            ]
            if len(self.attempts[key]) >= self.max_attempts:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many failed login attempts. Please try again in 1 minute.",
                )

    def record_failure(self, key: str) -> None:
        now = time.time()
        with self.lock:
            self.attempts[key].append(now)

    def reset(self, key: str) -> None:
        with self.lock:
            self.attempts.pop(key, None)


login_rate_limiter = InMemoryRateLimiter(max_attempts=5, window_seconds=60)
