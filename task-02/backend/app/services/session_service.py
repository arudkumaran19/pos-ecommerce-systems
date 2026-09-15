from typing import Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.repositories.session_repo import SessionRepository
from app.models.user import User
from app.models.user_session import UserSession
from app.core.security import generate_session_token, hash_token, generate_csrf_token
from app.core.config import settings

class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SessionRepository(db)

    def create_session(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Creates a new server-side session.
        Returns:
            (raw_session_token, csrf_token)
        Only the SHA-256 hash of raw_session_token is saved in PostgreSQL.
        """
        raw_token = generate_session_token()
        token_hash = hash_token(raw_token)
        csrf_token = generate_csrf_token()
        
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_MAX_AGE_SECONDS)
        
        session = UserSession(
            session_token_hash=token_hash,
            user_id=user.id,
            csrf_token=csrf_token,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at
        )
        self.repo.add(session)
        self.db.commit()
        return raw_token, csrf_token

    def validate_session(self, raw_session_token: str) -> Optional[UserSession]:
        if not raw_session_token:
            return None
        token_hash = hash_token(raw_session_token)
        session = self.repo.get_by_token_hash(token_hash)
        if not session:
            return None
        
        # Sliding expiration: update last_active_at and extend expires_at
        session.last_active_at = datetime.now(timezone.utc)
        self.db.commit()
        return session

    def revoke_session(self, raw_session_token: str):
        if not raw_session_token:
            return
        token_hash = hash_token(raw_session_token)
        self.repo.delete_by_token_hash(token_hash)
        self.db.commit()

    def revoke_all_user_sessions(self, user_id: UUID, except_token: Optional[str] = None):
        except_hash = hash_token(except_token) if except_token else None
        self.repo.revoke_all_for_user(user_id, except_token_hash=except_hash)
        self.db.commit()
