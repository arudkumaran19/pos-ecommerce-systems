from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    generate_session_token,
    hash_session_token,
    verify_password,
)
from app.models.user import User, UserSession


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_user(self, email: str, password: str) -> User:
        """Authenticate user by email and password using constant-time verification."""
        user = (
            self.db.query(User)
            .filter(User.email == email.strip().lower())
            .first()
        )

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive",
            )

        return user

    def create_session(self, user_id: int) -> tuple[UserSession, str]:
        """Create a server-side session, storing only the token hash in PostgreSQL."""
        raw_token = generate_session_token()
        token_hash = hash_session_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.session_expire_minutes
        )

        session = UserSession(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return session, raw_token

    def get_user_by_session_token(self, raw_token: str) -> User | None:
        """Validate session token against database and return active user."""
        if not raw_token:
            return None

        token_hash = hash_session_token(raw_token)
        now = datetime.now(timezone.utc)

        session = (
            self.db.query(UserSession)
            .filter(
                UserSession.token_hash == token_hash,
                UserSession.revoked_at.is_(None),
                UserSession.expires_at > now,
            )
            .first()
        )

        if not session:
            return None

        # Update last_used_at
        session.last_used_at = now
        self.db.commit()

        user = self.db.query(User).filter(User.id == session.user_id).first()
        if not user or not user.is_active:
            return None

        return user

    def revoke_session(self, raw_token: str) -> bool:
        """Revoke a session in the database immediately."""
        if not raw_token:
            return False

        token_hash = hash_session_token(raw_token)
        session = (
            self.db.query(UserSession)
            .filter(
                UserSession.token_hash == token_hash,
                UserSession.revoked_at.is_(None),
            )
            .first()
        )

        if session:
            session.revoked_at = datetime.now(timezone.utc)
            self.db.commit()
            return True

        return False
