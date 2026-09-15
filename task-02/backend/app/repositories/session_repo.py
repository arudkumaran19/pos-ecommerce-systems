from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from app.models.user_session import UserSession
from app.models.password_reset import PasswordResetToken
from app.repositories.base import BaseRepository

class SessionRepository(BaseRepository[UserSession]):
    def __init__(self, db: Session):
        super().__init__(UserSession, db)

    def get_by_token_hash(self, token_hash: str) -> Optional[UserSession]:
        now_utc = datetime.now(timezone.utc)
        return self.db.query(UserSession).filter(
            UserSession.session_token_hash == token_hash,
            UserSession.expires_at > now_utc
        ).first()

    def delete_by_token_hash(self, token_hash: str):
        self.db.query(UserSession).filter(UserSession.session_token_hash == token_hash).delete()

    def revoke_all_for_user(self, user_id, except_token_hash: Optional[str] = None):
        q = self.db.query(UserSession).filter(UserSession.user_id == user_id)
        if except_token_hash:
            q = q.filter(UserSession.session_token_hash != except_token_hash)
        q.delete(synchronize_session=False)

    def cleanup_expired(self):
        now_utc = datetime.now(timezone.utc)
        self.db.query(UserSession).filter(UserSession.expires_at <= now_utc).delete()

    # Password Reset Tokens
    def create_reset_token(self, token_hash: str, user_id, expires_at: datetime) -> PasswordResetToken:
        token = PasswordResetToken(token_hash=token_hash, user_id=user_id, expires_at=expires_at)
        self.db.add(token)
        return token

    def get_valid_reset_token(self, token_hash: str) -> Optional[PasswordResetToken]:
        now_utc = datetime.now(timezone.utc)
        return self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now_utc
        ).first()
