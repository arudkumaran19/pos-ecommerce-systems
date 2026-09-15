from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.idempotency import IdempotencyRecord
from app.repositories.base import BaseRepository

class IdempotencyRepository(BaseRepository[IdempotencyRecord]):
    def __init__(self, db: Session):
        super().__init__(IdempotencyRecord, db)

    def get_by_key(self, key: str) -> Optional[IdempotencyRecord]:
        return self.db.query(IdempotencyRecord).filter(IdempotencyRecord.key == key).first()

    def cleanup_expired(self):
        now_utc = datetime.now(timezone.utc)
        self.db.query(IdempotencyRecord).filter(IdempotencyRecord.expires_at <= now_utc).delete()
